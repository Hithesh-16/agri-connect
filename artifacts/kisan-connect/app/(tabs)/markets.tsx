import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { MANDIS, Mandi } from "@/data/mandis";
import { MOCK_PRICES } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

type ViewMode = "list" | "grid";

function MandiCard({ mandi, isSelected, onPress }: { mandi: Mandi; isSelected: boolean; onPress: () => void }) {
  const mandiPrices = MOCK_PRICES.filter((p) => p.mandiId === mandi.id);
  const topCrop = mandiPrices[0];

  return (
    <Pressable style={[styles.mandiCard, isSelected && styles.mandiCardSelected]} onPress={onPress}>
      <LinearGradient
        colors={isSelected ? [Colors.primary, Colors.primaryLight] : [Colors.card, Colors.card]}
        style={styles.mandiCardGrad}
      >
        <View style={styles.mandiCardHeader}>
          <View style={[styles.mandiCardIcon, isSelected && styles.mandiCardIconSelected]}>
            <MaterialCommunityIcons name="store-marker" size={20} color={isSelected ? "#fff" : Colors.primary} />
          </View>
          <View style={styles.distanceBadge}>
            <MaterialCommunityIcons name="map-marker" size={11} color={isSelected ? "rgba(255,255,255,0.8)" : Colors.textSecondary} />
            <Text style={[styles.distanceText, isSelected && styles.distanceTextSelected]}>{mandi.distanceKm} km</Text>
          </View>
        </View>
        <Text style={[styles.mandiCardName, isSelected && styles.mandiCardNameSelected]} numberOfLines={1}>{mandi.name}</Text>
        <Text style={[styles.mandiCardLoc, isSelected && styles.mandiCardLocSelected]}>{mandi.district}</Text>
        <View style={styles.mandiCardMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="leaf" size={12} color={isSelected ? "rgba(255,255,255,0.7)" : Colors.textSecondary} />
            <Text style={[styles.metaText, isSelected && styles.metaTextSelected]}>{mandi.activeCrops} crops</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="scale" size={12} color={isSelected ? "rgba(255,255,255,0.7)" : Colors.textSecondary} />
            <Text style={[styles.metaText, isSelected && styles.metaTextSelected]}>{mandi.volume}/day</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function MandiDetail({ mandi }: { mandi: Mandi }) {
  const mandiPrices = MOCK_PRICES.filter((p) => p.mandiId === mandi.id);
  const allPrices = MOCK_PRICES.slice(0, 5);
  const prices = mandiPrices.length > 0 ? mandiPrices : allPrices;

  return (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailName}>{mandi.name}</Text>
          <Text style={styles.detailAddr}>{mandi.district}, {mandi.state}</Text>
        </View>
        <View style={styles.detailBadge}>
          <MaterialCommunityIcons name="check-circle" size={14} color={Colors.green} />
          <Text style={styles.detailBadgeText}>Active</Text>
        </View>
      </View>

      <View style={styles.detailStats}>
        {[
          { label: "Distance", value: `${mandi.distanceKm} km`, icon: "map-marker" },
          { label: "Daily Volume", value: mandi.volume, icon: "scale" },
          { label: "Active Crops", value: String(mandi.activeCrops), icon: "leaf" },
        ].map((s) => (
          <View key={s.label} style={styles.detailStat}>
            <MaterialCommunityIcons name={s.icon as any} size={18} color={Colors.primary} />
            <Text style={styles.detailStatValue}>{s.value}</Text>
            <Text style={styles.detailStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.pricesTitle}>Today's Prices</Text>
      {prices.slice(0, 5).map((p, i) => {
        const isUp = p.change >= 0;
        return (
          <View key={i} style={styles.priceItem}>
            <View style={[styles.priceDot, { backgroundColor: isUp ? Colors.green : Colors.red }]} />
            <Text style={styles.priceItemCrop} numberOfLines={1}>{p.cropName}</Text>
            <Text style={styles.priceItemModal}>₹{p.modalPrice.toLocaleString()}</Text>
            <Text style={[styles.priceItemChange, { color: isUp ? Colors.green : Colors.red }]}>
              {isUp ? "+" : ""}{p.changePercent.toFixed(1)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function MarketsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedMandi, setSelectedMandi] = useState<Mandi | null>(MANDIS[0]);
  const [radiusFilter, setRadiusFilter] = useState(999);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = MANDIS.filter((m) => m.distanceKm <= radiusFilter).sort((a, b) => a.distanceKm - b.distanceKm);

  const radiusOptions = [
    { label: "All", maxKm: 999 },
    { label: "50 km", maxKm: 50 },
    { label: "100 km", maxKm: 100 },
    { label: "200 km", maxKm: 200 },
  ];

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nearby Markets</Text>
          <Text style={styles.headerSub}>{filtered.length} mandis found</Text>
        </View>
        <View style={styles.viewToggle}>
          <Pressable style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]} onPress={() => setViewMode("list")}>
            <MaterialCommunityIcons name="view-list" size={18} color={viewMode === "list" ? Colors.primary : Colors.textSecondary} />
          </Pressable>
          <Pressable style={[styles.toggleBtn, viewMode === "grid" && styles.toggleBtnActive]} onPress={() => setViewMode("grid")}>
            <MaterialCommunityIcons name="view-grid" size={18} color={viewMode === "grid" ? Colors.primary : Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Supply Chain & eNAM Banner */}
      <Pressable style={styles.supplyChainBanner} onPress={() => router.push("/(tabs)/supply-chain")}>
        <View style={styles.supplyChainLeft}>
          <View style={styles.supplyChainIcon}>
            <MaterialCommunityIcons name="link-variant" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.supplyChainTitle}>Cotton Supply Chain · eNAM · Finance</Text>
            <Text style={styles.supplyChainSub}>Price chain, trader registration & RXIL</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={18} color="rgba(255,255,255,0.8)" />
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}>
        {radiusOptions.map((r) => (
          <Pressable key={r.label} style={[styles.filterChip, radiusFilter === r.maxKm && styles.filterChipActive]} onPress={() => setRadiusFilter(r.maxKm)}>
            <Text style={[styles.filterChipText, radiusFilter === r.maxKm && styles.filterChipTextActive]}>{r.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.mapPlaceholder}>
        <MaterialCommunityIcons name="map-search" size={40} color={Colors.primary + "60"} />
        <Text style={styles.mapPlaceholderText}>Interactive map</Text>
        {filtered.slice(0, 5).map((m, i) => (
          <Pressable key={m.id} style={[styles.mapPin, { left: 40 + i * 50, top: 30 + (i % 3) * 20 }]} onPress={() => setSelectedMandi(m)}>
            <MaterialCommunityIcons name="map-marker" size={28} color={selectedMandi?.id === m.id ? Colors.accent : Colors.primary} />
            <View style={[styles.mapPinLabel, selectedMandi?.id === m.id && styles.mapPinLabelActive]}>
              <Text style={[styles.mapPinText, selectedMandi?.id === m.id && styles.mapPinTextActive]} numberOfLines={1}>{m.name.split(" ")[0]}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.mandisScroll} contentContainerStyle={[styles.mandisContent, viewMode === "grid" && styles.mandisContentGrid, { paddingBottom: bottomInset + 90 }]} showsVerticalScrollIndicator={false}>
        {viewMode === "grid" ? (
          <>
            <View style={styles.gridRow}>
              {filtered.map((m) => (
                <MandiCard key={m.id} mandi={m} isSelected={selectedMandi?.id === m.id} onPress={() => setSelectedMandi(selectedMandi?.id === m.id ? null : m)} />
              ))}
            </View>
            {selectedMandi && <MandiDetail mandi={selectedMandi} />}
          </>
        ) : (
          <>
            {filtered.map((m) => (
              <React.Fragment key={m.id}>
                <Pressable style={[styles.listCard, selectedMandi?.id === m.id && styles.listCardSelected]} onPress={() => setSelectedMandi(selectedMandi?.id === m.id ? null : m)}>
                  <View style={[styles.listCardIcon, selectedMandi?.id === m.id && styles.listCardIconSelected]}>
                    <MaterialCommunityIcons name="store-marker" size={22} color={selectedMandi?.id === m.id ? "#fff" : Colors.primary} />
                  </View>
                  <View style={styles.listCardInfo}>
                    <Text style={[styles.listCardName, selectedMandi?.id === m.id && styles.listCardNameSelected]}>{m.name}</Text>
                    <Text style={styles.listCardLoc}>{m.district}, {m.state}</Text>
                    <View style={styles.listCardMeta}>
                      <Text style={styles.listCardMetaText}>{m.distanceKm} km</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.listCardMetaText}>{m.activeCrops} crops</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.listCardMetaText}>{m.volume}/day</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name={selectedMandi?.id === m.id ? "chevron-up" : "chevron-down"} size={20} color={Colors.textSecondary} />
                </Pressable>
                {selectedMandi?.id === m.id && <MandiDetail mandi={m} />}
              </React.Fragment>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  viewToggle: { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 10, padding: 2, borderWidth: 1, borderColor: Colors.border },
  toggleBtn: { width: 36, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  toggleBtnActive: { backgroundColor: Colors.primary + "18" },
  filterRow: { flexGrow: 0 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  filterChipTextActive: { color: "#fff" },
  supplyChainBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.primary, marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 8 },
  supplyChainLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  supplyChainIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  supplyChainTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  supplyChainSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  mapPlaceholder: { height: 140, backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden", position: "relative" },
  mapPlaceholderText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  mapPin: { position: "absolute" },
  mapPinLabel: { backgroundColor: Colors.card, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border, marginTop: -4, marginLeft: -10, maxWidth: 60 },
  mapPinLabelActive: { backgroundColor: Colors.accent + "20", borderColor: Colors.accent },
  mapPinText: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.text },
  mapPinTextActive: { color: Colors.primary },
  mandisScroll: { flex: 1 },
  mandisContent: { paddingHorizontal: 16, gap: 10 },
  mandisContentGrid: {},
  gridRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  mandiCard: { width: "47.5%", borderRadius: 14, overflow: "hidden", borderWidth: 2, borderColor: Colors.border },
  mandiCardSelected: { borderColor: Colors.primary },
  mandiCardGrad: { padding: 14, gap: 6 },
  mandiCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mandiCardIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + "15", alignItems: "center", justifyContent: "center" },
  mandiCardIconSelected: { backgroundColor: "rgba(255,255,255,0.2)" },
  distanceBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  distanceText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.textSecondary },
  distanceTextSelected: { color: "rgba(255,255,255,0.8)" },
  mandiCardName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  mandiCardNameSelected: { color: "#fff" },
  mandiCardLoc: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  mandiCardLocSelected: { color: "rgba(255,255,255,0.7)" },
  mandiCardMeta: { flexDirection: "row", gap: 10, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  metaTextSelected: { color: "rgba(255,255,255,0.7)" },
  detailCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  detailName: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  detailAddr: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  detailBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.green + "15", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  detailBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.green },
  detailStats: { flexDirection: "row", justifyContent: "space-around", backgroundColor: Colors.background, borderRadius: 12, padding: 12 },
  detailStat: { alignItems: "center", gap: 4 },
  detailStatValue: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  detailStatLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textSecondary },
  pricesTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  priceItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  priceDot: { width: 7, height: 7, borderRadius: 3.5 },
  priceItemCrop: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text },
  priceItemModal: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.primary },
  priceItemChange: { fontFamily: "Inter_500Medium", fontSize: 12, width: 50, textAlign: "right" },
  listCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderColor: Colors.border },
  listCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + "06" },
  listCardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + "12", alignItems: "center", justifyContent: "center" },
  listCardIconSelected: { backgroundColor: Colors.primary },
  listCardInfo: { flex: 1, gap: 2 },
  listCardName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  listCardNameSelected: { color: Colors.primary },
  listCardLoc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  listCardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  listCardMetaText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textLight },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textLight },
});
