import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { UserRole } from "@/contexts/AuthContext";

const ROLES: { id: UserRole; label: string; icon: any; desc: string }[] = [
  { id: "farmer", label: "Farmer", icon: "sprout", desc: "Sell crops directly" },
  { id: "trader", label: "Trader", icon: "store", desc: "Buy & sell in bulk" },
  { id: "dealer", label: "Dealer", icon: "handshake", desc: "Connect farmers & mills" },
  { id: "corporate", label: "Corporate", icon: "domain", desc: "Source at scale" },
];

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState<"aadhaar" | "mobile">("mobile");
  const [aadhaar, setAadhaar] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<UserRole>("farmer");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  function validate() {
    const e: Record<string, string> = {};
    if (method === "aadhaar") {
      if (aadhaar.replace(/\s/g, "").length !== 12) e.aadhaar = "Enter valid 12-digit Aadhaar number";
    } else {
      if (mobile.length !== 10 || !/^\d+$/.test(mobile)) e.mobile = "Enter valid 10-digit mobile number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;
    navigation.navigate("OTP", { mobile: method === "mobile" ? mobile : "", aadhaar: method === "aadhaar" ? aadhaar.replace(/\s/g, "") : "", role });
  }

  function formatAadhaar(text: string) {
    const clean = text.replace(/\D/g, "").slice(0, 12);
    const parts = [];
    for (let i = 0; i < clean.length; i += 4) parts.push(clean.slice(i, i + 4));
    return parts.join(" ");
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.headerText} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>I am a</Text>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => (
            <Pressable
              key={r.id}
              style={[styles.roleCard, role === r.id && styles.roleCardActive]}
              onPress={() => setRole(r.id)}
            >
              <MaterialCommunityIcons name={r.icon} size={26} color={role === r.id ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.roleLabel, role === r.id && styles.roleLabelActive]}>{r.label}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Verify Identity</Text>
        <View style={styles.methodTabs}>
          <Pressable style={[styles.methodTab, method === "mobile" && styles.methodTabActive]} onPress={() => setMethod("mobile")}>
            <MaterialCommunityIcons name="cellphone" size={18} color={method === "mobile" ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.methodTabText, method === "mobile" && styles.methodTabTextActive]}>Mobile</Text>
          </Pressable>
          <Pressable style={[styles.methodTab, method === "aadhaar" && styles.methodTabActive]} onPress={() => setMethod("aadhaar")}>
            <MaterialCommunityIcons name="card-account-details" size={18} color={method === "aadhaar" ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.methodTabText, method === "aadhaar" && styles.methodTabTextActive]}>Aadhaar</Text>
          </Pressable>
        </View>

        {method === "mobile" ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={[styles.inputRow, errors.mobile ? styles.inputRowError : null]}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit number"
                placeholderTextColor={Colors.placeholder}
                keyboardType="numeric"
                maxLength={10}
                value={mobile}
                onChangeText={(t) => { setMobile(t.replace(/\D/g, "")); setErrors({}); }}
              />
            </View>
            {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Aadhaar Number</Text>
            <View style={[styles.inputRow, errors.aadhaar ? styles.inputRowError : null]}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor={Colors.placeholder}
                keyboardType="numeric"
                maxLength={14}
                value={aadhaar}
                onChangeText={(t) => { setAadhaar(formatAadhaar(t)); setErrors({}); }}
              />
            </View>
            {errors.aadhaar && <Text style={styles.errorText}>{errors.aadhaar}</Text>}
            <Pressable style={styles.scanBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="camera-scan" size={18} color={Colors.primary} />
              <Text style={styles.scanBtnText}>Scan Aadhaar Card</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.continueBtn, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.termsRow}>
          <Text style={styles.termsText}>By continuing, you agree to our </Text>
          <Text style={[styles.termsText, styles.termsLink]}>Terms of Service</Text>
          <Text style={styles.termsText}> and </Text>
          <Text style={[styles.termsText, styles.termsLink]}>Privacy Policy</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text, marginBottom: -8 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roleCard: {
    width: "47.5%",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + "0A" },
  roleLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.textSecondary },
  roleLabelActive: { color: Colors.primary },
  roleDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textLight },
  methodTabs: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  methodTabActive: { backgroundColor: Colors.primary + "15" },
  methodTabText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  methodTabTextActive: { color: Colors.primary },
  inputGroup: { gap: 8 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputRowError: { borderColor: Colors.red },
  prefix: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16, color: Colors.text, padding: 0 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.red },
  scanBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 6 },
  scanBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.primary },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  continueBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFFFFF" },
  termsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  termsText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textLight },
  termsLink: { color: Colors.primary },
});
