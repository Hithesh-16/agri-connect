import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { CROPS } from "@/data/crops";
import { MANDIS } from "@/data/mandis";

const ROLE_LABELS: Record<string, string> = {
  farmer: "Farmer",
  trader: "Trader",
  dealer: "Dealer",
  corporate: "Corporate",
};

function SettingRow({ icon, label, value, onPress, danger }: { icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.7 : 1 }]} onPress={onPress}>
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={danger ? Colors.red : Colors.primary} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<"crops" | "mandis" | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const userCrops = CROPS.filter((c) => user?.selectedCropIds.includes(c.id));
  const userMandis = MANDIS.filter((m) => user?.selectedMandiIds.includes(m.id));

  function handleSignOut() {
    if (Platform.OS === "web") {
      signOut().then(() => {});
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut().then(() => {}) },
    ]);
  }

  const roleColor: Record<string, string> = {
    farmer: Colors.green,
    trader: Colors.blue,
    dealer: Colors.accent,
    corporate: "#8B5CF6",
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: bottomInset + 90 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#0D4A22", "#1B6B3A"]} style={[styles.headerGrad, { paddingTop: topInset + 12 }]}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={44} color="rgba(255,255,255,0.9)" />
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{user?.firstName || "Farmer"} {user?.surname || ""}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColor[user?.role || "farmer"] + "30" }]}>
              <MaterialCommunityIcons name="shield-account" size={13} color={roleColor[user?.role || "farmer"]} />
              <Text style={[styles.roleText, { color: roleColor[user?.role || "farmer"] }]}>
                {ROLE_LABELS[user?.role || "farmer"]}
              </Text>
            </View>
          </View>
          <Pressable style={styles.editBtn} onPress={() => {}}>
            <MaterialCommunityIcons name="pencil" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        <View style={styles.profileMeta}>
          {user?.mobile && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="cellphone" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.metaText}>+91 {user.mobile}</Text>
            </View>
          )}
          {user?.village && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="map-marker" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.metaText}>{user.village}, {user.district}</Text>
            </View>
          )}
          {user?.language && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="translate" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.metaText}>{user.language}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <Pressable style={styles.statCard} onPress={() => setActiveSection(activeSection === "crops" ? null : "crops")}>
            <Text style={styles.statValue}>{userCrops.length}</Text>
            <Text style={styles.statLabel}>Crops</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable style={styles.statCard} onPress={() => setActiveSection(activeSection === "mandis" ? null : "mandis")}>
            <Text style={styles.statValue}>{userMandis.length}</Text>
            <Text style={styles.statLabel}>Mandis</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>
      </LinearGradient>

      {activeSection === "crops" && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedTitle}>My Crops</Text>
          <View style={styles.cropGrid}>
            {userCrops.map((c) => (
              <View key={c.id} style={styles.cropChip}>
                <MaterialCommunityIcons name={c.icon as any} size={16} color={c.color} />
                <Text style={styles.cropChipText}>{c.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {activeSection === "mandis" && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedTitle}>My Mandis</Text>
          {userMandis.map((m) => (
            <View key={m.id} style={styles.mandiItem}>
              <MaterialCommunityIcons name="store-marker" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mandiItemName}>{m.name}</Text>
                <Text style={styles.mandiItemDist}>{m.district} · {m.distanceKm} km</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Activity</Text>
        <SettingRow icon="chart-line" label="Price Watchlist" onPress={() => navigation.navigate("Prices")} />
        <SettingRow icon="map-marker-multiple" label="Nearby Mandis" onPress={() => navigation.navigate("Markets")} />
        <SettingRow icon="leaf-circle" label="Disease Scanner" onPress={() => navigation.navigate("Scanner")} />
        <SettingRow icon="newspaper-variant" label="Market News" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>eNAM Portal</Text>
        <View style={styles.enamCard}>
          <MaterialCommunityIcons name="shield-check" size={32} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.enamTitle}>Register on eNAM</Text>
            <Text style={styles.enamDesc}>National Agriculture Market — sell directly to 1,200+ mandis online</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.primary} />
        </View>
        <SettingRow icon="file-document" label="Trader Registration" value="Guide" onPress={() => {}} />
        <SettingRow icon="account-check" label="Seller Certification" value="FAQ" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <SettingRow icon="translate" label="Language" value={user?.language || "English"} onPress={() => {}} />
        <SettingRow icon="bell" label="Notifications" value="Enabled" onPress={() => {}} />
        <SettingRow icon="theme-light-dark" label="Appearance" value="Auto" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingRow icon="help-circle" label="Help & FAQ" onPress={() => {}} />
        <SettingRow icon="whatsapp" label="WhatsApp Support" onPress={() => {}} />
        <SettingRow icon="information" label="About KisanConnect" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <SettingRow icon="logout" label="Sign Out" onPress={handleSignOut} danger />
      </View>

      <Text style={styles.version}>KisanConnect v1.0.0 · Made for Indian Farmers</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGrad: { paddingHorizontal: 16, paddingBottom: 20, gap: 16 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  avatarInfo: { flex: 1, gap: 6 },
  avatarName: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  roleText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  editBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  profileMeta: { gap: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.75)" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, paddingVertical: 14 },
  statCard: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.65)" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  expandedSection: { margin: 16, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  expandedTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  cropGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cropChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.background, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  cropChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text },
  mandiItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  mandiItemName: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text },
  mandiItemDist: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  section: { marginHorizontal: 16, marginBottom: 12, gap: 0 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textSecondary, marginBottom: 8, marginLeft: 4 },
  settingRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + "12", alignItems: "center", justifyContent: "center" },
  settingIconDanger: { backgroundColor: Colors.red + "12" },
  settingLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.text },
  settingLabelDanger: { color: Colors.red },
  settingValue: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  enamCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.primary + "08", borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: Colors.primary + "20", marginBottom: 8 },
  enamTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  enamDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  version: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textLight, textAlign: "center", paddingBottom: 8 },
});
