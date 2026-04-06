# Phase 13: Financial Services & ONDC Integration

**Timeline:** Weeks 54–57
**Dependencies:** Phase 12 (Scale & Security) complete, Razorpay fully operational

---

## Objective

Expand KisanConnect into agricultural fintech — KCC loan assistance, crop insurance enrollment, warehouse receipt financing — and join India's Open Network for Digital Commerce (ONDC) for cross-platform interoperability.

---

## 13.1 KCC (Kisan Credit Card) Loan Assistance

### Flow
1. Farmer taps "Apply for KCC" in app
2. Profile auto-fills: name, Aadhaar, land records, crop details, bank account
3. App validates eligibility (land ownership, active farming)
4. Generates pre-filled application form (PDF)
5. Farmer submits to partner bank (SBI, PNB, etc.) via API or in-person
6. Track application status in app
7. KisanConnect earns referral fee: INR 200–500 per successful disbursement

### Partner Banks
- State Bank of India (largest KCC issuer)
- Punjab National Bank
- Regional Rural Banks (via NABARD partnerships)

---

## 13.2 PMFBY (Crop Insurance) Integration

### Flow
1. During crop selection/sowing, prompt farmer for PMFBY enrollment
2. Auto-fill: crop, season, area, premium calculation
3. Direct integration with PMFBY portal or via partner insurance company
4. Premium payment via Razorpay (subsidized — farmer pays 1.5-2% for Rabi, 2% for Kharif)
5. Claim tracking: satellite + weather data auto-triggers claim assessment
6. Revenue: per-enrollment fee from insurance company

### Insurance Partners
- Agriculture Insurance Company (AIC)
- ICICI Lombard
- Bajaj Allianz
- HDFC Ergo

---

## 13.3 Warehouse Receipt Financing

### Model (Arya.ag Inspired)
1. Farmer stores produce in registered warehouse
2. Warehouse issues electronic receipt (eNWR — electronic Negotiable Warehouse Receipt)
3. Farmer pledges receipt to bank/NBFC for loan (60-70% of produce value)
4. Farmer sells when market price is favorable → repays loan
5. KisanConnect facilitates: warehouse discovery, receipt verification, loan matchmaking

### Revenue
- Commission on loan facilitation (1-2% of loan value)
- Warehouse listing fees
- Data analytics for price-optimal sell timing recommendations

---

## 13.4 ONDC Integration

### What is ONDC
India's Open Network for Digital Commerce — a government-backed protocol that allows interoperability between buyer apps and seller apps. Any buyer on any ONDC-connected app can discover and purchase from any seller on any ONDC-connected seller app.

### KisanConnect as ONDC Seller App
- Register as ONDC Network Participant (seller side)
- Expose service provider listings to ONDC buyer apps
- Receive bookings from any ONDC buyer app (not just KisanConnect farmers)
- Expands vendor reach without vendor acquisition cost

### Implementation
- ONDC Protocol APIs: `/search`, `/select`, `/init`, `/confirm`, `/status`, `/cancel`
- Beckn Protocol adapter layer
- Catalog sync: push service listings to ONDC registry
- Order management: receive and fulfill ONDC orders alongside native orders

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/finance/kcc/apply` | Submit KCC application | Yes |
| GET | `/api/finance/kcc/status` | Track KCC application | Yes |
| GET | `/api/finance/kcc/eligibility` | Check KCC eligibility | Yes |
| POST | `/api/insurance/pmfby/enroll` | Enroll in PMFBY | Yes |
| GET | `/api/insurance/pmfby/premium` | Calculate premium | Yes |
| GET | `/api/insurance/claims` | My insurance claims | Yes |
| POST | `/api/insurance/claims` | File a claim | Yes |
| GET | `/api/warehouse/nearby` | Find warehouses | Yes |
| POST | `/api/warehouse/receipt` | Register warehouse receipt | Yes |
| POST | `/api/finance/loan/apply` | Apply for warehouse receipt loan | Yes |
| POST | `/api/ondc/search` | ONDC search callback | ONDC |
| POST | `/api/ondc/select` | ONDC select callback | ONDC |
| POST | `/api/ondc/confirm` | ONDC order confirmation | ONDC |
| POST | `/api/ondc/status` | ONDC status update | ONDC |

---

## Testing Checklist

- [ ] KCC eligibility check returns correct result for different farmer profiles
- [ ] KCC application PDF generated with correct pre-filled data
- [ ] PMFBY premium calculation matches official rates
- [ ] Insurance enrollment flows end-to-end
- [ ] Warehouse receipt creation and verification
- [ ] Loan application submission and status tracking
- [ ] ONDC catalog sync pushes all active service listings
- [ ] ONDC search/select/confirm protocol compliance
- [ ] ONDC orders appear in vendor's booking dashboard
- [ ] Cross-platform ONDC booking completion flow
