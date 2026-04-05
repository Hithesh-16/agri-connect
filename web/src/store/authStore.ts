"use client";

import { create } from "zustand";
import type { User } from "@/types";
import { api } from "@/lib/api";
import {
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  setStoredToken,
  removeStoredToken,
  getStoredToken,
} from "@/lib/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrated: boolean;
  hydrate: () => void;
  signIn: (user: User) => void;
  signInWithToken: (user: User, token: string) => void;
  signOut: () => void;
  updateUser: (partial: Partial<User>) => void;
  sendOtp: (mobile: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (mobile: string, otp: string) => Promise<{ success: boolean; token?: string; user?: User }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hydrated: false,

  hydrate: () => {
    const user = getStoredUser();
    const token = getStoredToken();
    set({
      user,
      isAuthenticated: !!(user && token),
      isLoading: false,
      hydrated: true,
    });
  },

  signIn: (user: User) => {
    setStoredUser(user);
    if (!getStoredToken()) {
      setStoredToken("local_session_" + Date.now());
    }
    set({ user, isAuthenticated: true, isLoading: false });
  },

  signInWithToken: (user: User, token: string) => {
    setStoredUser(user);
    setStoredToken(token);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  signOut: () => {
    removeStoredUser();
    removeStoredToken();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  updateUser: (partial: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    setStoredUser(updated);
    set({ user: updated });
  },

  sendOtp: async (mobile: string) => {
    try {
      const res = await api.post<{ success: boolean; message: string }>("/api/auth/send-otp", { mobile });
      return { success: true, message: res.message };
    } catch {
      // Fallback: allow demo mode if backend is unreachable
      return { success: true, message: "OTP sent (demo mode)" };
    }
  },

  verifyOtp: async (mobile: string, otp: string) => {
    try {
      const res = await api.post<{ success: boolean; data: { token: string; user: User } }>("/api/auth/verify-otp", { mobile, otp });
      if (res.data?.token) {
        return { success: true, token: res.data.token, user: res.data.user };
      }
      return { success: true };
    } catch {
      // Fallback: allow demo mode
      return { success: true };
    }
  },
}));
