# Mobile Privacy Data Inventory

Last updated: 2026-06-07

Use this as the source of truth when filling out App Store Connect privacy nutrition labels and the Google Play Data Safety form. It describes what the current web, iOS, and Android app code collects or stores.

## Summary

- The app does not request precise location, approximate location, contacts, photos, camera, microphone, health, fitness, calendars, reminders, or payment permissions.
- The Android app currently requests only `android.permission.INTERNET`.
- The iOS app declares the local preferences API in `PrivacyInfo.xcprivacy` because Capacitor/WebKit and the app use persistent local storage for settings and progress.
- The app does not sell data and does not use collected data for third-party advertising or cross-app tracking.
- Data is sent over HTTPS to hosted service providers for auth, sync, analytics, hosting, and distribution.

## Data Collected Or Stored

| Data | Where it comes from | Linked to user | Shared outside app | Purpose |
| --- | --- | --- | --- | --- |
| Email address | Google or Apple sign-in through Supabase Auth | Yes, when signed in | Service providers only | Account sign-in and account recovery |
| User ID | Supabase Auth user id | Yes, when signed in | Service providers only | Auth, cloud sync, analytics attribution, leaderboard rank |
| Display name/avatar | OAuth profile or optional in-app display name | Yes, when signed in or if the player sets it locally | Service providers only when used for leaderboard/profile features | Leaderboards and profile display |
| Gameplay progress | Journey progress, stars, achievements, onboarding state | Yes when signed in; otherwise local device only | Service providers only when sync is enabled | App functionality and cross-device sync |
| Gameplay scores | Leaderboard scores, mode, score metadata, achieved date | Yes when signed in | Service providers only | Leaderboards and competition features |
| Gameplay settings | Selected character, favorite flag, quiz settings, mode filters | Yes when signed in; otherwise local device only | Service providers only when sync is enabled | App functionality and personalization |
| Anonymous device id | Generated `fa_device_id` in local storage | No unless a player later signs in and analytics also include user id | Service providers only | Usage analytics and unique player counts |
| Product interaction analytics | Mode/session start and end, platform, timestamps, duration, score, correct count, total count, metadata | Linked when signed in; otherwise linked only to anonymous device id | Service providers only | Analytics, reliability, feature usage, gameplay balancing |

## Data Not Collected

- Precise or approximate location
- Contacts
- Photos or videos
- Camera or microphone input
- Health or fitness data
- Payment information
- Advertising ID
- Browsing history outside Flag Arcade
- User messages or private communications

## App Store Connect Privacy Labels Draft

Suggested App Privacy selections:

| App Store category | Data type | Usage |
| --- | --- | --- |
| Contact Info | Email Address | App Functionality |
| Identifiers | User ID | App Functionality, Analytics |
| Identifiers | Device ID | Analytics; not used for tracking |
| Usage Data | Product Interaction | App Functionality, Analytics |
| User Content | Other User Content | App Functionality for player settings/progress/profile fields |

Suggested answers:

- Data linked to the user: Email address, user ID, product interaction when signed in, gameplay/progress/profile content when signed in.
- Data not linked to the user: Anonymous device id for analytics before sign-in.
- Tracking: No.
- Third-party advertising: No.
- Data used for credit, lending, employment, housing, insurance, or eligibility decisions: No.

## Google Play Data Safety Draft

Suggested Data Safety answers:

| Google category | Data type | Collected | Shared | Purpose | Optional |
| --- | --- | --- | --- | --- | --- |
| Personal info | Email address, name | Yes, only for signed-in users | No sale; processed by service providers | Account management, app functionality | Yes, sign-in is optional |
| App activity | App interactions, in-app search/filter settings, gameplay sessions | Yes | No sale; processed by service providers | Analytics, app functionality | No for analytics when enabled |
| App info and performance | Diagnostics/reliability events if added by platform providers | Limited to platform/service provider processing | No sale; processed by service providers | Reliability | N/A |
| Device or other IDs | App-generated anonymous device id | Yes | No sale; processed by service providers | Analytics | No when analytics is enabled |

Suggested form statements:

- Data is encrypted in transit.
- Users can request account/data deletion from the in-app account menu or through `support@flagarcade.com`.
- The app does not share data for advertising and does not sell data.
- Sign-in is optional, but cloud sync and leaderboards require account data.

## Retention And Deletion

Current implementation keeps local progress/settings on the player's device until the app is cleared, uninstalled, or the user resets local app data. Cloud progress, auth identity, leaderboard records, and user-linked analytics are deleted through the process in `docs/mobile-data-deletion-runbook.md`.

Deletion requests should be completed within 30 days of verification. Anonymous aggregate analytics not linked to an identified user may be retained for product reliability and aggregate usage analysis.
