# Mobile Installed Build QA

Last updated: 2026-06-07

Use this checklist for TestFlight and Google Play internal testing builds. Do not mark the launch checklist's installed-build smoke tests complete until every required row below has been run on the submitted build or a build with the same commit and signing configuration.

For launch signoff, run `npm run mobile:evidence:init -- --build 1 --owner "Release Owner"` and fill the generated `docs/release-evidence/` file with the exact build ids, the prefilled artifact manifest path, devices, screenshots or clips, store-console statuses, failures, and final approval. Then run `npm run mobile:evidence:check -- --file docs/release-evidence/<release-file>.md` before final store review submission.

## Store Build ID Confirmation

Before any smoke test, confirm the installed app came from the uploaded store build, not a local debug build.

| Platform | Store build id to record | Where to confirm | Required evidence field |
| --- | --- | --- | --- |
| iOS | App Store Connect / TestFlight build number | TestFlight build details and installed app build | Build Artifacts `Artifact`, Installed Build Matrix `App build shown` |
| Android | Google Play internal test release name and version code | Play Console internal testing release and installed app info | Build Artifacts `Artifact`, Installed Build Matrix `App build shown` |

If the installed build id does not match the release candidate's `Build number / version code`, stop QA, upload the correct build, and restart the evidence file for the correct release candidate.

## Test Matrix

| Platform | Build source | Device | OS version | Tester | Date | Result |
| --- | --- | --- | --- | --- | --- | --- |
| iOS | TestFlight | Physical iPhone |  |  |  | Not run |
| iOS | TestFlight | Small-screen iPhone simulator or device |  |  |  | Not run |
| Android | Play internal test | Physical Android phone |  |  |  | Not run |
| Android | Play internal test | Large Android emulator or device |  |  |  | Not run |

The `App build shown` value copied into release evidence must match the release candidate's `Build number / version code`.

## Required Smoke Tests

Run these on both iOS and Android.

| Area | Steps | Expected | iOS | Android |
| --- | --- | --- | --- | --- |
| Fresh launch | Install app, launch from home screen | Splash appears without cropping, app opens to onboarding or game modes | Not run | Not run |
| Home screen icon | Review icon on light and dark wallpaper | Icon is recognizable, not cropped, no transparent edge artifacts | Not run | Not run |
| Orientation | Rotate device during home and gameplay | App remains portrait and UI does not break | Not run | Not run |
| Journey Mode | Complete first-run character and favorite flag flow, enter a level, answer at least one question | Onboarding state persists after relaunch | Not run | Not run |
| Perfect Passport | Play one full 10-question run with reroll and manual next question | Results page appears, score/link UI fits on screen | Not run | Not run |
| Perfect Passport share | Tap native share and copy link on results | Native share sheet opens, copied URL is a public `https://flagarcade.com` challenge link | Not run | Not run |
| Flag Jeopardy Easy | Start Easy mode, answer one pick-name and one pick-flag question | Four options render, answer state and scoring work | Not run | Not run |
| Flag Jeopardy Type | Start Type mode, type a correct and incorrect answer | Keyboard does not cover input, submission and feedback work | Not run | Not run |
| Arcade Mode | Start a custom quiz and answer several questions | Buttons are tappable, score/progress updates | Not run | Not run |
| Around the World | Start a run and answer flags across at least two continents | Map/flag UI fits and progress advances | Not run | Not run |
| Flag Runner | Start a run, jump, collect a correct flag, hit a wrong flag | Touch controls respond, game over/restart works | Not run | Not run |
| Native back | Android only: enter each game mode and press system back | Returns to Game Modes first, exits app from Game Modes | N/A | Not run |
| Auth callback | Sign in with Google or Apple, return through `com.flagarcade.app://auth/callback` | Browser closes, app session updates, no stuck blank screen | Not run | Not run |
| Offline launch | Enable airplane mode and relaunch after one successful online launch | App opens cached content and does not crash | Not run | Not run |
| Poor network | Throttle or use weak network during gameplay | Gameplay remains usable; failed sync/analytics do not interrupt play | Not run | Not run |
| Resume/background | Background app during a run, wait, reopen | App resumes without losing visible state or freezing | Not run | Not run |
| Legal links | Open Privacy, Terms, and Support from footer/menu | Pages load and are readable on mobile | Not run | Not run |

## Store Review Notes To Confirm

- App does not request camera, microphone, photos, contacts, health, or location permissions.
- App can be used without signing in; sign-in is only needed for cloud sync/leaderboard features.
- Privacy policy URL is reachable at `https://flagarcade.com/privacy`.
- Support URL is reachable at `https://flagarcade.com/support`.
- Perfect Passport share links use public web URLs, not localhost or custom app schemes.

## Failure Log

| Date | Platform | Build | Issue | Severity | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
