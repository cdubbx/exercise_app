# Spotify, S3 and release setup

## Current implementation

Spotify now connects the signed-in Exercise App account using a backend OAuth callback with random, single-use, five-minute state and PKCE. Provider tokens are encrypted in the database with a dedicated server key and never returned to the phone. A compact player in Settings and Home provides previous, play/pause and next, track/artist/artwork, an Open in Spotify link, disconnect, and a local visibility preference. Remote controls act on an existing Spotify client/device; this app does not stream audio. No active device, denied scopes, Premium/access restrictions, rate limits, expired tokens, cancellation and server failures have recovery states. Polling runs every 30 seconds while the app is active and the player is visible. The abandoned token-swap endpoints return 410 and no longer log credentials.

Photos use authenticated multipart uploads through Django. Images are limited to 5 MB and 16 megapixels, decoded and re-encoded, stripped of metadata and resized to at most 2048 pixels. The photo picker requests compatible images, including conversion of supported HEIC selections. S3 keys are random and scoped by authenticated user and image purpose. Objects use no public ACL. The API returns signed read URLs valid for one hour; writes normalize them to permanent S3 addresses, while reads issue fresh signed URLs. A user cannot ask the API to sign another user's object by submitting its address. Profile image links refresh on foreground and after 45 minutes of active use. Workout lists refresh on focus. A signed image URL is a bearer link until expiry; avoid sharing it as a permanent image address.

Development can save images locally. Production returns a clear 503 if S3 is missing or unavailable instead of saving to Heroku's ephemeral disk. Existing non-S3 image URLs remain supported; old objects at other S3 endpoints need a migration before privatizing those objects.

## Configuration found in branches

`origin/ios-production`, `origin/ios-development` and other branches reference:

- Backend: `https://exerciseplus-a70aea8e1a80.herokuapp.com`
- Bucket: `exerciseplus`
- Region: `us-east-2`

The backend returned HTTP 401 at `/api/user/`, confirming that address responds. These are historical configuration values, not confirmation of current bucket ownership, IAM, or Heroku config. The local Heroku CLI session returned 401, so deployed settings were not inspected or changed. This repository's canonical backend is `exercise-backend/backend`; the separate legacy production repository was not modified or deployed.

## Heroku backend variables

Set variables through Heroku's protected configuration UI or an authenticated local CLI. Do not paste secrets in chat or commit an environment file.

| Variable | Value/purpose |
| --- | --- |
| `SPOTIFY_ENABLED` | `true` after setup; leave `false` when Spotify is unavailable to this release audience |
| `SPOTIFY_CLIENT_ID` | Spotify dashboard app ID |
| `SPOTIFY_CLIENT_SECRET` | Server-only Spotify secret |
| `SPOTIFY_REDIRECT_URI` | `https://exerciseplus-a70aea8e1a80.herokuapp.com/api/spotify/callback/` if this remains the deployed backend |
| `SPOTIFY_TOKEN_ENCRYPTION_KEY` | A dedicated Fernet key, generated once and retained across deploys/backups |
| `AWS_STORAGE_BUCKET_NAME` | Verify historical `exerciseplus` bucket before setting |
| `AWS_S3_REGION_NAME` | Verify historical `us-east-2` region |
| AWS credential provider | A server IAM identity with `s3:PutObject` and `s3:GetObject` for the two image prefixes |

Generate the encryption key locally using the backend environment: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. Save it directly to protected configuration. Changing or losing it requires users to reconnect Spotify.

Keep S3 Block Public Access enabled and ACLs disabled. Grant the backend identity access to `arn:aws:s3:::exerciseplus/profile-images/*` and `arn:aws:s3:::exerciseplus/exercises-images/*` only after verifying this is the intended bucket. Account for any existing SSE-KMS key permissions if applicable. Images go through the backend, so browser CORS and public bucket policies are unnecessary. Rotate AWS credentials used by any distributed historical client build; older branches configured an AWS SDK in the phone app. The new Babel environment allowlist exposes only `API_BASE_URL`.

Run the `0016_spotifyconnection` migration before sending traffic to the new endpoints. A PostgreSQL backup should precede the normal release migration. Keep database and encryption-key backups together with restricted access. Use PostgreSQL and shared Redis on Heroku, production SMTP, `DJANGO_DEBUG=false`, a unique `DJANGO_SECRET_KEY`, and the correct `DJANGO_ALLOWED_HOSTS`. This work does not switch or deploy the existing Heroku app.

Build the mobile app with:

```dotenv
API_BASE_URL=https://exerciseplus-a70aea8e1a80.herokuapp.com/api
```

This is the only mobile environment setting. Rebuild/restart Metro after changing it. Android now accepts the `exercisefrontend://spotify-connect` return link; iOS already registers the app scheme. The return link includes no provider token.

## Spotify dashboard and public release gate

Register the exact HTTPS callback above, including its trailing slash. Do not use the native app scheme as Spotify's callback. Testers approve `user-read-playback-state` and `user-modify-playback-state`. Add each development tester to the dashboard allowlist; use a Premium account and start music in Spotify on an active device before testing controls.

As checked against Spotify's current documentation on October 26, 2026, development mode requires the app owner to have Premium and permits up to five allowlisted authenticated users. Playback controls require Premium. Extended quota currently has organization and audience requirements; do not assume a personal development app can enable Spotify for an unrestricted App Store audience. A limited beta can exercise this integration. For a wider app release, keep Spotify disabled until access is confirmed, or ship the rest of the app while pursuing provider approval.

Sources: [quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [redirect URI requirements](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri), [playback controls](https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback), [S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html).

## Acceptance before shipping

- Deploy the new backend through the intended Heroku pipeline and apply the migration. Verify the deployed `/api/spotify/` endpoint using an authenticated test account.
- With a real allowlisted Premium account, test connect, cancellation, return to app, track display, pause/play, both skips, no active device, foreground refresh, disconnect and reconnect. Check that account switching never displays the previous user's track.
- Upload a synthetic photo to both Profile and Upload Workout through a physical phone. Verify rendering after app restart and after one-hour URL expiry, successful save/load, permission-denied recovery, cancellation, and large/HEIC photo handling. Confirm the object cannot be read without its signed URL.
- Confirm the bucket's actual Block Public Access, encryption and IAM settings, and define orphan-image retention and account-deletion cleanup before production use. Current account deletion cascades Spotify tokens; automatic deletion of S3 photo objects is not implemented in this pass.
- Test the production-signed iOS build on a device and the Android release build, including callback links, photo picker, keyboard, background/foreground and flaky network. Simulator checks and unit tests do not establish device/provider acceptance.
- Finish real SMTP/OTP/reset acceptance, store signing/identifiers, privacy disclosures and account-deletion acceptance. Review remaining app release BDDs separately; AI and public/social functionality remain outside this integration pass.

## Validation record

Local validation passed: 47 backend tests, 85 frontend tests, TypeScript, scoped lint and migration drift checks. Automated tests cover OAuth state expiry/replay/cancellation, encrypted credentials, owner isolation, token refresh, playback actions/errors, disconnect and legacy endpoint closure; private S3 writes, metadata removal, permanent URL persistence, fresh signing, foreign-object rejection and storage failures; and client upload selection, action routing, error retry, account switching and background polling. Real Spotify authorization/playback and real S3 operations remain pending configuration and account access. No production deployment or cloud access-policy changes were made.
