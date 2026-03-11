import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth, UserRole } from "@/contexts/AuthContext";

const GENDERS = ["male", "female", "other"] as const;
const LANGUAGES = ["English", "Hindi", "Telugu", "Marathi", "Kannada", "Tamil", "Gujarati"];

function FormInput({ label, value, onChangeText, placeholder, keyboardType, maxLength }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={Colors.placeholder}
        keyboardType={keyboardType || "default"}
        maxLength={maxLength}
      />
    </View>
  );
}

export default function PersonalInfoScreen() {
  const insets = useSafeAreaInsets();
  const { mobile, aadhaar, role } = useLocalSearchParams<{ mobile: string; aadhaar: string; role: string }>();
  const { signIn } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [altMobile, setAltMobile] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [village, setVillage] = useState("");
  const [post, setPost] = useState("");
  const [mandal, setMandal] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [language, setLanguage] = useState("English");
  const [consent, setConsent] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  function validate() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!surname.trim()) e.surname = "Required";
    if (!village.trim()) e.village = "Required";
    if (!district.trim()) e.district = "Required";
    if (!state.trim()) e.state = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleContinue() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    router.push({ pathname: "/(auth)/crop-selection", params: { mobile, aadhaar, role, firstName, surname, village, district, state: state, mandal, gender, language, consent: consent ? "1" : "0" } });
    setSaving(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.headerText} />
        </Pressable>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: "40%" }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput style={[styles.textInput, errors.firstName && styles.inputError]} value={firstName} onChangeText={(t) => { setFirstName(t); setErrors({}); }} placeholder="First name" placeholderTextColor={Colors.placeholder} />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Surname *</Text>
              <TextInput style={[styles.textInput, errors.surname && styles.inputError]} value={surname} onChangeText={(t) => { setSurname(t); setErrors({}); }} placeholder="Surname" placeholderTextColor={Colors.placeholder} />
              {errors.surname && <Text style={styles.errorText}>{errors.surname}</Text>}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput style={[styles.textInput, styles.inputDisabled]} value={mobile ? `+91 ${mobile}` : "From Aadhaar"} editable={false} />
          </View>

          <FormInput label="Alternate Mobile" value={altMobile} onChangeText={setAltMobile} keyboardType="numeric" maxLength={10} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TextInput style={styles.textInput} value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" placeholderTextColor={Colors.placeholder} keyboardType="numeric" maxLength={10} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <Pressable key={g} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <FormInput label="House No." value={houseNo} onChangeText={setHouseNo} />
          <FormInput label="Street" value={street} onChangeText={setStreet} />
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Village *</Text>
              <TextInput style={[styles.textInput, errors.village && styles.inputError]} value={village} onChangeText={(t) => { setVillage(t); setErrors({}); }} placeholder="Village" placeholderTextColor={Colors.placeholder} />
              {errors.village && <Text style={styles.errorText}>{errors.village}</Text>}
            </View>
            <FormInput label="Post" value={post} onChangeText={setPost} />
          </View>
          <View style={styles.row}>
            <FormInput label="Mandal" value={mandal} onChangeText={setMandal} />
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>District *</Text>
              <TextInput style={[styles.textInput, errors.district && styles.inputError]} value={district} onChangeText={(t) => { setDistrict(t); setErrors({}); }} placeholder="District" placeholderTextColor={Colors.placeholder} />
              {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput style={[styles.textInput, errors.state && styles.inputError]} value={state} onChangeText={(t) => { setState(t); setErrors({}); }} placeholder="State" placeholderTextColor={Colors.placeholder} />
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            </View>
            <FormInput label="Country" value="India" onChangeText={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Preferred Language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.langRow}>
                {LANGUAGES.map((l) => (
                  <Pressable key={l} style={[styles.langChip, language === l && styles.langChipActive]} onPress={() => setLanguage(l)}>
                    <Text style={[styles.langChipText, language === l && styles.langChipTextActive]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.consentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.consentLabel}>Receive Updates</Text>
              <Text style={styles.consentDesc}>Get price alerts, weather updates and crop advisories via SMS & WhatsApp</Text>
            </View>
            <Switch value={consent} onValueChange={setConsent} trackColor={{ true: Colors.primary, false: Colors.border }} thumbColor="#FFFFFF" />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.continueBtn, { opacity: pressed || saving ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          onPress={handleContinue}
          disabled={saving}
        >
          <Text style={styles.continueBtnText}>{saving ? "Saving..." : "Continue"}</Text>
          {!saving && <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />}
        </Pressable>
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
  progressBar: { height: 3, backgroundColor: Colors.border },
  progressFill: { height: 3, backgroundColor: Colors.accent },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  section: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.primary, marginBottom: 4 },
  row: { flexDirection: "row", gap: 10 },
  inputGroup: { gap: 5 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  inputDisabled: { color: Colors.textSecondary, backgroundColor: Colors.border + "40" },
  inputError: { borderColor: Colors.red },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.red },
  genderRow: { flexDirection: "row", gap: 8 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center", backgroundColor: Colors.background },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + "10" },
  genderText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  genderTextActive: { color: Colors.primary },
  langRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  langChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + "10" },
  langChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  langChipTextActive: { color: Colors.primary },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  consentLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text },
  consentDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  continueBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
});
