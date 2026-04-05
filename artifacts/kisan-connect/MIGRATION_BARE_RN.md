# Migration: Expo removed → Bare React Native

This app has been fully migrated from **Expo** to **bare React Native** using only React Native and community packages.

## What changed

### Build & entry
- **Entry:** `index.js` registers the app and loads `App.tsx` (no Expo entry).
- **Metro:** Uses `@react-native/metro-config` (no Expo Metro).
- **Babel:** Uses `@react-native/babel-preset` + `babel-plugin-module-resolver` for `@/` alias (no `babel-preset-expo`).

### Navigation
- **expo-router** (file-based) → **React Navigation**
  - `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
  - All `router.push/replace/back` and `Redirect`/`Link` replaced with `useNavigation().navigate/replace/goBack()` and `useRoute().params`.
  - Root: Auth stack (when logged out) or Main stack (tabs + SupplyChain) when logged in.

### Replaced Expo modules

| Expo package           | Replacement                          |
|------------------------|--------------------------------------|
| expo-router            | React Navigation (stack + bottom tabs) |
| @expo/vector-icons      | react-native-vector-icons             |
| @expo-google-fonts/inter| System font (Inter font loading removed) |
| expo-linear-gradient   | react-native-linear-gradient          |
| expo-blur              | @react-native-community/blur          |
| expo-haptics           | react-native-haptic-feedback          |
| expo-image-picker      | react-native-image-picker             |
| expo-splash-screen     | react-native-splash-screen (native)   |
| expo-symbols / expo-glass-effect | Removed (tabs use Feather/MaterialCommunityIcons) |
| expo (reloadAppAsync)  | DevSettings.reload() in ErrorFallback |

### Android
- **Expo** removed from the Android project:
  - `android/settings.gradle`: no Expo plugins; only React Native Gradle plugin.
  - `android/build.gradle`: no `expo-root-project`.
  - `android/app/build.gradle`: entry set to `index.js`; no Expo CLI; Fresco for images.
  - `MainApplication.kt` / `MainActivity.kt`: no Expo wrappers; JS entry `index`, component name `KisanConnect`.
- **react-native-vector-icons:** `apply from: "../node_modules/react-native-vector-icons/fonts.gradle"` in `app/build.gradle`.

### Removed
- All `expo*` and `@expo/*` dependencies.
- `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx` (navigation lives in `App.tsx`).
- Expo-specific scripts (`expo start`, `expo run:android`, `expo prebuild`).

### Scripts (package.json)
- `pnpm start` → `react-native start`
- `pnpm android` → `react-native run-android`
- `pnpm ios` → `react-native run-ios`

## How to run

1. **Install:** From repo root, `pnpm install` (or from `artifacts/kisan-connect`, `pnpm install` with workspace).
2. **Metro:** `pnpm start` (from `artifacts/kisan-connect`).
3. **Android:** `pnpm android` or open `android/` in Android Studio and Run.
4. **iOS:** `pnpm ios` or open `ios/` in Xcode (if you generate `ios/` with `npx react-native run-ios` or add an `ios` folder manually).

## Fonts

Inter font loading was removed with Expo. Any remaining `fontFamily: "Inter_..."` in styles will fall back to the system font. To restore Inter, add the font files under `assets/fonts/` and link them (e.g. via `react-native.config.js` or manual copy to `android/app/src/main/assets/fonts/` and iOS project).
