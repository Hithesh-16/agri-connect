import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { CROPS } from "@/data/crops";

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

const ALL_PRICES: FullPriceEntry[] = [
  { cropId: "wheat", cropName: "Wheat", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 1950, dealerPrice: 2100, mandiPrice: 2250, retailPrice: 2600, dealerMargin: 150, change: 45, changePercent: 2.04, unit: "quintal", volume: "420 qtl", updatedAt: "10:30 AM" },
  { cropId: "rice", cropName: "Rice (Basmati)", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 3000, dealerPrice: 3200, mandiPrice: 3500, retailPrice: 4200, dealerMargin: 200, change: -80, changePercent: -2.23, unit: "quintal", volume: "310 qtl", updatedAt: "10:30 AM" },
  { cropId: "cotton", cropName: "Cotton", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 5800, dealerPrice: 6200, mandiPrice: 6500, retailPrice: 7800, dealerMargin: 400, change: 120, changePercent: 1.88, unit: "quintal", volume: "680 qtl", updatedAt: "11:00 AM" },
  { cropId: "chili", cropName: "Chili (Red)", mandiId: "m2", mandiName: "Nizamabad Market", farmGatePrice: 8800, dealerPrice: 9500, mandiPrice: 10400, retailPrice: 13000, dealerMargin: 700, change: 350, changePercent: 3.49, unit: "quintal", volume: "180 qtl", updatedAt: "10:15 AM" },
  { cropId: "maize", cropName: "Maize", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 1600, dealerPrice: 1750, mandiPrice: 1820, retailPrice: 2100, dealerMargin: 150, change: -20, changePercent: -1.09, unit: "quintal", volume: "560 qtl", updatedAt: "09:45 AM" },
  { cropId: "soybean", cropName: "Soybean", mandiId: "m2", mandiName: "Nizamabad Market", farmGatePrice: 3800, dealerPrice: 4100, mandiPrice: 4280, retailPrice: 5100, dealerMargin: 300, change: 60, changePercent: 1.42, unit: "quintal", volume: "240 qtl", updatedAt: "10:00 AM" },
  { cropId: "onion", cropName: "Onion", mandiId: "m3", mandiName: "Karimnagar Mandi", farmGatePrice: 1500, dealerPrice: 1800, mandiPrice: 1950, retailPrice: 2800, dealerMargin: 300, change: -150, changePercent: -7.14, unit: "quintal", volume: "920 qtl", updatedAt: "09:30 AM" },
  { cropId: "tomato", cropName: "Tomato", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 500, dealerPrice: 700, mandiPrice: 950, retailPrice: 1600, dealerMargin: 200, change: 200, changePercent: 26.67, unit: "quintal", volume: "340 qtl", updatedAt: "11:15 AM" },
  { cropId: "chickpea", cropName: "Chickpea", mandiId: "m4", mandiName: "Nalgonda APMC", farmGatePrice: 4400, dealerPrice: 4800, mandiPrice: 5000, retailPrice: 6200, dealerMargin: 400, change: 80, changePercent: 1.63, unit: "quintal", volume: "190 qtl", updatedAt: "10:45 AM" },
  { cropId: "groundnut", cropName: "Groundnut", mandiId: "m2", mandiName: "Nizamabad Market", farmGatePrice: 4800, dealerPrice: 5200, mandiPrice: 5500, retailPrice: 7000, dealerMargin: 400, change: -100, changePercent: -1.79, unit: "quintal", volume: "280 qtl", updatedAt: "10:20 AM" },
  { cropId: "turmeric", cropName: "Turmeric", mandiId: "m3", mandiName: "Karimnagar Mandi", farmGatePrice: 7200, dealerPrice: 7800, mandiPrice: 8500, retailPrice: 11000, dealerMargin: 600, change: 450, changePercent: 5.59, unit: "quintal", volume: "95 qtl", updatedAt: "09:50 AM" },
  { cropId: "potato", cropName: "Potato", mandiId: "m5", mandiName: "Khammam Market", farmGatePrice: 800, dealerPrice: 900, mandiPrice: 1050, retailPrice: 1500, dealerMargin: 100, change: 30, changePercent: 2.94, unit: "quintal", volume: "480 qtl", updatedAt: "10:30 AM" },
  { cropId: "sorghum", cropName: "Sorghum", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 2100, dealerPrice: 2300, mandiPrice: 2450, retailPrice: 2900, dealerMargin: 200, change: 15, changePercent: 0.62, unit: "quintal", volume: "310 qtl", updatedAt: "10:00 AM" },
  { cropId: "lentil", cropName: "Lentil (Masoor)", mandiId: "m4", mandiName: "Nalgonda APMC", farmGatePrice: 5500, dealerPrice: 5900, mandiPrice: 6200, retailPrice: 7800, dealerMargin: 400, change: 120, changePercent: 1.97, unit: "quintal", volume: "145 qtl", updatedAt: "11:00 AM" },
];

