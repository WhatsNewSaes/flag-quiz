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
- Privacy/data-safety source doc: `docs/mobile-privacy-data-inventory.md`
- Store privacy form answer guide: `docs/mobile-store-privacy-form-answers.md`
- Data deletion runbook: `docs/mobile-data-deletion-runbook.md`

## App Store Connect

Copy:

- Subtitle: see `docs/mobile-store-metadata.md`
- Promotional text: see `docs/mobile-store-metadata.md`
- Description: see `docs/mobile-store-metadata.md`
- Keywords: see `docs/mobile-store-metadata.md`
- Age rating notes: see `docs/mobile-store-metadata.md`
- Privacy labels: see `docs/mobile-store-privacy-form-answers.md`

Assets:

- App icon source: `store-assets/shared/app-icon-1024.png`
- 6.7-inch iPhone screenshots:
  - `store-assets/app-store/iphone-6-7/01-game-modes.png`
  - `store-assets/app-store/iphone-6-7/02-perfect-passport.png`
  - `store-assets/app-store/iphone-6-7/03-share-score.png`
  - `store-assets/app-store/iphone-6-7/04-journey-mode.png`
  - `store-assets/app-store/iphone-6-7/05-flag-jeopardy.png`
  - `store-assets/app-store/iphone-6-7/06-flag-runner.png`

Build artifact:

- Required before upload: signed iOS archive from Xcode Organizer / Transporter.
- Local unsigned verification command: `npm run mobile:build:ios:debug`.

External tasks:

- Confirm Apple Developer team ID and signing profile.
- Upload signed archive to TestFlight.
- Complete App Privacy using `docs/mobile-store-privacy-form-answers.md`, and verify it against `docs/mobile-privacy-data-inventory.md`.
- Run TestFlight smoke test on an installed build.

## Google Play Console

Copy:

- Short description: see `docs/mobile-store-metadata.md`
- Full description: see `docs/mobile-store-metadata.md`
- Category/rating notes: see `docs/mobile-store-metadata.md`
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
- Upload signed AAB to an internal testing track.
- Complete Data Safety using `docs/mobile-store-privacy-form-answers.md`, and verify it against `docs/mobile-privacy-data-inventory.md`.
- Run Google Play pre-launch report.
- Run internal test smoke test on an installed build.

## Final Local Preflight

Run before creating signed store builds:

```bash
npm run typecheck:all
npm run build:store-assets
npm run mobile:audit
npm run build
npx cap sync
npm run package:store-submission
npm run mobile:build:android:debug
npm run mobile:build:ios:debug
```

Expected current local result: all commands pass. Signed release uploads still require developer account credentials and store-console access.
