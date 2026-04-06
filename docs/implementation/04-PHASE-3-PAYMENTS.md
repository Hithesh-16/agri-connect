# Phase 3: Payment Gateway & Escrow

**Timeline:** Weeks 14-17
**Priority:** HIGH — Revenue generation and trust layer
**Dependencies:** Phase 0 (RBAC), Phase 1 (Service Providers), Phase 2 (Booking Engine)

> **NOTE:** Start Razorpay merchant onboarding in Phase 0 itself. KYC verification and Route API activation takes 5-7 business days. Do not wait until Phase 3 to begin this process.

---

## Objective

Implement the complete payment lifecycle — multiple payment flows (prepay, advance+balance, post-pay, cash+digital split), escrow-protected service payments via Razorpay Route API, digital wallet, vendor payouts with settlement schedules, TDS compliance (Section 194-O), and GST invoice generation.

---

## Current State

### What Exists
- Booking model with pricing fields (`basePrice`, `platformFee`, `gstAmount`, `totalAmount`, `advanceAmount`, `balanceAmount`)
- ServiceListing with `pricingType` (FIXED, NEGOTIABLE, BID_BASED, QUOTE_REQUIRED)
- Razorpay account (to be onboarded in Phase 0)
- No payment processing, no wallet, no escrow, no invoicing

### What's Missing
- No payment gateway integration
- No escrow mechanism — farmers have zero protection
- No wallet system for quick payments and cashback
- No vendor payout/settlement system
- No TDS/GST compliance
- No invoice generation
- No refund processing
- No payment failure handling and retry logic

---

## Payment Flows

### Flow 1: Full Prepay (Inputs/On-Demand)
```
Farmer → Pay 100% upfront → Platform holds → Service delivered → Release to vendor
```
Used for: Agri inputs, seeds, fertilizers, transport bookings

### Flow 2: Advance + Balance (Machinery — 30%/70%)
```
Farmer → Pay 30% advance → Booking confirmed
→ Service day: Pay remaining 70% → Service starts
→ Completed → Release full amount to vendor
```
Used for: Tractor, harvester, rotavator, all machinery bookings

### Flow 3: Post-Pay (Labor)
```
Farmer → Booking confirmed (no upfront payment)
→ Work completed → QR attendance verified
→ Farmer pays based on actual hours/days worked
```
Used for: Farm labor (daily wages calculated post-completion)

### Flow 4: Cash + Digital Split
```
Farmer → Pay advance digitally → Remaining in cash at farm
→ Provider confirms cash received → Platform releases digital portion
```
Used for: Remote areas with limited digital payment adoption

---

## Escrow via Razorpay Route API

### Architecture
```
Farmer pays ──→ Razorpay Order ──→ Platform Settlement Account (holds funds)
                                          │
                              Service completed + confirmed
                                          │
                               Razorpay Transfer API
                                   │           │
                          Vendor Account    Platform Commission
                          (minus TDS)       (platform_fee + GST)
```

