import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "farmer" | "trader" | "dealer" | "corporate";

export interface UserProfile {
  mobile: string;
  aadhaar?: string;
  firstName: string;
  surname: string;
  role: UserRole;
  profilePhoto?: string;
  houseNo?: string;
  street?: string;
  village?: string;
  post?: string;
  mandal?: string;
  district?: string;
  state?: string;
  country?: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  language?: string;
  updatesConsent: boolean;
  selectedCropIds: string[];
  selectedMandiIds: string[];
  lastActive: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (profile: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_DAYS = 20;
const STORAGE_KEY = "kisan_user_profile";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const profile: UserProfile = JSON.parse(raw);
        const daysSinceActive = (Date.now() - profile.lastActive) / (1000 * 60 * 60 * 24);
        if (daysSinceActive < SESSION_DAYS) {
          setUser(profile);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}
    setIsLoading(false);
  }

  async function signIn(profile: UserProfile) {
    const withTimestamp = { ...profile, lastActive: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
    setUser(withTimestamp);
  }

  async function signOut() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return;
    const updated = { ...user, ...updates, lastActive: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
