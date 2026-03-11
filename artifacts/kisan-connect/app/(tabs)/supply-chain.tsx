import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

type TabId = "cotton" | "enam" | "rxil";

const TABS = [
  { id: "cotton" as TabId, label: "Cotton Chain", icon: "flower" as const },
  { id: "enam" as TabId, label: "eNAM", icon: "bank-outline" as const },
  { id: "rxil" as TabId, label: "Finance", icon: "cash-multiple" as const },
];

const CHAIN_STEPS = [
  {
    step: 1,
    title: "Farmer Sells Cotton",
    color: "#16A34A",
    icon: "account-cowboy-hat" as const,
    buyers: ["CCI (Cotton Corporation of India)", "Private Dealers"],
    note: "MSP set by government. Moisture content and quality parameters determine final price.",
  },
  {
    step: 2,
    title: "Price Determination",
    color: "#F59E0B",
    icon: "scale-balance" as const,
    buyers: ["MSP baseline", "Moisture content testing", "Quality grade A/B/C"],
    note: "Staple: 130.5mm · Micronaire: 4mm · RD: 77 · Strength: 23+ GTEX",
  },
  {
    step: 3,
    title: "Cotton Manufacturing Unit",
    color: "#8B5CF6",
    icon: "factory" as const,
    buyers: ["Raw cotton → Cotton Bales", "Cotton separation", "Seed separation"],
    note: "Mills run 24/7 and need constant cotton supply. Example: Chityala Mill, Telangana.",
  },
  {
    step: 4,
    title: "Corporate Buyers",
    color: "#3B82F6",
    icon: "office-building" as const,
    buyers: ["Vardaman Textiles", "Arvind Textiles", "Gima"],
    note: "Cotton bales mostly sold to Rajasthan and Gujarat textile hubs.",
  },
  {
    step: 5,
    title: "Final Products",
    color: "#EC4899",
    icon: "tshirt-crew" as const,
    buyers: ["Threads", "Fabrics", "Cloth"],
    note: "Corporates convert bales into finished textiles for retail and export.",
  },
];

const ENAM_CONTENT = [
  {
    title: "Trader Registration on eNAM",
    icon: "account-plus" as const,
    color: Colors.primary,
    items: [
      { label: "Step 1", text: "Visit enam.gov.in and click 'Trader Registration'" },
      { label: "Step 2", text: "Upload valid trade license issued by local authority" },
      { label: "Step 3", text: "Provide PAN card, Aadhaar card, bank account details" },
      { label: "Step 4", text: "Register under the mandi/APMC where you operate" },
      { label: "Step 5", text: "Pay registration fee (varies by state, typically Rs.1,000-Rs.5,000)" },
      { label: "Note", text: "A valid mandi license (Arhat license) is mandatory for traders" },
    ],
  },
  {
    title: "Seller Registration on eNAM",
    icon: "account-check" as const,
    color: "#3B82F6",
    items: [
      { label: "Login", text: "Use your Aadhaar-linked mobile number on enam.gov.in" },
      { label: "Cert 1", text: "Kisan Credit Card (KCC) or PM Kisan registration recommended" },
      { label: "Cert 2", text: "Land ownership documents / Patta / Passbook" },
      { label: "Cert 3", text: "Bank account with IFSC code (for direct payment)" },
      { label: "Process", text: "Upload crop details, grade, and quantity before bringing to mandi" },
      { label: "Benefit", text: "Payments credited directly to bank account within 24 hours of sale" },
    ],
  },
  {
    title: "eNAM Benefits",
    icon: "check-decagram" as const,
    color: "#16A34A",
    items: [
      { label: "Price", text: "Transparent online bidding — farmers get best market price" },
      { label: "Reach", text: "Sell to buyers across India, not just local traders" },
      { label: "Payment", text: "Secure online payment — no cash handling" },
      { label: "Grade", text: "Standardized assaying and grading before bidding" },
      { label: "Mobile", text: "Available via eNAM mobile app on Android and iOS" },
    ],
  },
];

const COTTON_PRICES = [
  { exchange: "NCDEX (India)", code: "COCUDAKL", price: "Rs.6,485", change: "+Rs.120", isUp: true },
  { exchange: "NYBOT (New York)", code: "CT1!", price: "$0.748/lb", change: "-$0.003", isUp: false },
  { exchange: "ZCE (Zhengzhou)", code: "CF", price: "CNY15,220", change: "+CNY85", isUp: true },
];

const COTTON_QUALITY = [
  { param: "Staple Length", value: "130.5 mm", icon: "ruler" as const },
  { param: "Micronaire", value: "4 mm", icon: "diameter-variant" as const },
  { param: "Reflectance (RD)", value: "77", icon: "lightbulb-outline" as const },
  { param: "Strength", value: "23+ GTEX", icon: "arm-flex-outline" as const },
];