### Implementation
```typescript
// backend/src/services/paymentService.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Step 1: Create order (farmer initiates payment)
export async function createPaymentOrder(bookingId: string, amount: number, type: 'FULL' | 'ADVANCE' | 'BALANCE') {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt: `${booking.bookingNumber}-${type}`,
    notes: {
      bookingId,
      farmerId: booking.farmerId,
      providerId: booking.providerId,
      paymentType: type,
    },
  });

  await prisma.payment.create({
    data: {
      bookingId,
      userId: booking.farmerId,
      type,
      amount,
      razorpayOrderId: order.id,
      status: 'CREATED',
    },
  });

  return { orderId: order.id, amount: order.amount, currency: order.currency };
}

// Step 2: Verify payment (after Razorpay checkout)
export async function verifyPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  // Verify signature
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (expectedSignature !== params.razorpaySignature) {
    throw new Error('Payment verification failed — invalid signature');
  }

  // Update payment record
  const payment = await prisma.payment.update({
    where: { razorpayOrderId: params.razorpayOrderId },
    data: {
      razorpayPaymentId: params.razorpayPaymentId,
      razorpaySignature: params.razorpaySignature,
      status: 'CAPTURED',
      paidAt: new Date(),
    },
  });

  // Update booking status based on payment type
  if (payment.type === 'FULL' || payment.type === 'ADVANCE') {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' },
    });
  }

  return payment;
}

// Step 3: Release escrow (after service completion + farmer confirmation)
export async function releaseEscrow(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: true, provider: true },
  });

  const totalPaid = booking.payments
    .filter(p => p.status === 'CAPTURED')
    .reduce((sum, p) => sum + p.amount, 0);

  const platformFee = booking.platformFee;
  const gstOnFee = booking.gstAmount;
  const tdsAmount = await calculateTDS(booking.provider.userId, totalPaid - platformFee - gstOnFee);
  const vendorAmount = totalPaid - platformFee - gstOnFee - tdsAmount;

  // Razorpay Route API — transfer to vendor's linked account
  const transfer = await razorpay.payments.transfer(booking.payments[0].razorpayPaymentId, {
    transfers: [
      {
        account: booking.provider.razorpayLinkedAccountId,
        amount: Math.round(vendorAmount * 100),
        currency: 'INR',
        notes: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          tdsDeducted: tdsAmount,
        },
        on_hold: 0,
      },
    ],
  });

  // Record payout
  await prisma.payout.create({
    data: {
      providerId: booking.providerId,
      bookingId,
      grossAmount: totalPaid - platformFee - gstOnFee,
      tdsAmount,
      netAmount: vendorAmount,
      razorpayTransferId: transfer.items[0].id,
      status: 'PROCESSED',
    },
  });

  // Generate invoice
  await generateInvoice(bookingId);

  return { vendorAmount, platformFee, gstOnFee, tdsAmount };
}
```

### Multi-Day Milestone-Based Release
```typescript
// For multi-day bookings: release 50% after day 1, 50% at completion
export async function processMilestoneRelease(bookingId: string, milestone: 'DAY_1' | 'COMPLETION') {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: true },
  });

  const totalPaid = booking.payments
    .filter(p => p.status === 'CAPTURED')
    .reduce((sum, p) => sum + p.amount, 0);

  const releaseAmount = milestone === 'DAY_1'
    ? totalPaid * 0.5
    : totalPaid * 0.5; // Remaining 50%

  await releasePartialEscrow(bookingId, releaseAmount, milestone);
}
```

### Auto-Confirm Timer
```typescript
// If farmer does not confirm/dispute within 24-48h, auto-confirm
// BullMQ delayed job
export async function scheduleAutoConfirm(bookingId: string) {
  await autoConfirmQueue.add(
    'auto-confirm',
    { bookingId },
    {
      delay: 48 * 60 * 60 * 1000, // 48 hours
      jobId: `auto-confirm-${bookingId}`,
    }
  );
}

// Worker
const autoConfirmWorker = new Worker('auto-confirm', async (job) => {
  const { bookingId } = job.data;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (booking.status === 'COMPLETED' && !booking.farmerConfirmed) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { farmerConfirmed: true, autoConfirmedAt: new Date() },
    });
    await releaseEscrow(bookingId);
    await queueNotification({
      userId: booking.farmerId,
      type: 'ESCROW_AUTO_RELEASED',
      title: { en: 'Payment Released', te: 'చెల్లింపు విడుదల', hi: 'भुगतान जारी' },
      body: {
        en: `Payment for booking ${booking.bookingNumber} has been auto-released to the provider.`,
        te: `బుకింగ్ ${booking.bookingNumber} చెల్లింపు ప్రొవైడర్‌కు ఆటో-విడుదల చేయబడింది.`,
        hi: `बुकिंग ${booking.bookingNumber} का भुगतान प्रदाता को ऑटो-रिलीज़ किया गया है।`,
      },
      channels: ['PUSH', 'IN_APP'],
    });
  }
});
```

