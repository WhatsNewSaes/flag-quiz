# Mobile Release Runbook

Last updated: 2026-06-07

This runbook covers the repeatable release path for the Capacitor mobile apps. It intentionally avoids committing signing secrets.

## 1. Preflight

Run these from the repo root:

```bash
npm run mobile:preflight
```

That command runs:

```bash
npm run typecheck:all
npm run build:store-assets
npm run mobile:signing:preflight
npm run mobile:version:check
npm run mobile:privacy:check
npm run mobile:store:check
npm run mobile:qa:plan
npm run mobile:devices:check
npm run mobile:evidence:self-test
npm run mobile:audit
npm run build
npx cap sync
npm run mobile:bundle:check
npm run mobile:readiness
npm run mobile:blockers:check
npm run package:store-submission
npm run mobile:handoff:check
```

Expected current result: all commands pass locally.

Android npm scripts use `$JAVA_HOME` when present and fall back to `/opt/homebrew/opt/openjdk@21`, which is the verified local JDK path for this workspace.

The first iOS release is targeted to iPhone only. Do not add iPad screenshots unless the Xcode target is changed back to universal support.

`npm run mobile:readiness` writes `dist/mobile-readiness-report.md` and `dist/mobile-launch-blockers.md`. The blocker report is generated from unchecked items in `docs/mobile-launch-checklist.md` and is included in the store handoff package.

`npm run mobile:blockers:check` verifies that `dist/mobile-launch-blockers.md` still matches the unchecked launch checklist items and required closeout criteria.

GitHub Actions also runs the unsigned mobile preflight on `main`, pull requests, and manual dispatch through `.github/workflows/mobile-preflight.yml`. The workflow uploads the generated store submission package as an artifact; signed store builds still require local/store-console credentials.

`npm run mobile:bundle:check` runs after `npx cap sync` and rejects OS metadata files such as `.DS_Store` in web, Android, or iOS bundled assets.

`npm run mobile:signing:preflight` is expected to warn until Android signing secrets and the Apple Developer Team are configured locally. It should not fail unless a repo safety invariant or filled signing config is broken.

Run `npm run mobile:version:check` after any release version bump to confirm `package.json`, Android Gradle, iOS project settings, store metadata, and the submission handoff all agree.

Before submitting store forms, run `npm run mobile:privacy:check` to verify Android permissions, backup/data extraction rules, FileProvider scope, iOS usage keys, iOS tracking declarations, and privacy documentation alignment. Run `npm run mobile:store:check` to verify listing copy, store text limits, asset dimensions, privacy references, and handoff paths. Run `npm run mobile:qa:plan` to verify the installed-build QA checklist still covers the required devices, game modes, native behaviors, and evidence flow. Run `npm run mobile:devices:check` to verify the local simulator/emulator coverage plan still covers small-screen iPhone, latest iPhone, Pixel 8 Android, large Android, every game mode, native back, offline launch, poor network, and evidence capture notes. Then run `npm run mobile:urls:check` to verify the public marketing, privacy, terms, and support URLs are live. The URL check uses the production site and is intentionally separate from the local preflight.

`npm run mobile:evidence:self-test` exercises the release evidence checker against a complete synthetic signoff file and negative cases for stale commits, missing repo-relative evidence files, and weak final signoff values. It is included in `npm run mobile:preflight` so CI catches regressions in the final evidence gate before a real release evidence file exists.

Confirm privacy and store form answers against `docs/mobile-privacy-data-inventory.md` before uploading builds.

The native projects explicitly disable Android cleartext traffic and set iOS `ITSAppUsesNonExemptEncryption=false` for standard HTTPS/platform encryption only. Revisit both declarations before submission if a future SDK adds custom cryptography, ad attribution, or plain-HTTP endpoints.

Use `docs/mobile-store-submission-package.md` as the final handoff manifest for upload paths, listing copy, privacy answers, and external store-console tasks.

Use `docs/mobile-local-device-coverage.md` before signed builds are available to keep simulator/emulator QA consistent. This local pass is useful for catching layout and native shell issues early, but launch signoff still requires the installed-build evidence generated from TestFlight and Google Play internal testing.

`npm run package:store-submission` runs `npm run mobile:handoff:check` after creating the ZIP. Run that checker directly any time you need to verify an existing `dist/mobile-store-submission/manifest.json` and `dist/flag-arcade-mobile-store-submission.zip`.

Create a release evidence file before uploading store builds, then keep it updated through TestFlight, Play internal testing, and final signoff:

```bash
npm run mobile:evidence:init -- --build 1 --owner "Release Owner"
```

The generated file is written to `docs/release-evidence/` with the current version, build, branch, and git commit prefilled.

After TestFlight, Play internal testing, and store-console evidence are filled, verify the signoff file:

```bash
npm run mobile:evidence:check -- --file docs/release-evidence/<release-file>.md
```

As the final local gate before submitting for App Store and Google Play review, run it with the signed artifact paths:

```bash
npm run mobile:go-live:check -- --evidence docs/release-evidence/<release-file>.md --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive
```

For evidence-only review when the signed builds have already been uploaded and are not available locally, make the skip explicit:

```bash
npm run mobile:go-live:check -- --evidence docs/release-evidence/<release-file>.md --skip-artifacts
```

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

Check signing readiness:

```bash
npm run mobile:signing:preflight
```

Build the Play upload artifact:

```bash
npm run mobile:build:android:release
```

Expected output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

After the iOS archive is created, verify both signed release artifact paths:

```bash
npm run mobile:artifacts:check -- --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive --manifest docs/release-evidence/mobile-<version>-build-<build>-<commit>-artifacts.json
```

This checks bundle/archive structure, version metadata, Android AAB signing metadata, the archived iOS app's code-signature resources, embedded provisioning profile, and `codesign --verify`. It also writes a JSON artifact manifest with byte counts and SHA-256 hashes; paste that manifest path into the release evidence file's `Artifact manifest` field.

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

Use `docs/mobile-installed-build-qa.md` as the pass/fail checklist for TestFlight and Google Play internal testing.

Before starting installed-build QA, run:

```bash
npm run mobile:qa:plan
```

Record the actual devices, build ids, pass/fail results, and evidence links in the generated `docs/release-evidence/` file.

Do not submit for final review until the generated evidence file passes `npm run mobile:evidence:check` and the complete release passes `npm run mobile:go-live:check`.

- Install the Android internal test build and tap through all six game modes.
- Install the TestFlight build and tap through all six game modes.
- Verify Perfect Passport copy link and native share on both platforms.
- Verify Android hardware/system back behavior.
- Verify auth callback/deep link on both platforms.
- Verify fresh-install Journey onboarding.
- Review icon and splash on real home screens.

## 5. Store Metadata

Use `docs/mobile-store-metadata.md` as the working copy for listing text, categories, rating notes, and screenshot planning.

Use `docs/mobile-privacy-data-inventory.md` as the working copy for App Store Privacy and Google Play Data Safety answers.

Use `docs/mobile-store-submission-package.md` as the checklist of exact upload assets and remaining external tasks.

Generate store artwork before packaging screenshots:

```bash
npm run build:store-assets
```

Remaining required external artifacts:

- App Store privacy nutrition labels.
- Google Play Data Safety form.
- App Store screenshots.
- Google Play screenshots.
- Signed Android AAB.
- Signed iOS archive.
