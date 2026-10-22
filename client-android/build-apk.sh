#!/usr/bin/env bash
set -e

# HelloAgain Messenger - Android APK Build Script
echo "=================================================="
echo "  Building HelloAgain Android Client & APK"
echo "=================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Detect Android SDK
if [ -z "$ANDROID_HOME" ]; then
  if [ -d "$HOME/Library/Android/sdk" ]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    echo "✔ Found Android SDK at $ANDROID_HOME"
  elif [ -d "/usr/local/share/android-sdk" ]; then
    export ANDROID_HOME="/usr/local/share/android-sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    echo "✔ Found Android SDK at $ANDROID_HOME"
  fi
fi

# 2. Build Web Assets
echo ""
echo "📦 Step 1/3: Building Web Assets (Vite)..."
npm run build

# 3. Sync Native Android Platform
echo ""
echo "📱 Step 2/3: Syncing Capacitor Android Native Project..."
npx cap sync android

# 4. Check if SDK is available to compile APK
echo ""
echo "⚙️ Step 3/3: Compiling Native Android APK with Gradle..."
cd "$SCRIPT_DIR/android"
chmod +x gradlew

mkdir -p "$SCRIPT_DIR/dist-apk"

if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME" ]; then
  ./gradlew assembleDebug
  
  APK_SRC="$SCRIPT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
  APK_DEST="$SCRIPT_DIR/dist-apk/HelloAgain-Messenger.apk"
  
  if [ -f "$APK_SRC" ]; then
    cp "$APK_SRC" "$APK_DEST"
    echo ""
    echo "=================================================="
    echo "🎉 SUCCESS: Android APK compiled successfully!"
    echo "📍 Output: $APK_DEST"
    ls -lh "$APK_DEST"
    echo "=================================================="
  else
    echo "⚠ Gradle finished, but output APK not found at $APK_SRC"
  fi
else
  echo ""
  echo "ℹ️ Note: Android SDK was not detected at standard location ($HOME/Library/Android/sdk)."
  echo "You have three easy ways to get your downloadable APK:"
  echo ""
  echo "1. 🚀 Push to GitHub (Automated Cloud APK):"
  echo "   Push this repo to GitHub; GitHub Actions automatically builds the APK and"
  echo "   attaches 'HelloAgain-Messenger-Android-APK' to the GitHub Actions artifacts tab."
  echo ""
  echo "2. 🛠 Open in Android Studio:"
  echo "   Run: 'npm run cap:open' to open the native project in Android Studio and click 'Run' or 'Build APK'."
  echo ""
  echo "3. 📲 1-Tap Mobile Install (WebAPK):"
  echo "   Open the app on your Android phone's Chrome browser and tap 'Install App'."
fi
