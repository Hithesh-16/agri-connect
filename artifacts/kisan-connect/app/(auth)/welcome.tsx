import React, { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

const ROLES = [
  { label: "Farmer", icon: "sprout" as const, color: "#22C55E" },
  { label: "Trader", icon: "store" as const, color: "#3B82F6" },
  { label: "Dealer", icon: "handshake" as const, color: "#F59E0B" },
  { label: "Corporate", icon: "domain" as const, color: "#8B5CF6" },
];

function FloatingTag({ label, icon, color, style }: { label: string; icon: any; color: string; style: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>
      <View style={[styles.floatingTag, { backgroundColor: color + "22", borderColor: color + "44" }]}>
        <MaterialCommunityIcons name={icon} size={14} color={color} />
        <Text style={[styles.floatingTagText, { color }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D4A22", "#1B6B3A", "#2D8A50"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <View style={[StyleSheet.absoluteFill, styles.patternOverlay]} />

      <FloatingTag label="Farmer" icon="sprout" color="#22C55E" style={[styles.float1, { top: topInset + 60 }]} />
      <FloatingTag label="Trader" icon="store" color="#60A5FA" style={[styles.float2, { top: topInset + 130 }]} />
      <FloatingTag label="Cotton" icon="flower" color="#F5A623" style={[styles.float3, { top: topInset + 90 }]} />
      <FloatingTag label="Rice" icon="sack" color="#FCD34D" style={[styles.float4, { top: topInset + 170 }]} />

      <Animated.View
        style={[styles.content, { paddingTop: topInset + 40, paddingBottom: bottomInset + 24, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="sprout" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>KisanConnect</Text>
          <Text style={styles.tagline}>India's Agricultural Marketplace</Text>
        </View>

        <View style={styles.featureRow}>
          {[
            { icon: "chart-line" as const, label: "Live Prices" },
            { icon: "weather-partly-cloudy" as const, label: "Weather" },
            { icon: "map-marker-multiple" as const, label: "Mandis" },
          ].map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <MaterialCommunityIcons name={f.icon} size={22} color={Colors.accentLight} />
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statsRow}>
          {[
            { value: "1,200+", label: "Mandis" },
            { value: "50L+", label: "Farmers" },
            { value: "200+", label: "Crops" },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.secondaryBtnText}>Already registered? Login</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>Trusted by farmers across India</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryDark },
  patternOverlay: { opacity: 0.06 },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  logoContainer: { alignItems: "center", gap: 10 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  appName: { fontFamily: "Inter_700Bold", fontSize: 34, color: "#FFFFFF", letterSpacing: -0.5 },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center" },
  featureRow: { flexDirection: "row", justifyContent: "center", gap: 28 },
  featureItem: { alignItems: "center", gap: 6 },
  featureLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.75)" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.accentLight },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.6)" },
  buttons: { gap: 12 },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFFFFF" },
  secondaryBtn: { paddingVertical: 12, alignItems: "center" },
  secondaryBtnText: { fontFamily: "Inter_500Medium", fontSize: 14, color: "rgba(255,255,255,0.7)" },
  disclaimer: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center" },
  floatingTag: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  floatingTagText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  float1: { position: "absolute", left: 20 },
  float2: { position: "absolute", right: 20 },
  float3: { position: "absolute", right: 50 },
  float4: { position: "absolute", left: 30 },
});
