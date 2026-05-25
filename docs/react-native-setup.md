# React Native Setup

This guide describes how to set up a React Native development environment for Android and iOS across macOS, Windows, and Linux. It covers required tooling, platform SDKs, common configurations, and troubleshooting.

If this repository adopts a specific approach (React Native CLI or Expo), use the relevant sections and ignore the others.

## Prerequisites

- Node.js 18.x or newer
- A package manager (npm, Yarn, or pnpm)
- Git
- macOS users: Watchman (improves file watching performance)
  - brew install watchman

Recommended versions as of 2026:
- JDK 17 (LTS)
- Android Studio latest stable, Android SDK Platform 34+, recent NDK if using native modules
- Xcode latest stable for your macOS version (iOS builds require macOS)

## Tooling and SDKs

### Java/JDK
- Install JDK 17:
  - macOS (Homebrew): brew install openjdk@17
  - Ubuntu/Debian: sudo apt install -y openjdk-17-jdk
  - Windows: winget install -e --id EclipseAdoptium.Temurin.17.JDK or use Chocolatey: choco install temurin17 -y
- Set JAVA_HOME:
  - macOS (zsh/bash):
    - export JAVA_HOME=$(/usr/libexec/java_home -v 17)
  - Linux (example path):
    - export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
  - Windows (PowerShell example):
    - setx JAVA_HOME "C:\\Program Files\\Eclipse Adoptium\\jdk-17*"

### Android Studio and Android SDK
- Install Android Studio from https://developer.android.com/studio
- In Android Studio > SDK Manager:
  - Install latest Android SDK Platform (e.g., Android 14 / API 34)
  - Install Android SDK Build-Tools (matching your Gradle plugin requirements)
  - Install Android SDK Tools, Platform-Tools (adb), and NDK (if using native modules)
- Set environment variables (Linux/macOS shells):
  - export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"  # macOS default
  - export ANDROID_SDK_ROOT="$HOME/Android/Sdk"          # Linux default
  - export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/tools:$PATH"
- Windows: Ensure Android SDK location is set in Android Studio and PATH includes platform-tools (adb)

### Xcode (macOS only)
- Install Xcode from the Mac App Store
- Install Command Line Tools:
  - xcode-select --install
- Accept licenses:
  - sudo xcodebuild -license accept
- Install CocoaPods for iOS dependency management:
  - sudo gem install cocoapods

## React Native CLI workflow

Use this if your app is a standard React Native CLI project.

- Create a new app (example):
  - npx react-native@latest init MyApp --version latest

- Install dependencies in the repo:
  - npm install  # or yarn / pnpm

- iOS setup (macOS only):
  - cd ios && pod install && cd -

- Android Gradle/Java configuration tips:
  - Ensure JAVA_HOME points to JDK 17
  - In android/gradle.properties, you may need:
    - org.gradle.jvmargs=-Xmx4g -Dkotlin.daemon.jvm.options=-Xmx2g
  - If using NDK/native modules, match NDK version in android/build.gradle and SDK Manager

- Running:
  - Start Metro bundler: npx react-native start
  - Android (emulator must be running or a device connected): npx react-native run-android
  - iOS (simulator): npx react-native run-ios

## Expo workflow (alternative)

Expo provides a streamlined developer experience. Choose this if the project uses Expo.

- Install the CLI:
  - npm install -g expo-cli  # Or use npx expo

- Create a new app:
  - npx create-expo-app@latest MyApp

- Running:
  - npm start  # or expo start
  - Use the Expo Go app on a device, or run emulators/simulators via the prompts

- EAS (Expo Application Services) for builds and updates:
  - npm install -g eas-cli
  - eas build --platform ios|android

## Emulators and Devices

- Android Emulator:
  - Create an Android Virtual Device (AVD) via Android Studio > Device Manager
  - Start the emulator, confirm with `adb devices`

- iOS Simulator (macOS):
  - Xcode > Open Developer Tool > Simulator
  - You can select device models and iOS versions

- Physical devices:
  - Android: Enable Developer Options and USB debugging
  - iOS: Requires Apple developer account for device provisioning; follow Xcode prompts

## Troubleshooting

- Metro bundler port in use (8081)
  - Kill processes on 8081 or run with a different port: `RCT_METRO_PORT=8082 npx react-native start`

- Android build fails: No matching NDK version / SDK not found
  - Install the required NDK/SDK in Android Studio SDK Manager
  - Ensure ANDROID_SDK_ROOT is correct and Gradle plugin version matches

- iOS build fails: Command PhaseScriptExecution failed / missing pods
  - Run `cd ios && pod install`
  - Clean build folder in Xcode (Shift+Cmd+K) and retry

- Code signing issues on iOS
  - In Xcode, set your team and provisioning profile in the project Signing & Capabilities tab
  - For local dev, use automatic signing

- Watchman/FS events issues on macOS
  - Install/upgrade Watchman: `brew install watchman`
  - Consider adding watchman config to increase watch limits

- Gradle Daemon memory
  - Increase `org.gradle.jvmargs` memory in `android/gradle.properties`

## Useful Links

- Official React Native Docs: https://reactnative.dev/docs/environment-setup
- Android Studio: https://developer.android.com/studio
- Xcode: https://developer.apple.com/xcode/
- Expo: https://docs.expo.dev/
- CocoaPods: https://cocoapods.org/
