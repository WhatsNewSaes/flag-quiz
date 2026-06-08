# Mobile Store Submission Package

Last updated: 2026-06-07

This is the handoff checklist for the exact assets, copy, URLs, and build artifacts needed in App Store Connect and Google Play Console.

Create a local handoff folder with:

```bash
npm run package:store-submission
```

Output:

- Handoff folder: `dist/mobile-store-submission/`
- Handoff archive: `dist/flag-arcade-mobile-store-submission.zip`
- Readiness report: `dist/mobile-readiness-report.md`
- Launch blocker report: `dist/mobile-launch-blockers.md`
- Handoff manifest: `dist/mobile-store-submission/manifest.json`, including source paths, package paths, byte counts, and SHA-256 checksums for every included file.

## Shared Listing Details

- App name: `Flag Arcade`
- Bundle ID / package name: `com.flagarcade.app`
- Public version: `1.0`
- Build number / Android version code: `1`
- Category: Games / Educational / Trivia
- Marketing URL: `https://flagarcade.com`
- Support URL: `https://flagarcade.com/support`
- Privacy Policy URL: `https://flagarcade.com/privacy`
- Terms URL: `https://flagarcade.com/terms`
- Source metadata doc: `docs/mobile-store-metadata.md`
- Store account handoff: `docs/mobile-store-account-handoff.md`
- Release runbook: `docs/mobile-release-runbook.md`
- Privacy/data-safety source doc: `docs/mobile-privacy-data-inventory.md`
- Store privacy form answer guide: `docs/mobile-store-privacy-form-answers.md`
- Data deletion runbook: `docs/mobile-data-deletion-runbook.md`
- Android cleartext traffic: disabled.
- iOS export compliance: `ITSAppUsesNonExemptEncryption=false` for standard HTTPS/platform encryption only.

## App Store Connect

Copy:

- Subtitle: see `docs/mobile-store-metadata.md`
- Promotional text: see `docs/mobile-store-metadata.md`
- Description: see `docs/mobile-store-metadata.md`
- Keywords: see `docs/mobile-store-metadata.md`
- Age rating notes: see `docs/mobile-store-metadata.md`
- App Review notes: see `docs/mobile-store-metadata.md`
- Privacy labels: see `docs/mobile-store-privacy-form-answers.md`

Assets:

- App icon source: `store-assets/shared/app-icon-1024.png`
- iOS device family: iPhone-only for the first release.
- 6.7-inch iPhone screenshots:
  - `store-assets/app-store/iphone-6-7/01-game-modes.png`
  - `store-assets/app-store/iphone-6-7/02-perfect-passport.png`
  - `store-assets/app-store/iphone-6-7/03-share-score.png`
  - `store-assets/app-store/iphone-6-7/04-journey-mode.png`
  - `store-assets/app-store/iphone-6-7/05-flag-jeopardy.png`
  - `store-assets/app-store/iphone-6-7/06-flag-runner.png`

Build artifact:

- Required before upload: signed iOS archive from Xcode Organizer / Transporter.
- Expected local archive path after command-line archive: `ios/App/build/FlagArcade.xcarchive`.
- Local unsigned verification command: `npm run mobile:build:ios:debug`.
- Command-line archive command after signing is configured: `npm run mobile:build:ios:archive`.

External tasks:

- Confirm Apple Developer team ID and signing profile using `docs/mobile-store-account-handoff.md`.
- Upload signed archive to TestFlight.
- Complete App Privacy using `docs/mobile-store-privacy-form-answers.md`, and verify it against `docs/mobile-privacy-data-inventory.md`.
- Run TestFlight smoke test on an installed build.

## Google Play Console

Copy:

- Short description: see `docs/mobile-store-metadata.md`
- Full description: see `docs/mobile-store-metadata.md`
- Category/rating notes: see `docs/mobile-store-metadata.md`
- Google Play testing notes: see `docs/mobile-store-metadata.md`
- Data Safety answers: see `docs/mobile-store-privacy-form-answers.md`

Assets:

