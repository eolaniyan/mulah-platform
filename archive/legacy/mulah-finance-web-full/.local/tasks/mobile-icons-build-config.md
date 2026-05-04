# Mobile App Icons & Build Configuration

## What & Why
The Mulah mobile app needs properly branded app icons and splash screen assets, plus EAS (Expo Application Services) build configuration so it can be compiled for iOS and Android distribution. Currently the assets directory has placeholder images that need to be replaced with actual Mulah branding (teal/dark theme with the Mulah wordmark or logo mark). The build configuration also needs to be finalized for production.

## Done looks like
- App icon (1024×1024) reflects Mulah brand: teal background with white "M" or wordmark
- Adaptive icon for Android uses matching foreground + teal background
- Splash screen uses Mulah brand colors with centered logo
- `app.json` has finalized bundle identifiers, version info, and permissions
- `eas.json` is present with development, preview, and production build profiles
- The app.json `apiUrl` extra field is documented clearly for the deployer to update

## Out of scope
- Actual App Store / Play Store submission (user handles this externally)
- Push notification setup
- In-app purchase configuration

## Tasks
1. **Generate branded icon assets** — Create a 1024×1024 PNG icon with Mulah branding (teal #0d9488 background, white "M" lettermark) and resize/export all required variants: icon.png, adaptive-icon.png (foreground), splash-icon.png, and favicon.png using canvas drawing or a generated image.

2. **Finalize app.json** — Add permissions arrays for iOS and Android (camera, notifications), confirm bundle identifiers, add `backgroundColor` for splash, and document the `apiUrl` extra field with clear instructions.

3. **Create eas.json** — Add EAS build configuration with three profiles: `development` (internal distribution, dev client), `preview` (internal distribution, production JS), and `production` (store distribution).

4. **Create a SETUP.md in mobile/** — Document the exact steps needed to take the mobile/ folder into a new Expo project, update the API URL, and run an EAS build for each platform.

## Relevant files
- `mobile/app.json`
- `mobile/assets/icon.png`
- `mobile/assets/adaptive-icon.png`
- `mobile/assets/splash-icon.png`
- `mobile/assets/favicon.png`
- `mobile/package.json`
