import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { MOCK_PRICES, PriceEntry } from "@/data/mockData";

const SORT_OPTIONS = ["Highest Price", "Lowest Price", "Biggest Gain", "Biggest Loss"] as const;

function PriceRow({ item }: { item: PriceEntry }) {
  const isUp = item.change >= 0;
  return (
    <View style={styles.priceRow}>
      <View style={styles.priceRowLeft}>
        <View style={[styles.priceRowDot, { backgroundColor: isUp ? Colors.green : Colors.red }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.priceRowCrop}>{item.cropName}</Text>
          <Text style={styles.priceRowMandi} numberOfLines={1}>{item.mandiName}</Text>
        </View>
      </View>
      <View style={styles.priceRowRight}>
        <Text style={styles.priceRowModal}>₹{item.modalPrice.toLocaleString()}</Text>
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

function PriceHeader({ item }: { item: PriceEntry }) {
  const isUp = item.change >= 0;
  return (
    <View style={[styles.highlightCard, { borderLeftColor: isUp ? Colors.green : Colors.red }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.highlightCrop}>{item.cropName}</Text>
        <Text style={styles.highlightMandi}>{item.mandiName}</Text>
        <View style={styles.highlightRange}>
          <Text style={styles.highlightRangeText}>₹{item.minPrice.toLocaleString()} – ₹{item.maxPrice.toLocaleString()}</Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text style={styles.highlightModal}>₹{item.modalPrice.toLocaleString()}</Text>
        <Text style={styles.highlightUnit}>per {item.unit}</Text>
        <View style={[styles.priceRowBadge, { backgroundColor: isUp ? Colors.green + "18" : Colors.red + "18" }]}>
          <MaterialCommunityIcons name={isUp ? "trending-up" : "trending-down"} size={14} color={isUp ? Colors.green : Colors.red} />
          <Text style={[styles.priceRowBadgeText, { color: isUp ? Colors.green : Colors.red }]}>
            {isUp ? "+" : ""}{item.change} today
          </Text>
        </View>
        <Text style={styles.highlightTime}>Updated {item.updatedAt}</Text>
      </View>
    </View>
  );
}

export default function PricesScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]>("Highest Price");
  const [refreshing, setRefreshing] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = MOCK_PRICES.filter(
    (p) =>
      p.cropName.toLowerCase().includes(search.toLowerCase()) ||
      p.mandiName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sort === "Highest Price") return b.modalPrice - a.modalPrice;
    if (sort === "Lowest Price") return a.modalPrice - b.modalPrice;
    if (sort === "Biggest Gain") return b.changePercent - a.changePercent;
    return a.changePercent - b.changePercent;
  });

  const topGainer = [...MOCK_PRICES].sort((a, b) => b.changePercent - a.changePercent)[0];

  async function onRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Market Prices</Text>
        <Text style={styles.headerSub}>Updated as of today</Text>
      </View>

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

      {topGainer && (
        <View style={styles.topGainerSection}>
          <Text style={styles.topGainerLabel}>Top Gainer Today</Text>
          <PriceHeader item={topGainer} />
        </View>
      )}

      <View style={styles.sortScroll}>
        {SORT_OPTIONS.map((s) => (
          <Pressable
            key={s}
            style={[styles.sortChip, sort === s && styles.sortChipActive]}
            onPress={() => setSort(s)}
          >
            <Text style={[styles.sortChipText, sort === s && styles.sortChipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <PriceRow item={item} />}
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  searchRow: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text, padding: 0 },
  topGainerSection: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  topGainerLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textSecondary },
  highlightCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  highlightCrop: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  highlightMandi: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  highlightRange: { marginTop: 6 },
  highlightRangeText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  highlightModal: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.primary },
  highlightUnit: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  highlightTime: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textLight },
  sortScroll: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8, flexWrap: "nowrap" },
  sortChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  sortChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  sortChipTextActive: { color: "#fff" },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  priceRow: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceRowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  priceRowDot: { width: 8, height: 8, borderRadius: 4 },
  priceRowCrop: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  priceRowMandi: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  priceRowRight: { alignItems: "flex-end", gap: 3 },
  priceRowModal: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.primary },
  priceRowUnit: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textSecondary },
  priceRowBadge: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  priceRowBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  separator: { height: 8 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textSecondary },
});
