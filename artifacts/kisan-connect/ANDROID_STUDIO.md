# Running Kisan Connect in Android Studio

This project is **Android Studio compatible**. You can open the native Android project, build, and run on an emulator or device without using Expo Go.

## Quick start

1. **Open in Android Studio**
   - File → Open → select the `android` folder inside this project (`artifacts/kisan-connect/android`).
   - Wait for Gradle sync to finish.

2. **Run the app**
   - Start an Android emulator (AVD) or connect a device with USB debugging.
   - In Android Studio: Run → Run 'app' (or click the green Run button).
   - Or from terminal (from this directory): `pnpm android`.

3. **Metro bundler (required for dev)**
   - In a separate terminal, start Metro so the app can load JS:
     ```bash
     cd artifacts/kisan-connect && pnpm exec expo start --localhost
     ```
   - Keep this running while you run the app from Android Studio.

---

## Differences: Expo Go vs Android Studio

| Aspect | **Expo Go (managed)** | **Android Studio (this setup)** |
|--------|------------------------|----------------------------------|
| **How you run** | `expo start` → scan QR in Expo Go app | Open `android/` in Android Studio → Run app; Metro runs separately |
| **Runtime** | Expo Go app (prebuilt) | Your own debug build (includes your native code) |
| **Native code** | No `android/` or `ios/`; fully managed | `android/` folder present; can edit Gradle, manifests, native modules |
| **Custom native code** | Only via config plugins | Full access: edit Java/Kotlin, add libraries, change build config |
| **Build output** | N/A (you don’t build; Expo Go runs your bundle) | APK/AAB from Android Studio or `expo run:android` |
| **Where app runs** | Inside Expo Go on device/emulator | Standalone app on device/emulator (no Expo Go) |
| **Debugging** | Expo dev tools, React DevTools | Android Studio debugger, Logcat, React DevTools, breakpoints in native code |
| **Dependencies** | Node + Expo CLI + Expo Go on device | Node + Android Studio + JDK + Android SDK (+ Metro for dev) |
| **Best for** | Fast iteration, no native setup | Native customizations, in-house builds, Play Store–style builds |

### Summary

- **Expo Go**: No Android project on disk; you only run `expo start` and open the project in the Expo Go app. Easiest, but no native project to open in Android Studio.
- **Android Studio (current setup)**: `android/` is generated with `expo prebuild`. You open that folder in Android Studio, build and run a real Android app. You still use the same Expo/React Native JS code; only the way you build and run changes.

### Regenerating the Android project

If you change `app.json` plugins or add/remove native modules, regenerate the Android project:

```bash
pnpm prebuild:clean   # or: pnpm exec expo prebuild --platform android --clean
```

Then open the `android` folder again in Android Studio.