---

## Database Schema Changes

### New Models

```prisma
model Payment {
  id                  String   @id @default(cuid())
  bookingId           String
  userId              String   // Who paid
  
  type                String   // "FULL" | "ADVANCE" | "BALANCE" | "WALLET" | "REFUND"
  method              String?  // "UPI" | "CARD" | "NETBANKING" | "WALLET" | "CASH"
  amount              Float
  currency            String   @default("INR")
  
  // Razorpay
  razorpayOrderId     String?  @unique
  razorpayPaymentId   String?  @unique
  razorpaySignature   String?
  razorpayRefundId    String?
  
  status              String   @default("CREATED")
  // "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED"
  
  paidAt              DateTime?
  refundedAt          DateTime?
  refundAmount        Float?
  refundReason        String?
  
  // Failure tracking
  failureCode         String?
  failureDescription  String?
  retryCount          Int      @default(0)
  
  metadata            Json?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  booking             Booking  @relation(fields: [bookingId], references: [id])
  
  @@index([bookingId])
  @@index([userId, status])
  @@index([razorpayOrderId])
  @@map("payments")
}

model Wallet {
  id              String   @id @default(cuid())
  userId          String   @unique
  balance         Float    @default(0)
  currency        String   @default("INR")
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  transactions    WalletTransaction[]
  
  @@map("wallets")
}

model WalletTransaction {
  id              String   @id @default(cuid())
  walletId        String
  
  type            String   // "CREDIT" | "DEBIT"
  amount          Float
  balanceAfter    Float
  
  source          String   // "UPI_LOAD" | "BANK_LOAD" | "CASHBACK" | "REFUND" | "BOOKING_PAYMENT" | "WITHDRAWAL"
  referenceId     String?  // bookingId, paymentId, etc.
  description     String?
  
  razorpayPaymentId String?
  
  status          String   @default("COMPLETED") // "PENDING" | "COMPLETED" | "FAILED"
  
  createdAt       DateTime @default(now())
  
  wallet          Wallet   @relation(fields: [walletId], references: [id])
  
  @@index([walletId, createdAt])
  @@map("wallet_transactions")
}

model Payout {
  id                  String   @id @default(cuid())
  providerId          String
  bookingId           String?
  
  // Settlement period
  settlementPeriod    String?  // "2026-W15" (weekly) or "2026-04-15" (daily)
  
  grossAmount         Float
  platformFee         Float    @default(0)
  gstAmount           Float    @default(0)
  tdsAmount           Float    @default(0)
  netAmount           Float
  
  // Razorpay
  razorpayTransferId  String?
  razorpayPayoutId    String?
  
  status              String   @default("PENDING")
  // "PENDING" | "PROCESSED" | "SETTLED" | "FAILED" | "ON_HOLD"
  
  processedAt         DateTime?
  settledAt           DateTime?
  failureReason       String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  provider            ServiceProvider @relation(fields: [providerId], references: [id])
  
  @@index([providerId, status])
  @@index([settlementPeriod])
  @@map("payouts")
}

model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique // "KC-INV-2026-0001"
  bookingId       String
  
  type            String   // "FARMER_RECEIPT" | "VENDOR_INVOICE" | "PLATFORM_INVOICE"
  
  // Parties
  fromName        String
  fromAddress     String
  fromGstin       String?
  toName          String
  toAddress       String
  toGstin         String?
  
  // Line items
  items           Json[]   // [{ description, qty, rate, amount, hsnCode, gstRate }]
  subtotal        Float
  gstAmount       Float
  totalAmount     Float
  
  // GST details
  cgst            Float    @default(0)
  sgst            Float    @default(0)
  igst            Float    @default(0)
  
  // PDF
  pdfUrl          String?
  
  issuedAt        DateTime @default(now())
  
  @@index([bookingId])
  @@map("invoices")
}

model TaxProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  
  // PAN
  panNumber       String?  // Encrypted
  panVerified     Boolean  @default(false)
  panName         String?
  
  // GST
  gstNumber       String?
  gstVerified     Boolean  @default(false)
  gstState        String?
  
  // TDS tracking (Section 194-O)
  financialYear   String   // "2026-27"
  totalPayouts    Float    @default(0)  // Cumulative payouts in FY
  totalTdsDeducted Float   @default(0)
  tdsThresholdReached Boolean @default(false) // INR 5,00,000 threshold
  
  // Lower TDS certificate (if applicable)
  lowerTdsCertNumber String?
  lowerTdsRate       Float?
  lowerTdsCertExpiry DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@map("tax_profiles")
}
```

