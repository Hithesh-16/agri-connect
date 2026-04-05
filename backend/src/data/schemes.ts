export interface SchemeEligibility {
  roles: string[];
  states: string[];
  requiresLand?: boolean;
  minAge?: number;
  maxAge?: number;
}

export interface Scheme {
  id: string;
  name: string;
  nameTE: string;
  description: string;
  benefit: string;
  eligibility: SchemeEligibility;
  documents: string[];
  applyUrl: string;
  category: string;
}

export const SCHEMES: Scheme[] = [
  {
    id: "rythu_bandhu",
    name: "Rythu Bandhu",
    nameTE: "రైతు బంధు",
    description: "Investment support of ₹10,000 per acre per year for crop production",
    benefit: "₹10,000/acre/year",
    eligibility: { roles: ["farmer"], states: ["Telangana"], requiresLand: true },
    documents: ["Pattadar passbook", "Aadhaar card", "Bank passbook"],
    applyUrl: "https://treasury.telangana.gov.in/rythubandhu",
    category: "investment"
  },
  {
    id: "pm_kisan",
    name: "PM-KISAN",
    nameTE: "ప్రధాన మంత్రి కిసాన్",
    description: "₹6,000 per year in three installments for all land-holding farmer families",
    benefit: "₹6,000/year",
    eligibility: { roles: ["farmer"], states: ["all"], requiresLand: true },
    documents: ["Aadhaar card", "Land records", "Bank account"],
    applyUrl: "https://pmkisan.gov.in",
    category: "income"
  },
  {
    id: "kcc",
    name: "Kisan Credit Card",
    nameTE: "కిసాన్ క్రెడిట్ కార్డ్",
    description: "Short-term credit up to ₹3 lakh at 4% interest for crop production",
    benefit: "Up to ₹3 lakh at 4% p.a.",
    eligibility: { roles: ["farmer"], states: ["all"], requiresLand: true },
    documents: ["Aadhaar card", "Land records", "Identity proof", "Passport photo"],
    applyUrl: "https://pmkisan.gov.in/KCCForm",
    category: "credit"
  },
  {
    id: "pmfby",
    name: "PMFBY (Crop Insurance)",
    nameTE: "ప్రధాన మంత్రి ఫసల్ బీమా",
    description: "Crop insurance at 1.5-5% premium. Full claim on crop loss due to natural calamities.",
    benefit: "Full crop value insurance",
    eligibility: { roles: ["farmer"], states: ["all"], requiresLand: true },
    documents: ["Aadhaar card", "Land records", "Sowing certificate", "Bank account"],
    applyUrl: "https://pmfby.gov.in",
    category: "insurance"
  },
  {
    id: "rythu_bima",
    name: "Rythu Bima",
    nameTE: "రైతు బీమా",
    description: "Life insurance of ₹5 lakh for farmers aged 18-59. Government pays full premium.",
    benefit: "₹5 lakh life cover (free)",
    eligibility: { roles: ["farmer"], states: ["Telangana"], minAge: 18, maxAge: 59 },
    documents: ["Pattadar passbook", "Aadhaar card", "Age proof"],
    applyUrl: "https://rythubima.telangana.gov.in",
    category: "insurance"
  },
  {
    id: "enam_registration",
    name: "eNAM Registration",
    nameTE: "ఈ-నామ్ నమోదు",
    description: "Register on National Agriculture Market for transparent online trading across 1,361 mandis",
    benefit: "Access to national market",
    eligibility: { roles: ["farmer", "trader", "dealer"], states: ["all"] },
    documents: ["Aadhaar card", "PAN card (traders)", "Bank passbook", "Trade license (traders)"],
    applyUrl: "https://enam.gov.in",
    category: "market"
  },
  {
    id: "soil_health_card",
    name: "Soil Health Card",
    nameTE: "మట్టి ఆరోగ్య కార్డు",
    description: "Free soil testing and nutrient recommendations for your farm",
    benefit: "Free soil analysis + recommendations",
    eligibility: { roles: ["farmer"], states: ["all"], requiresLand: true },
    documents: ["Aadhaar card", "Land details"],
    applyUrl: "https://soilhealth.dac.gov.in",
    category: "advisory"
  }
];
