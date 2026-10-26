# Core release

This change continues the existing handwritten React Native/Django application. It retains the original artwork, cards, tab layout, screens, colors, and component locations. Backend/client contracts and state handling are repaired where necessary. No UI redesign or framework rewrite is included.

## GitHub issue coverage

| Issues | Core implementation |
| --- | --- |
| #52 | One root chat screen with a stable route ID; repeated presses and simultaneous sends are guarded. Chat state clears between accounts. |
| #51 | Settings replay, persistent completion/skip, seven ordered steps, navigation between tabs, and working Back navigation. |
| #50 | Numeric sets and repetitions in the existing planning form; validation and persistence; calendar display. |
| #47 | Authenticated server-side uploads; immediate picker result used by the form; profile URL saved and shared state refreshed. |
| #46 | Daily app-use streak stored by the backend and displayed from real account data. Multiple visits in a day do not increment it. This is an app-use streak, not a completed-workout count. |
| #45 | Encoded, debounced exercise search with stale-result protection, empty state, and errors. |
| #44 | Phone number appears in one editable field rather than being duplicated in its label. |
| #43 | Stable thumbnail dimensions, guarded pagination, and loading indicator only while more results are loading. |
| #42 | Muscle name shown in list/empty states and exercise details. |
| #41 | Visible placeholder text in workout/profile/auth/chat inputs. |
| #33; regressions of #39/#40 | Duplicate-safe saved exercises and plans, database uniqueness, repeated-submit guards, and clear already-saved feedback. |
| #29; regressions of #30/#34/#38 | Existing profile menu works across platforms; deletion uses owner-scoped routes and updates lists only after success. |
| Existing core flows | Consistent JWT refresh, session expiry/logout, verification-code resend, password-reset deep links, custom exercise planning, public/private feed isolation, private contact fields omitted from public profile responses. |

Implementation does not automatically close issues. Device and hosted-provider verification remain separate from unit tests.

## Verification

- Backend: 26 tests cover registration/OTP and resend, inactive-account login, JWT refresh, cursor search, repeated saves/plans, sets/reps validation, custom exercise ownership, deletion ownership/cascades, privacy, streaks, password reset, image uploads, reporting, and historical free-text repetitions.
- Frontend: 20 automated API/session, navigation, signed-in/signed-out routing, and planning-form tests; TypeScript and scoped lint checks.
- Clean installation from the checked-in dependency lockfile succeeds. `.npmrc` retains the original installer's legacy peer-dependency setting. The installer now uses the lockfile without deleting it.
- Native iOS Debug build succeeded with Xcode/iOS 26 SDK using the existing installed Pods.
- iPhone 17 Pro / iOS 26 simulator: sign-in, existing Home artwork, Biceps browsing, exercise detail, save, already-saved feedback, profile saved exercise, 3 × 10 Monday plan, calendar display, Settings replay, all seven tutorial steps, tutorial Back from chat to profile, and completion verified.
- JavaScript packaging checked for iOS and Android. Android native/device behavior still requires verification.

## Data and deployment

Use `exercise-backend/backend` for the core release. The separate production backend repository was inaccessible through the connected GitHub account and has not been modified or deployed. Its local copy contains additional recommendation features that are outside this release.

The original migration history was ignored by Git; the historical migrations are now included unchanged, followed by migration 0015. Back up an existing database before applying migrations. Migration 0015 adds sets, optional custom exercise plans, the previously unmigrated vector field, and plan constraints. It enables pgvector on PostgreSQL, which requires that extension to be available and the migration user to have permission to enable it. SQLite development and tests do not need the extension.

An existing database with duplicate plans for the same account/exercise/day must be reconciled before adding the unique constraints. No existing database is automatically deleted or reset. Historical free-text repetitions remain readable; new submissions use positive numbers.

Docker now stores SQLite under `/data` and media in a separate volume. The previous Compose configuration used the bind-mounted `db.sqlite3`; moving to a new volume does not copy that database automatically. Import/back up existing data deliberately if it must be retained. The exercise-only fixture contains 873 catalog entries; do not seed private account dumps for a public/demo install.

Configure SMTP, a real sender, `REPORT_EMAIL`, Apple sign-in identifiers, persistent media/S3, HTTPS, allowed hosts, and a unique server secret before deploying. Mobile builds only need the API address, not AWS signing keys. Production must serve media through persistent storage/web-server configuration or S3.

Critical `fast-xml-parser` and `shell-quote` findings from the original lockfile are patched through compatible overrides. The remaining legacy dependency tree still reports moderate/high advisories (32 total at verification). A broader dependency upgrade and fresh native/device checks are required before a public release; the change does not force an incompatible React Native/CLI upgrade.

## Deferred by the agreed core-first scope

Apple Health (#10), Blender avatars (#4), trainer playlists (#11), social workout invitations/calendar sharing (#12/#18/#19), PR and weight history/charts (#15/#25/#26), calorie estimates (#16/#48), dark mode (#24), sharing/app-store/NFC links (#32), and AI recommendation expansion (#5).

Spotify was already commented out/incomplete in the local app. Its original Settings design is retained and explains that integration is deferred. The core backend returns a clear unavailable message for recommendations instead of a missing route or a fabricated response. Friend/completed-workout placeholders show an em dash until those data models are implemented.
