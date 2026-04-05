import { Router, Response } from 'express';

const router = Router();

// GET /api/supply-chain/cotton
router.get('/cotton', (_req, res: Response) => {
  res.json({
    success: true,
    data: {
      exchangePrices: {
        updatedAt: new Date().toISOString(),
        exchanges: [
          {
            name: 'NCDEX',
            fullName: 'National Commodity & Derivatives Exchange',
            price: 27850,
            currency: 'INR',
            unit: 'per bale (170 kg)',
            change: +350,
            changePercent: 1.27,
            contract: 'Apr 2026',
          },
          {
            name: 'NYBOT (ICE)',
            fullName: 'New York Board of Trade / ICE Futures',
            price: 82.45,
            currency: 'USc',
            unit: 'per lb',
            change: +1.2,
            changePercent: 1.48,
            contract: 'May 2026',
          },
          {
            name: 'ZCE',
            fullName: 'Zhengzhou Commodity Exchange',
            price: 15280,
            currency: 'CNY',
            unit: 'per tonne',
            change: -120,
            changePercent: -0.78,
            contract: 'May 2026',
          },
        ],
      },
      qualityParameters: [
        { parameter: 'Staple Length', standard: '28-30 mm', premium: '31+ mm', description: 'Length of cotton fiber' },
        { parameter: 'Micronaire', standard: '3.5-4.9', premium: '3.8-4.5', description: 'Fiber fineness and maturity' },
        { parameter: 'Strength', standard: '26-28 g/tex', premium: '29+ g/tex', description: 'Bundle fiber strength' },
        { parameter: 'Trash Content', standard: '< 4%', premium: '< 2%', description: 'Non-lint content' },
        { parameter: 'Moisture', standard: '< 8.5%', premium: '< 7%', description: 'Moisture content by weight' },
        { parameter: 'Color Grade', standard: 'Middling', premium: 'Strict Middling+', description: 'USDA color grade' },
      ],
      procurementFlow: {
        steps: [
          {
            step: 1,
            title: 'Harvest & Picking',
            description: 'Cotton is hand-picked or machine-harvested at the farm. Ensure bolls are fully open and dry before picking.',
            duration: '1-2 weeks',
            tip: 'Pick in the morning after dew dries for best quality.',
          },
          {
            step: 2,
            title: 'Ginning',
            description: 'Raw cotton (kapas) is processed at the gin to separate fiber (lint) from seeds. Weight loss is typically 33-35%.',
            duration: '1-2 days',
            tip: 'Choose CCI-approved gins for better prices.',
          },
          {
            step: 3,
            title: 'Quality Testing',
            description: 'Lint is tested for staple length, micronaire, strength, and trash content using HVI (High Volume Instrument).',
            duration: '1 day',
            tip: 'Get HVI report before selling for transparent pricing.',
          },
          {
            step: 4,
            title: 'Mandi Auction / Direct Sale',
            description: 'Sell through APMC mandi auction or directly to mills/CCI through eNAM platform.',
            duration: '1-3 days',
            tip: 'Compare mandi prices across nearby markets before selling.',
          },
          {
            step: 5,
            title: 'Payment & Settlement',
            description: 'Payment received via bank transfer. MSP procurement by CCI ensures minimum price guarantee.',
            duration: '3-7 days',
            tip: 'MSP for cotton (medium staple) is Rs 7,121/quintal for 2025-26.',
          },
        ],
      },
      mspInfo: {
        currentMSP: 7121,
        unit: 'per quintal',
        season: '2025-26',
        variety: 'Medium Staple (F-414/H-777)',
        longStapleMSP: 7521,
        announcement: 'CCEA approved, effective from October 2025',
      },
    },
  });
});

// GET /api/supply-chain/enam
router.get('/enam', (_req, res: Response) => {
  res.json({
    success: true,
    data: {
      overview: {
        name: 'eNAM (Electronic National Agriculture Market)',
        description: 'A pan-India electronic trading portal that networks existing APMC mandis to create a unified national market for agricultural commodities.',
        totalMandis: 1361,
        totalFarmers: '1.76 crore',
        totalTraders: '2.19 lakh',
        totalTurnover: 'Rs 2.69 lakh crore',
        website: 'https://enam.gov.in',
      },
      registrationSteps: [
        {
          step: 1,
          title: 'Visit eNAM Portal or App',
          description: 'Go to enam.gov.in or download the eNAM mobile app from Play Store/App Store.',
          documents: [],
        },
        {
          step: 2,
          title: 'Select Registration Type',
          description: 'Choose your role: Farmer, Trader, Commission Agent (CA), or FPO.',
          documents: [],
        },
        {
          step: 3,
          title: 'Fill Registration Form',
          description: 'Enter personal details, address, bank account information, and select your nearest APMC mandi.',
          documents: ['Aadhaar Card', 'Bank Passbook/Cancelled Cheque', 'Passport Photo'],
        },
        {
          step: 4,
          title: 'Submit KYC Documents',
          description: 'Upload or physically submit required identity and address proof documents.',
          documents: ['Aadhaar Card', 'PAN Card (for traders)', 'Land Records / Pattadar Passbook (for farmers)', 'Trade License (for traders)'],
        },
        {
          step: 5,
          title: 'Verification & Approval',
          description: 'APMC/Mandi Secretary verifies documents and approves registration. You will receive login credentials via SMS.',
          documents: [],
        },
        {
          step: 6,
          title: 'Start Trading',
          description: 'Login to eNAM, create lots for sale, and participate in online bidding across connected mandis.',
          documents: [],
        },
      ],
      benefits: [
        'Transparent price discovery through online bidding',
        'Access to more buyers across the country',
        'Real-time price information from multiple mandis',
        'Direct payment to bank account within 24-48 hours',
        'Quality assaying at mandi ensures fair pricing',
        'Reduced intermediaries and better realization for farmers',
        'FPOs can aggregate and sell on behalf of member farmers',
      ],
      telanganaStatus: {
        integratedMandis: 57,
        registeredFarmers: '12.8 lakh',
        topCommodities: ['Cotton', 'Chili', 'Turmeric', 'Maize', 'Soybean'],
      },
    },
  });
});

