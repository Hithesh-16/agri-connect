import React, { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const OTP_LENGTH = 6;

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [step]);

  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const t = setTimeout(() => setTimer((p) => p - 1), 1000);
      return () => clearTimeout(t);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [step, timer]);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  function handleSendOtp() {
    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setMobileError("Enter valid 10-digit mobile number");
      shake();
      return;
    }
    setMobileError("");
    setStep("otp");
    setTimer(30);
    setCanResend(false);
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
  }

  function handleOtpDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpError("");
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  async function handleLogin() {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setOtpError("Enter complete 6-digit OTP");
      shake();
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    // In a real app, verify OTP with backend and fetch user profile
    // For demo: create a minimal profile with the mobile number
    await signIn({
      mobile,
      firstName: "Returning",
      surname: "User",
      role: "farmer",
      updatesConsent: true,
      selectedCropIds: ["wheat", "cotton", "chili"],
      selectedMandiIds: ["m1", "m2"],
      lastActive: Date.now(),
    });
    setLoading(false);
    ReactNativeHapticFeedback.trigger("notificationSuccess");
  }

  function handleResend() {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["#0D4A22", "#1B6B3A"]} style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color="rgba(255,255,255,0.9)" />
        </Pressable>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="sprout" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.logoTitle}>KisanConnect</Text>
            <Text style={styles.logoSub}>Welcome back</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: bottomInset + 24 }]}>
        {step === "mobile" && (
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }]}>
            <View style={styles.stepIconRow}>
              <View style={styles.stepIcon}>
                <MaterialCommunityIcons name="cellphone" size={28} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.cardTitle}>Enter Mobile Number</Text>
            <Text style={styles.cardSub}>We'll send a one-time password to verify your identity</Text>

            <View style={[styles.inputRow, mobileError ? styles.inputRowError : null]}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={Colors.placeholder}
                keyboardType="numeric"
                maxLength={10}
                value={mobile}
                onChangeText={(t) => { setMobile(t.replace(/\D/g, "")); setMobileError(""); }}
                autoFocus
              />
            </View>
            {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              onPress={handleSendOtp}
            >
              <Text style={styles.primaryBtnText}>Send OTP</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </Pressable>

            <Pressable style={styles.registerLink} onPress={() => navigation.replace("Register")}>
              <Text style={styles.registerLinkText}>New user? Create Account</Text>
            </Pressable>
          </Animated.View>
        )}

        {step === "otp" && (
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.stepIconRow}>
              <View style={styles.stepIcon}>
                <MaterialCommunityIcons name="message-lock" size={28} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.cardTitle}>Enter OTP</Text>
            <Text style={styles.cardSub}>
              6-digit code sent to{" "}
              <Text style={styles.highlight}>+91 {mobile}</Text>
              {"\n"}
              <Text style={styles.changeNumber} onPress={() => { setStep("mobile"); fadeAnim.setValue(0); slideAnim.setValue(40); }}>
                Change number
              </Text>
            </Text>

            <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
              {Array(OTP_LENGTH).fill(0).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputRefs.current[i] = r; }}
                  style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : null, otpError ? styles.otpBoxError : null]}
                  keyboardType="numeric"
                  maxLength={1}
                  value={otp[i]}
                  onChangeText={(v) => handleOtpDigit(i, v)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                  selectionColor={Colors.primary}
                  autoFocus={i === 0}
                />
              ))}
            </Animated.View>
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, loading && { opacity: 0.7 }, { opacity: pressed ? 0.9 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.primaryBtnText}>Logging in...</Text>
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                  <Text style={styles.primaryBtnText}>Login</Text>
                </>
              )}
            </Pressable>

            <View style={styles.resendRow}>
              {canResend ? (
                <Pressable onPress={handleResend}>
                  <Text style={styles.resendActive}>Resend OTP</Text>
                </Pressable>
              ) : (
                <Text style={styles.resendTimer}>
                  Resend in <Text style={{ color: Colors.primary }}>{timer}s</Text>
                </Text>
              )}
            </View>
            <Text style={styles.demoNote}>Demo: any 6 digits work</Text>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  logoTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
  logoSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.65)" },
  body: { flex: 1, padding: 20, justifyContent: "center" },
  card: { backgroundColor: Colors.card, borderRadius: 20, padding: 24, gap: 16, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 20, elevation: 8 },
  stepIconRow: { alignItems: "center" },
  stepIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary + "12", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text, textAlign: "center" },
  cardSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 21 },
  highlight: { fontFamily: "Inter_600SemiBold", color: Colors.text },
  changeNumber: { fontFamily: "Inter_500Medium", color: Colors.primary, fontSize: 13 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  inputRowError: { borderColor: Colors.red },
  prefix: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16, color: Colors.text, padding: 0 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.red, textAlign: "center" },
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    textAlign: "center",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primary + "08" },
  otpBoxError: { borderColor: Colors.red },
  primaryBtn: {
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
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  registerLink: { alignItems: "center", paddingVertical: 4 },
  registerLinkText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.primary },
  resendRow: { alignItems: "center" },
  resendTimer: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  resendActive: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.primary },
  demoNote: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textLight, textAlign: "center" },
});
