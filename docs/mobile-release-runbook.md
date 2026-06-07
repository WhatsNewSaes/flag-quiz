# Mobile Release Runbook

Last updated: 2026-06-07

This runbook covers the repeatable release path for the Capacitor mobile apps. It intentionally avoids committing signing secrets.

## 1. Preflight

Run these from the repo root:

```bash
npm run typecheck:all
npm run mobile:audit
npm run build
npx cap sync
```

Expected current result: all commands pass locally.

Android npm scripts use `$JAVA_HOME` when present and fall back to `/opt/homebrew/opt/openjdk@21`, which is the verified local JDK path for this workspace.

## 2. Android Release AAB

Create an upload keystore once and store it outside git:

```bash
cd android
keytool -genkeypair -v \
  -keystore flag-arcade-upload.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias flag-arcade-upload
```

Copy the template:

```bash
cp android/keystore.properties.example android/keystore.properties
```

Fill in the passwords and keystore file name in `android/keystore.properties`.

Build the Play upload artifact:

```bash
npm run mobile:build:android:release
```

Expected output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Upload that AAB to a Google Play internal testing track before production.

## 3. iOS Archive

Confirm the Apple Developer team and signing profile in Xcode:

```bash
npm run cap:ios
```

Archive from Xcode using `Product > Archive`, then upload to App Store Connect from Organizer.

Command-line archive once signing is configured:

```bash
npm run build
npx cap sync ios
xcodebuild archive \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath ios/App/build/FlagArcade.xcarchive
```

Upload to TestFlight before App Store review.

## 4. Manual QA Before Store Upload

- Install the Android internal test build and tap through all six game modes.
- Install the TestFlight build and tap through all six game modes.
- Verify Perfect Passport copy link and native share on both platforms.
- Verify Android hardware/system back behavior.
- Verify auth callback/deep link on both platforms.
- Verify fresh-install Journey onboarding.
- Review icon and splash on real home screens.

## 5. Store Metadata

Use `docs/mobile-store-metadata.md` as the working copy for listing text, categories, rating notes, and screenshot planning.

Remaining required external artifacts:

- Privacy policy URL.
- App Store privacy nutrition labels.
- Google Play Data Safety form.
- App Store screenshots.
- Google Play screenshots.
- Signed Android AAB.
- Signed iOS archive.
