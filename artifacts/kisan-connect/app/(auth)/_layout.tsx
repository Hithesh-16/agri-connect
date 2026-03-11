import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="crop-selection" />
      <Stack.Screen name="mandi-selection" />
    </Stack>
  );
}
