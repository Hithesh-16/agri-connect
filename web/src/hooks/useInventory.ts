"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface InventoryCategory {
  id: string;
  names: { en: string; te: string; hi: string };
  icon: string;
  sortOrder: number;
  items: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  categoryId: string;
  names: { en: string; te: string; hi: string };
  descriptions?: { en: string; te: string; hi: string };
  defaultUnit: string;
  unitLabels: { en: string; te: string; hi: string };
  transactionTypes: string[];
  tags: string[];
  brand?: string;
}

export function getLocalizedName(
  names: { en: string; te: string; hi: string },
  locale: string
): string {
  if (locale === "te" && names.te) return names.te;
  if (locale === "hi" && names.hi) return names.hi;
  return names.en;
}

const FALLBACK_CATEGORIES: InventoryCategory[] = [
  {
    id: "machinery",
    names: { en: "Machinery", te: "యంత్రాలు", hi: "मशीनरी" },
    icon: "Tractor",
    sortOrder: 1,
    items: [
      { id: "m1", categoryId: "machinery", names: { en: "Tractor", te: "ట్రాక్టర్", hi: "ट्रैक्टर" }, descriptions: { en: "Farm tractor for plowing and transport", te: "దున్నడం మరియు రవాణా కోసం వ్యవసాయ ట్రాక్టర్", hi: "जुताई और परिवहन के लिए कृषि ट्रैक्टर" }, defaultUnit: "unit", unitLabels: { en: "Unit", te: "యూనిట్", hi: "इकाई" }, transactionTypes: ["selling", "buying", "renting"], tags: ["heavy", "plowing"] },
      { id: "m2", categoryId: "machinery", names: { en: "Rotavator", te: "రోటవేటర్", hi: "रोटावेटर" }, descriptions: { en: "Soil preparation rotary tiller", te: "భూమి సిద్ధం చేయడానికి రోటరీ టిల్లర్", hi: "मिट्टी तैयार करने वाला रोटरी टिलर" }, defaultUnit: "unit", unitLabels: { en: "Unit", te: "యూనిట్", hi: "इकाई" }, transactionTypes: ["selling", "buying", "renting"], tags: ["tilling", "attachment"] },
      { id: "m3", categoryId: "machinery", names: { en: "Seed Drill", te: "సీడ్ డ్రిల్", hi: "सीड ड्रिल" }, defaultUnit: "unit", unitLabels: { en: "Unit", te: "యూనిట్", hi: "इकाई" }, transactionTypes: ["selling", "buying", "renting"], tags: ["sowing"] },
      { id: "m4", categoryId: "machinery", names: { en: "Sprayer Pump", te: "స్ప్రేయర్ పంప్", hi: "स्प्रेयर पंप" }, defaultUnit: "unit", unitLabels: { en: "Unit", te: "యూనిట్", hi: "इकाई" }, transactionTypes: ["selling", "buying", "renting"], tags: ["spraying", "portable"] },
      { id: "m5", categoryId: "machinery", names: { en: "Harvester", te: "హార్వెస్టర్", hi: "हार्वेस्टर" }, defaultUnit: "unit", unitLabels: { en: "Unit", te: "యూనిట్", hi: "इकाई" }, transactionTypes: ["selling", "buying", "renting"], tags: ["harvest", "heavy"] },
      { id: "m6", categoryId: "machinery", names: { en: "Power Tiller", te: "పవర్ టిల్లర్", hi: "पावर टिलर" }, defaultUnit: "unit", unitLabels: { en: "Unit", te: "యూనిట్", hi: "इकाई" }, transactionTypes: ["selling", "buying", "renting"], tags: ["tilling", "small"] },
      { id: "m7", categoryId: "machinery", names: { en: "Thresher", te: "త్రెషర్", hi: "थ्रेशर" }, defaultUnit: "unit", unitLabels: { en: "Unit", te: "యూనిట్", hi: "इकाई" }, transactionTypes: ["selling", "buying", "renting"], tags: ["post-harvest"] },
    ],
  },
  {
    id: "pesticides",
    names: { en: "Pesticides", te: "పురుగుమందులు", hi: "कीटनाशक" },
    icon: "Bug",
    sortOrder: 2,
    items: [
      { id: "p1", categoryId: "pesticides", names: { en: "Imidacloprid 17.8% SL", te: "ఇమిడాక్లోప్రిడ్ 17.8% SL", hi: "इमिडाक्लोप्रिड 17.8% SL" }, descriptions: { en: "Systemic insecticide for sucking pests", te: "పీల్చే పురుగుల కోసం సిస్టమిక్ కీటనాశకం", hi: "चूसने वाले कीटों के लिए प्रणालीगत कीटनाशक" }, defaultUnit: "litre", unitLabels: { en: "Litre", te: "లీటర్", hi: "लीटर" }, transactionTypes: ["selling", "buying"], tags: ["insecticide", "systemic"], brand: "Confidor" },
      { id: "p2", categoryId: "pesticides", names: { en: "Chlorpyrifos 20% EC", te: "క్లోర్‌పైరిఫాస్ 20% EC", hi: "क्लोरपाइरीफॉस 20% EC" }, defaultUnit: "litre", unitLabels: { en: "Litre", te: "లీటర్", hi: "लीटर" }, transactionTypes: ["selling", "buying"], tags: ["insecticide", "contact"], brand: "Dursban" },
      { id: "p3", categoryId: "pesticides", names: { en: "Mancozeb 75% WP", te: "మాంకోజెబ్ 75% WP", hi: "मैंकोजेब 75% WP" }, descriptions: { en: "Broad-spectrum fungicide", te: "విస్తృత-స్పెక్ట్రం శిలీంద్రనాశకం", hi: "व्यापक-स्पेक्ट्रम फफूंदनाशक" }, defaultUnit: "kg", unitLabels: { en: "Kg", te: "కేజీ", hi: "किलो" }, transactionTypes: ["selling", "buying"], tags: ["fungicide"] },
      { id: "p4", categoryId: "pesticides", names: { en: "Glyphosate 41% SL", te: "గ్లైఫోసేట్ 41% SL", hi: "ग्लाइफोसेट 41% SL" }, defaultUnit: "litre", unitLabels: { en: "Litre", te: "లీటర్", hi: "लीटर" }, transactionTypes: ["selling", "buying"], tags: ["herbicide"] },
      { id: "p5", categoryId: "pesticides", names: { en: "Neem Oil (Azadirachtin)", te: "వేప నూనె (అజాడిరాక్టిన్)", hi: "नीम तेल (अज़ाडिरेक्टिन)" }, descriptions: { en: "Organic bio-pesticide", te: "సేంద్రీయ జీవ పురుగుమందు", hi: "जैविक कीटनाशक" }, defaultUnit: "litre", unitLabels: { en: "Litre", te: "లీటర్", hi: "लीटर" }, transactionTypes: ["selling", "buying"], tags: ["organic", "bio-pesticide"] },
      { id: "p6", categoryId: "pesticides", names: { en: "Profenofos 50% EC", te: "ప్రొఫెనోఫాస్ 50% EC", hi: "प्रोफेनोफॉस 50% EC" }, defaultUnit: "litre", unitLabels: { en: "Litre", te: "లీటర్", hi: "लीटर" }, transactionTypes: ["selling", "buying"], tags: ["insecticide", "cotton"] },
    ],
  },
  {
    id: "fertilizers",
    names: { en: "Fertilizers", te: "ఎరువులు", hi: "उर्वरक" },
    icon: "Beaker",
    sortOrder: 3,
    items: [
      { id: "f1", categoryId: "fertilizers", names: { en: "Urea (46% N)", te: "యూరియా (46% N)", hi: "यूरिया (46% N)" }, descriptions: { en: "Nitrogen fertilizer for vegetative growth", te: "వృద్ధికి నైట్రోజన్ ఎరువు", hi: "वानस्पतिक वृद्धि के लिए नाइट्रोजन उर्वरक" }, defaultUnit: "bag", unitLabels: { en: "Bag (50kg)", te: "బ్యాగ్ (50 కేజీ)", hi: "बैग (50 किलो)" }, transactionTypes: ["selling", "buying"], tags: ["nitrogen", "basic"] },
      { id: "f2", categoryId: "fertilizers", names: { en: "DAP (18-46-0)", te: "DAP (18-46-0)", hi: "DAP (18-46-0)" }, descriptions: { en: "Diammonium phosphate for root growth", te: "రూట్ పెరుగుదలకు డైయమ్మోనియం ఫాస్ఫేట్", hi: "जड़ वृद्धि के लिए डाइअमोनियम फॉस्फेट" }, defaultUnit: "bag", unitLabels: { en: "Bag (50kg)", te: "బ్యాగ్ (50 కేజీ)", hi: "बैग (50 किलो)" }, transactionTypes: ["selling", "buying"], tags: ["phosphate"] },
      { id: "f3", categoryId: "fertilizers", names: { en: "MOP (Potash 60%)", te: "MOP (పొటాష్ 60%)", hi: "MOP (पोटाश 60%)" }, defaultUnit: "bag", unitLabels: { en: "Bag (50kg)", te: "బ్యాగ్ (50 కేజీ)", hi: "बैग (50 किलो)" }, transactionTypes: ["selling", "buying"], tags: ["potash"] },
      { id: "f4", categoryId: "fertilizers", names: { en: "NPK 10-26-26", te: "NPK 10-26-26", hi: "NPK 10-26-26" }, defaultUnit: "bag", unitLabels: { en: "Bag (50kg)", te: "బ్యాగ్ (50 కేజీ)", hi: "बैग (50 किलो)" }, transactionTypes: ["selling", "buying"], tags: ["complex"] },
      { id: "f5", categoryId: "fertilizers", names: { en: "Vermicompost", te: "వర్మీకంపోస్ట్", hi: "वर्मीकम्पोस्ट" }, descriptions: { en: "Organic compost from earthworms", te: "వానపాముల నుండి సేంద్రీయ కంపోస్ట్", hi: "केंचुओं से जैविक खाद" }, defaultUnit: "kg", unitLabels: { en: "Kg", te: "కేజీ", hi: "किलो" }, transactionTypes: ["selling", "buying"], tags: ["organic"] },
      { id: "f6", categoryId: "fertilizers", names: { en: "Zinc Sulphate", te: "జింక్ సల్ఫేట్", hi: "ज़िंक सल्फेट" }, defaultUnit: "kg", unitLabels: { en: "Kg", te: "కేజీ", hi: "किलो" }, transactionTypes: ["selling", "buying"], tags: ["micronutrient"] },
      { id: "f7", categoryId: "fertilizers", names: { en: "Single Super Phosphate", te: "సింగిల్ సూపర్ ఫాస్ఫేట్", hi: "सिंगल सुपर फॉस्फेट" }, defaultUnit: "bag", unitLabels: { en: "Bag (50kg)", te: "బ్యాగ్ (50 కేజీ)", hi: "बैग (50 किलो)" }, transactionTypes: ["selling", "buying"], tags: ["phosphate"] },
      { id: "f8", categoryId: "fertilizers", names: { en: "Gypsum", te: "జిప్సం", hi: "जिप्सम" }, defaultUnit: "bag", unitLabels: { en: "Bag (50kg)", te: "బ్యాగ్ (50 కేజీ)", hi: "బ్యాగ్ (50 किलो)" }, transactionTypes: ["selling", "buying"], tags: ["soil-amendment"] },
    ],
  },
  {
    id: "seeds",
    names: { en: "Seeds", te: "విత్తనాలు", hi: "बीज" },
    icon: "Sprout",
    sortOrder: 4,
    items: [
      { id: "s1", categoryId: "seeds", names: { en: "BT Cotton Seeds", te: "BT పత్తి విత్తనాలు", hi: "BT कपास बीज" }, descriptions: { en: "Bollworm resistant hybrid cotton seeds", te: "బోల్‌వార్మ్ నిరోధక హైబ్రిడ్ పత్తి విత్తనాలు", hi: "बॉलवर्म प्रतिरोधी हाइब्रिड कपास बीज" }, defaultUnit: "packet", unitLabels: { en: "Packet (450g)", te: "ప్యాకెట్ (450 గ్రా)", hi: "पैकेट (450 ग्रा)" }, transactionTypes: ["selling", "buying"], tags: ["hybrid", "cotton"], brand: "Mahyco" },
      { id: "s2", categoryId: "seeds", names: { en: "Sona Masuri Paddy Seeds", te: "సోనా మసూరి వరి విత్తనాలు", hi: "सोना मसूरी धान बीज" }, defaultUnit: "kg", unitLabels: { en: "Kg", te: "కేజీ", hi: "किलो" }, transactionTypes: ["selling", "buying"], tags: ["paddy", "fine-grain"] },
      { id: "s3", categoryId: "seeds", names: { en: "Hybrid Maize Seeds", te: "హైబ్రిడ్ మొక్కజొన్న విత్తనాలు", hi: "हाइब्रिड मक्का बीज" }, defaultUnit: "kg", unitLabels: { en: "Kg", te: "కేజీ", hi: "किलो" }, transactionTypes: ["selling", "buying"], tags: ["hybrid", "maize"] },
      { id: "s4", categoryId: "seeds", names: { en: "Teja Chili Seeds", te: "తేజ మిర్చి విత్తనాలు", hi: "तेजा मिर्च बीज" }, descriptions: { en: "High yield red chili variety", te: "అధిక దిగుబడి ఎర్ర మిర్చి రకం", hi: "उच्च उपज लाल मिर्च किस्म" }, defaultUnit: "packet", unitLabels: { en: "Packet (100g)", te: "ప్యాకెట్ (100 గ్రా)", hi: "पैकेट (100 ग्रा)" }, transactionTypes: ["selling", "buying"], tags: ["chili", "high-yield"] },
      { id: "s5", categoryId: "seeds", names: { en: "Wheat HD-2967 Seeds", te: "గోధుమ HD-2967 విత్తనాలు", hi: "गेहूं HD-2967 बीज" }, defaultUnit: "kg", unitLabels: { en: "Kg", te: "కేజీ", hi: "किलो" }, transactionTypes: ["selling", "buying"], tags: ["wheat", "certified"] },
      { id: "s6", categoryId: "seeds", names: { en: "Tomato Hybrid Seeds", te: "టమాటా హైబ్రిడ్ విత్తనాలు", hi: "टमाटर हाइब्रिड बीज" }, defaultUnit: "packet", unitLabels: { en: "Packet (10g)", te: "ప్యాకెట్ (10 గ్రా)", hi: "पैकेट (10 ग्रा)" }, transactionTypes: ["selling", "buying"], tags: ["hybrid", "vegetable"] },
    ],
  },
];