---

## TDS Compliance (Section 194-O)

```typescript
// backend/src/services/tdsService.ts

// Section 194-O: E-commerce operator must deduct 1% TDS on payouts exceeding INR 5,00,000/year
// Effective for e-commerce platforms facilitating sale of goods/services

const TDS_THRESHOLD = 500000; // INR 5 lakh per financial year
const TDS_RATE = 0.01; // 1%
const TDS_RATE_NO_PAN = 0.05; // 5% if vendor has no PAN

export async function calculateTDS(userId: string, payoutAmount: number): Promise<number> {
  const taxProfile = await prisma.taxProfile.findUnique({ where: { userId } });

  if (!taxProfile) {
    // Create tax profile for new vendor
    await prisma.taxProfile.create({
      data: { userId, financialYear: getCurrentFinancialYear() },
    });
    return 0; // First payout, below threshold
  }

  // Check lower TDS certificate
  if (taxProfile.lowerTdsCertNumber && taxProfile.lowerTdsCertExpiry > new Date()) {
    return payoutAmount * (taxProfile.lowerTdsRate || 0);
  }

  const cumulativePayouts = taxProfile.totalPayouts + payoutAmount;

  if (cumulativePayouts <= TDS_THRESHOLD) {
    // Below threshold — no TDS
    await prisma.taxProfile.update({
      where: { userId },
      data: { totalPayouts: cumulativePayouts },
    });
    return 0;
  }

  // Above threshold — apply TDS
  const rate = taxProfile.panVerified ? TDS_RATE : TDS_RATE_NO_PAN;
  let tdsAmount: number;

  if (taxProfile.totalPayouts < TDS_THRESHOLD) {
    // Threshold crossed with this payout — TDS only on amount above threshold
    tdsAmount = (cumulativePayouts - TDS_THRESHOLD) * rate;
    await prisma.taxProfile.update({
      where: { userId },
      data: {
        totalPayouts: cumulativePayouts,
        tdsThresholdReached: true,
        totalTdsDeducted: { increment: tdsAmount },
      },
    });
  } else {
    // Already above threshold — TDS on full payout
    tdsAmount = payoutAmount * rate;
    await prisma.taxProfile.update({
      where: { userId },
      data: {
        totalPayouts: { increment: payoutAmount },
        totalTdsDeducted: { increment: tdsAmount },
      },
    });
  }

  return Math.round(tdsAmount * 100) / 100; // Round to 2 decimal places
}

function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${(year + 1).toString().slice(2)}`;
}
```

---

## Wallet System

```typescript
// backend/src/services/walletService.ts

// Load wallet via UPI/bank transfer
export async function loadWallet(userId: string, amount: number, razorpayPaymentId: string) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');

    const newBalance = wallet.balance + amount;

    await tx.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount,
        balanceAfter: newBalance,
        source: 'UPI_LOAD',
        razorpayPaymentId,
        description: `Wallet loaded with INR ${amount}`,
      },
    });

    return { balance: newBalance };
  });
}