export default function SupplyChainScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>("cotton");
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <LinearGradient colors={[Colors.primary, "#0D4A22"]} style={styles.header}>
        <Text style={styles.headerTitle}>Supply Chain & Markets</Text>
        <Text style={styles.headerSub}>Cotton ecosystem · eNAM · Financing</Text>
      </LinearGradient>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <MaterialCommunityIcons
              name={t.icon}
              size={16}
              color={activeTab === t.id ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 90 }]}
      >
        {activeTab === "cotton" && (
          <View style={{ gap: 16 }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Global Cotton Exchanges</Text>
              <View style={styles.exchangeGrid}>
                {COTTON_PRICES.map((e) => (
                  <View key={e.exchange} style={styles.exchangeCard}>
                    <Text style={styles.exchangeName}>{e.exchange}</Text>
                    <Text style={styles.exchangeCode}>{e.code}</Text>
                    <Text style={styles.exchangePrice}>{e.price}</Text>
                    <View style={[styles.exchangeBadge, { backgroundColor: e.isUp ? Colors.green + "18" : Colors.red + "18" }]}>
                      <MaterialCommunityIcons name={e.isUp ? "trending-up" : "trending-down"} size={12} color={e.isUp ? Colors.green : Colors.red} />
                      <Text style={[styles.exchangeChange, { color: e.isUp ? Colors.green : Colors.red }]}>{e.change}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cotton Bale Quality Parameters</Text>
              <Text style={styles.sectionDesc}>Standard parameters per Chityala Mill specifications</Text>
              <View style={styles.qualityGrid}>
                {COTTON_QUALITY.map((q) => (
                  <View key={q.param} style={styles.qualityCard}>
                    <MaterialCommunityIcons name={q.icon} size={22} color={Colors.primary} />
                    <Text style={styles.qualityValue}>{q.value}</Text>
                    <Text style={styles.qualityParam}>{q.param}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cotton Procurement Flow</Text>
              {CHAIN_STEPS.map((s, idx) => (
                <View key={s.step} style={styles.stepCard}>
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepCircle, { backgroundColor: s.color }]}>
                      <Text style={styles.stepNumber}>{s.step}</Text>
                    </View>
                    {idx < CHAIN_STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: s.color + "40" }]} />}
                  </View>
                  <View style={styles.stepContent}>
                    <View style={styles.stepTitleRow}>
                      <MaterialCommunityIcons name={s.icon} size={18} color={s.color} />
                      <Text style={styles.stepTitle}>{s.title}</Text>
                    </View>
                    {s.buyers.map((b, bi) => (
                      <View key={bi} style={styles.stepBullet}>
                        <View style={[styles.stepBulletDot, { backgroundColor: s.color }]} />
                        <Text style={styles.stepBulletText}>{b}</Text>
                      </View>
                    ))}
                    <View style={[styles.stepNote, { backgroundColor: s.color + "10" }]}>
                      <Text style={[styles.stepNoteText, { color: s.color }]}>{s.note}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.section, styles.infoCard]}>
              <MaterialCommunityIcons name="seed-circle" size={24} color={Colors.accent} />
              <Text style={styles.infoCardTitle}>Cotton Seeds Business</Text>
              <Text style={styles.infoCardText}>
                Cotton seeds separated during processing are sold separately to oil manufacturers via auction on the{" "}
                <Text style={styles.infoCardHighlight}>ENVIDA platform</Text>. This generates additional revenue for mills.
              </Text>
            </View>

            <View style={[styles.section, styles.rxilCard]}>
              <MaterialCommunityIcons name="bank" size={24} color="#3B82F6" />
              <Text style={[styles.infoCardTitle, { color: "#3B82F6" }]}>RXIL — Invoice Financing</Text>
              <Text style={styles.infoCardText}>
                RXIL is an RBI-backed MSME invoice discounting platform. Mills and traders can use it to get working capital by
                discounting unpaid invoices. Helps solve payment delay issues in the cotton supply chain.
              </Text>
            </View>
          </View>
        )}

        {activeTab === "enam" && (
          <View style={{ gap: 16 }}>
            <View style={styles.enamIntro}>
              <MaterialCommunityIcons name="information-outline" size={22} color={Colors.primary} />
              <Text style={styles.sectionTitle}>National Agriculture Market</Text>
              <Text style={styles.sectionDesc}>
                eNAM (Electronic National Agriculture Market) is an online trading platform that enables farmers, traders, and buyers to
                trade agricultural commodities transparently. Managed by the Ministry of Agriculture, Government of India.
              </Text>
            </View>

            {ENAM_CONTENT.map((section) => (
              <View key={section.title} style={styles.enamSection}>
                <View style={styles.enamHeader}>
                  <View style={[styles.enamIcon, { backgroundColor: section.color + "15" }]}>
                    <MaterialCommunityIcons name={section.icon} size={22} color={section.color} />
                  </View>
                  <Text style={styles.enamTitle}>{section.title}</Text>
                </View>
                {section.items.map((item, i) => (
                  <View key={i} style={styles.enamItem}>
                    <View style={[styles.enamItemBadge, { backgroundColor: section.color + "15" }]}>
                      <Text style={[styles.enamItemLabel, { color: section.color }]}>{item.label}</Text>
                    </View>
                    <Text style={styles.enamItemText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {activeTab === "rxil" && (
          <View style={{ gap: 16 }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Financing Platforms</Text>

              <View style={styles.financeCard}>
                <View style={[styles.financeIconBox, { backgroundColor: "#3B82F6" + "15" }]}>
                  <MaterialCommunityIcons name="bank" size={28} color="#3B82F6" />
                </View>
                <Text style={styles.financeTitle}>RXIL</Text>
                <Text style={styles.financeSubtitle}>RBI Backed · Invoice Discounting</Text>
                <Text style={styles.financeDesc}>
                  RXIL (Receivables Exchange of India) is backed by the Reserve Bank of India. It allows MSMEs — including cotton
                  mills, traders, and agri-businesses — to discount unpaid invoices and receive immediate working capital.
                </Text>
                <View style={styles.financeFeatures}>
                  {[
                    "Instant working capital against invoices",
                    "Competitive interest rates",
                    "Digital onboarding — no branch visit",
                    "Supports agri MSMEs across India",
                    "Regulated by RBI — fully compliant",
                  ].map((f, i) => (
                    <View key={i} style={styles.financeFeat}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={Colors.green} />
                      <Text style={styles.financeFeatText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.financeCard}>
                <View style={[styles.financeIconBox, { backgroundColor: Colors.accent + "15" }]}>
                  <MaterialCommunityIcons name="gold" size={28} color={Colors.accent} />
                </View>
                <Text style={styles.financeTitle}>Kisan Credit Card (KCC)</Text>
                <Text style={styles.financeSubtitle}>Govt. Scheme · Short Term Credit</Text>
                <Text style={styles.financeDesc}>
                  Provides farmers with a revolving credit limit for crop cultivation, post-harvest expenses, and maintenance
                  needs. Issued by nationalized banks and cooperative banks at subsidized interest rates (typically 4% p.a.).
                </Text>
                <View style={styles.financeFeatures}>
                  {[
                    "Credit limit up to Rs.3 lakh at 4% interest",
                    "Covers crop production & allied activities",
                    "Personal accident insurance included",
                    "Valid for 5 years with annual renewal",
                  ].map((f, i) => (
                    <View key={i} style={styles.financeFeat}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={Colors.green} />
                      <Text style={styles.financeFeatText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 3 },
  tabBar: { flexDirection: "row", backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 10, backgroundColor: "transparent" },
  tabActive: { backgroundColor: Colors.primary + "12" },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16, gap: 16 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  sectionDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  exchangeGrid: { flexDirection: "row", gap: 8 },
  exchangeCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 12, gap: 4, borderWidth: 1, borderColor: Colors.border },
  exchangeName: { fontFamily: "Inter_500Medium", fontSize: 10, color: Colors.textSecondary },
  exchangeCode: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.text },
  exchangePrice: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  exchangeBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  exchangeChange: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  qualityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  qualityCard: { width: "47%", backgroundColor: Colors.card, borderRadius: 12, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: Colors.border },
  qualityValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  qualityParam: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary, textAlign: "center" },
  stepCard: { flexDirection: "row", gap: 12 },
  stepLeft: { alignItems: "center", width: 32 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stepNumber: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  stepLine: { width: 2, flex: 1, minHeight: 20, marginTop: 4 },
  stepContent: { flex: 1, gap: 8, paddingBottom: 20 },
  stepTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  stepBullet: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBulletDot: { width: 6, height: 6, borderRadius: 3 },
  stepBulletText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1 },
  stepNote: { borderRadius: 10, padding: 10 },
  stepNoteText: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 18 },
  infoCard: { borderRadius: 14, borderWidth: 1, borderColor: Colors.accent + "30", backgroundColor: Colors.accent + "06", padding: 16, alignItems: "flex-start", gap: 8 },
  rxilCard: { borderRadius: 14, borderWidth: 1, borderColor: "#3B82F630", backgroundColor: "#3B82F606", padding: 16, alignItems: "flex-start", gap: 8 },
  infoCardTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  infoCardText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  infoCardHighlight: { fontFamily: "Inter_600SemiBold", color: Colors.accent },
  enamIntro: { backgroundColor: Colors.primary + "08", borderRadius: 14, borderWidth: 1, borderColor: Colors.primary + "20", padding: 16, gap: 8 },
  enamSection: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  enamHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  enamIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  enamTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text, flex: 1 },
  enamItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  enamItemBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, minWidth: 56, alignItems: "center" },
  enamItemLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  enamItemText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  financeCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  financeIconBox: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  financeTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  financeSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  financeDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  financeFeatures: { gap: 8 },
  financeFeat: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  financeFeatText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text, flex: 1 },
});
