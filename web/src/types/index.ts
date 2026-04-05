export type UserRole = "farmer" | "trader" | "dealer" | "corporate";

export interface User {
  mobile: string;
  aadhaar?: string;
  firstName: string;
  surname: string;
  role: UserRole;
  village?: string;
  district?: string;
  state?: string;
  mandal?: string;
  gender?: "male" | "female" | "other";
  language?: string;
  updatesConsent: boolean;
  selectedCropIds: string[];
  selectedMandiIds: string[];
  lastActive: number;
}

export interface Crop {
  id: string;
  name: string;
  category: "vegetable" | "cereal" | "pulse" | "spice" | "cash";
  icon: string;
  color: string;
  unit: string;
}

export interface Mandi {
  id: string;
  name: string;
  district: string;
  state: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  activeCrops: number;
  volume: string;
}

export interface PriceEntry {
  cropId: string;
  cropName: string;
  mandiId: string;
  mandiName: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  change: number;
  changePercent: number;
  unit: string;
  updatedAt: string;
}

export interface FullPriceEntry {
  cropId: string;
  cropName: string;
  mandiId: string;
  mandiName: string;
  farmGatePrice: number;
  dealerPrice: number;
  mandiPrice: number;
  retailPrice: number;
  dealerMargin: number;
  change: number;
  changePercent: number;
  unit: string;
  volume: string;
  updatedAt: string;
}

export interface WeatherData {
  condition: "sunny" | "cloudy" | "rainy" | "partly_cloudy";
  tempC: number;
  humidity: number;
  windKph: number;
  location: string;
  forecast: { day: string; condition: string; high: number; low: number }[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: "market" | "policy" | "weather" | "advisory";
  date: string;
  readTime: number;
}

export interface DiseaseResult {
  cropName: string;
  diseaseName: string;
  confidence: number;
  severity: "Mild" | "Moderate" | "Severe";
  affectedArea: string;
  weatherNote: string;
  treatments: { type: "organic" | "chemical" | "preventive"; action: string }[];
  nearbyAdvisory: string;
}