// Pay for booking from wallet
export async function payFromWallet(userId: string, bookingId: string, amount: number) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const newBalance = wallet.balance - amount;

    await tx.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount,
        balanceAfter: newBalance,
        source: 'BOOKING_PAYMENT',
        referenceId: bookingId,
        description: `Payment for booking`,
      },
    });

    await tx.payment.create({
      data: {
        bookingId,
        userId,
        type: 'FULL',
        method: 'WALLET',
        amount,
        status: 'CAPTURED',
        paidAt: new Date(),
      },
    });

    return { balance: newBalance };
  });
}

// Withdraw wallet balance to bank
export async function withdrawWallet(userId: string, amount: number) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const newBalance = wallet.balance - amount;

    await tx.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount,
        balanceAfter: newBalance,
        source: 'WITHDRAWAL',
        status: 'PENDING',
        description: `Withdrawal of INR ${amount} to bank account`,
      },
    });

    // Initiate Razorpay payout to user's bank account
    // This is async — settled in 1-3 business days
    await initiateRazorpayPayout(userId, amount);

    return { balance: newBalance };
  });
}

// Cashback incentives
export async function creditCashback(userId: string, bookingId: string, cashbackPercent: number, maxCashback: number) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  const cashbackAmount = Math.min(booking.totalAmount * (cashbackPercent / 100), maxCashback);

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const newBalance = wallet.balance + cashbackAmount;

  await prisma.wallet.update({ where: { userId }, data: { balance: newBalance } });
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'CREDIT',
      amount: cashbackAmount,
      balanceAfter: newBalance,
      source: 'CASHBACK',
      referenceId: bookingId,
      description: `${cashbackPercent}% cashback on booking`,
    },
  });
}
```

---

## Vendor Payout Schedules

```typescript
// backend/src/workers/payoutWorker.ts

// Weekly settlements (default): every Monday at 6 AM
// Daily settlements: for providers with >50 bookings/month

const payoutWorker = new Worker('payouts', async (job) => {
  const { providerId, settlementPeriod } = job.data;

  // Get all completed bookings in the settlement period that haven't been paid out
  const completedBookings = await prisma.booking.findMany({
    where: {
      providerId,
      status: 'COMPLETED',
      farmerConfirmed: true,
      payments: { some: { status: 'CAPTURED' } },
      payouts: { none: {} },
    },
    include: { payments: true, provider: true },
  });

  if (completedBookings.length === 0) return;

  let totalGross = 0;
  let totalPlatformFee = 0;
  let totalGst = 0;

  for (const booking of completedBookings) {
    const paid = booking.payments
      .filter(p => p.status === 'CAPTURED')
      .reduce((sum, p) => sum + p.amount, 0);
    totalGross += paid - booking.platformFee - booking.gstAmount;
    totalPlatformFee += booking.platformFee;
    totalGst += booking.gstAmount;
  }

  const tdsAmount = await calculateTDS(completedBookings[0].provider.userId, totalGross);
  const netAmount = totalGross - tdsAmount;

  // Create consolidated payout
  await prisma.payout.create({
    data: {
      providerId,
      settlementPeriod,
      grossAmount: totalGross,
      platformFee: totalPlatformFee,
      gstAmount: totalGst,
      tdsAmount,
      netAmount,
      status: 'PROCESSED',
      processedAt: new Date(),
    },
  });

  // Transfer via Razorpay
  await initiateRazorpayPayout(completedBookings[0].provider.userId, netAmount);
});

// Schedule: Weekly payout cron
// Queue: 'payouts'
// Cron: '0 6 * * 1' (every Monday 6 AM)
```

---

## GST Invoice Generation

```typescript
// backend/src/services/invoiceService.ts
import PDFDocument from 'pdfkit';
import { uploadToS3 } from './uploadService';

