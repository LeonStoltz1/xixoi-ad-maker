# Mobile App Setup Guide

## Prerequisites
- Node.js and npm installed
- iOS: Mac with Xcode installed
- Android: Android Studio installed

## Setup Steps

### 1. Export to GitHub
1. Click "Export to GitHub" button in Lovable
2. Clone your repository locally:
```bash
git clone <your-repo-url>
cd xixoi-ad-maker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Mobile Platforms
```bash
# Add iOS (Mac only)
npx cap add ios

# Add Android
npx cap add android
```

### 4. Build and Sync
```bash
# Build the web app
npm run build

# Sync with native platforms
npx cap sync
```

### 5. Run on Device/Emulator

**iOS (Mac only):**
```bash
npx cap run ios
```
Or open in Xcode:
```bash
npx cap open ios
```

**Android:**
```bash
npx cap run android
```
Or open in Android Studio:
```bash
npx cap open android
```

## Hot Reload Development

The app is configured for hot reload from the Lovable sandbox:
- URL: `https://e6035fce-0e29-4297-b630-64ec7d0f6a4e.lovableproject.com?forceHideBadge=true`
- Changes in Lovable appear instantly on your device
- No need to rebuild for code changes

## After Git Pull

Whenever you pull changes from GitHub:
```bash
npm install
npx cap sync
```

## Publishing

### iOS App Store
1. Configure signing in Xcode
2. Archive and upload via Xcode
3. Submit through App Store Connect

### Google Play Store
1. Generate signed APK/Bundle in Android Studio
2. Upload to Google Play Console
3. Submit for review

## Troubleshooting

**Build errors:** Run `npx cap sync` after any dependency changes
**Hot reload not working:** Check the server URL in `capacitor.config.ts`
**iOS signing issues:** Configure your development team in Xcode
