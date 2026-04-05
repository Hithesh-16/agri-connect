import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { MANDIS } from "@/data/mandis";

const RADIUS_FILTERS = [
  { label: "All", maxKm: 999 },
  { label: "< 50 km", maxKm: 50 },
  { label: "< 100 km", maxKm: 100 },
  { label: "< 200 km", maxKm: 200 },
];

export default function MandiSelectionScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [radiusFilter, setRadiusFilter] = useState(999);
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = MANDIS.filter((m) => m.distanceKm <= radiusFilter);

  function toggleMandi(id: string) {
    ReactNativeHapticFeedback.trigger("impactLight");
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleFinish() {
    if (selected.length === 0) return;
    setSaving(true);
    const cropIds = typeof params.cropIds === "string" ? params.cropIds.split(",") : [];
    await signIn({
      mobile: (params.mobile as string) || "9999999999",
      aadhaar: params.aadhaar as string | undefined,
      firstName: (params.firstName as string) || "Farmer",
      surname: (params.surname as string) || "",
      role: (params.role as UserRole) || "farmer",
      village: params.village as string,
      district: params.district as string,
      state: params.state as string,
      mandal: params.mandal as string,
      gender: (params.gender as any) || "male",
      language: (params.language as string) || "English",
      updatesConsent: params.consent === "1",
      selectedCropIds: cropIds,
      selectedMandiIds: selected,
      lastActive: Date.now(),
    });
    setSaving(false);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.headerText} />
        </Pressable>
        <Text style={styles.headerTitle}>Select Mandis</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: "90%" }]} />
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>Nearest markets within radius</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selected.length} selected</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {RADIUS_FILTERS.map((f) => (
          <Pressable
            key={f.label}
            style={[styles.filterChip, radiusFilter === f.maxKm && styles.filterChipActive]}
            onPress={() => setRadiusFilter(f.maxKm)}
          >
            <Text style={[styles.filterChipText, radiusFilter === f.maxKm && styles.filterChipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]} showsVerticalScrollIndicator={false}>
        {filtered.map((mandi) => {
          const isSelected = selected.includes(mandi.id);
          return (
            <Pressable
              key={mandi.id}
              style={[styles.mandiCard, isSelected && styles.mandiCardActive]}
              onPress={() => toggleMandi(mandi.id)}
            >
              <View style={[styles.mandiIconBg, isSelected && styles.mandiIconBgActive]}>
                <MaterialCommunityIcons name="store-marker" size={22} color={isSelected ? "#fff" : Colors.primary} />
              </View>
              <View style={styles.mandiInfo}>
                <Text style={[styles.mandiName, isSelected && styles.mandiNameActive]}>{mandi.name}</Text>
                <Text style={styles.mandiLocation}>{mandi.district}, {mandi.state}</Text>
                <View style={styles.mandiMeta}>
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons name="map-marker" size={11} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{mandi.distanceKm} km</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons name="leaf" size={11} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{mandi.activeCrops} crops</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons name="scale" size={11} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{mandi.volume}/day</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.radio, isSelected && styles.radioActive]}>
                {isSelected && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.finishBtn, selected.length === 0 && styles.finishBtnDisabled, { opacity: pressed ? 0.9 : 1 }]}
          onPress={handleFinish}
          disabled={selected.length === 0 || saving}
        >
          <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
          <Text style={styles.finishBtnText}>{saving ? "Setting up..." : "Complete Registration"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.headerText },
  progressBar: { height: 3, backgroundColor: Colors.border },
  progressFill: { height: 3, backgroundColor: Colors.accent },
  subHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  subHeaderText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  badge: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  filterChipTextActive: { color: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  mandiCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  mandiCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + "06" },
  mandiIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + "15", alignItems: "center", justifyContent: "center" },
  mandiIconBgActive: { backgroundColor: Colors.primary },
  mandiInfo: { flex: 1, gap: 3 },
  mandiName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  mandiNameActive: { color: Colors.primary },
  mandiLocation: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  mandiMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bottomBar: { backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 16, paddingTop: 12 },
  finishBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  finishBtnDisabled: { backgroundColor: Colors.textLight },
  finishBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
