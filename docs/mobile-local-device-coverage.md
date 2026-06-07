# Mobile Local Device Coverage

Last updated: 2026-06-07

Use this checklist before signed store builds are available. It is a local simulator/emulator pass only; it does not replace TestFlight, Google Play internal testing, physical-device review, or the release evidence required by `docs/mobile-installed-build-qa.md`.

## Required Targets

| Platform | Target | Purpose | Evidence |
| --- | --- | --- | --- |
| iOS | iPhone SE or smallest available iPhone simulator | Small-screen layout pressure, keyboard, safe areas | Screenshot or clip for game modes and results/share UI |
| iOS | Latest available iPhone simulator | Current iOS shell, status bar, splash, portrait lock | Screenshot or clip for launch and one gameplay flow |
| Android | Pixel 8 emulator: `FlagArcade_Pixel_8_API_36` | Baseline Android phone coverage and native back | Screenshot or clip for each game mode and back behavior |
| Android | Large Android emulator or device | Large-phone scaling, touch target spacing, result pages | Screenshot or clip for game modes and results/share UI |

## Required Game Mode Pass

Run each item on both iOS simulator and Android emulator unless the row says Android-only.

| Area | Minimum Local Check |
| --- | --- |
| Game Modes | Landing page loads, each mode tile is reachable, and header/footer controls fit |
| Journey Mode | Fresh onboarding can select character and favorite flag, then enter a level |
| Perfect Passport | Complete one run, verify answer reveal, manual next, auto advance toggle, results, copy link, and native share entry point |
| Flag Jeopardy Easy | Start Easy mode and answer one pick-name and one pick-flag prompt |
| Flag Jeopardy Type | Type one correct and one incorrect answer, verifying the keyboard does not cover the input |
| Arcade Mode | Start a custom quiz and answer several prompts |
| Around the World | Start a run and answer flags from at least two continents |
| Flag Runner | Start, jump, collect a correct flag, collide with a wrong flag, and restart |
| Native back | Android-only: from each game screen, system back returns to Game Modes; from Game Modes, system back exits |
| Offline launch | Relaunch once with network disabled after a successful online launch |
| Poor network | Gameplay remains usable while sync/analytics may fail silently |

## Evidence Notes

- Store local screenshots or clips under `docs/release-evidence/local-device/` if you want repo-relative evidence paths.
- Name files with platform, target, route, and date, for example `android-pixel-8-perfect-passport-2026-06-07.png`.
- Copy the strongest evidence paths into the final generated release evidence file once TestFlight and Play internal testing are ready.
- Any failure found here should be fixed before creating signed release builds, even though this local checklist is not the final store gate.