export async function generateInvoice(bookingId: string): Promise<Invoice> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      farmer: true,
      provider: { include: { user: true } },
      serviceListing: { include: { category: true } },
      payments: { where: { status: 'CAPTURED' } },
    },
  });

  const invoiceNumber = await generateInvoiceNumber();

  // Determine GST type (CGST+SGST for intra-state, IGST for inter-state)
  const farmerState = booking.farmLocation?.state;
  const providerState = booking.provider.baseLocation?.state;
  const isIntraState = farmerState === providerState;

  const gstRate = 0.18; // 18% GST on platform services
  const serviceAmount = booking.basePrice;
  const platformFee = booking.platformFee;
  const gstOnPlatformFee = platformFee * gstRate;

  const items = [
    {
      description: `${booking.serviceListing.title?.en || 'Service'} — Booking ${booking.bookingNumber}`,
      qty: 1,
      rate: serviceAmount,
      amount: serviceAmount,
      hsnCode: '9986', // Support services (agricultural)
      gstRate: 0,
    },
    {
      description: 'Platform convenience fee',
      qty: 1,
      rate: platformFee,
      amount: platformFee,
      hsnCode: '9983', // Professional services
      gstRate: gstRate * 100,
    },
  ];

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      bookingId,
      type: 'FARMER_RECEIPT',
      fromName: 'KisanConnect Private Limited',
      fromAddress: 'Hyderabad, Telangana, India',
      fromGstin: process.env.PLATFORM_GSTIN,
      toName: booking.farmer.name,
      toAddress: JSON.stringify(booking.farmLocation),
      items,
      subtotal: serviceAmount + platformFee,
      gstAmount: gstOnPlatformFee,
      totalAmount: booking.totalAmount,
      cgst: isIntraState ? gstOnPlatformFee / 2 : 0,
      sgst: isIntraState ? gstOnPlatformFee / 2 : 0,
      igst: isIntraState ? 0 : gstOnPlatformFee,
    },
  });

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoice, booking);
  const pdfUrl = await uploadToS3(pdfBuffer, `invoices/${invoiceNumber}.pdf`, 'application/pdf');

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl },
  });

  return { ...invoice, pdfUrl };
}

async function generateInvoicePDF(invoice: Invoice, booking: any): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Header
    doc.fontSize(20).text('KisanConnect', { align: 'center' });
    doc.fontSize(10).text('Tax Invoice', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(10).text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString('en-IN')}`);
    doc.text(`Booking: ${booking.bookingNumber}`);
    doc.moveDown();

    // From / To
    doc.text(`From: ${invoice.fromName}`);
    doc.text(`GSTIN: ${invoice.fromGstin || 'N/A'}`);
    doc.moveDown();
    doc.text(`To: ${invoice.toName}`);
    doc.text(`GSTIN: ${invoice.toGstin || 'N/A'}`);
    doc.moveDown();

    // Line items table
    doc.fontSize(9);
    for (const item of invoice.items) {
      doc.text(`${item.description} — Qty: ${item.qty} x INR ${item.rate} = INR ${item.amount} (GST: ${item.gstRate}%)`);
    }
    doc.moveDown();

    // Totals
    doc.fontSize(10);
    doc.text(`Subtotal: INR ${invoice.subtotal}`);
    if (invoice.cgst > 0) doc.text(`CGST (9%): INR ${invoice.cgst}`);
    if (invoice.sgst > 0) doc.text(`SGST (9%): INR ${invoice.sgst}`);
    if (invoice.igst > 0) doc.text(`IGST (18%): INR ${invoice.igst}`);
    doc.fontSize(12).text(`Total: INR ${invoice.totalAmount}`, { underline: true });

    doc.end();
  });
}
```

---

## Razorpay Webhook Handling

```typescript
// backend/src/routes/webhooks.ts

router.post('/webhooks/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = req.body.toString();

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event.payload.payment.entity);
      break;
    case 'payment.failed':
      await handlePaymentFailed(event.payload.payment.entity);
      break;
    case 'refund.created':
      await handleRefundCreated(event.payload.refund.entity);
      break;
    case 'transfer.settled':
      await handleTransferSettled(event.payload.transfer.entity);
      break;
    case 'payout.processed':
      await handlePayoutProcessed(event.payload.payout.entity);
      break;
    case 'payout.failed':
      await handlePayoutFailed(event.payload.payout.entity);
      break;
  }

  res.json({ status: 'ok' });
});
```

