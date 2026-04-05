import React, { useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { CROPS } from "@/data/crops";
import { MOCK_PRICES, MOCK_WEATHER, NEWS_ITEMS } from "@/data/mockData";
import { MANDIS } from "@/data/mandis";
import { AppTour, shouldShowTour } from "@/components/AppTour";

function WeatherIcon({ condition }: { condition: string }) {
  const icons: Record<string, { name: any; color: string }> = {
    sunny: { name: "white-balance-sunny", color: "#F59E0B" },
    cloudy: { name: "cloud", color: "#9CA3AF" },
    rainy: { name: "weather-rainy", color: "#60A5FA" },
    partly_cloudy: { name: "weather-partly-cloudy", color: "#F59E0B" },
  };
  const icon = icons[condition] || icons.sunny;
  return <MaterialCommunityIcons name={icon.name} size={28} color={icon.color} />;
}

function PriceCard({ item }: { item: typeof MOCK_PRICES[0] }) {
  const isUp = item.change >= 0;
  return (
    <View style={styles.priceCard}>
      <Text style={styles.priceCardCrop}>{item.cropName}</Text>
      <Text style={styles.priceCardMandi} numberOfLines={1}>{item.mandiName}</Text>
      <Text style={styles.priceCardPrice}>₹{item.modalPrice.toLocaleString()}</Text>
      <View style={[styles.priceChange, { backgroundColor: isUp ? Colors.green + "20" : Colors.red + "20" }]}>
        <MaterialCommunityIcons name={isUp ? "trending-up" : "trending-down"} size={12} color={isUp ? Colors.green : Colors.red} />
        <Text style={[styles.priceChangeText, { color: isUp ? Colors.green : Colors.red }]}>
          {isUp ? "+" : ""}{item.changePercent.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

function NewsCard({ item }: { item: typeof NEWS_ITEMS[0] }) {
  const categoryColors: Record<string, string> = {
    market: Colors.accent,
    policy: Colors.blue,
    weather: "#60A5FA",
    advisory: Colors.green,
  };
  return (
    <Pressable style={styles.newsCard} onPress={() => {}}>
      <View style={[styles.newsCategoryBadge, { backgroundColor: (categoryColors[item.category] || Colors.accent) + "20" }]}>
        <Text style={[styles.newsCategoryText, { color: categoryColors[item.category] || Colors.accent }]}>
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </Text>
      </View>
      <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
      <View style={styles.newsMeta}>
        <Text style={styles.newsDate}>{item.date}</Text>
        <Text style={styles.newsRead}>{item.readTime} min read</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showTour, setShowTour] = useState(false);

  React.useEffect(() => {
    shouldShowTour().then((should) => { if (should) setShowTour(true); });
  }, []);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const userCrops = user?.selectedCropIds.length
    ? CROPS.filter((c) => user.selectedCropIds.includes(c.id))
    : CROPS.slice(0, 5);

  const relevantPrices = MOCK_PRICES.filter((p) =>
    user?.selectedCropIds.includes(p.cropId)
  ).slice(0, 8);

  const displayPrices = relevantPrices.length > 0 ? relevantPrices : MOCK_PRICES.slice(0, 8);

  const userMandis = user?.selectedMandiIds.length
    ? MANDIS.filter((m) => user.selectedMandiIds.includes(m.id))
    : MANDIS.slice(0, 3);

  async function onRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRefreshing(false);
  }

  return (
    <>
    {showTour && <AppTour onDone={() => setShowTour(false)} />}
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={["#0D4A22", "#1B6B3A"]} style={[styles.headerGradient, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Jai Kisan</Text>
            <Text style={styles.userName}>{user?.firstName || "Farmer"} {user?.surname || ""}</Text>
          </View>
          <Pressable style={styles.notifBtn} onPress={() => {}}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        <View style={styles.weatherCard}>
          <View style={styles.weatherMain}>
            <WeatherIcon condition={MOCK_WEATHER.condition} />
            <View style={{ gap: 2 }}>
              <Text style={styles.weatherTemp}>{MOCK_WEATHER.tempC}°C</Text>
              <Text style={styles.weatherLoc}>{MOCK_WEATHER.location}</Text>
            </View>
          </View>
          <View style={styles.weatherStats}>
            <View style={styles.weatherStat}>
              <MaterialCommunityIcons name="water-percent" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.weatherStatText}>{MOCK_WEATHER.humidity}%</Text>
            </View>
            <View style={styles.weatherStat}>
              <MaterialCommunityIcons name="weather-windy" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.weatherStatText}>{MOCK_WEATHER.windKph} km/h</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {MOCK_WEATHER.forecast.map((f, i) => (
            <View key={i} style={styles.forecastItem}>
              <Text style={styles.forecastDay}>{f.day}</Text>
              <WeatherIcon condition={f.condition} />
              <Text style={styles.forecastHigh}>{f.high}°</Text>
              <Text style={styles.forecastLow}>{f.low}°</Text>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.quickActions}>
          {[
            { icon: "leaf", label: "My Crops", onPress: () => navigation.navigate("Prices") },
            { icon: "store-marker", label: "Mandis", onPress: () => navigation.navigate("Markets") },
            { icon: "crop-free", label: "Scan", onPress: () => navigation.navigate("Scanner") },
            { icon: "shield-check", label: "eNAM", onPress: () => navigation.getParent()?.navigate("SupplyChain") },
          ].map((a) => (
            <Pressable key={a.label} style={styles.quickAction} onPress={a.onPress}>
              <View style={styles.quickActionIcon}>
                <MaterialCommunityIcons name={a.icon as any} size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Highlights</Text>
            <Pressable onPress={() => navigation.navigate("Prices")}>
              <Text style={styles.seeAll}>View All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
            {displayPrices.map((p, i) => <PriceCard key={i} item={p} />)}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Mandis</Text>
            <Pressable onPress={() => navigation.navigate("Markets")}>
              <Text style={styles.seeAll}>See Map</Text>
            </Pressable>
          </View>
          {userMandis.slice(0, 3).map((m) => (
            <Pressable key={m.id} style={styles.mandiRow} onPress={() => navigation.navigate("Markets")}>
              <View style={styles.mandiRowIcon}>
                <MaterialCommunityIcons name="store-marker-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mandiRowName}>{m.name}</Text>
                <Text style={styles.mandiRowDist}>{m.district} · {m.distanceKm} km away</Text>
              </View>
              <Text style={styles.mandiRowCrops}>{m.activeCrops} crops</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agricultural News</Text>
          </View>
          {NEWS_ITEMS.slice(0, 4).map((n) => <NewsCard key={n.id} item={n} />)}
        </View>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingHorizontal: 16, paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)" },
  userName: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#FFFFFF" },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, borderWidth: 1.5, borderColor: Colors.primary },
  weatherCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 14, marginBottom: 12 },
  weatherMain: { flexDirection: "row", alignItems: "center", gap: 12 },
  weatherTemp: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#FFFFFF" },
  weatherLoc: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)" },
  weatherStats: { gap: 6 },
  weatherStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  weatherStatText: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)" },
  forecastScroll: { marginTop: 4 },
  forecastItem: { alignItems: "center", gap: 4, minWidth: 56 },
  forecastDay: { fontFamily: "Inter_500Medium", fontSize: 11, color: "rgba(255,255,255,0.65)" },
  forecastHigh: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFFFFF" },
  forecastLow: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.55)" },
  body: { padding: 16, gap: 20 },
  quickActions: { flexDirection: "row", justifyContent: "space-between" },
  quickAction: { alignItems: "center", gap: 8 },
  quickActionIcon: { width: 58, height: 58, borderRadius: 16, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center", shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  quickActionLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.textSecondary },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  seeAll: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.primary },
  priceCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, width: 150, gap: 4, borderWidth: 1, borderColor: Colors.border },
  priceCardCrop: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  priceCardMandi: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  priceCardPrice: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.primary },
  priceChange: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  priceChangeText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  mandiRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 12, gap: 12, borderWidth: 1, borderColor: Colors.border },
  mandiRowIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary + "12", alignItems: "center", justifyContent: "center" },
  mandiRowName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  mandiRowDist: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  mandiRowCrops: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.primary },
  newsCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: Colors.border },
  newsCategoryBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  newsCategoryText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  newsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text, lineHeight: 20 },
  newsSummary: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  newsMeta: { flexDirection: "row", justifyContent: "space-between" },
  newsDate: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textLight },
  newsRead: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textLight },
});
