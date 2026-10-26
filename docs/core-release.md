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

- Backend: 31 tests cover registration/OTP and resend, inactive-account login, JWT refresh, cursor search, repeated saves/plans, sets/reps validation, custom exercise ownership, deletion ownership/cascades, privacy, streaks, password reset, image uploads, reporting, and historical free-text repetitions.
- Frontend: 48 automated API/session, navigation, signed-in/signed-out routing, and planning-form tests; TypeScript and scoped lint checks.
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

Spotify was already commented out/incomplete in the local app. Its original Settings design is retained and explains that integration is deferred. The core backend returns a clear unavailable message for recommendations instead of a missing route or a fabricated response. Friend/completed-workout metrics are omitted from Profile until those data models are implemented.

## Release 1 BDD follow-up

The [Release 1 BDDs](https://docs.google.com/document/d/1DPLusxK7VOGDiEEiGajgbpbBAlupxuROsia2lfyyl8w/edit?tab=t.e7cueor89l38) are the acceptance reference. Core-first implementation is not a declaration that every Release 1 BDD is complete.

| BDD | Current status and remaining verification |
| --- | --- |
| 1–2 | Existing sign-in/sign-up and OTP flow retained; backend registration/verification covered by tests. Real SMTP delivery requires deployment configuration. |
| 3 | Username or email/password login supported, with inactive/invalid/ambiguous accounts rejected. Existing Apple sign-in requires provider/device verification. |
| 4(a–b) | Reset email links to a server webpage with an Open App button. Invalid, expired, and consumed tokens do not offer an app link. Tests follow email → webpage → app URI → reset; real email/device opening still needs verification. Deploy the updated backend over HTTPS for public use. |
| 5 | Reset form requires matching confirmation; success toast survives navigation back to Login. Error keeps the form available. Covered by frontend tests. |
| 6–9 | Existing tabs, body-part browsing, weekday planning and long-press deletion retained. Prior iOS smoke covered browsing/planning; weekday deletion has backend coverage. |
| 10 | Profile displays the requested invitation to save a workout when the saved list is empty, excluding loading/error states. |
| 11(a–b), 12–14 | Existing two-workout preview, Show More → Exercises/Your Exercises, username/menu and edit form retained. |
| 15–16 | Numeric weight/phone controls retained; profile save uses meaningful toast feedback, including errors inside the edit modal. Height retains the original feet/inches pickers. |
| 17–18 | Existing Settings navigation/options retained. Presence of an option does not establish its integration is complete. |
| 19 | Spotify playback remains deferred under core-first scope; does not satisfy the full BDD yet. |
| 20–21 | Document explicitly excludes privacy from initial release. Existing privacy behavior remains. |
| 22 | Logout clears the account and opens Login. This follows BDD 3's signed-out destination; BDD 22's Home destination conflicts with it. |
| 23–24 | Search includes primary muscle/body-part names as well as existing text fields. Regression test covers a muscle name absent from exercise name. Browse/details/save retained. |
| 25–26 | First-use tutorial and Settings replay implemented; prior iOS smoke verified replay, ordered steps, Back and completion. Fresh-install first-use still needs device acceptance. |
| 27 | AI questions, generated workouts and saving generated workouts remain deferred; the unavailable response is not completion of this BDD. |

Follow-up local validation: 31 backend tests and 23 frontend tests pass, including username/email login, body-part search, email/web/app reset linkage, expired links, password confirmation, reset failures and success feedback across navigation. Native/device acceptance remains distinct from automated tests and JS bundle packaging.

## Workout planning UI refinement

The Add to Plan form keeps the app's black-and-white palette, rounded photo/cards and existing navigation. A smaller 240-point exercise photo gives the workout controls more space. Sets and repetitions are editable number fields with bounded plus/minus controls; optional 8/10/12/15-rep shortcuts are selections, not workout recommendations. Visible weekday buttons use the existing black selected state. A live sets/reps/day summary sits above one Add to Plan button. The form scrolls and accommodates the number keyboard; the floating chat button stays out of this screen so it cannot cover the save action.

Verification: all 25 frontend tests, TypeScript and scoped lint pass. Planning regression tests cover invalid quantities, save failure, numeric payloads, presets/steppers and limits. On the iOS 26 simulator, preset selection, incrementing, direct keyboard entry, day selection and save were exercised; Calendar displayed the saved Tuesday workout as 4 sets × 11 reps. Android device layout has not been checked for this refinement.

## Calendar cleanup

Calendar now has a clear heading, an Add workout action, consistent weekday buttons and dots for days with plans. It initially selects the current weekday and keeps the chosen day while navigating to saved exercises. Rounded white workout cards preserve the original thumbnails and show readable names, categories, sets and repetitions; long names wrap within the card. An explicit options button and the existing long-press both open a confirmation that explains only the planned entry is removed. Empty days offer an Add workout action; initial loading, refresh failures and retry are distinct states. Pull to refresh and focus refresh share one request path, and older responses cannot overwrite a newer load.

Removed unused calendar/gradient/component imports, duplicate derived list state and nested unbounded layout. The workout list uses the available screen height and leaves bottom space for the existing floating button. The calendar tutorial anchor remains on Add workout.

Verification: 29 frontend tests, TypeScript and scoped lint pass. Calendar regressions cover weekday filtering, saved-exercise navigation, waiting for deletion success, preserving workouts on deletion failure, and retry after a failed load. iOS simulator checks covered populated/empty days, the removal confirmation (cancelled), and Add workout navigation. Screenshots of populated and empty-day states were captured. Android layout still requires device verification.

## Exercise Bot page cleanup

Exercise Bot uses the same monochrome palette, rounded white cards and black actions as Calendar and workout planning. The blank entry screen now offers editable starter questions and a Browse exercises action. The multiline composer has a clear send control, blank/loading guards, bounded height and keyboard-safe positioning. Incoming exercise links retain the existing root ExerciseCard route. Clear conversation now works with confirmation; Back and the existing tutorial anchor remain available. The floating shortcut is hidden on the chat route by the existing route guard.

Chat failures appear in a separate recovery card, not as assistant answers. Network failures can retry the same question without duplicating it. A 503 response explains that the bot is not available yet and offers Browse exercises. AI recommendations remain deferred under core-first scope; no AI provider or generated-workout feature was added. Message IDs are stable and unique, pending replies cannot reappear after a clear or account change, and automatic scrolling follows new replies only while near the bottom.

Verification: 38 frontend tests, TypeScript and scoped lint pass. New tests cover duplicate/blank sends, retry without duplicate questions, unavailable/missing replies, late replies after clear/account changes, starter drafts, composer guards, confirmation, Back, browsing and exercise navigation. iOS simulator checked starter selection, keyboard spacing, send, the real unavailable response and Browse exercises navigation. Start and unavailable-state screenshots were captured. Android device layout remains unverified.

## Public pages deferred

The public/social feed, other-user profiles and public workouts are outside the agreed core-first scope. Their navigation entries are gated off together with PUBLIC_PAGES_ENABLED in App.tsx; the original screens and artwork remain for a later release. The visible tabs are Home, Calendar and Profile. The Home exercise catalog, body-part browsing, exercise details, saved workouts, Calendar and existing profile settings stay available. Public routes are also absent from the active Home navigator, so hiding the tab does not leave a second entry point.

## Profile cleanup

Profile now follows the same monochrome palette and rounded cards as Calendar and workout planning. It shows the original avatar, username, join month, a clearly labelled app-use streak and the real saved-workout count. Unimplemented Friends and Exercises Completed placeholders are removed. Current/goal weights use a dedicated goals card with Not set for missing data. The first two saved workouts, Show More and the native Edit Profile / Settings / Add Workout menu retain their destinations. Shared saved-exercise rows constrain long names within the available width.

Edit Profile uses controlled fields, grouped cards, a scrollable keyboard-aware form and a persistent Save Profile button. Each open starts from saved account data; Cancel discards draft fields/photos. Phone and numeric fields use appropriate keyboards, existing values are prefilled, height is optional and only submitted if adjusted, and save payloads contain editable fields rather than the entire account. Photo selection cancellation stays quiet, pending uploads disable saving, and stale upload results cannot overwrite a later draft. Success/error toasts remain visible, including errors within the modal.

Verification: all 44 frontend tests, TypeScript and scoped lint pass. Added regression checks for Cancel/reopen, controlled save payloads, keeping drafts on save failure, cancelled image selection, optional height clearing, saved-workout/menu destinations and fetch errors. iOS simulator verified the main screen, edit form with persistent save, cancelling an unsaved username, and the native menu. Profile/editor screenshots were captured. Android layout remains unverified.

## Home UI refinement

Home keeps all five original body-part photographs, labels and exercise-category pills. A clear heading, profile-avatar shortcut, full-width search field and consistent margins replace the unused menu and nested offsets. Rounded image cards use a subtle contrast overlay with content laid out inside the card, including wrapping category pills. Search results use the same rounded white cards as Calendar and Profile. Blank/short queries retain browsing, while searching, failed requests and empty results have distinct feedback; search can be cleared and failures retried. Scrolling leaves room for the existing floating shortcut and adjusts keyboard insets on iOS. Existing exercise routes and tutorial anchors remain.

Removed unused Home imports/state and corrected the Home navigator exercise-detail parameter type to match the existing exercise object. The existing three-character threshold, 300ms debounce and stale-response protection remain.

Verification: 48 frontend tests, TypeScript and scoped lint pass. New Home checks cover five body-part links and profile navigation, debounce/threshold, opening a result, clearing search, stale responses after clearing, and retry after failure. iOS simulator checked the original-artwork catalog, live curl search and opening an exercise result; catalog/search screenshots were captured. Android layout remains unverified.