// GET /api/supply-chain/finance
router.get('/finance', (_req, res: Response) => {
  res.json({
    success: true,
    data: {
      rxil: {
        name: 'RXIL (Receivables Exchange of India Limited)',
        description: 'A joint venture of SIDBI and NSE, RXIL operates the TReDS platform for financing trade receivables of MSMEs, including agri-businesses.',
        platform: 'TReDS (Trade Receivables Discounting System)',
        benefits: [
          'Get early payment for invoices at competitive rates',
          'No collateral required - invoice itself is the security',
          'Digital process - upload invoice and get funded in 24-48 hours',
          'Multiple financiers bid for your invoice, ensuring best rates',
          'RBI regulated platform for safety and transparency',
        ],
        eligibility: [
          'MSME registered entity (Udyam Registration)',
          'Supplying goods/services to corporates or government',
          'Valid GST registration',
          'Bank account linked to RXIL platform',
        ],
        howItWorks: [
          { step: 1, title: 'Register on TReDS', description: 'Both seller (MSME/farmer cooperative) and buyer register on the platform.' },
          { step: 2, title: 'Upload Invoice', description: 'Seller uploads invoice details after delivery of goods.' },
          { step: 3, title: 'Buyer Accepts', description: 'Buyer verifies and accepts the invoice on the platform.' },
          { step: 4, title: 'Financiers Bid', description: 'Banks and NBFCs bid to finance the invoice at competitive discount rates.' },
          { step: 5, title: 'Early Payment', description: 'Seller receives early payment (typically 80-90% of invoice value) within 24-48 hours.' },
          { step: 6, title: 'Settlement', description: 'On due date, buyer pays the financier directly through the platform.' },
        ],
        interestRates: '6-10% per annum (varies by buyer credit rating)',
        website: 'https://www.rxil.in',
      },
      kcc: {
        name: 'KCC (Kisan Credit Card)',
        description: 'A government scheme providing farmers with timely and adequate credit for agricultural and allied activities at subsidized interest rates.',
        interestRate: '4% per annum (with prompt repayment subvention)',
        normalRate: '7% per annum',
        maxLimit: 'Rs 3.00 lakh (crop loan component)',
        repaymentPeriod: '12 months (crop season based)',
        benefits: [
          'Subsidized interest rate of 4% (with 3% subvention on timely repayment)',
          'Covers crop production, post-harvest, and consumption needs',
          'Personal accident insurance cover of Rs 50,000',
          'No processing fee for loans up to Rs 3 lakh',
          'Flexible withdrawal as per crop cycle needs',
          'ATM-enabled RuPay card for easy cash withdrawal',
          'Covers allied activities: dairy, fisheries, poultry, sericulture',
        ],
        eligibility: [
          'Individual farmers (owner cultivators)',
          'Tenant farmers, oral lessees, share croppers',
          'Self-help groups (SHGs) and Joint Liability Groups (JLGs)',
          'Farmer Producer Organizations (FPOs)',
        ],
        requiredDocuments: [
          'Aadhaar Card',
          'Land ownership documents / Pattadar Passbook',
          'Passport size photographs (2)',
          'Bank account details',
          'Crop sowing certificate from village officer (if tenant)',
        ],
        applicationProcess: [
          { step: 1, title: 'Visit Bank Branch', description: 'Go to nearest branch of any commercial bank, RRB, or cooperative bank.' },
          { step: 2, title: 'Fill Application Form', description: 'Complete KCC application form with personal and land details.' },
          { step: 3, title: 'Submit Documents', description: 'Provide Aadhaar, land records, and photographs.' },
          { step: 4, title: 'Credit Limit Assessment', description: 'Bank assesses credit limit based on land holding, crops, and scale of finance.' },
          { step: 5, title: 'Card Issuance', description: 'KCC RuPay card issued within 14 working days of application.' },
        ],
        issuingBanks: ['State Bank of India', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Telangana Grameena Bank', 'DCCB (District Cooperative Central Banks)'],
        pmKisanIntegration: 'PM-KISAN beneficiaries can get simplified KCC with minimal documentation through Saturation Drive.',
      },
    },
  });
});

export default router;
