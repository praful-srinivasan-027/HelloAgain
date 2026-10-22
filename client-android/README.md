# HelloAgain - Android Messenger Client

A dedicated native & downloadable **Android Client** for HelloAgain Messenger, pre-configured to connect directly to the online Render server (`https://helloagain-reverse-proxy.onrender.com`).

---

## 📱 Features

- **Direct Online Backend Connection**: Connects out-of-the-box to `https://helloagain-reverse-proxy.onrender.com` (API) and `wss://helloagain-reverse-proxy.onrender.com/ws` (WebSocket) with zero backend modification.
- **Native Android Platform (Capacitor)**: Full native Android Studio & Gradle project in `android/` with launcher icons, AndroidManifest, Gradle wrapper, and Java bridge.
- **Hardware Back Button**: Native Android back button listener handles backing out of chats to the conversation list and minimizing cleanly.
- **Haptic Feedback**: Native vibration patterns on sending/receiving messages and tapping controls.
- **Native Cookie Bridge**: Android `CookieManager` configured to preserve FastAPI HttpOnly session cookies across cross-origin requests.
- **Downloadable Options**:
  1. **Automated GitHub Actions APK**: Direct downloadable `.apk` artifact generated on push.
  2. **Local Gradle APK Build**: 1-command `./build-apk.sh` compiler.
  3. **Android WebAPK Install**: 1-tap home screen install prompt from mobile Chrome.
  4. **Android Studio**: 1-click open with `npm run cap:open`.
- **In-App Server Config**: Built-in ping tool to test server latency and switch between the online Render server and local dev servers.

---

## 🚀 How to Download & Run the Android App

### Method 1: Download Pre-built APK via GitHub Actions (Recommended)
This repo includes an automated CI/CD pipeline (`.github/workflows/build-android-apk.yml`).
1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "Add Android client"
   git push origin main
   ```
2. Navigate to your repository on GitHub:
   `https://github.com/praful-srinivasan-027/HelloAgain/actions`
3. Click on the latest **Build Android APK** workflow run.
4. Download the **HelloAgain-Messenger-Android-APK** artifact from the Artifacts section.
5. Transfer or download the `.apk` file onto your Android phone and tap **Install**.

---

### Method 2: Open and Run in Android Studio
If you have Android Studio installed on your Mac or PC:
```bash
cd client-android
npm run cap:open
```
- Android Studio will open the native project in `client-android/android`.
- Plug in your Android phone (with USB debugging enabled) or start an Android Emulator.
- Click the green **Run** button (▶) or select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

### Method 3: Compile Locally via Build Script
```bash
cd client-android
npm run build:apk
# or
bash build-apk.sh
```
If `ANDROID_HOME` is set, Gradle will compile the `.apk` into `client-android/dist-apk/HelloAgain-Messenger.apk`.

---

### Method 4: 1-Tap Mobile Install (WebAPK)
Run the development or preview server on your local Wi-Fi:
```bash
cd client-android
npm run dev
```
1. Open your Android phone's browser (e.g. Chrome) and navigate to your computer's local IP address (e.g. `http://192.168.1.X:5174`).
2. Tap the banner **"Install App Now"** (or Chrome menu `⋮` > **"Install App"** / **"Add to Home Screen"**).
3. The app is installed as a native app on your Android device home screen.

---

## 🛠 Available Scripts

In `client-android/`:

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite dev server with network host enabled (`--host`) |
| `npm run build` | Builds production web assets into `dist/` |
| `npm run cap:sync` | Syncs web assets to the native Android project |
| `npm run cap:open` | Opens the native Android project in Android Studio |
| `npm run cap:build` | Builds web assets and syncs to Android in one command |
| `npm run build:apk` | Runs the automated APK build script |

---

## 🌐 Server Connection

The client connects to:
- **REST API Base URL**: `https://helloagain-reverse-proxy.onrender.com`
  - `/login` (POST)
  - `/register` (POST)
  - `/userinfo` (GET)
  - `/messageHistory` (POST / GET)
  - `/me` (GET)
  - `/` (Health check)
- **WebSocket URL**: `wss://helloagain-reverse-proxy.onrender.com/ws`

*To test latency or switch to a local server, tap the Server icon (top right) in the app.*