type PriceType = "mandi" | "farmGate" | "dealer" | "retail";

const PRICE_TYPES: { id: PriceType; label: string; desc: string; color: string }[] = [
  { id: "mandi", label: "Mandi Price", desc: "Market rate at APMC", color: Colors.primary },
  { id: "farmGate", label: "Farm Gate", desc: "Price at farm level", color: "#16A34A" },
  { id: "dealer", label: "Dealer", desc: "Cost + margin", color: "#F59E0B" },
  { id: "retail", label: "Retail", desc: "Consumer price", color: "#3B82F6" },
];

function getPriceForType(item: FullPriceEntry, type: PriceType): number {
  switch (type) {
    case "farmGate": return item.farmGatePrice;
    case "dealer": return item.dealerPrice;
    case "retail": return item.retailPrice;
    default: return item.mandiPrice;
  }
}

function PriceRow({ item, priceType }: { item: FullPriceEntry; priceType: PriceType }) {
  const isUp = item.change >= 0;
  const price = getPriceForType(item, priceType);
  const selectedType = PRICE_TYPES.find((t) => t.id === priceType)!;

  return (
    <View style={styles.priceRow}>
      <View style={styles.priceRowLeft}>
        <View style={[styles.priceRowDot, { backgroundColor: isUp ? Colors.green : Colors.red }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.priceRowCrop}>{item.cropName}</Text>
          <Text style={styles.priceRowMandi} numberOfLines={1}>{item.mandiName}</Text>
          <Text style={styles.priceRowVolume}>{item.volume} traded today</Text>
        </View>
      </View>
      <View style={styles.priceRowRight}>
        <Text style={[styles.priceRowModal, { color: selectedType.color }]}>₹{price.toLocaleString()}</Text>
        <Text style={styles.priceRowUnit}>/{item.unit}</Text>
        <View style={[styles.priceRowBadge, { backgroundColor: isUp ? Colors.green + "18" : Colors.red + "18" }]}>
          <MaterialCommunityIcons name={isUp ? "arrow-up" : "arrow-down"} size={11} color={isUp ? Colors.green : Colors.red} />
          <Text style={[styles.priceRowBadgeText, { color: isUp ? Colors.green : Colors.red }]}>
            {Math.abs(item.changePercent).toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PricesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("mandi");
  const [filterMyCrops, setFilterMyCrops] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const userCropIds = user?.selectedCropIds || [];
  const userMandiIds = user?.selectedMandiIds || [];

  const filtered = ALL_PRICES.filter((p) => {
    const matchesSearch =
      p.cropName.toLowerCase().includes(search.toLowerCase()) ||
      p.mandiName.toLowerCase().includes(search.toLowerCase());
    const matchesMyCrops = !filterMyCrops || userCropIds.includes(p.cropId);
    return matchesSearch && matchesMyCrops;
  }).sort((a, b) => getPriceForType(b, priceType) - getPriceForType(a, priceType));

  // Highlight: highest price change crop for user's selected crops
  const topGainer = [...ALL_PRICES]
    .filter((p) => userCropIds.length === 0 || userCropIds.includes(p.cropId))
    .sort((a, b) => b.changePercent - a.changePercent)[0] || ALL_PRICES[0];

  const selectedType = PRICE_TYPES.find((t) => t.id === priceType)!;

  async function onRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Live Market Prices</Text>
          <Text style={styles.headerSub}>Updated as of today · {ALL_PRICES.length} crops</Text>
        </View>
        {userCropIds.length > 0 && (
          <Pressable
            style={[styles.myCropsToggle, filterMyCrops && styles.myCropsToggleActive]}
            onPress={() => setFilterMyCrops((v) => !v)}
          >
            <MaterialCommunityIcons name="filter-variant" size={16} color={filterMyCrops ? "#fff" : Colors.primary} />
            <Text style={[styles.myCropsToggleText, filterMyCrops && styles.myCropsToggleTextActive]}>My Crops</Text>
          </Pressable>
        )}
      </View>

      {/* Price Type Selector */}
      <View style={styles.priceTypeSection}>
        <Text style={styles.priceTypeLabel}>Price Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 4 }}>
          {PRICE_TYPES.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.priceTypeCard, priceType === t.id && { borderColor: t.color, backgroundColor: t.color + "10" }]}
              onPress={() => setPriceType(t.id)}
            >
              <View style={[styles.priceTypeDot, { backgroundColor: t.color }]} />
              <View>
                <Text style={[styles.priceTypeName, priceType === t.id && { color: t.color }]}>{t.label}</Text>
                <Text style={styles.priceTypeDesc}>{t.desc}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Pricing Chain Legend */}
      {topGainer && (
        <View style={styles.chainSection}>
          <Text style={styles.chainLabel}>Price Chain — {topGainer.cropName}</Text>
          <View style={styles.chainRow}>
            {[
              { label: "Farm Gate", price: topGainer.farmGatePrice, color: "#16A34A" },
              { label: "Dealer", price: topGainer.dealerPrice, color: "#F59E0B" },
              { label: "Mandi", price: topGainer.mandiPrice, color: Colors.primary },
              { label: "Retail", price: topGainer.retailPrice, color: "#3B82F6" },
            ].map((c, i, arr) => (
              <React.Fragment key={c.label}>
                <View style={styles.chainItem}>
                  <View style={[styles.chainDot, { backgroundColor: c.color }]} />
                  <Text style={styles.chainItemLabel}>{c.label}</Text>
                  <Text style={[styles.chainItemPrice, { color: c.color }]}>₹{c.price.toLocaleString()}</Text>
                </View>
                {i < arr.length - 1 && (
                  <MaterialCommunityIcons name="arrow-right" size={14} color={Colors.textLight} style={{ marginTop: 12 }} />
                )}
              </React.Fragment>
            ))}
          </View>
          <Text style={styles.dealerMarginNote}>
            Dealer margin: ₹{topGainer.dealerMargin}/{topGainer.unit} · {((topGainer.dealerMargin / topGainer.farmGatePrice) * 100).toFixed(1)}%
          </Text>
        </View>
      )}

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop or mandi..."
            placeholderTextColor={Colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>{filtered.length} results · showing {selectedType.label}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <PriceRow item={item} priceType={priceType} />}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="chart-bar-stacked" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No prices found</Text>
          </View>
        }
        scrollEnabled={!!filtered.length}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  myCropsToggle: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: "#fff" },
  myCropsToggleActive: { backgroundColor: Colors.primary },
  myCropsToggleText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.primary },
  myCropsToggleTextActive: { color: "#fff" },
  priceTypeSection: { gap: 6, marginBottom: 8 },
  priceTypeLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary, paddingHorizontal: 16 },
  priceTypeCard: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, minWidth: 110 },
  priceTypeDot: { width: 8, height: 8, borderRadius: 4 },
  priceTypeName: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text },
  priceTypeDesc: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textSecondary },
  chainSection: { marginHorizontal: 16, backgroundColor: Colors.card, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  chainLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  chainRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  chainItem: { flex: 1, alignItems: "center", gap: 3 },
  chainDot: { width: 8, height: 8, borderRadius: 4 },
  chainItemLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textSecondary, textAlign: "center" },
  chainItemPrice: { fontFamily: "Inter_700Bold", fontSize: 13, textAlign: "center" },
  dealerMarginNote: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary, textAlign: "center", backgroundColor: Colors.orange + "10", borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, gap: 8, borderWidth: 1.5, borderColor: Colors.border },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text, padding: 0 },
  listHeader: { paddingHorizontal: 16, paddingBottom: 6 },
  listHeaderText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  list: { paddingHorizontal: 16, paddingTop: 2 },
  priceRow: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceRowLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  priceRowDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  priceRowCrop: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  priceRowMandi: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  priceRowVolume: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textLight, marginTop: 2 },
  priceRowRight: { alignItems: "flex-end", gap: 3 },
  priceRowModal: { fontFamily: "Inter_700Bold", fontSize: 18 },
  priceRowUnit: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textSecondary },
  priceRowBadge: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  priceRowBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textSecondary },
});
