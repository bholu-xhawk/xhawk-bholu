# React Native Local Development Setup

This guide explains how to set up a React Native development environment and run the app locally for Android and iOS. It covers required tooling, SDK setup, emulators/simulators, configuring the app to talk to a local backend, and common troubleshooting.

## Overview

- Install Node.js and package manager
- Install React Native toolchain and platform SDKs (Android, iOS)
- Configure environment variables for API base URL
- Launch Metro bundler and run the app on Android/iOS
- Verify connectivity to your local backend

## Prerequisites

- Node.js 18+ (repo engines specify >=20; using Node 20 is recommended)
- pnpm (preferred) or yarn/npm
- Watchman (macOS, improves file watching performance)
- Java Development Kit (JDK 17 recommended)
- Android Studio (Android SDK + emulator)
- Xcode (macOS only, for iOS simulator)

## Install Tooling

### Node & pnpm

- Use Node 20 (this repo includes an .nvmrc with a compatible version if you use nvm):
  ```bash
  node -v
  # if needed
  nvm install 20 && nvm use 20
  ```
- Install pnpm:
  ```bash
  corepack enable
  corepack prepare pnpm@latest --activate
  pnpm -v
  ```

### Watchman (macOS)

```bash
brew install watchman
```

### JDK

- macOS (Homebrew): `brew install openjdk@17`
- Linux (Debian/Ubuntu): `sudo apt-get install -y openjdk-17-jdk`
- Windows: Install Temurin 17 (Adoptium) or Oracle JDK 17; ensure JAVA_HOME is set.

Verify:
```bash
java -version
```

## Android Setup

1. Install Android Studio (latest stable) from https://developer.android.com/studio
2. During first run, install the following SDK components via SDK Manager:
   - Android SDK Platform (latest LTS and the target SDK for the app)
   - Android SDK Platform-Tools
   - Android SDK Build-Tools (e.g., 34.x)
   - Android NDK (if required by native modules)
3. Create an Android Virtual Device (AVD) with Pixel device image and a recent API level (e.g., API 34).
4. Set environment variables in your shell profile (~/.zshrc or ~/.bashrc):
   ```bash
   export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"   # macOS default
   export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/tools/bin:$ANDROID_SDK_ROOT/emulator:$PATH"
   # Linux example:
   # export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
   ```
5. Accept licenses:
   ```bash
   yes | "$ANDROID_SDK_ROOT"/cmdline-tools/latest/bin/sdkmanager --licenses || true
   ```

Run on Android:
```bash
pnpm install
pnpm start      # starts Metro bundler
# in another terminal
npx react-native run-android
```

Notes:
- If your backend runs on the host at http://localhost:3000, Android emulators do not resolve host localhost by default.
  - Use http://10.0.2.2:3000 for the Android emulator (default AOSP).
  - For physical devices, use your machine's LAN IP, e.g., http://192.168.1.50:3000.

## iOS Setup (macOS only)

1. Install Xcode from the Mac App Store and agree to the license after first run.
2. Install Command Line Tools (Xcode > Settings > Locations > Command Line Tools).
3. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```
4. Install iOS pods (run from the iOS app directory when present):
   ```bash
   cd ios && pod install && cd -
   ```
5. Run on iOS simulator:
   ```bash
   pnpm install
   pnpm start
   npx react-native run-ios
   ```

Notes:
- iOS simulators use your macOS network stack; http://localhost:3000 will reach services on your Mac.
- If you use self-signed HTTPS locally, configure ATS exceptions or use http for development.

## Environment Config (API Base URL)

Point the mobile app to your local backend by setting an environment variable or config constant. Common approaches:

- Using a .env file with react-native-config:
  ```bash
  # .env.development
  API_BASE_URL=http://localhost:3000
  ```
  And read it in code (example):
  ```js
  import Config from 'react-native-config';
  const api = axios.create({ baseURL: Config.API_BASE_URL });
  ```
- Using a JS config module:
  ```js
  export const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.example.com';
  ```

Android emulator special case:
- If using the Android emulator, set `API_BASE_URL` to `http://10.0.2.2:3000`.

## Useful Commands

- Clean caches:
  ```bash
  # watchman
  watchman watch-del-all || true
  # metro & react-native cache
  rm -rf $TMPDIR/metro-* || true
  npx react-native start --reset-cache
  # Android build clean
  cd android && ./gradlew clean && cd -
  # iOS derived data (macOS)
  rm -rf ~/Library/Developer/Xcode/DerivedData
  ```
- List devices/emulators:
  ```bash
  adb devices
  xcrun simctl list devices
  ```

## Run & Verify

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start Metro bundler:
   ```bash
   pnpm start
   ```
3. Launch on Android:
   ```bash
   npx react-native run-android
   ```
4. Launch on iOS (macOS):
   ```bash
   npx react-native run-ios
   ```
5. Verify the app loads and can fetch from your local API endpoint. Use the device/emulator dev menu to enable network inspect and view errors.

## Common Issues & Troubleshooting

- Metro cannot find module / stale cache:
  - Run the clean cache commands above and restart Metro.
- Android: emulator cannot reach localhost:
  - Use http://10.0.2.2 for Android emulator, or your LAN IP for physical devices.
- iOS: Pod install failures:
  - Ensure Ruby and CocoaPods are installed; try `sudo gem install cocoapods` and `pod repo update`.
- JDK version mismatch:
  - Ensure JAVA_HOME points to JDK 17 and Gradle is using it.
- Permission denied on Gradle wrapper:
  - `chmod +x android/gradlew`
- Hermes/NDK issues:
  - Ensure NDK version matches your RN version’s requirements, or temporarily disable Hermes if debugging.

## Next Steps

- Link this guide from the repo README if desired.
- Align API base URL and env naming with your backend and app conventions.
