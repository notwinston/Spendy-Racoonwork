# EAS Build + Apple Calendar Setup Guide

## What You Need

- **Node.js** (already have it)
- **Expo account** (free — create at expo.dev)
- **Apple Developer account** ($99/year) — only needed for physical iPhone. **Simulator builds are free.**

## Current Status

What's already done:
- `expo-calendar` plugin configured in `app.json` with permission message
- `calendarService.ts` fully implements Apple Calendar reading (permissions, fetching events, categorization)
- All native modules declared (`expo-calendar`, `expo-image-picker`, `expo-notifications`, `expo-secure-store`)

What's missing:
- `eas.json` config file
- EAS CLI login
- A development build

## Step-by-Step Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Log in to Expo

```bash
eas login
```

Create a free account at https://expo.dev if you don't have one.

### 3. Configure EAS

From the `app/` directory:

```bash
cd app
eas build:configure
```

This creates `eas.json`. If you want to do it manually, create `app/eas.json`:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development-simulator": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### 4. Build for iOS Simulator (FREE — no Apple Developer account needed)

```bash
eas build --profile development-simulator --platform ios
```

This runs in the cloud (takes ~10-15 minutes). When done, it gives you a download URL for a `.app` file.

### 5. Install on Simulator

After the build finishes:

```bash
# Download and install automatically
eas build:run --platform ios
```

Or manually drag the `.app` file onto your open iOS Simulator.

### 6. Run Your App

Start Metro as usual:

```bash
npx expo start --dev-client
```

Open the development build app on the simulator — it connects to Metro just like Expo Go, but with full native module access.

## For Physical iPhone (requires Apple Developer account)

```bash
# Register your device first
eas device:create

# Build for physical device
eas build --profile development --platform ios
```

EAS handles code signing and provisioning automatically. You'll be prompted to log in to your Apple Developer account during the first build.

Install via QR code or direct download link that EAS provides.

## Testing Apple Calendar

Once running in the development build:

1. Open the app and tap a demo persona (or sign up)
2. Go through onboarding — tap "Connect Apple Calendar"
3. The OS permission dialog will appear (this never happens in Expo Go)
4. Grant permission
5. Events from the simulator's Calendar app will be imported

**To add test events to the simulator:**
- Open the Calendar app on the simulator
- Add events manually (or use `xcrun simctl` commands)
- Then connect in FutureSpend — they'll appear with predicted spending

## What Changes After the Build

| Feature | Expo Go | Development Build |
|---|---|---|
| Apple Calendar access | Demo data only | Real device calendar |
| Push notifications | Warnings, limited | Fully functional |
| Receipt camera | Limited | Full camera access |
| Secure storage | AsyncStorage fallback | Native keychain |
| Morning brief scheduling | Skipped | Real scheduled notifications |

## Costs

- **EAS Build**: Free tier includes 30 builds/month
- **iOS Simulator build**: Free, no Apple account needed
- **iOS Device build**: Requires $99/year Apple Developer Program
- **Android build**: Free, no Google account needed for APK

## Troubleshooting

**Build fails with signing errors:**
```bash
eas credentials  # manage iOS certificates
```

**Can't find the dev build on simulator:**
```bash
eas build:run --platform ios --latest
```

**Metro doesn't connect to dev build:**
Make sure you start with `--dev-client` flag:
```bash
npx expo start --dev-client
```

**Calendar permission denied:**
Reset permissions in simulator: Device > Erase All Content and Settings
