# 📱 Mulah iOS Simulator Setup Guide

## Prerequisites
1. **macOS with Xcode installed** (Xcode 12.0 or later)
2. **CocoaPods installed** (for iOS dependencies)
3. **Node.js** (already installed in Replit)

## Setup Steps

### 1. Install CocoaPods (if not already installed)
```bash
sudo gem install cocoapods
```

### 2. Download Your Project Files
Download these key files from your Replit project to your local Mac:
- The entire `ios/` folder (contains the Xcode project)
- `capacitor.config.ts` (Capacitor configuration)
- `dist/public/` folder (built web assets)

### 3. Local Setup Commands
Navigate to your project directory on your Mac and run:

```bash
# Install iOS dependencies
cd ios/App
pod install

# Open the Xcode workspace (NOT the .xcodeproj file)
open App.xcworkspace
```

### 4. Running in iOS Simulator

#### Option A: From Xcode
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select a simulator device (iPhone 14, iPhone 15, etc.)
3. Click the "Play" button or press `Cmd+R`
4. Your Mulah app will launch in the iOS Simulator

#### Option B: From Command Line
```bash
# Build and run on simulator
npx cap run ios

# Or specify a specific simulator
npx cap run ios --target="iPhone 15"
```

## 🔄 Development Workflow

### Making Changes
When you make changes to your web app in Replit:

1. **Build your changes:**
   ```bash
   npm run build
   ```

2. **Sync with iOS:**
   ```bash
   npx cap sync ios
   ```

3. **Re-run in simulator:**
   ```bash
   npx cap run ios
   ```

### Live Reload (Development)
For faster development, you can point the iOS app to your Replit dev server:

1. Update `capacitor.config.ts`:
   ```typescript
   const config: CapacitorConfig = {
     appId: 'com.mulah.app',
     appName: 'Mulah',
     webDir: 'dist/public',
     server: {
       url: 'https://YOUR-REPLIT-URL.replit.app',
       cleartext: true
     }
   };
   ```

2. Run `npx cap sync ios` and rebuild

## 📋 Complete File Transfer Checklist

### From Replit → Your Mac:

1. **iOS Project:**
   - `ios/` (entire folder)
   
2. **Configuration:**
   - `capacitor.config.ts`
   - `package.json`
   
3. **Built Assets:**
   - `dist/public/` (entire folder)

4. **Source Code (optional, for reference):**
   - `client/src/` (entire folder)
   - `server/` (entire folder)

## 🛠️ Troubleshooting

### Common Issues:

1. **"No such file or directory" error:**
   - Ensure you've run `npm run build` first
   - Check that `dist/public/` exists

2. **CocoaPods errors:**
   ```bash
   cd ios/App
   pod repo update
   pod install
   ```

3. **Simulator not loading app:**
   - Clean build: Product → Clean Build Folder in Xcode
   - Reset simulator: Device → Erase All Content and Settings

4. **Network requests failing:**
   - Update API URLs in your app to point to your Replit backend
   - Ensure CORS is configured for mobile requests

## 🎯 Next Steps

Once running in simulator:
1. Test all mobile interactions (touch, gestures)
2. Verify subscription management works
3. Test USW calculations and flows
4. Check analytics and navigation
5. Prepare for App Store deployment (requires Apple Developer account)

## 📱 App Features Ready for Testing:
- ✅ Mobile-optimized subscription tracking
- ✅ USW (Unified Subscription Wallet) calculations  
- ✅ Step-by-step subscription addition flow
- ✅ Analytics dashboard with spending breakdowns
- ✅ Touch-friendly navigation and interactions