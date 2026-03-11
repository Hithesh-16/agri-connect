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

export const MOCK_PRICES: PriceEntry[] = [
  { cropId: "wheat", cropName: "Wheat", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 2100, maxPrice: 2350, modalPrice: 2250, change: 45, changePercent: 2.04, unit: "quintal", updatedAt: "10:30 AM" },
  { cropId: "rice", cropName: "Rice (Basmati)", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 3200, maxPrice: 3800, modalPrice: 3500, change: -80, changePercent: -2.23, unit: "quintal", updatedAt: "10:30 AM" },
  { cropId: "cotton", cropName: "Cotton", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 6200, maxPrice: 6800, modalPrice: 6500, change: 120, changePercent: 1.88, unit: "quintal", updatedAt: "11:00 AM" },
  { cropId: "chili", cropName: "Chili (Red)", mandiId: "m2", mandiName: "Nizamabad Market", minPrice: 9500, maxPrice: 11200, modalPrice: 10400, change: 350, changePercent: 3.49, unit: "quintal", updatedAt: "10:15 AM" },
  { cropId: "maize", cropName: "Maize", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 1750, maxPrice: 1900, modalPrice: 1820, change: -20, changePercent: -1.09, unit: "quintal", updatedAt: "09:45 AM" },
  { cropId: "soybean", cropName: "Soybean", mandiId: "m2", mandiName: "Nizamabad Market", minPrice: 4100, maxPrice: 4450, modalPrice: 4280, change: 60, changePercent: 1.42, unit: "quintal", updatedAt: "10:00 AM" },
  { cropId: "onion", cropName: "Onion", mandiId: "m3", mandiName: "Karimnagar Mandi", minPrice: 1800, maxPrice: 2200, modalPrice: 1950, change: -150, changePercent: -7.14, unit: "quintal", updatedAt: "09:30 AM" },
  { cropId: "tomato", cropName: "Tomato", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 600, maxPrice: 1400, modalPrice: 950, change: 200, changePercent: 26.67, unit: "quintal", updatedAt: "11:15 AM" },
  { cropId: "chickpea", cropName: "Chickpea", mandiId: "m4", mandiName: "Nalgonda APMC", minPrice: 4800, maxPrice: 5200, modalPrice: 5000, change: 80, changePercent: 1.63, unit: "quintal", updatedAt: "10:45 AM" },
  { cropId: "groundnut", cropName: "Groundnut", mandiId: "m2", mandiName: "Nizamabad Market", minPrice: 5200, maxPrice: 5800, modalPrice: 5500, change: -100, changePercent: -1.79, unit: "quintal", updatedAt: "10:20 AM" },
  { cropId: "turmeric", cropName: "Turmeric", mandiId: "m3", mandiName: "Karimnagar Mandi", minPrice: 7800, maxPrice: 9200, modalPrice: 8500, change: 450, changePercent: 5.59, unit: "quintal", updatedAt: "09:50 AM" },
  { cropId: "potato", cropName: "Potato", mandiId: "m5", mandiName: "Khammam Market", minPrice: 900, maxPrice: 1200, modalPrice: 1050, change: 30, changePercent: 2.94, unit: "quintal", updatedAt: "10:30 AM" },
];

export const MOCK_WEATHER: WeatherData = {
  condition: "partly_cloudy",
  tempC: 28,
  humidity: 72,
  windKph: 14,
  location: "Warangal, Telangana",
  forecast: [
    { day: "Today", condition: "partly_cloudy", high: 31, low: 22 },
    { day: "Wed", condition: "sunny", high: 33, low: 23 },
    { day: "Thu", condition: "rainy", high: 27, low: 21 },
    { day: "Fri", condition: "rainy", high: 26, low: 20 },
    { day: "Sat", condition: "cloudy", high: 29, low: 21 },
  ],
};

export const NEWS_ITEMS: NewsItem[] = [
  { id: "n1", title: "Government raises MSP for Kharif crops by 5-7%", summary: "Cabinet approves minimum support price hike for 14 Kharif crops, benefiting over 11 crore farmers across India.", category: "policy", date: "Mar 11, 2026", readTime: 3 },
  { id: "n2", title: "Cotton prices surge as exports to China rise", summary: "Indian cotton exports see a 23% jump this quarter driven by high demand from Chinese textile mills. Prices expected to stay firm.", category: "market", date: "Mar 10, 2026", readTime: 2 },
  { id: "n3", title: "Pre-monsoon showers expected in Telangana by March 20", summary: "IMD forecasts early pre-monsoon activity over Telangana and Andhra Pradesh. Farmers advised to complete rabi harvesting before this date.", category: "weather", date: "Mar 9, 2026", readTime: 2 },
  { id: "n4", title: "eNAM integration now live in 1,361 mandis nationwide", summary: "National Agriculture Market now connects buyers and sellers across India with transparent pricing. Register today to access lakhs of buyers.", category: "policy", date: "Mar 8, 2026", readTime: 4 },
  { id: "n5", title: "Chili prices hit 3-year high on short supply", summary: "Poor rainfall in key chili growing regions has tightened supply. Prices in Guntur and Warangal mandis are up 28% over last year.", category: "market", date: "Mar 7, 2026", readTime: 3 },
  { id: "n6", title: "Use drip irrigation to save 50% water — advisory", summary: "Agriculture department urges farmers to adopt drip and sprinkler irrigation to conserve water ahead of predicted dry spell.", category: "advisory", date: "Mar 6, 2026", readTime: 2 },
];
