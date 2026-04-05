import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import RN from "react-native";
import Feather from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

import WelcomeScreen from "@/app/(auth)/welcome";
import LoginScreen from "@/app/(auth)/login";
import RegisterScreen from "@/app/(auth)/register";
import OTPScreen from "@/app/(auth)/otp";
import PersonalInfoScreen from "@/app/(auth)/personal-info";
import CropSelectionScreen from "@/app/(auth)/crop-selection";
import MandiSelectionScreen from "@/app/(auth)/mandi-selection";
import HomeScreen from "@/app/(tabs)/index";
import PricesScreen from "@/app/(tabs)/prices";
import ScannerScreen from "@/app/(tabs)/scanner";
import MarketsScreen from "@/app/(tabs)/markets";
import ProfileScreen from "@/app/(tabs)/profile";
import SupplyChainScreen from "@/app/(tabs)/supply-chain";
import NotFoundScreen from "@/app/+not-found";

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const isDark = RN.useColorScheme() === "dark";
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.OS === "ios" ? "transparent" : isDark ? "#0F1A12" : "#FFFFFF",
          borderTopWidth: Platform.OS === "web" ? 1 : 0,
          borderTopColor: Colors.border,
          elevation: 0,
        },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home", tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tab.Screen name="Prices" component={PricesScreen} options={{ title: "Prices", tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={22} color={color} /> }} />
      <Tab.Screen name="Scanner" component={ScannerScreen} options={{ title: "Scan", tabBarIcon: ({ color }) => <MaterialCommunityIcons name="crop-free" size={24} color={color} /> }} />
      <Tab.Screen name="Markets" component={MarketsScreen} options={{ title: "Markets", tabBarIcon: ({ color }) => <Feather name="map" size={22} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile", tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="SupplyChain" component={SupplyChainScreen} />
    </MainStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="OTP" component={OTPScreen} />
      <AuthStack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <AuthStack.Screen name="CropSelection" component={CropSelectionScreen} />
      <AuthStack.Screen name="MandiSelection" component={MandiSelectionScreen} />
    </AuthStack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <RN.View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background }}>
        <RN.ActivityIndicator size="large" color={Colors.primary} />
      </RN.View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
      <RootStack.Screen name="NotFound" component={NotFoundScreen} options={{ title: "Oops!" }} />
    </RootStack.Navigator>
  );
}

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    if (Platform.OS !== "web" && RN.NativeModules?.SplashScreen) {
      try {
        RN.NativeModules.SplashScreen.hide();
      } catch (_) {}
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <NavigationContainer>
                  <RootNavigator />
                </NavigationContainer>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
