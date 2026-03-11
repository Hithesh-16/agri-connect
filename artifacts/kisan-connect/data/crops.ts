export interface Crop {
  id: string;
  name: string;
  category: "vegetable" | "cereal" | "pulse" | "spice" | "cash";
  icon: string;
  color: string;
  unit: string;
}

export const CROPS: Crop[] = [
  { id: "wheat", name: "Wheat", category: "cereal", icon: "grain", color: "#D97706", unit: "quintal" },
  { id: "rice", name: "Rice", category: "cereal", icon: "sack", color: "#A16207", unit: "quintal" },
  { id: "maize", name: "Maize", category: "cereal", icon: "corn", color: "#CA8A04", unit: "quintal" },
  { id: "cotton", name: "Cotton", category: "cash", icon: "flower", color: "#9CA3AF", unit: "quintal" },
  { id: "soybean", name: "Soybean", category: "pulse", icon: "circle-slice-8", color: "#65A30D", unit: "quintal" },
  { id: "chili", name: "Chili", category: "spice", icon: "chili-hot", color: "#DC2626", unit: "quintal" },
  { id: "tomato", name: "Tomato", category: "vegetable", icon: "fruit-cherries", color: "#EF4444", unit: "quintal" },
  { id: "onion", name: "Onion", category: "vegetable", icon: "circle-multiple", color: "#7C3AED", unit: "quintal" },
  { id: "potato", name: "Potato", category: "vegetable", icon: "oval-outline", color: "#92400E", unit: "quintal" },
  { id: "sorghum", name: "Sorghum", category: "cereal", icon: "barley", color: "#B45309", unit: "quintal" },
  { id: "chickpea", name: "Chickpea", category: "pulse", icon: "seed", color: "#D97706", unit: "quintal" },
  { id: "lentil", name: "Lentil", category: "pulse", icon: "seed-outline", color: "#A16207", unit: "quintal" },
  { id: "groundnut", name: "Groundnut", category: "cash", icon: "seed-circle", color: "#C2410C", unit: "quintal" },
  { id: "turmeric", name: "Turmeric", category: "spice", icon: "flower-outline", color: "#F59E0B", unit: "quintal" },
  { id: "coriander", name: "Coriander", category: "spice", icon: "leaf", color: "#16A34A", unit: "quintal" },
  { id: "millet", name: "Millet", category: "cereal", icon: "barley", color: "#B45309", unit: "quintal" },
  { id: "sunflower", name: "Sunflower", category: "cash", icon: "white-balance-sunny", color: "#F59E0B", unit: "quintal" },
  { id: "sugarcane", name: "Sugarcane", category: "cash", icon: "grass", color: "#15803D", unit: "tonne" },
  { id: "cauliflower", name: "Cauliflower", category: "vegetable", icon: "dots-hexagon", color: "#F5F5DC", unit: "quintal" },
  { id: "brinjal", name: "Brinjal", category: "vegetable", icon: "circle", color: "#6D28D9", unit: "quintal" },
];

export const CROP_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "cereal", label: "Cereals" },
  { id: "pulse", label: "Pulses" },
  { id: "vegetable", label: "Vegetables" },
  { id: "spice", label: "Spices" },
  { id: "cash", label: "Cash Crops" },
];
