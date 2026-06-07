# Mobile Store Account Handoff

Last updated: 2026-06-07

Use this as the non-secret handoff sheet for final App Store Connect and Google Play Console setup. Do not add passwords, app-specific passwords, private keys, certificates, provisioning profile files, keystores, recovery codes, or personal access tokens to this file.

## Shared

- Release owner:
- Copyright holder:
- Support contact: `support@flagarcade.com`
- Public site: `https://flagarcade.com`
- Bundle ID / package name: `com.flagarcade.app`
- Public version: `1.0`
- Build number / Android version code: `1`

## Apple Developer / App Store Connect

- Apple Developer account holder:
- Apple Developer Team ID:
- App Store Connect app record:
- Bundle identifier owner confirmed:
- Signing style: Automatic signing in Xcode project; confirm final Team ID before archive.
- Distribution certificate type: Apple Distribution.
- Provisioning profile type: App Store distribution.
- Required access before upload: App Manager or Admin access in App Store Connect.
- Signed archive command after signing is configured: `npm run mobile:build:ios:archive`
- Expected archive path: `ios/App/build/FlagArcade.xcarchive`
- Upload target: TestFlight, then App Store review.

## Google Play Console

- Google Play developer account holder:
- Google Play package name: `com.flagarcade.app`
- Upload key owner:
- Keystore properties path: `android/keystore.properties` (gitignored)
- Keystore file path:
- Release command after signing is configured: `npm run mobile:build:android:release`
- Expected AAB path: `android/app/build/outputs/bundle/release/app-release.aab`
- Upload target: Internal testing, then production review.

## Final Confirmation

- [ ] Apple Developer Team ID is configured locally or selected in Xcode.
- [ ] Android upload keystore is configured locally and outside git.
- [ ] Copyright holder is final.
- [ ] App Store Connect app record matches `com.flagarcade.app`.
- [ ] Google Play Console app record matches `com.flagarcade.app`.
- [ ] Store roles are sufficient to upload builds and submit privacy/store forms.
