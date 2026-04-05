import React, { useState } from "react";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

interface DiseaseResult {
  cropName: string;
  diseaseName: string;
  confidence: number;
  severity: "Mild" | "Moderate" | "Severe";
  affectedArea: string;
  weatherNote: string;
  treatments: { type: "organic" | "chemical" | "preventive"; action: string }[];
  nearbyAdvisory: string;
}

const MOCK_RESULTS: DiseaseResult[] = [
  {
    cropName: "Cotton",
    diseaseName: "Leaf Curl Disease",
    confidence: 91,
    severity: "Moderate",
    affectedArea: "~35% of visible leaf area",
    weatherNote: "High humidity detected in your region. Conditions favorable for spread.",
    treatments: [
      { type: "organic", action: "Remove and destroy infected leaves immediately" },
      { type: "chemical", action: "Apply Imidacloprid 17.8 SL @ 0.5ml/L of water" },
      { type: "preventive", action: "Avoid over-irrigation and ensure proper drainage" },
    ],
    nearbyAdvisory: "Check cotton prices in Warangal APMC before harvest.",
  },
  {
    cropName: "Tomato",
    diseaseName: "Early Blight",
    confidence: 87,
    severity: "Mild",
    affectedArea: "~15% of leaf surface",
    weatherNote: "Moderate temperature and humidity — disease may spread slowly.",
    treatments: [
      { type: "organic", action: "Spray neem oil solution (2%) every 7 days" },
      { type: "chemical", action: "Apply Mancozeb 75 WP @ 2.5g/L of water" },
      { type: "preventive", action: "Improve air circulation between plants" },
    ],
    nearbyAdvisory: "Tomato prices rising in local mandis. Consider early harvest.",
  },
];