- Feature graphic: `store-assets/google-play/feature-graphic.png`
- Phone screenshots:
  - `store-assets/google-play/phone-screenshots/01-game-modes.png`
  - `store-assets/google-play/phone-screenshots/02-perfect-passport.png`
  - `store-assets/google-play/phone-screenshots/03-share-score.png`
  - `store-assets/google-play/phone-screenshots/04-journey-mode.png`
  - `store-assets/google-play/phone-screenshots/05-flag-jeopardy.png`
  - `store-assets/google-play/phone-screenshots/06-flag-runner.png`

Build artifact:

- Expected signed release AAB path after signing is configured: `android/app/build/outputs/bundle/release/app-release.aab`.
- Local release command: `npm run mobile:build:android:release`.
- Keystore template: `android/keystore.properties.example`.
- Do not commit `android/keystore.properties` or keystore files.

External tasks:

- Create or confirm upload keystore.
- Confirm Google Play developer account and upload key owner using `docs/mobile-store-account-handoff.md`.
- Upload signed AAB to an internal testing track.
- Complete Data Safety using `docs/mobile-store-privacy-form-answers.md`, and verify it against `docs/mobile-privacy-data-inventory.md`.
- Run Google Play pre-launch report.
- Run internal test smoke test on an installed build.

## Final Local Preflight

Run before creating signed store builds:

```bash
npm run mobile:preflight
```

Full command sequence:

```bash
npm run typecheck:all
npm run build:store-assets
npm run mobile:signing:preflight
npm run mobile:version:check
npm run mobile:privacy:check
npm run mobile:store:check
npm run mobile:accounts:check
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
npm run mobile:build:android:debug
npm run mobile:build:ios:debug
```

Expected current local result: all commands pass. Signed release uploads still require developer account credentials and store-console access.

After packaging, use `dist/mobile-store-submission/manifest.json` as the integrity index for the handoff archive. It records the source git commit plus each included file's original repo path, archive destination, byte count, and SHA-256 checksum so the exact store assets and docs can be verified during submission.

`npm run package:store-submission` runs `npm run mobile:blockers:check` and `npm run mobile:handoff:check` automatically. Run `npm run mobile:blockers:check` again after editing `docs/mobile-launch-checklist.md`, and run `npm run mobile:handoff:check` again if the package is moved or reviewed later and you want to verify the manifest, checksums, and ZIP contents still match.

Before final store form submission, verify native privacy declarations, store metadata, local device coverage, installed-build QA coverage, and public listing URLs:

```bash
npm run mobile:evidence:self-test
npm run mobile:privacy:check
npm run mobile:store:check
npm run mobile:qa:plan
npm run mobile:devices:check
npm run mobile:signing:release
npm run mobile:urls:check
```

The evidence self-test includes negative rejection cases for stale commits, missing copyright holder, missing repo-relative evidence files, external artifact manifests, and weak final signoff values.

Before uploading signed builds, start a release evidence file:

```bash
npm run mobile:evidence:init -- --build 1 --owner "Release Owner"
```

Before final store review submission, verify the completed evidence file:

```bash
npm run mobile:build:ios:archive
npm run mobile:artifacts:check -- --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive --manifest docs/release-evidence/mobile-<version>-build-<build>-<commit>-artifacts.json
npm run mobile:evidence:check -- --file docs/release-evidence/<release-file>.md
npm run mobile:go-live:check -- --evidence docs/release-evidence/<release-file>.md --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive
```

The evidence initializer prefills the `Artifact manifest` field and leaves final account fields as `TBD`. Fill copyright holder, Apple Developer Team ID, and Google Play developer account from `docs/mobile-store-account-handoff.md` before final evidence validation. Run `npm run mobile:accounts:release` after filling the final account handoff. The evidence checker requires the artifact manifest to stay a local JSON path so it can parse and verify the manifest's commit, version, build number, and signed artifact hashes. The full go-live gate reads that same local path, runs strict store account handoff validation, runs strict release signing preflight, writes the artifact manifest before evidence validation, and then verifies the completed evidence file. If `--skip-artifacts` is used for evidence-only review, the completed evidence file must still point to a previously generated local artifact manifest.