export function useInventory(categoryFilter?: string) {
  return useQuery({
    queryKey: ["inventory", categoryFilter],
    queryFn: async (): Promise<InventoryCategory[]> => {
      try {
        const params: Record<string, string> = {};
        if (categoryFilter) params.category = categoryFilter;
        const res = await api.get<{ success: boolean; data: InventoryCategory[] }>("/api/inventory", { params });
        return res.data || FALLBACK_CATEGORIES;
      } catch {
        let data = FALLBACK_CATEGORIES;
        if (categoryFilter) {
          data = data.filter((c) => c.id === categoryFilter);
        }
        return data;
      }
    },
    staleTime: 300000,
  });
}

export function useInventorySearch(query: string) {
  return useQuery({
    queryKey: ["inventorySearch", query],
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!query || query.length < 2) return [];
      try {
        const res = await api.get<{ success: boolean; data: InventoryItem[] }>("/api/inventory/search", {
          params: { q: query },
        });
        return res.data || [];
      } catch {
        const lowerQuery = query.toLowerCase();
        const results: InventoryItem[] = [];
        for (const category of FALLBACK_CATEGORIES) {
          for (const item of category.items) {
            const matchEn = item.names.en.toLowerCase().includes(lowerQuery);
            const matchTe = item.names.te.toLowerCase().includes(lowerQuery);
            const matchHi = item.names.hi.toLowerCase().includes(lowerQuery);
            const matchTags = item.tags.some((t) => t.toLowerCase().includes(lowerQuery));
            const matchBrand = item.brand?.toLowerCase().includes(lowerQuery);
            if (matchEn || matchTe || matchHi || matchTags || matchBrand) {
              results.push(item);
            }
          }
        }
        return results;
      }
    },
    enabled: query.length >= 2,
    staleTime: 60000,
  });
}

export { FALLBACK_CATEGORIES };