function ScanningOverlay() {
  const scanY = useSharedValue(-80);
  React.useEffect(() => {
    scanY.value = withRepeat(withTiming(220, { duration: 1800 }), -1, true);
  }, []);
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }] }));
  return (
    <View style={styles.scanOverlay}>
      <View style={styles.scanCornerTL} />
      <View style={styles.scanCornerTR} />
      <View style={styles.scanCornerBL} />
      <View style={styles.scanCornerBR} />
      <Animated.View style={[styles.scanLine, lineStyle]} />
    </View>
  );
}

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  async function pickImage() {
    const res = await launchImageLibrary({ mediaType: "photo", quality: 0.8 });
    if (!res.didCancel && res.assets?.[0]?.uri) {
      setImage(res.assets[0].uri);
      setResult(null);
      analyzeImage();
    }
  }

  async function openCamera() {
    if (Platform.OS === "web") {
      pickImage();
      return;
    }
    const res = await launchCamera({ quality: 0.8 });
    if (!res.didCancel && res.assets?.[0]?.uri) {
      setImage(res.assets[0].uri);
      setResult(null);
      analyzeImage();
    }
  }

  async function analyzeImage() {
    setScanning(true);
    ReactNativeHapticFeedback.trigger("impactMedium");
    await new Promise((r) => setTimeout(r, 3000));
    const r = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
    setResult(r);
    setScanning(false);
    ReactNativeHapticFeedback.trigger("notificationSuccess");
  }

  function reset() {
    setImage(null);
    setResult(null);
    setScanning(false);
  }

  const severityColor = { Mild: Colors.green, Moderate: Colors.orange, Severe: Colors.red };
  const treatmentIcon = { organic: "leaf-circle", chemical: "flask", preventive: "shield-check" };
  const treatmentColor = { organic: Colors.green, chemical: Colors.blue, preventive: Colors.accent };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={["#0D4A22", "#1B6B3A"]} style={[styles.headerGrad, { paddingTop: topInset + 12 }]}>
        <Text style={styles.headerTitle}>Plant Disease Scanner</Text>
        <Text style={styles.headerSub}>AI-powered crop health analysis</Text>
      </LinearGradient>

      <View style={styles.body}>
        {!image && !scanning && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.cameraSection}>
            <View style={styles.cameraBox}>
              <View style={styles.cameraPlaceholder}>
                <MaterialCommunityIcons name="leaf-circle-outline" size={64} color={Colors.primary + "60"} />
                <Text style={styles.cameraPlaceholderText}>Point camera at affected plant</Text>
              </View>
              <ScanningOverlay />
            </View>
            <View style={styles.cameraActions}>
              <Pressable style={styles.camAction} onPress={openCamera}>
                <View style={styles.camActionIcon}>
                  <MaterialCommunityIcons name="camera" size={26} color="#fff" />
                </View>
                <Text style={styles.camActionLabel}>Take Photo</Text>
              </Pressable>
              <Pressable style={styles.camAction} onPress={pickImage}>
                <View style={[styles.camActionIcon, { backgroundColor: Colors.primary + "20" }]}>
                  <MaterialCommunityIcons name="image-multiple" size={26} color={Colors.primary} />
                </View>
                <Text style={styles.camActionLabel}>Upload Image</Text>
              </Pressable>
            </View>
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={18} color={Colors.blue} />
              <Text style={styles.infoText}>For best results, take a close-up photo of the affected leaves in good lighting.</Text>
            </View>
          </Animated.View>
        )}

        {(image || scanning) && !result && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.analyzingSection}>
            {image && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: image }} style={styles.previewImg} />
                {scanning && (
                  <View style={styles.scanningOverlayFull}>
                    <ScanningOverlay />
                  </View>
                )}
              </View>
            )}
            {scanning && (
              <View style={styles.analyzingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.analyzingTitle}>Analyzing your crop...</Text>
                {["Detecting crop type", "Identifying disease patterns", "Checking weather data", "Generating recommendations"].map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={Colors.green} />
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {result && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultCrop}>{result.cropName}</Text>
                <Text style={styles.resultDisease}>{result.diseaseName}</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceValue}>{result.confidence}%</Text>
                <Text style={styles.confidenceLabel}>confidence</Text>
              </View>
            </View>

            {image && <Image source={{ uri: image }} style={styles.resultImg} />}

            <View style={[styles.severityBadge, { backgroundColor: (severityColor[result.severity] || Colors.orange) + "18" }]}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={severityColor[result.severity] || Colors.orange} />
              <Text style={[styles.severityText, { color: severityColor[result.severity] || Colors.orange }]}>
                Severity: {result.severity}
              </Text>
              <Text style={[styles.affectedText, { color: Colors.textSecondary }]}> · {result.affectedArea}</Text>
            </View>

            <View style={styles.weatherNote}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={18} color={Colors.blue} />
              <Text style={styles.weatherNoteText}>{result.weatherNote}</Text>
            </View>

            <Text style={styles.treatmentHeader}>Treatment Recommendations</Text>
            {result.treatments.map((t, i) => (
              <View key={i} style={[styles.treatmentCard, { borderLeftColor: treatmentColor[t.type] }]}>
                <MaterialCommunityIcons name={treatmentIcon[t.type] as any} size={22} color={treatmentColor[t.type]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.treatmentType, { color: treatmentColor[t.type] }]}>{t.type.charAt(0).toUpperCase() + t.type.slice(1)}</Text>
                  <Text style={styles.treatmentAction}>{t.action}</Text>
                </View>
              </View>
            ))}

            <View style={styles.advisoryBox}>
              <MaterialCommunityIcons name="store-marker" size={18} color={Colors.primary} />
              <Text style={styles.advisoryText}>{result.nearbyAdvisory}</Text>
            </View>

            <Pressable style={styles.resetBtn} onPress={reset}>
              <MaterialCommunityIcons name="refresh" size={20} color={Colors.primary} />
              <Text style={styles.resetBtnText}>Scan Another Plant</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={styles.whatsappBox}>
          <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
          <View style={{ flex: 1 }}>
            <Text style={styles.whatsappTitle}>Detect via WhatsApp</Text>
            <Text style={styles.whatsappDesc}>Send plant photo to our WhatsApp number for AI analysis</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGrad: { paddingHorizontal: 16, paddingBottom: 20 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  body: { padding: 16, gap: 16 },
  cameraSection: { gap: 16 },
  cameraBox: {
    height: 240,
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.primary + "30",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraPlaceholder: { alignItems: "center", gap: 10 },
  cameraPlaceholderText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  scanOverlay: { position: "absolute", top: 20, left: 20, right: 20, bottom: 20 },
  scanCornerTL: { position: "absolute", top: 0, left: 0, width: 20, height: 20, borderTopWidth: 3, borderLeftWidth: 3, borderColor: Colors.primary, borderTopLeftRadius: 4 },
  scanCornerTR: { position: "absolute", top: 0, right: 0, width: 20, height: 20, borderTopWidth: 3, borderRightWidth: 3, borderColor: Colors.primary, borderTopRightRadius: 4 },
  scanCornerBL: { position: "absolute", bottom: 0, left: 0, width: 20, height: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: Colors.primary, borderBottomLeftRadius: 4 },
  scanCornerBR: { position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderBottomWidth: 3, borderRightWidth: 3, borderColor: Colors.primary, borderBottomRightRadius: 4 },
  scanLine: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: Colors.primary + "80" },
  cameraActions: { flexDirection: "row", gap: 12 },
  camAction: { flex: 1, alignItems: "center", gap: 8 },
  camActionIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  camActionLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text },
  infoBox: { flexDirection: "row", gap: 10, backgroundColor: Colors.blue + "12", borderRadius: 12, padding: 12, alignItems: "flex-start" },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  analyzingSection: { gap: 16 },
  imagePreview: { position: "relative", borderRadius: 18, overflow: "hidden", height: 220 },
  previewImg: { width: "100%", height: 220, borderRadius: 18 },
  scanningOverlayFull: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  analyzingBox: { backgroundColor: Colors.card, borderRadius: 14, padding: 20, alignItems: "center", gap: 12 },
  analyzingTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "stretch" },
  stepText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  resultSection: { gap: 12 },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: Colors.primary, borderWidth: 1, borderColor: Colors.border },
  resultCrop: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  resultDisease: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text, marginTop: 2 },
  confidenceBadge: { alignItems: "center", backgroundColor: Colors.primary + "12", borderRadius: 10, padding: 10 },
  confidenceValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.primary },
  confidenceLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textSecondary },
  resultImg: { width: "100%", height: 180, borderRadius: 14 },
  severityBadge: { flexDirection: "row", alignItems: "center", borderRadius: 10, padding: 12, gap: 6 },
  severityText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  affectedText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  weatherNote: { flexDirection: "row", gap: 10, backgroundColor: Colors.blue + "10", borderRadius: 12, padding: 12, alignItems: "flex-start" },
  weatherNoteText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  treatmentHeader: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  treatmentCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start", borderLeftWidth: 4, borderWidth: 1, borderColor: Colors.border },
  treatmentType: { fontFamily: "Inter_600SemiBold", fontSize: 12, textTransform: "capitalize" },
  treatmentAction: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text, lineHeight: 18, marginTop: 2 },
  advisoryBox: { flexDirection: "row", gap: 10, backgroundColor: Colors.primary + "10", borderRadius: 12, padding: 12, alignItems: "flex-start" },
  advisoryText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 14 },
  resetBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.primary },
  whatsappBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#25D366" + "10", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#25D366" + "30" },
  whatsappTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  whatsappDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});
