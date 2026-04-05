"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UserRole } from "@/types";

export type SchemeCategory = "investment" | "income" | "credit" | "insurance" | "market" | "advisory";
export type EligibilityStatus = "eligible" | "maybe" | "not_eligible";

export interface GovernmentScheme {
  id: string;
  name: string;
  nameLocal?: string;
  category: SchemeCategory;
  description: string;
  benefit: string;
  eligibleRoles: UserRole[];
  eligibleStates: string[];
  documents: string[];
  applyUrl: string;
}

const FALLBACK_SCHEMES: GovernmentScheme[] = [
  {
    id: "s1",
    name: "Rythu Bandhu",
    nameLocal: "రైతు బంధు",
    category: "investment",
    description: "Telangana state investment support scheme providing financial assistance to farmers for crop cultivation. Covers both Kharif and Rabi seasons.",
    benefit: "Rs. 10,000 per acre per season",
    eligibleRoles: ["farmer"],
    eligibleStates: ["Telangana"],
    documents: ["Aadhaar Card", "Land ownership documents (pattadar passbook)", "Bank account details", "Phone number linked to Aadhaar"],
    applyUrl: "https://rythubandhu.telangana.gov.in",
  },
  {
    id: "s2",
    name: "PM-KISAN",
    nameLocal: "పి.ఎం. కిసాన్",
    category: "income",
    description: "Pradhan Mantri Kisan Samman Nidhi provides direct income support to all landholding farmer families across India. Benefit transferred in 3 equal installments.",
    benefit: "Rs. 6,000 per year (3 installments of Rs. 2,000)",
    eligibleRoles: ["farmer"],
    eligibleStates: [],
    documents: ["Aadhaar Card", "Land records", "Bank account with IFSC", "Mobile number"],
    applyUrl: "https://pmkisan.gov.in",
  },
  {
    id: "s3",
    name: "Kisan Credit Card (KCC)",
    nameLocal: "కిసాన్ క్రెడిట్ కార్డ్",
    category: "credit",
    description: "Provides farmers with affordable credit for crop production, post-harvest expenses, and maintenance of farm assets. Interest subvention available at 2% for timely repayment.",
    benefit: "Up to Rs. 3 lakh at 4% interest (2% subvention for timely repayment)",
    eligibleRoles: ["farmer"],
    eligibleStates: [],
    documents: ["Aadhaar Card", "Land records / Lease agreement", "Passport-size photographs", "Bank account details", "Crop sowing certificate"],
    applyUrl: "https://www.pmkisan.gov.in/KCC",
  },
  {
    id: "s4",
    name: "PMFBY (Crop Insurance)",
    nameLocal: "పి.ఎం.ఎఫ్.బి.వై.",
    category: "insurance",
    description: "Pradhan Mantri Fasal Bima Yojana provides comprehensive crop insurance against natural calamities, pests, and diseases. Premium is highly subsidized by the government.",
    benefit: "Premium: 2% for Kharif, 1.5% for Rabi (Government subsidizes rest)",
    eligibleRoles: ["farmer"],
    eligibleStates: [],
    documents: ["Aadhaar Card", "Land records", "Bank account details", "Sowing certificate", "KCC details (if applicable)"],
    applyUrl: "https://pmfby.gov.in",
  },
  {
    id: "s5",
    name: "Rythu Bima",
    nameLocal: "రైతు బీమా",
    category: "insurance",
    description: "Telangana government life insurance scheme for farmers aged 18-59 years. Premium fully paid by the state government. Benefit paid to nominee in case of death.",
    benefit: "Rs. 5 lakh life insurance (zero premium for farmer)",
    eligibleRoles: ["farmer"],
    eligibleStates: ["Telangana"],
    documents: ["Aadhaar Card", "Age proof", "Land ownership documents", "Nominee details", "Bank account details"],
    applyUrl: "https://rythubima.telangana.gov.in",
  },
  {
    id: "s6",
    name: "eNAM Registration",
    nameLocal: "ఇ-నామ్ రిజిస్ట్రేషన్",
    category: "market",
    description: "Electronic National Agriculture Market connects farmers to buyers across India. Free registration allows you to sell produce at best prices through transparent online bidding.",
    benefit: "Free registration + access to nationwide buyers + transparent pricing",
    eligibleRoles: ["farmer", "trader", "dealer"],
    eligibleStates: [],
    documents: ["Aadhaar Card", "Bank account details", "Mobile number", "Mandi license (for traders)"],
    applyUrl: "https://enam.gov.in",
  },
  {
    id: "s7",
    name: "Soil Health Card",
    nameLocal: "సాయిల్ హెల్త్ కార్డ్",
    category: "advisory",
    description: "Government provides soil testing and personalized Soil Health Card with crop-wise fertilizer recommendations. Helps optimize input costs and improve yields.",
    benefit: "Free soil testing + personalized fertilizer recommendations",
    eligibleRoles: ["farmer"],
    eligibleStates: [],
    documents: ["Aadhaar Card", "Land details (survey number)", "Mobile number"],
    applyUrl: "https://soilhealth.dac.gov.in",
  },
];

export function checkEligibility(
  scheme: GovernmentScheme,
  userRole?: UserRole,
  userState?: string
): EligibilityStatus {
  const roleMatch = scheme.eligibleRoles.includes(userRole || "farmer");
  const stateMatch = scheme.eligibleStates.length === 0 || scheme.eligibleStates.includes(userState || "");

  if (roleMatch && stateMatch) return "eligible";
  if (roleMatch || stateMatch) return "maybe";
  return "not_eligible";
}

export function useSchemes() {
  return useQuery({
    queryKey: ["schemes"],
    queryFn: async (): Promise<GovernmentScheme[]> => {
      try {
        const res = await api.get<{ success: boolean; data: GovernmentScheme[] }>("/api/schemes");
        return res.data || FALLBACK_SCHEMES;
      } catch {
        return FALLBACK_SCHEMES;
      }
    },
    staleTime: 600000,
  });
}

export const SCHEME_CATEGORIES: { id: SchemeCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "investment", label: "Investment" },
  { id: "income", label: "Income" },
  { id: "credit", label: "Credit" },
  { id: "insurance", label: "Insurance" },
  { id: "market", label: "Market" },
  { id: "advisory", label: "Advisory" },
];

export { FALLBACK_SCHEMES };
