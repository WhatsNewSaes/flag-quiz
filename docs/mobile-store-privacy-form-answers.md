# Mobile Store Privacy Form Answers

Last updated: 2026-06-07

Use this as the fill-in guide for App Store Connect App Privacy and Google Play Console Data Safety. Keep `docs/mobile-privacy-data-inventory.md` as the source of truth; this file turns that inventory into console-ready selections.

Official references checked:

- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Google Play Data Safety: https://support.google.com/googleplay/android-developer/answer/10787469

## Shared Answers

- App collects user data: Yes, when the player signs in or when gameplay analytics are recorded.
- Sign-in required to use the app: No.
- Sign-in required for cloud sync and leaderboards: Yes.
- Data encrypted in transit: Yes.
- Data sold: No.
- Data shared for advertising: No.
- Cross-app tracking: No.
- Precise location collected: No.
- Approximate location collected: No.
- Contacts collected: No.
- Photos, videos, camera, or microphone collected: No.
- Health, fitness, payment, calendar, or messages collected: No.
- User deletion path: In-app account menu `Delete Account`, plus `support@flagarcade.com`.
- Deletion timing: within 30 days after request verification.
- Anonymous aggregate analytics retention: May be retained when not linked to an identified user.

## App Store Connect App Privacy

Tracking:

- Does this app track users across apps and websites owned by other companies? No.
- Uses third-party advertising? No.
- Uses data broker sharing? No.

Data linked to the user:

| Category | Data type | Collected | Purpose | Notes |
| --- | --- | --- | --- | --- |
| Contact Info | Email Address | Yes, signed-in users only | App Functionality | Supabase Auth account sign-in and recovery |
| Identifiers | User ID | Yes, signed-in users only | App Functionality, Analytics | Supabase Auth user id and cloud sync attribution |
| Usage Data | Product Interaction | Yes | App Functionality, Analytics | Mode/session starts and ends, score metadata, duration, correct/total counts |
| User Content | Other User Content | Yes | App Functionality | Player progress, achievements, favorite flag, profile/display fields, leaderboard score records |

Data not linked to the user:

| Category | Data type | Collected | Purpose | Notes |
| --- | --- | --- | --- | --- |
| Identifiers | Device ID | Yes | Analytics | App-generated anonymous `fa_device_id`, not advertising ID and not used for tracking |
| Usage Data | Product Interaction | Yes | Analytics | Anonymous gameplay analytics before sign-in |

Data not collected:

- Location
- Contacts
- Search History
- Browsing History
- Purchases
- Financial Info
- Sensitive Info
- Health and Fitness
- Diagnostics, unless platform/service-provider diagnostics are later enabled and the privacy inventory is updated

## Google Play Data Safety

Top-level answers:

- Does your app collect or share any of the required user data types? Yes.
- Is all user data collected by your app encrypted in transit? Yes.
- Do you provide a way for users to request that their data is deleted? Yes.
- Is all collected data required, or can users choose whether it is collected? Sign-in data is optional because sign-in is optional; gameplay analytics are collected for app functionality and analytics when enabled.
- Does the app share user data with third parties? No sale or advertising sharing. Service providers process data for app functionality, analytics, auth, hosting, database, and distribution.

Data types:

| Google category | Data type | Collected | Shared | Purpose | Optional |
| --- | --- | --- | --- | --- | --- |
| Personal info | Email address | Yes, signed-in users only | Service providers only | Account management, app functionality | Yes |
| Personal info | Name | Yes, if provided by OAuth/profile | Service providers only | Account management, profile/leaderboard display | Yes |
| App activity | App interactions | Yes | Service providers only | Analytics, app functionality | No when analytics is enabled |
| App activity | Other user-generated content | Yes, signed-in progress/profile/leaderboard data | Service providers only | App functionality, cloud sync, leaderboards | Yes for sign-in-only features |
| Device or other IDs | App-generated anonymous device id | Yes | Service providers only | Analytics, unique player counts | No when analytics is enabled |

Security practices:

- Data encrypted in transit: Yes.
- Users can request deletion: Yes, in-app `Delete Account` or email `support@flagarcade.com`.
- Committed deletion window: within 30 days after verification.
- Android local app data backup/transfer: disabled through the app manifest and data extraction rules.
- App independently security reviewed: No, unless a review is later completed.

Children and families:

- Target audience: General audience learning/trivia game.
- Intended for children under 13: No.
- Ads or ad SDKs directed to children: No.

## Review Before Submission

Before submitting either store form:

- Confirm no new SDKs were added after this date.
- Confirm analytics events still match `src/lib/analytics.ts` and `src/hooks/useSessionTracking.ts`.
- Confirm Android permissions still only include `android.permission.INTERNET`.
- Confirm Android Auto Backup/device transfer remains disabled for local app data.
- Confirm iOS `PrivacyInfo.xcprivacy` still declares tracking as false and lists the local storage accessed API reason.
- Confirm the public Privacy Policy at `https://flagarcade.com/privacy` includes account deletion and retention language.
