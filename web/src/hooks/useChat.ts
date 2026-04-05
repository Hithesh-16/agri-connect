"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { ALL_FULL_PRICES } from "@/hooks/usePrices";
import { formatCurrency } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "price_info" | "weather_info" | "scheme_info" | "disease_info";
  data?: Record<string, unknown>;
  timestamp: number;
}

const CROP_KEYWORDS: Record<string, string[]> = {
  wheat: ["wheat", "గోధుమ", "गेहूं"],
  rice: ["rice", "బియ్యం", "चावल", "basmati"],
  cotton: ["cotton", "పత్తి", "कपास"],
  chili: ["chili", "chilli", "మిర్చి", "मिर्च"],
  maize: ["maize", "corn", "మొక్కజొన్న", "मक्का"],
  soybean: ["soybean", "soy", "సోయాబీన్", "सोयाबीन"],
  onion: ["onion", "ఉల్లిపాయ", "प्याज़"],
  tomato: ["tomato", "టమాట", "टमाटर"],
  chickpea: ["chickpea", "chana", "శెనగ", "चना"],
  groundnut: ["groundnut", "peanut", "వేరుశెనగ", "मूंगफली"],
  turmeric: ["turmeric", "పసుపు", "हल्दी"],
  potato: ["potato", "బంగాళాదుంప", "आलू"],
};

function detectCrop(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [cropId, keywords] of Object.entries(CROP_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return cropId;
    }
  }
  return null;
}

function buildPriceResponse(cropId: string): ChatMessage {
  const entry = ALL_FULL_PRICES.find((p) => p.cropId === cropId);
  if (!entry) {
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: "Sorry, I don't have price data for that crop right now.",
      type: "text",
      timestamp: Date.now(),
    };
  }
  const changeDir = entry.change >= 0 ? "up" : "down";
  const changeIcon = entry.change >= 0 ? "+" : "";
  return {
    id: Date.now().toString(),
    role: "assistant",
    content: `**${entry.cropName}** at ${entry.mandiName}:\n\n- Mandi Price: **${formatCurrency(entry.mandiPrice)}** per ${entry.unit}\n- Farm Gate: ${formatCurrency(entry.farmGatePrice)}\n- Retail: ${formatCurrency(entry.retailPrice)}\n- Change: ${changeIcon}${entry.changePercent.toFixed(1)}% (${changeDir})\n- Updated: ${entry.updatedAt}`,
    type: "price_info",
    data: {
      cropName: entry.cropName,
      mandiPrice: entry.mandiPrice,
      farmGatePrice: entry.farmGatePrice,
      retailPrice: entry.retailPrice,
      change: entry.change,
      changePercent: entry.changePercent,
      unit: entry.unit,
      mandiName: entry.mandiName,
    },
    timestamp: Date.now(),
  };
}

function buildWeatherResponse(): ChatMessage {
  return {
    id: Date.now().toString(),
    role: "assistant",
    content:
      "**Weather Forecast - Warangal, Telangana:**\n\n- Today: Partly cloudy, 32 C, Humidity 65%\n- Tomorrow: Sunny, 34 C\n- Day After: Partly cloudy, 31 C\n\nGood conditions for field work over the next 2 days. No rainfall expected this week.",
    type: "weather_info",
    data: {
      condition: "partly_cloudy",
      tempC: 32,
      humidity: 65,
      location: "Warangal, Telangana",
    },
    timestamp: Date.now(),
  };
}

function buildSchemeResponse(): ChatMessage {
  return {
    id: Date.now().toString(),
    role: "assistant",
    content:
      "**Government Schemes for Farmers:**\n\n1. **PM-KISAN**: Rs 6,000/year in 3 installments. All landholding farmers eligible. Apply at pmkisan.gov.in\n\n2. **Rythu Bandhu (Telangana)**: Rs 10,000/acre/year for investment support. Register at your local agriculture office.\n\n3. **PM Fasal Bima Yojana**: Crop insurance at 2% premium for Kharif, 1.5% for Rabi. Enroll through your bank.\n\n4. **KCC (Kisan Credit Card)**: Low-interest crop loans up to Rs 3 lakh at 4% interest. Apply at any bank branch.",
    type: "scheme_info",
    data: {
      schemes: ["PM-KISAN", "Rythu Bandhu", "PM Fasal Bima", "KCC"],
    },
    timestamp: Date.now(),
  };
}