---

## API Endpoints

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/order` | FARMER | Create Razorpay order for booking |
| POST | `/api/payments/verify` | FARMER | Verify payment after Razorpay checkout |
| POST | `/api/payments/escrow/release/:bookingId` | FARMER/SYSTEM | Release escrow after service completion |
| GET | `/api/payments/booking/:bookingId` | Owner | Get payments for a booking |
| POST | `/api/payments/refund/:paymentId` | ADMIN | Initiate refund |
| POST | `/api/webhooks/razorpay` | Razorpay | Webhook handler (signature verified) |

### Wallet

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wallet/balance` | Auth | Get wallet balance |
| POST | `/api/wallet/add` | Auth | Load wallet (create Razorpay order) |
| POST | `/api/wallet/pay` | Auth | Pay for booking from wallet |
| POST | `/api/wallet/withdraw` | Auth | Withdraw to bank account |
| GET | `/api/wallet/transactions` | Auth | Transaction history (paginated) |

### Payouts & Invoices

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/payouts` | VENDOR | List vendor's payouts |
| GET | `/api/payouts/:id` | VENDOR | Payout details |
| GET | `/api/invoices/booking/:bookingId` | Owner | Get invoice for booking |
| GET | `/api/invoices/:id/pdf` | Owner | Download invoice PDF |

---

## Frontend Screens

### Web & Mobile (Farmer)

| Route/Screen | Description |
|-------------|-------------|
| `/wallet` / WalletScreen | Balance, load money, transaction history, withdraw |
| `/payments` / PaymentScreen | Payment history across all bookings |
| `/bookings/[id]` (payment section) | Pay now, view receipt, download invoice |

### Web & Mobile (Vendor/Partner)

| Route/Screen | Description |
|-------------|-------------|
| `/earnings` / EarningsScreen | Total earnings, pending payouts, payout history |
| `/earnings/payouts` / PayoutDetailScreen | Individual payout breakdown (gross, TDS, net) |
| `/earnings/tax` / TaxProfileScreen | PAN, GSTIN management, TDS certificate download |

---

## Industry Comparison

| Feature | Arya.ag | DeHaat | Trringo | KisanConnect (Ours) |
|---------|---------|--------|---------|---------------------|
| Payment types | Post-harvest only | Input payments | Advance only | 4 flows (prepay, advance+balance, post-pay, cash split) |
| Escrow | No | No | No | Yes — Razorpay Route API |
| Wallet | No | No | No | Yes — UPI/bank load, cashback |
| Multi-day milestones | N/A | N/A | No | 50%/50% milestone release |
| TDS compliance | Unknown | Unknown | Unknown | Section 194-O automated |
| GST invoicing | Basic | Basic | No | Auto-generated PDF with HSN codes |
| Vendor settlements | Manual | Weekly | Unknown | Automated weekly/daily |

---

## Testing Checklist

- [ ] **Razorpay Integration**: Create order → complete checkout → verify signature → payment captured
- [ ] **Webhook Signature**: Invalid signature returns 400; valid signature processes event
- [ ] **Webhook Idempotency**: Same webhook delivered twice does not create duplicate records
- [ ] **Escrow Lifecycle**: Farmer pays → service completed → farmer confirms → funds released to vendor
- [ ] **Auto-Confirm**: After 48h without farmer action, escrow auto-releases
- [ ] **Milestone Release**: Multi-day booking releases 50% after day 1, 50% at completion
- [ ] **Cancellation Refund**: Free cancellation returns 100%; late returns 50%; no-show returns 0%
- [ ] **Wallet Load**: Create Razorpay order → pay → wallet balance increases
- [ ] **Wallet Pay**: Sufficient balance → debit → booking confirmed; insufficient balance → error
- [ ] **Wallet Atomicity**: Concurrent wallet debits do not create negative balance (transaction isolation)
- [ ] **Wallet Withdraw**: Withdrawal initiated → Razorpay payout → balance decremented
- [ ] **TDS Calculation**: Below INR 5L threshold → no TDS; above → 1% deducted (5% if no PAN)
- [ ] **TDS Threshold Crossing**: Payout that crosses threshold applies TDS only on excess
- [ ] **Invoice Generation**: PDF generated with correct line items, GST (CGST+SGST or IGST), totals
- [ ] **Invoice PDF**: PDF downloadable and renders correctly
- [ ] **Payment Failure**: Failed payment → status updated → retry possible → booking not confirmed
- [ ] **Payment Retry**: Failed payment retried successfully → booking confirmed
- [ ] **Vendor Payout**: Weekly settlement job calculates correct gross, TDS, net amounts
- [ ] **Concurrent Payments**: Two users paying for same booking slot → only one succeeds

---

## Files to Create/Modify

### New Files
```
backend/src/routes/payments.ts              # Payment order, verify, refund
backend/src/routes/wallet.ts                # Wallet balance, load, pay, withdraw
backend/src/routes/payouts.ts               # Vendor payout listing
backend/src/routes/invoices.ts              # Invoice retrieval + PDF download
backend/src/routes/webhooks.ts              # Razorpay webhook handler
backend/src/services/paymentService.ts      # Order creation, verification, escrow
backend/src/services/walletService.ts       # Wallet CRUD + atomic transactions
backend/src/services/tdsService.ts          # TDS calculation (Section 194-O)
backend/src/services/invoiceService.ts      # Invoice generation + PDF
backend/src/services/payoutService.ts       # Vendor settlement logic
backend/src/workers/autoConfirmWorker.ts    # Auto-confirm escrow after 48h
backend/src/workers/payoutWorker.ts         # Weekly/daily payout processor
packages/shared/types/payment.ts            # Payment TypeScript types
mobile/src/screens/wallet/WalletScreen.tsx  # Wallet balance + load + history
mobile/src/screens/payment/PaymentScreen.tsx # Payment flow (Razorpay checkout)
partner-app/src/screens/EarningsScreen.tsx  # Earnings dashboard
partner-app/src/screens/PayoutDetailScreen.tsx # Payout breakdown
web/src/pages/wallet/index.tsx              # Wallet page
web/src/pages/payments/index.tsx            # Payment history
web/src/pages/earnings/index.tsx            # Vendor earnings (partner web)
```

### Modified Files
```
backend/prisma/schema.prisma                # Add Payment, Wallet, Payout, Invoice, TaxProfile
backend/src/index.ts                        # Mount payment/wallet/webhook routes
backend/src/routes/bookings.ts              # Integrate payment flow with booking creation
backend/src/services/bookingService.ts      # Trigger escrow release on completion
mobile/src/screens/booking/BookingDetailScreen.tsx # Add payment actions
partner-app/src/navigation/AppNavigator.tsx # Add earnings tab
```

---

## Definition of Done

- [ ] All 4 payment flows work end-to-end (prepay, advance+balance, post-pay, cash split)
- [ ] Escrow holds funds and releases only after service confirmation (or auto-confirm at 48h)
- [ ] Milestone-based release works for multi-day bookings
- [ ] Wallet supports load, pay, withdraw with atomic balance operations
- [ ] Razorpay webhook signature verification passes
- [ ] TDS calculated correctly per Section 194-O (1% above INR 5L threshold)
- [ ] GST invoices generated as downloadable PDFs with correct CGST/SGST/IGST
- [ ] Vendor weekly settlements processed automatically
- [ ] Payment failures handled with retry logic
- [ ] All frontend screens render payment data and handle payment flows
