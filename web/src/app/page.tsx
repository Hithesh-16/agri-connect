"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function RootPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) {
      router.replace("/home");
    } else {
      router.replace("/welcome");
    }
  }, [isAuthenticated, hydrated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-kisan-bg">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
