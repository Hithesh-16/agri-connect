import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
import { CROP_CATEGORIES, CROPS } from "@/data/crops";

export default function CropSelectionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = activeCategory === "all" ? CROPS : CROPS.filter((c) => c.category === activeCategory);

  function toggleCrop(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleContinue() {
    if (selected.length < 2) return;
    router.push({ pathname: "/(auth)/mandi-selection", params: { ...params, cropIds: selected.join(",") } });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.headerText} />
        </Pressable>
        <Text style={styles.headerTitle}>Select Your Crops</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: "65%" }]} />
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>Select at least 2 crops you grow or trade</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selected.length} selected</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
        {CROP_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text style={[styles.categoryChipText, activeCategory === cat.id && styles.categoryChipTextActive]}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filtered.map((crop) => {
            const isSelected = selected.includes(crop.id);
            return (
              <Pressable
                key={crop.id}
                style={[styles.cropCard, isSelected && styles.cropCardActive]}
                onPress={() => toggleCrop(crop.id)}
              >
                <View style={[styles.cropIconBg, { backgroundColor: crop.color + "20" }]}>
                  <MaterialCommunityIcons name={crop.icon as any} size={28} color={crop.color} />
                </View>
                <Text style={[styles.cropName, isSelected && styles.cropNameActive]}>{crop.name}</Text>
                <Text style={styles.cropCategory}>{crop.category}</Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}>
        {selected.length < 2 && (
          <Text style={styles.minNote}>Select {2 - selected.length} more crop{selected.length === 1 ? "" : "s"}</Text>
        )}
        <Pressable
          style={({ pressed }) => [styles.continueBtn, selected.length < 2 && styles.continueBtnDisabled, { opacity: pressed ? 0.9 : 1 }]}
          onPress={handleContinue}
          disabled={selected.length < 2}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
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
  categoryScroll: { flexGrow: 0 },
  categoryContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  categoryChipTextActive: { color: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cropCard: {
    width: "30%",
    minWidth: 96,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    position: "relative",
  },
  cropCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + "08" },
  cropIconBg: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  cropName: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text, textAlign: "center" },
  cropNameActive: { color: Colors.primary },
  cropCategory: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textLight, textTransform: "capitalize" },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  minNote: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, textAlign: "center" },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueBtnDisabled: { backgroundColor: Colors.textLight },
  continueBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
