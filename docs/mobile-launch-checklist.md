# Mobile App Launch Checklist

Last updated: 2026-06-07

## App Identity

- [x] App name: Flag Arcade
- [x] Bundle/package id: `com.flagarcade.app`
- [x] iOS display name: `Flag Arcade`
- [x] Android display name: `Flag Arcade`
- [x] iOS URL scheme: `com.flagarcade.app://auth/callback`
- [x] Android URL scheme: `com.flagarcade.app://auth/callback`
- [x] Mobile orientation locked to portrait
- [ ] Confirm final developer accounts and signing team ids
- [ ] Confirm production release version and build number

## Native Assets

- [x] iOS app icon asset exists at 1024x1024
- [x] iOS splash image set exists at 2732x2732
- [x] Android launcher icons exist for mdpi through xxxhdpi
- [x] Android adaptive icon foreground/background resources exist
- [x] Android splash resources exist for portrait and landscape densities
- [ ] Review app icon on real home screens against light/dark wallpapers
- [ ] Review splash screen on real devices for cropping and perceived load time
- [ ] Produce App Store screenshots for required iPhone sizes
- [ ] Produce Google Play screenshots for phone listing
- [ ] Produce optional iPad/tablet screenshots only if tablet support remains enabled

## Native Functionality

- [x] Capacitor app id/name/webDir configured
- [x] Android system back returns to Game Modes from game screens
- [x] Android system back exits from Game Modes
- [x] Native share links use public web URLs for Perfect Passport
- [x] Native analytics posts to public site URL
- [x] Status bar background/style configured
- [x] Keyboard resize/style configured
- [ ] Test iOS native share sheet from Perfect Passport results on device or interactive simulator
- [ ] Test Android native share sheet from Perfect Passport results on emulator/device
- [ ] Test auth callback/deep link on both platforms
- [ ] Test offline/poor-network behavior for all game modes

## Game Mode QA Matrix

| Mode | Mobile route QA | Android native QA | iOS native shell QA | Remaining |
| --- | --- | --- | --- | --- |
| Journey Mode | Pass | Pass, including first-run character/flag setup | Launch/shell pass | Interactive iOS tap-through |
| Perfect Passport | Pass | Pass, including back handling | Launch/shell pass | iOS results/share tap-through |
| Flag Jeopardy | Pass, Easy and Hard | Pass, Easy board | Launch/shell pass | Interactive iOS Easy/Hard tap-through |
| Arcade Mode | Pass | Visual pass | Launch/shell pass | Interactive iOS tap-through |
| Around the World | Pass | Visual pass | Launch/shell pass | Interactive iOS map/tap-through |
| Flag Runner | Pass | Visual pass | Launch/shell pass | Interactive iOS tap-through |

## Build And Release Gates

- [x] `npm run typecheck:all`
- [x] `npm run build`
- [x] `npx cap sync`
- [x] Android debug build: `./gradlew assembleDebug`
- [x] iOS unsigned build: `xcodebuild ... CODE_SIGNING_ALLOWED=NO build`
- [ ] Android release build: signed AAB
- [ ] iOS archive: signed App Store archive
- [ ] Upload Android internal test build to Google Play Console
- [ ] Upload iOS TestFlight build to App Store Connect
- [ ] Run smoke test from installed TestFlight build
- [ ] Run smoke test from installed Play internal test build

## Store Metadata

- [ ] Short description for Google Play
- [ ] Full description for Google Play
- [ ] Promotional text for App Store
- [ ] App Store subtitle
- [ ] App Store description
- [ ] App Store keywords
- [ ] Support URL
- [ ] Marketing URL
- [ ] Privacy policy URL
- [ ] Category selections
- [ ] Content rating questionnaire
- [ ] Age rating questionnaire
- [ ] Copyright holder

## Privacy And Compliance

- [ ] App Store privacy nutrition labels completed
- [ ] Google Play Data Safety form completed
- [ ] Confirm analytics data collected and retention policy
- [ ] Confirm Supabase/auth data collected and deletion path
- [ ] Confirm no precise location, contacts, photos, microphone, camera, or health permissions are requested
- [ ] Confirm children's/privacy positioning before launch copy is finalized
- [ ] Confirm Terms of Use, Privacy Policy, and support contact are reachable from store listings

## Manual Device Targets

- [x] Android Pixel 8 emulator created: `FlagArcade_Pixel_8_API_36`
- [x] Android Pixel 8 emulator APK install/smoke tested
- [x] iPhone 17 simulator build/install/launch/screenshot tested
- [ ] Physical iPhone test
- [ ] Physical Android test
- [ ] Small-screen iPhone simulator test
- [ ] Large-screen Android test

## Known Launch Risks

- iOS command-line tooling in this environment cannot tap through screens, so final iOS interaction QA needs either manual simulator use, XCUITest, or a physical device.
- First-run Journey onboarding intentionally asks for character and flag selection on fresh installs before showing the map.
- Store submission cannot be considered complete until signed release builds, store screenshots, privacy forms, and internal test tracks are verified.