function buildDiseaseResponse(): ChatMessage {
  return {
    id: Date.now().toString(),
    role: "assistant",
    content:
      "Yellow spots on tomato leaves can indicate several conditions:\n\n1. **Early Blight** (Alternaria solani) - brown spots with concentric rings\n2. **Septoria Leaf Spot** - small circular spots with dark edges\n3. **Nutrient deficiency** - nitrogen or magnesium deficiency\n\n**Recommended actions:**\n- Remove affected leaves immediately\n- Apply Mancozeb 75% WP (2g/L) as a fungicide spray\n- Ensure proper spacing for air circulation\n- Use neem oil spray as an organic alternative\n\nFor accurate diagnosis, use the **Disease Scanner** to upload a photo of the affected leaf.",
    type: "disease_info",
    timestamp: Date.now(),
  };
}

function buildFallbackResponse(message: string): ChatMessage {
  const lower = message.toLowerCase();

  // Check for price-related queries
  const cropId = detectCrop(message);
  if (cropId && (lower.includes("price") || lower.includes("ధర") || lower.includes("भाव") || lower.includes("rate") || lower.includes("cost"))) {
    return buildPriceResponse(cropId);
  }
  if (cropId) {
    return buildPriceResponse(cropId);
  }

  // Weather
  if (lower.includes("weather") || lower.includes("వాతావరణ") || lower.includes("मौसम") || lower.includes("rain") || lower.includes("forecast")) {
    return buildWeatherResponse();
  }

  // Schemes
  if (lower.includes("scheme") || lower.includes("pm-kisan") || lower.includes("pm kisan") || lower.includes("rythu") || lower.includes("पथक") || lower.includes("पथकाल") || lower.includes("योजना") || lower.includes("subsidy") || lower.includes("insurance")) {
    return buildSchemeResponse();
  }

  // Disease
  if (lower.includes("disease") || lower.includes("yellow") || lower.includes("spots") || lower.includes("pest") || lower.includes("wilt") || lower.includes("blight") || lower.includes("వ్యాధి") || lower.includes("रोग")) {
    return buildDiseaseResponse();
  }

  // Sowing
  if (lower.includes("sow") || lower.includes("plant") || lower.includes("when to") || lower.includes("విత్తన") || lower.includes("बुवाई")) {
    return {
      id: Date.now().toString(),
      role: "assistant",
      content:
        "**Sowing Calendar for Telangana:**\n\n- **Kharif (June-July):** Rice, Cotton, Maize, Soybean, Chili\n- **Rabi (Oct-Nov):** Wheat, Chickpea, Lentil, Groundnut, Sunflower\n- **Summer (Feb-Mar):** Vegetables (Tomato, Onion, Brinjal)\n\nFor specific crop timing, check the **Calendar** section or ask me about a particular crop!",
      type: "text",
      timestamp: Date.now(),
    };
  }

  return {
    id: Date.now().toString(),
    role: "assistant",
    content:
      "I can help you with:\n\n- **Crop prices** - Ask about any crop (e.g., \"cotton price today\")\n- **Weather forecasts** - Current and upcoming weather\n- **Disease diagnosis** - Describe symptoms or use the Scanner\n- **Government schemes** - PM-KISAN, Rythu Bandhu, etc.\n- **Sowing advice** - When to plant different crops\n\nTry asking about a specific topic!",
    type: "text",
    timestamp: Date.now(),
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        type: "text",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await api.post<{ success: boolean; data: ChatMessage }>(
          "/api/chat",
          {
            message: content,
            history: messages.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }
        );
        if (res.data) {
          setMessages((prev) => [
            ...prev,
            { ...res.data, id: `bot-${Date.now()}`, timestamp: Date.now() },
          ]);
        } else {
          throw new Error("No data");
        }
      } catch {
        // Fallback to client-side pattern matching
        await new Promise((r) => setTimeout(r, 600));
        const botMsg = buildFallbackResponse(content);
        setMessages((prev) => [...prev, botMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const suggestions = [
    { en: "Cotton price today", te: "నేటి పత్తి ధర", hi: "आज कपास का भाव" },
    { en: "Weather forecast", te: "వాతావరణ సమాచారం", hi: "मौसम का पूर्वानुमान" },
    { en: "Am I eligible for PM-KISAN?", te: "PM-KISAN కి నేను అర్హుడినా?", hi: "क्या मैं PM-KISAN के लिए पात्र हूँ?" },
    { en: "When to sow wheat?", te: "గోధుమ ఎప్పుడు విత్తాలి?", hi: "गेहूं कब बोएं?" },
    { en: "My tomato has yellow spots", te: "నా టమాటకు పసుపు మచ్చలు", hi: "मेरे टमाटर पर पीले धब्बे हैं" },
    { en: "Government schemes", te: "ప్రభుత్వ పథకాలు", hi: "सरकारी योजनाएँ" },
  ];

  return { messages, sendMessage, isLoading, suggestions };
}
