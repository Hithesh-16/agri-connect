import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

const TOUR_KEY = "kisan_tour_seen";

const STEPS = [
  {
    icon: "home" as const,
    title: "Dashboard",
    desc: "Your daily crop prices, weather updates, and market news — all in one place.",
    color: Colors.primary,
  },
  {
    icon: "chart-bar" as const,
    title: "Live Market Prices",
    desc: "Real-time prices from your selected mandis. View Farm Gate, Dealer, Mandi, and Retail prices.",
    color: "#3B82F6",
  },
  {
    icon: "crop-free" as const,
    title: "Disease Scanner",
    desc: "Point your camera at any crop to get AI-powered disease detection and treatment recommendations.",
    color: "#16A34A",
  },
  {
    icon: "store-marker" as const,
    title: "Nearby Markets",
    desc: "Browse mandis within 200 km. Tap any mandi to see live prices for all crops.",
    color: "#F59E0B",
  },
  {
    icon: "sprout" as const,
    title: "You're all set!",
    desc: "KisanConnect helps you get the best price for your crops. Jai Kisan!",
    color: Colors.primary,
  },
];

interface AppTourProps {
  onDone: () => void;
}

export function AppTour({ onDone }: AppTourProps) {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    animateIn();
  }, [step]);

  function animateIn() {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.85);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
    ]).start();
  }

  function next() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    AsyncStorage.setItem(TOUR_KEY, "1");
    onDone();
  }

  const current = STEPS[step];

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <Pressable style={styles.skipBtn} onPress={dismiss}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          <View style={[styles.iconCircle, { backgroundColor: current.color + "18" }]}>
            <MaterialCommunityIcons name={current.icon} size={44} color={current.color} />
          </View>

          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.desc}>{current.desc}</Text>

          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive, i === step && { backgroundColor: current.color }]} />
            ))}
          </View>

          <Pressable
            style={[styles.nextBtn, { backgroundColor: current.color }]}
            onPress={next}
          >
            <Text style={styles.nextBtnText}>
              {step === STEPS.length - 1 ? "Start Exploring" : "Next"}
            </Text>
            <MaterialCommunityIcons
              name={step === STEPS.length - 1 ? "check" : "arrow-right"}
              size={20}
              color="#fff"
            />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

export async function shouldShowTour(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(TOUR_KEY);
    return !val;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  skipBtn: { position: "absolute", top: 18, right: 18 },
  skipText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginTop: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text, textAlign: "center" },
  desc: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  dotsRow: { flexDirection: "row", gap: 6, marginVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.border },
  dotActive: { width: 20 },
  nextBtn: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
