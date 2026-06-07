# Mobile Data Deletion And Retention Runbook

Last updated: 2026-06-07

This runbook documents how Flag Arcade handles account deletion requests, cloud data deletion, and analytics retention for iOS, Android, and web.

## User-Facing Entry Points

- Signed-in users can initiate deletion from the in-app account menu via `Delete Account`.
- Users can also email `support@flagarcade.com` from the Support page or store listings.
- The deletion request should include the email address used for Google or Apple sign-in. The in-app mail link pre-fills the Supabase user id when available.

## Data Covered

- Supabase Auth identity.
- `profiles` row.
- `user_progress` cloud sync row.
- `leaderboard_scores` and `leaderboard_monthly` rows.
- `play_sessions` analytics rows linked to the user id or known anonymous device id.
- Local-only device data remains on the user's device until they uninstall the app, clear app/browser storage, or reset local data.

## Retention Policy

- Account deletion requests should be completed within 30 days of verification.
- Supabase Auth, profile, progress, and leaderboard rows should be deleted when the request is processed.
- Analytics rows linked to the deleted user id should be deleted or anonymized during processing.
- Anonymous aggregate analytics not linked to an identified user may be retained for product reliability and aggregate usage analysis.
- Support correspondence may be retained only as needed for operational, legal, or abuse-prevention purposes.

## Manual Deletion Procedure

1. Verify the requester controls the account email or is signed in and includes their Supabase user id.
2. Find the Supabase Auth user by email or id.
3. Record the user id and any known `fa_device_id` supplied by the user.
4. Delete or anonymize analytics rows:

```sql
delete from public.play_sessions where user_id = '<user-id>';
-- If the user provides a device id:
delete from public.play_sessions where device_id = '<fa-device-id>';
```

5. Delete the auth user through the Supabase dashboard or Admin API. Schema cascades should remove:

```text
auth.users -> public.profiles -> public.user_progress
auth.users -> public.profiles -> public.leaderboard_scores
auth.users -> public.profiles -> public.leaderboard_monthly
```

6. Confirm the user no longer appears in Auth, `profiles`, `user_progress`, `leaderboard_scores`, or `leaderboard_monthly`.
7. Reply to the requester confirming completion and reminding them to uninstall or clear app storage to remove local-only device data.

## Verification Queries

Run after deletion with the relevant user id:

```sql
select id from public.profiles where id = '<user-id>';
select id from public.user_progress where id = '<user-id>';
select id from public.leaderboard_scores where user_id = '<user-id>';
select id from public.leaderboard_monthly where user_id = '<user-id>';
select id from public.play_sessions where user_id = '<user-id>';
```

Each query should return zero rows.

## Store Review Notes

- In-app deletion initiation exists in the account menu for signed-in users.
- Deletion is handled through a support-assisted flow because removing Supabase Auth users requires privileged server-side access.
- The Privacy Policy and Support page point users to `support@flagarcade.com` for privacy and deletion requests.
