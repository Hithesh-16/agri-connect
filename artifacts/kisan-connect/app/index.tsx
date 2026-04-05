import React from "react";
import { View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
}
