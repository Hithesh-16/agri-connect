import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { mobile, aadhaar, role } = useLocalSearchParams<{ mobile: string; aadhaar: string; role: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter complete 6-digit OTP");
      shake();
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 1000));
    setVerifying(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({ pathname: "/(auth)/personal-info", params: { mobile, aadhaar, role } });
  }

  function handleResend() {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }

  const displayNumber = mobile || (aadhaar ? `Aadhaar ${aadhaar.slice(0, 4)}XXXX${aadhaar.slice(-4)}` : "your number");

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.headerText} />
        </Pressable>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.content, { paddingBottom: bottomInset + 24 }]}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="message-text-lock" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit OTP to{"\n"}
          <Text style={styles.phone}>+91 {displayNumber}</Text>
        </Text>

        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array(OTP_LENGTH).fill(0).map((_, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputRefs.current[i] = r; }}
              style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : null, error ? styles.otpBoxError : null]}
              keyboardType="numeric"
              maxLength={1}
              value={otp[i]}
              onChangeText={(v) => handleDigit(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              selectionColor={Colors.primary}
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.verifyBtn, verifying && styles.verifyBtnLoading, { opacity: pressed ? 0.9 : 1 }]}
          onPress={handleVerify}
          disabled={verifying}
        >
          {verifying ? (
            <Text style={styles.verifyBtnText}>Verifying...</Text>
          ) : (
            <>
              <Text style={styles.verifyBtnText}>Verify & Continue</Text>
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
            </>
          )}
        </Pressable>

        <View style={styles.resendRow}>
          {canResend ? (
            <Pressable onPress={handleResend}>
              <Text style={styles.resendActive}>Resend OTP</Text>
            </Pressable>
          ) : (
            <Text style={styles.resendTimer}>Resend in <Text style={{ color: Colors.primary }}>{timer}s</Text></Text>
          )}
        </View>

        <Text style={styles.demoNote}>Demo: any 6 digits work</Text>
      </View>
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
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 20 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text, textAlign: "center" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  phone: { fontFamily: "Inter_600SemiBold", color: Colors.text },
  otpRow: { flexDirection: "row", gap: 10, marginVertical: 8 },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    textAlign: "center",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primary + "0A" },
  otpBoxError: { borderColor: Colors.red },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.red },
  verifyBtn: {
    width: "100%",
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
  verifyBtnLoading: { opacity: 0.7 },
  verifyBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  resendRow: { alignItems: "center" },
  resendTimer: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  resendActive: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.primary },
  demoNote: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textLight, marginTop: -10 },
});
