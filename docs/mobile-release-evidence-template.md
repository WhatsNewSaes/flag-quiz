# Mobile Release Evidence Template

Last updated: 2026-06-07

Copy this file for each release candidate, for example `docs/release-evidence/mobile-1.0-build-1.md`. Do not mark the launch checklist's installed-build smoke tests complete until this evidence is filled for both platforms.

Use `YYYY-MM-DD` for Evidence date, Upload date, installed-build Date, Failure Log Date, and Approval date. Release evidence dates must be today or earlier; future-dated evidence is rejected.

## Release Candidate

- App version:
- Build number / version code:
- Git commit:
- Release branch:
- Evidence owner:
- Evidence date:
- Public site URL verified:
- Privacy URL verified:
- Terms URL verified:
- Support URL verified:
- Artifact manifest:

The artifact manifest must be the JSON file written by `npm run mobile:artifacts:check -- --manifest ...`. Local manifest paths are parsed by `npm run mobile:evidence:check` and must match this release candidate's commit, version, and build number.

## Build Artifacts

| Platform | Store channel | Artifact | Uploaded by | Upload date | Processing status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| iOS | TestFlight | `.xcarchive` / App Store Connect build id |  |  | Not uploaded |  |
| Android | Play internal test | `android/app/build/outputs/bundle/release/app-release.aab` |  |  | Not uploaded |  |

## Signing Evidence

| Platform | Signing identity | Team/account id | Profile/keystore | Verified by | Result |
| --- | --- | --- | --- | --- | --- |
| iOS |  |  | App Store distribution profile |  | Not verified |
| Android |  |  | Upload keystore outside git |  | Not verified |

## Installed Build Matrix

`App build shown` must match the release candidate's `Build number / version code`.

| Platform | Build source | Device | OS version | App build shown | Tester | Date | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iOS | TestFlight | Physical iPhone |  |  |  |  | Not run |
| iOS | TestFlight | Small-screen iPhone simulator or device |  |  |  |  | Not run |
| Android | Play internal test | Physical Android phone |  |  |  |  | Not run |
| Android | Play internal test | Large Android emulator or device |  |  |  |  | Not run |

## Required Smoke Evidence

Record `Pass`, `Fail`, or `N/A`. Every required row must include an evidence URL or repo-relative evidence file path to a screenshot, clip, store-console screenshot, or QA note before `npm run mobile:evidence:check` can pass. Repo-relative evidence file paths must exist.

| Area | iOS result | Android result | Evidence file/link | Notes |
| --- | --- | --- | --- | --- |
| Fresh launch and splash | Not run | Not run |  |  |
| Home screen icon on light/dark wallpaper | Not run | Not run |  |  |
| Portrait orientation lock | Not run | Not run |  |  |
| Journey Mode first-run character/favorite flag flow | Not run | Not run |  |  |
| Journey Mode level play and progress persistence | Not run | Not run |  |  |
| Perfect Passport full 10-question run | Not run | Not run |  |  |
| Perfect Passport share sheet | Not run | Not run |  |  |
| Perfect Passport copied public challenge link | Not run | Not run |  |  |
| Flag Jeopardy Easy mode, pick name and pick flag | Not run | Not run |  |  |
| Flag Jeopardy Type mode, keyboard and answer submit | Not run | Not run |  |  |
| Arcade Mode custom quiz | Not run | Not run |  |  |
| Around the World map/tap flow | Not run | Not run |  |  |
| Flag Runner touch controls and restart | Not run | Not run |  |  |
| Android native back behavior | N/A | Not run |  |  |
| Auth callback/deep link | Not run | Not run |  |  |
| Offline launch | Not run | Not run |  |  |
| Poor-network gameplay | Not run | Not run |  |  |
| Resume/background state | Not run | Not run |  |  |
| Privacy, Terms, and Support links | Not run | Not run |  |  |

## Store Console Evidence

| Store | Area | Status | Evidence file/link | Notes |
| --- | --- | --- | --- | --- |
| App Store Connect | App information | Not complete |  |  |
| App Store Connect | Pricing/availability | Not complete |  |  |
| App Store Connect | Age rating | Not complete |  |  |
| App Store Connect | App Privacy labels | Not complete |  | Use `docs/mobile-store-privacy-form-answers.md` |
| App Store Connect | TestFlight build processing | Not complete |  |  |
| Google Play Console | Store listing | Not complete |  |  |
| Google Play Console | Content rating | Not complete |  |  |
| Google Play Console | Data Safety | Not complete |  | Use `docs/mobile-store-privacy-form-answers.md` |
| Google Play Console | Internal testing track | Not complete |  |  |
| Google Play Console | Pre-launch report | Not complete |  |  |

## Failure Log

Leave the blank row empty if there were no failures. Every non-empty failure row must use Severity `Critical`, `High`, `Medium`, or `Low`, include an owner and fix commit or no-code-change reference, and end with Retest result `Pass`.

| Date | Platform | Device | Area | Issue | Severity | Owner | Fix commit | Retest result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |

## Final Signoff

Do not sign off while any required row above is `Not run`, `Fail`, `Not uploaded`, `Not verified`, or `Not complete`. Use `YYYY-MM-DD` for Approval date.

- iOS installed build smoke passed:
- Android installed build smoke passed:
- Store privacy forms submitted:
- Signed release artifacts uploaded:
- Known launch risks accepted:
- Release approver:
- Approval date:
