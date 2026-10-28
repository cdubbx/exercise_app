"""Published backend routes and React Native call sites for the API reference."""

import ast
from functools import lru_cache
from pathlib import Path

ENDPOINTS = [
    ('Accounts', 'POST', '/register/', 'Create an account and send an email verification code.', False, 'JSON user registration fields.', '201 account-created message; validation errors on 400.', 'useRegister.register'),
    ('Accounts', 'POST', '/verify-otp/', 'Verify the email code and activate the account.', False, 'email, otp', '200 user profile and access/refresh JWTs.', 'useRegister.verifyOTP'),
    ('Accounts', 'POST', '/resend-otp/', 'Send a replacement verification code.', False, 'email', '200 confirmation; throttled by the OTP rate limit.', 'useRegister.resendOTP'),
    ('Accounts', 'POST', '/login/', 'Sign in with username or email and password.', False, 'identifier (or legacy username/email), password', '200 access and refresh JWTs; 401 for invalid credentials.', 'useLogin.login'),
    ('Accounts', 'POST', '/social-login/', 'Exchange an Apple identity response for app JWTs.', False, 'Apple sign-in identity payload.', '200 access and refresh JWTs.', 'useLogin.appleLogin'),
    ('Accounts', 'GET', '/user/', 'Get the current account profile.', True, '', '200 current user profile.', 'useUser.getUser; useAuth.checkToken'),
    ('Accounts', 'POST', '/user/update/', 'Update allowed fields on the current profile.', True, 'Partial user profile fields.', '200 updated user and confirmation.', 'useUpdateUser.updateUser'),
    ('Accounts', 'DELETE', '/user/delete/', 'Delete the current account and its associated data.', True, '', '204 deleted; client clears local session.', 'useDeleteProfile.deleteProfile'),
    ('Accounts', 'POST', '/logout/', 'Clear the legacy JWT cookie. Mobile clients normally clear local tokens.', True, 'None.', '200 confirmation.', 'useLogout.logout (local token removal)'),
    ('Accounts', 'POST', '/token/', 'Obtain a SimpleJWT token pair using configured Django credentials.', False, 'username, password', '200 access and refresh JWTs.', 'Not used by the current client login flow.'),
    ('Accounts', 'POST', '/token/refresh/', 'Refresh an access JWT.', False, 'refresh', '200 access JWT and optionally rotated refresh JWT.', 'apiFetch / refreshAccessToken'),
    ('Accounts', 'POST', '/token/verify/', 'Verify an access JWT.', False, 'token', '200 valid-token response; 401 if invalid.', 'useVerifyToken.verifyToken'),
    ('Password reset', 'POST', '/request-password-reset/', 'Email a one-time password-reset link.', False, 'email', '200 generic confirmation to avoid account enumeration.', 'useResetPassword.requestPasswordReset'),
    ('Password reset', 'POST', '/reset-password/', 'Set a new password from a reset token.', False, 'email, token, new_password', '200 confirmation; 400 for expired or invalid link.', 'useResetPassword.resetPassword; web reset form'),
    ('Password reset', 'GET', '/password-reset/', 'Render the browser password-reset form linked from email.', False, 'email and token query parameters', 'HTML password-reset page.', 'Browser flow; not a React Native API method.'),
    ('Exercises', 'GET', '/exercises/', 'Search the exercise catalog with cursor pagination.', False, 'Optional search and primaryMuscles query parameters.', 'Paginated results with next cursor.', 'useExercises.searchExercises; useMuscleExercise'),
    ('Exercises', 'GET', '/get-specific-exercises/', 'Get exercises matching a body part.', True, 'bodyPart (currently read from request data).', '200 exercise list.', 'No current shared hook call site.'),
    ('Workouts', 'POST', '/saveWorkOuts', 'Save a catalog exercise to the current user.', True, 'workout.id (exercise UUID)', '201 when created; 200 if already saved.', 'useSaveWorkOuts.saveWorkouts'),
    ('Workouts', 'GET', '/userSavedWorkouts/', 'List the current user’s saved catalog exercises.', True, '', '200 saved-workout list.', 'useFetchedSavedWorkOuts.refresh'),
    ('Workouts', 'POST', '/plannedWorkouts/', 'Create one or a batch of planned workouts for the authenticated user, separated by weekday and time-of-day slot.', True, 'workout object or workouts array (1–8 items), each with exercise, day, optional time_of_day (Morning, Afternoon, Evening, Anytime), sets, and reps.', '201 when created; 200 when already present in that day and time slot; a batch is all-or-nothing.', 'useSavePlannedWorkouts.savePlannedWorkouts; useChat.addWorkoutToCalendar'),
    ('Workouts', 'GET', '/plannedWorkouts/', 'List the current user’s calendar workout entries.', True, '', '200 planned-workout list.', 'useFetchedPlanedWorkouts.fetchPlannedWorkouts'),
    ('Workouts', 'DELETE', '/delete-saved-workout/{saved_workout_id}/', 'Remove a saved catalog exercise.', True, 'Path ID: integer.', '204 deleted.', 'useDeleteWorkout.deleteSavedWorkout'),
    ('Workouts', 'DELETE', '/delete-planned-workout/{planned_workout_id}/', 'Remove a planned calendar entry.', True, 'Path ID: integer.', '204 deleted.', 'useDeleteWorkout.deletePlannedWorkout'),
    ('Custom workouts', 'POST', '/user-upload-workout/', 'Create a user-owned custom workout.', True, 'Workout fields accepted by the custom workout serializer.', '201 created workout message.', 'useUploadWorkOuts.addWorkout'),
    ('Custom workouts', 'GET', '/user-upload-workouts/', 'List the current user’s workouts; is_public=true lists public community workouts.', True, 'Optional is_public boolean and cursor pagination parameters.', 'Paginated workout results.', 'useUploadWorkOuts.refresh'),
    ('Custom workouts', 'DELETE', '/delete-user-workout/{workout_id}/', 'Delete a custom workout owned by the current user.', True, 'Path ID: workout UUID.', '204 deleted.', 'useDeleteWorkout.deleteUserSavedWorkout'),
    ('Images', 'POST', '/uploads/', 'Validate and upload a profile or exercise image to configured object storage.', True, 'multipart/form-data: path (profile or exercises), file (JPEG/PNG/WebP; max 5 MB).', '201 image URL; 503 when storage is not configured.', 'useS3Uploader.uploadToS3'),
    ('Social', 'GET', '/users/', 'Search visible, searchable user profiles with cursor pagination.', True, 'Optional search query (username prefix).', 'Paginated profile results.', 'useUsers.fetchUsers'),
    ('Social', 'GET', '/users/{user_id}/', 'Get a visible user profile.', True, 'Path ID: user UUID.', '200 public profile; 404 for private/unavailable profile.', 'Profile screen via user hooks.'),
    ('Activity', 'POST', '/streak/', 'Record workout activity and update the current streak.', True, 'Request body supported by streak view.', '200 updated streak data.', 'No dedicated shared hook.'),
    ('Activity', 'POST', '/now_playing/update', 'Update the current user’s now-playing status.', True, 'Now-playing fields accepted by the view.', '200 updated status.', 'Legacy activity flow.'),
    ('Activity', 'GET', '/now_playing/{user_id}/', 'Read a user’s now-playing status.', True, 'Path ID: user UUID.', '200 status payload.', 'Legacy activity flow.'),
    ('Reports', 'POST', '/report/', 'Submit an issue or content report.', True, 'reportObj with report_type, reported_id, report_text.', '200 confirmation; 503 if report email is not configured.', 'useReport.reportUser'),
    ('Exercise Bot', 'POST', '/gpt-chat/', 'Ask the Exercise Bot; may return a catalog-backed weekday and time-of-day workout proposal.', True, 'query and optional bounded conversation history.', '200 assistant text and optional calendar_action with day, time_of_day, and catalog-backed workouts; 429 after 20 requests per minute per user.', 'useChat.sendMessage; useChat.retryMessage'),
    ('Spotify', 'GET', '/spotify/', 'Read Spotify connection and server-configuration status.', True, '', '200 configured and connected flags.', 'useSpotify.refresh'),
    ('Spotify', 'DELETE', '/spotify/', 'Disconnect Spotify and remove stored credentials.', True, '', '204 disconnected.', 'useSpotify.disconnect'),
    ('Spotify', 'POST', '/spotify/connect/', 'Start Spotify OAuth authorization with PKCE.', True, '', '200 authorization URL.', 'useSpotify.connect'),
    ('Spotify', 'GET', '/spotify/callback/', 'Complete Spotify OAuth from the provider redirect.', False, 'OAuth code and state query parameters.', 'HTML connection status and app return link.', 'Browser OAuth callback.'),
    ('Spotify', 'GET', '/spotify/player/', 'Read current playback state.', True, '', '200 playback/device state.', 'useSpotify.refresh'),
    ('Spotify', 'POST', '/spotify/player/', 'Control playback.', True, 'action: play, pause, next, or previous.', '204 on success; 503/400 for provider or playback errors.', 'useSpotify.control'),
    ('Legacy Spotify', 'POST', '/token/swap/', 'Retired legacy Spotify token endpoint.', False, '', '410 gone.', 'Not used; use Spotify OAuth routes.'),
    ('Legacy Spotify', 'POST', '/spotify/token/refresh/', 'Retired legacy Spotify token endpoint.', False, '', '410 gone.', 'Not used; credentials remain server-side.'),
]

# Links point to the backend implementation on the project's shared source
# branch. Line anchors open the actual request handler (or URL registration for
# framework-provided JWT handlers that are not defined in this repository).
GITHUB_SOURCE_ROOT = 'https://github.com/cdubbx/exercise_app/blob/codex/complete-core-app/exercise-backend/backend/'
PYTHON_HANDLERS = {
    ('POST', '/register/'): ('backend1/views.py', 101, 'RegisterAPIView.post'),
    ('POST', '/verify-otp/'): ('backend1/views.py', 119, 'VerifyOTPAPIView.post'),
    ('POST', '/resend-otp/'): ('backend1/views.py', 757, 'ResendOTPAPIView.post'),
    ('POST', '/login/'): ('backend1/views.py', 160, 'LoginAPIView.post'),
    ('POST', '/social-login/'): ('backend1/views.py', 415, 'SigninWIthApple.post'),
    ('GET', '/user/'): ('backend1/views.py', 186, 'UserView.get'),
    ('POST', '/user/update/'): ('backend1/views.py', 222, 'EditUserView.post'),
    ('DELETE', '/user/delete/'): ('backend1/views.py', 549, 'DeleteUserAccountView.delete'),
    ('POST', '/logout/'): ('backend1/views.py', 244, 'LogoutView.post'),
    ('POST', '/token/'): ('backend1/urls.py', 36, 'TokenObtainPairView route (Django REST Framework SimpleJWT)'),
    ('POST', '/token/refresh/'): ('backend1/urls.py', 37, 'TokenRefreshView route (Django REST Framework SimpleJWT)'),
    ('POST', '/token/verify/'): ('backend1/urls.py', 38, 'TokenVerifyView route (Django REST Framework SimpleJWT)'),
    ('POST', '/request-password-reset/'): ('backend1/views.py', 438, 'RequestPasswordResetAPIView.post'),
    ('POST', '/reset-password/'): ('backend1/views.py', 475, 'ResetPasswordAPIView.post'),
    ('GET', '/password-reset/'): ('backend1/password_reset.py', 10, 'password_reset_landing'),
    ('GET', '/exercises/'): ('backend1/views.py', 85, 'ExerciseListView.get_queryset'),
    ('GET', '/get-specific-exercises/'): ('backend1/views.py', 301, 'GetBodyPartWorkOutView.get'),
    ('POST', '/saveWorkOuts'): ('backend1/views.py', 317, 'SaveWorkOutView.post'),
    ('GET', '/userSavedWorkouts/'): ('backend1/views.py', 236, 'UserSavedWorkoutsView.get'),
    ('GET', '/plannedWorkouts/'): ('backend1/views.py', 331, 'UserPlannedWorkoutsView.get'),
    ('POST', '/plannedWorkouts/'): ('backend1/views.py', 346, 'UserPlannedWorkoutsView.post'),
    ('DELETE', '/delete-saved-workout/{saved_workout_id}/'): ('backend1/views.py', 542, 'DeleteSavedWorkoutView.delete'),
    ('DELETE', '/delete-planned-workout/{planned_workout_id}/'): ('backend1/views.py', 535, 'DeletePlannedWorkoutView.delete'),
    ('POST', '/user-upload-workout/'): ('backend1/views.py', 254, 'UploadWorkOutView.post'),
    ('GET', '/user-upload-workouts/'): ('backend1/views.py', 278, 'GetUserUploadedWorkOutView.get_queryset'),
    ('DELETE', '/delete-user-workout/{workout_id}/'): ('backend1/views.py', 574, 'DeleteUserUploadedWorkoutView.delete'),
    ('POST', '/uploads/'): ('backend1/uploads.py', 23, 'ImageUploadView.post'),
    ('GET', '/users/'): ('backend1/views.py', 202, 'UserListView.get_queryset'),
    ('GET', '/users/{user_id}/'): ('backend1/views.py', 213, 'UserDetailView.get'),
    ('POST', '/streak/'): ('backend1/views.py', 493, 'TrackStreakView.post'),
    ('POST', '/now_playing/update'): ('backend1/views.py', 503, 'UpdateNowPlayingView.post'),
    ('GET', '/now_playing/{user_id}/'): ('backend1/views.py', 519, 'NowPlayingForUserView.get'),
    ('POST', '/report/'): ('backend1/views.py', 560, 'ReportIssueView.post'),
    ('POST', '/gpt-chat/'): ('backend1/views.py', 583, 'ExerciseChatView.post'),
    ('GET', '/spotify/'): ('backend1/spotify.py', 85, 'SpotifyStatusView.get'),
    ('DELETE', '/spotify/'): ('backend1/spotify.py', 88, 'SpotifyStatusView.delete'),
    ('POST', '/spotify/connect/'): ('backend1/spotify.py', 99, 'SpotifyConnectView.post'),
    ('GET', '/spotify/callback/'): ('backend1/spotify.py', 120, 'SpotifyCallbackView.get'),
    ('GET', '/spotify/player/'): ('backend1/spotify.py', 220, 'SpotifyPlayerView.get'),
    ('POST', '/spotify/player/'): ('backend1/spotify.py', 223, 'SpotifyPlayerView.post'),
    ('POST', '/token/swap/'): ('backend1/spotify.py', 261, 'LegacySpotifyTokenView.post'),
    ('POST', '/spotify/token/refresh/'): ('backend1/spotify.py', 261, 'LegacySpotifyTokenView.post'),
}

# A short context line for each routed class. Individual method entries below
# carry the actual implementation details.
PYTHON_VIEW_SUMMARIES = {
    'RegisterAPIView': 'Creates a pending account and starts email verification.',
    'VerifyOTPAPIView': 'Checks the one-time email code, activates the account, and starts a signed-in session.',
    'ResendOTPAPIView': 'Sends a replacement verification code for an inactive account.',
    'LoginAPIView': 'Finds an unambiguous account and issues app session tokens after password verification.',
    'SigninWIthApple': 'Validates the Apple identity through the configured authentication backend and issues app tokens.',
    'UserView': 'Refreshes the signed-in user’s activity streak and returns the profile.',
    'EditUserView': 'Validates and saves allowed changes to the signed-in profile.',
    'DeleteUserAccountView': 'Deletes the signed-in account and its related records.',
    'LogoutView': 'Clears the legacy JWT cookie; mobile apps clear their own stored tokens.',
    'TokenObtainPairView': 'Uses SimpleJWT’s built-in username/password flow to issue a token pair.',
    'TokenRefreshView': 'Uses SimpleJWT’s built-in refresh flow to issue a fresh access token.',
    'TokenVerifyView': 'Uses SimpleJWT’s built-in validation flow to check a token.',
    'RequestPasswordResetAPIView': 'Creates a password-reset link and emails it to the account holder.',
    'ResetPasswordAPIView': 'Checks the reset link, enforces password rules, and saves a new password.',
    'password_reset_landing': 'Renders the browser form only when the emailed reset link is valid.',
    'ExerciseListView': 'Filters and paginates the shared exercise catalog.',
    'GetBodyPartWorkOutView': 'Returns catalog exercises that target the requested body part.',
    'SaveWorkOutView': 'Validates a catalog exercise ID and saves that exercise once for the user.',
    'UserSavedWorkoutsView': 'Loads saved exercises for the signed-in user.',
    'UserPlannedWorkoutsView': 'Lists calendar entries and creates one or several planned exercises.',
    'DeleteSavedWorkoutView': 'Deletes a saved exercise only when it belongs to the signed-in user.',
    'DeletePlannedWorkoutView': 'Deletes a planned calendar entry only when it belongs to the signed-in user.',
    'UploadWorkOutView': 'Validates and saves a user-created exercise or workout.',
    'GetUserUploadedWorkOutView': 'Lists the user’s uploads or eligible public community uploads.',
    'DeleteUserUploadedWorkoutView': 'Deletes an uploaded workout only when it belongs to the signed-in user.',
    'ImageUploadView': 'Checks an uploaded image and stores a cleaned copy in private storage.',
    'UserListView': 'Searches profiles that are active, searchable, public, and not the current user.',
    'UserDetailView': 'Returns a public profile while enforcing its privacy settings.',
    'TrackStreakView': 'Updates the signed-in user’s activity streak safely within a database transaction.',
    'UpdateNowPlayingView': 'Publishes the signed-in user’s current track update.',
    'NowPlayingForUserView': 'Loads the latest available track snapshot for a user.',
    'ReportIssueView': 'Validates a report and emails it to the configured report address.',
    'ExerciseChatView': 'Validates chat history, calls OpenAI, and checks proposed exercises against the catalog.',
    'SpotifyStatusView': 'Reports Spotify setup/connection state and removes a user’s connection on disconnect.',
    'SpotifyConnectView': 'Creates short-lived PKCE state and returns Spotify’s authorization URL.',
    'SpotifyCallbackView': 'Consumes the one-time OAuth state, exchanges the code, and stores encrypted Spotify tokens.',
    'SpotifyPlayerView': 'Reads playback or forwards a validated playback action to Spotify.',
    'LegacySpotifyTokenView': 'Keeps retired token routes explicit and directs clients to the current connection flow.',
}

# Per-request business logic, in execution order. API cards remain the source
# for request field types, return types, and HTTP status details.
PYTHON_HANDLER_DETAILS = {
    'RegisterAPIView.post': ('Validates registration fields with UserSerializer and creates the account inactive. Generates a one-time code, stores it in cache for five minutes, and emails it. If email delivery fails, removes the pending account and cached code.', ['UserSerializer', 'UserSerializer.validate_password', 'UserSerializer.validate', 'UserSerializer.create', 'generate_otp', 'send_otp']),
    'VerifyOTPAPIView.post': ('Requires email and code, reads the expected code from Django’s cache, compares it with the submitted code, and finds the account. If inactive, deletes the used code and activates/saves the account. Then serializes the profile and creates access/refresh JWTs. An already-active account receives an “already activated” response.', ['UserSerializer']),
    'ResendOTPAPIView.post': ('Requires an email and looks only for an inactive matching account. If found, creates and emails a new code and caches it for five minutes. Returns the same confirmation whether or not an inactive account was found.', ['generate_otp', 'send_otp']),
    'LoginAPIView.post': ('Accepts identifier, username, or email; finds up to two case-insensitive email/username matches and rejects ambiguous matches. Checks the password and active-account flag before creating access/refresh JWTs.', []),
    'SigninWIthApple.post': ('Requires an Apple identity token, passes it to AppleAuthenticationBackend, and issues app JWTs for the returned user. Missing or rejected credentials produce an error response.', ['AppleAuthenticationBackend']),
    'UserView.get': ('Locks the current user row inside a transaction, updates the user’s activity streak, then returns the profile through UserSerializer.', ['User.update_streak', 'UserSerializer', 'MediaSerializerMixin.to_representation']),
    'EditUserView.post': ('Uses UserSerializer in partial-update mode with request context. Validates fields and media ownership, saves accepted changes, and returns the updated profile; invalid fields return serializer errors.', ['UserSerializer', 'UserSerializer.validate_password', 'UserSerializer.validate', 'UserSerializer.update', 'MediaSerializerMixin.to_representation', 'MediaSerializerMixin.validate_image_url']),
    'DeleteUserAccountView.delete': ('Deletes request.user. Django applies the model relationships’ configured delete behavior to related records.', []),
    'LogoutView.post': ('Deletes the legacy jwt cookie and returns a confirmation. The mobile client removes its separately stored access and refresh tokens.', []),
    'TokenObtainPairView route (Django REST Framework SimpleJWT)': ('Delegates credential validation and token creation to SimpleJWT; this project does not override its request handler.', []),
    'TokenRefreshView route (Django REST Framework SimpleJWT)': ('Delegates refresh-token validation and access-token creation to SimpleJWT; this project does not override its request handler.', []),
    'TokenVerifyView route (Django REST Framework SimpleJWT)': ('Delegates token signature/expiry validation to SimpleJWT; this project does not override its request handler.', []),
    'RequestPasswordResetAPIView.post': ('Requires an email, finds the account, creates a time-limited Django reset token, builds the browser reset URL, and emails that link. The current implementation returns a validation error when the email is not found.', []),
    'ResetPasswordAPIView.post': ('Finds the account by email and checks the one-time reset token. Applies Django password validators, hashes the accepted password with set_password, and saves only the password field.', []),
    'password_reset_landing': ('Reads email and token from the URL, checks the token, and renders the reset form as valid or invalid. Disables caching and sets a no-referrer policy.', []),
    'ExerciseListView.get_queryset': ('Starts from the exercise catalog, optionally filters by primary muscle and searches name, description, category, and primary muscles. Sorts deterministically; DRF applies cursor pagination and ExerciseSerializer.', ['ExerciseSerializer', 'MediaSerializerMixin.to_representation']),
    'GetBodyPartWorkOutView.get': ('Reads bodyPart from the request body, optionally applies a muscle-overlap filter, and serializes matching catalog exercises.', ['ExerciseSerializer', 'MediaSerializerMixin.to_representation']),
    'SaveWorkOutView.post': ('Reads workout.id, requires a valid UUID, finds the catalog exercise, then uses get_or_create so the same user cannot save the same exercise twice.', []),
    'UserSavedWorkoutsView.get': ('Filters saved-workout records by the signed-in user, fetches related exercises in the same query, and serializes the list.', ['SavedWorkoutSerializer', 'MediaSerializerMixin.to_representation']),
    'UserPlannedWorkoutsView.get': ('Filters calendar entries by the signed-in user, fetches linked exercise details efficiently, and serializes the results.', ['PlannedWorkoutSerializer', 'PlanRepetitionsField.to_representation', 'MediaSerializerMixin.to_representation']),
    'UserPlannedWorkoutsView.post': ('Accepts one workout or a batch of 1–8. Creates the entire batch inside one transaction, validates each item, and returns serialized plans; an invalid item rolls the batch back.', ['_create_planned_workout', 'PlannedWorkoutSerializer.validate', 'PlanRepetitionsField.to_representation', 'MediaSerializerMixin.to_representation']),
    'DeleteSavedWorkoutView.delete': ('Looks up the saved-workout record by ID and current user together. Returns not found for another user’s record, otherwise deletes it.', []),
    'DeletePlannedWorkoutView.delete': ('Looks up the calendar record by ID and current user together. Returns not found for another user’s record, otherwise deletes it.', []),
    'UploadWorkOutView.post': ('Validates submitted workout fields and image addresses with UserUploadWorkoutsSerializer, assigns ownership to request.user, and saves the record.', ['UserUploadWorkoutsSerializer', 'UserUploadWorkoutsSerializer.create', 'MediaSerializerMixin.validate_img_url']),
    'GetUserUploadedWorkOutView.get_queryset': ('When is_public=true, returns public uploads whose owners are not private; otherwise returns only the signed-in user’s uploads. DRF serializes, signs private image links, and paginates the result.', ['UserUploadWorkoutsSerializer', 'MediaSerializerMixin.to_representation']),
    'DeleteUserUploadedWorkoutView.delete': ('Finds an uploaded workout using both its ID and request.user, then deletes it. Another user’s upload is not exposed.', []),
    'ImageUploadView.post': ('Accepts multipart image data, checks destination, file size, format, and pixel count, corrects image orientation, strips metadata by re-encoding, and limits output dimensions. Stores the clean image privately and returns a temporary display URL.', ['s3_client', 'media_origin', 'display_media']),
    'UserListView.get_queryset': ('Limits results to active, searchable, public profiles; excludes the signed-in user and optionally filters usernames by prefix. DRF applies cursor pagination and PublicUserSerializer.', ['PublicUserSerializer']),
    'UserDetailView.get': ('Finds an active profile by UUID. Hides private or non-searchable profiles from other users, then returns only public profile fields.', ['PublicUserSerializer', 'MediaSerializerMixin.to_representation']),
    'TrackStreakView.post': ('Locks the current user row in a database transaction, updates the streak, and returns the refreshed user profile.', ['User.update_streak', 'UserSerializer', 'MediaSerializerMixin.to_representation']),
    'UpdateNowPlayingView.post': ('Reads track and artist details, finds the signed-in user, and sends a track update through the app notification helper.', ['send_track_update']),
    'NowPlayingForUserView.get': ('Finds the user and loads their newest stored track snapshot. Serializes a snapshot when present; returns an empty/no-track result otherwise.', ['NowPlayingTrackSerializer']),
    'ReportIssueView.post': ('Accepts reportObj or a top-level report, trims and limits report text to 5,000 characters, checks that reporting email is configured, then sends the report email.', ['send_mail']),
    'ExerciseChatView.post': ('Validates the question (1–2,000 characters) and up to 12 prior messages, checks server configuration, then sends a bounded request to OpenAI Responses. Extracts text and an optional workout tool call; resolves every proposed exercise to the catalog before returning a calendar proposal. It never writes to the calendar itself.', ['resolve_catalog_exercise']),
    'SpotifyStatusView.get': ('Checks server configuration and whether this signed-in user has a stored access token; returns flags only, never provider credentials.', ['configured']),
    'SpotifyStatusView.delete': ('Deletes this user’s Spotify connection, including any unfinished OAuth handshake state.', []),
    'SpotifyConnectView.post': ('Checks server configuration, creates random state and a PKCE verifier, stores hashed/encrypted short-lived values for this user, and returns Spotify’s authorization URL.', ['configured', 'cipher']),
    'SpotifyCallbackView.get': ('Finds and locks the connection using the returned state, rejects missing/expired attempts, and consumes state before processing the result. Exchanges the authorization code with the saved PKCE verifier, checks required scopes, and stores encrypted tokens; then shows a success/failure page.', ['configured', 'cipher', 'token_request', 'store_tokens']),
    'SpotifyPlayerView.get': ('Checks configuration and connection, locks the user’s connection, refreshes expiring tokens if needed, and asks Spotify for current playback. Converts the provider response into the app’s smaller track/device result.', ['SpotifyPlayerView.run', 'configured', 'player_request']),
    'SpotifyPlayerView.post': ('Accepts only play, pause, next, or previous. Locks the user’s connection, forwards the action to Spotify, and preserves token invalidation even when Spotify returns an error.', ['SpotifyPlayerView.run', 'configured', 'player_request']),
    'LegacySpotifyTokenView.post': ('Returns HTTP 410 and directs clients to the account-bound Spotify connection flow. It does not exchange or expose tokens.', []),
}

PYTHON_HELPERS = [
    {'id':'helper-generate-otp','name':'generate_otp(length=4)','file':'backend1/utils/utils.py','line':24,'group':'Accounts','summary':'Creates a short numeric email-verification code.','logic':'Uses a cryptographically secure random digit generator and returns the code as text.'},
    {'id':'helper-send-otp','name':'send_otp(email, otp)','file':'backend1/utils/utils.py','line':10,'group':'Accounts','summary':'Sends the account verification code by email.','logic':'Builds the verification message and sends it with Django’s configured email service. Returns True on success and False when delivery raises an error.'},
    {'id':'helper-send-track-update','name':'send_track_update(user_id, track_name, artist_name, album_image_url)','file':'backend1/utils/utils.py','line':31,'group':'Activity','summary':'Publishes a now-playing update to connected clients.','logic':'Sends a message to the spotify_updates WebSocket group using the app’s Channels layer.'},
    {'id':'helper-resolve-catalog-exercise','name':'resolve_catalog_exercise(name)','file':'backend1/views.py','line':36,'group':'Exercise Bot','summary':'Matches a proposed exercise name to a real catalog record.','logic':'Normalizes punctuation and case, checks known aliases and common plural forms, then searches catalog names. Returns the matching Exercise or None; chat rejects the proposal if any exercise is missing.'},
    {'id':'helper-create-planned-workout','name':'UserPlannedWorkoutsView._create_planned_workout(request, workout)','file':'backend1/views.py','line':354,'group':'Workouts','summary':'Converts one proposed workout into a calendar record.','logic':'Validates the exercise UUID, checks whether it belongs to the user’s custom uploads, otherwise finds the catalog exercise and creates its saved-workout link. Validates day, time, sets, and reps with PlannedWorkoutSerializer, then creates or reuses the matching user/day/time/exercise entry.'},
    {'id':'helper-spotify-configured','name':'configured()','file':'backend1/spotify.py','line':32,'group':'Spotify','summary':'Checks whether required Spotify settings and encryption are usable.','logic':'Requires Spotify to be enabled, client settings and a secure callback to be present, and the token-encryption key to be valid.'},
    {'id':'helper-spotify-cipher','name':'cipher()','file':'backend1/spotify.py','line':42,'group':'Spotify','summary':'Builds the Fernet encryptor used for stored provider credentials.','logic':'Creates the encryption object from SPOTIFY_TOKEN_ENCRYPTION_KEY; callers use it to encrypt or decrypt tokens and temporary PKCE verifier values.'},
    {'id':'helper-spotify-token-request','name':'token_request(payload)','file':'backend1/spotify.py','line':46,'group':'Spotify','summary':'Exchanges an OAuth code or refresh token with Spotify.','logic':'Posts the OAuth payload to Spotify’s token endpoint, checks the provider response, and returns token data or a controlled validation error.'},
    {'id':'helper-spotify-store-tokens','name':'store_tokens(connection, data)','file':'backend1/spotify.py','line':74,'group':'Spotify','summary':'Encrypts and saves Spotify token data on the user’s connection.','logic':'Encrypts access/refresh tokens, records expiry, and persists them on the account-bound SpotifyConnection record.'},
    {'id':'helper-spotify-player-request','name':'player_request(connection, method, path)','file':'backend1/spotify.py','line':149,'group':'Spotify','summary':'Makes a playback request with token refresh and provider-error handling.','logic':'Refreshes a token near expiry, retries once after an authorization failure, clears rejected credentials, and translates no-device, permission, rate-limit, network, and provider errors into app responses.'},
    {'id':'helper-s3-client','name':'s3_client()','file':'backend1/media.py','line':16,'group':'Images','summary':'Creates the AWS S3 client used by private image storage.','logic':'Builds a boto3 S3 client using the server’s configured AWS region and credentials.'},
    {'id':'helper-media-origin','name':'media_origin()','file':'backend1/media.py','line':21,'group':'Images','summary':'Gets the canonical address used to identify stored images.','logic':'Returns the configured S3 origin used to build stable private object addresses.'},
    {'id':'helper-display-media','name':'display_media(url)','file':'backend1/media.py','line':49,'group':'Images','summary':'Turns a private S3 object address into a temporary display link.','logic':'Creates a short-lived presigned read URL while keeping the stored object address private and stable.'},
    {'id':'helper-media-key','name':'media_key(url)','file':'backend1/media.py','line':26,'group':'Images','summary':'Recognizes an object address that belongs to the configured S3 bucket.','logic':'Checks the URL scheme and host against the bucket’s canonical S3 origin, then returns its object key or None for an unrelated URL.'},
    {'id':'helper-canonical-media','name':'canonical_media(url, user=None)','file':'backend1/media.py','line':35,'group':'Images','summary':'Checks that a profile or workout image address is safe to store.','logic':'Accepts empty values, validates web URLs, and for this bucket requires a key in the current user’s profile or exercise folder. Returns the stable object address; it does not issue a temporary display link.','references':['helper-media-key']},
    {'id':'method-user-update-streak','name':'User.update_streak(self)','file':'backend1/models.py','line':37,'group':'Activity','summary':'Updates one account’s workout activity streak.','logic':'Uses the local calendar date: starts at one for first activity, does nothing if already active today, increments after activity on the previous day, or resets to one after a longer gap. Saves the new activity date and streak, then returns the streak number.','signature':'def update_streak(self) -> int','returns':'int · the updated streak count; unchanged count when already active today.'},
    {'id':'method-spotify-player-run','name':'SpotifyPlayerView.run(self, request, action=None)','file':'backend1/spotify.py','line':228,'group':'Spotify','summary':'Runs the shared Spotify current-track or playback-action flow.','logic':'Checks server setup and the signed-in account’s connection, locks the connection row, and forwards a read or validated action to player_request. Converts Spotify playback data into the app response.','signature':'def run(self, request, action=None) -> Response','returns':'rest_framework.response.Response · playback state or an empty successful control response.'},
    {'id':'method-user-serializer-password','name':'UserSerializer.validate_password(self, value)','file':'backend1/serializers.py','line':32,'group':'Accounts','summary':'Checks a submitted password against Django’s configured password rules.','logic':'Passes the candidate and current user instance to Django’s password validators. Returns the value unchanged when accepted; raises a serializer validation error when rejected.','signature':'def validate_password(self, value)','returns':'str · the accepted password value.'},
    {'id':'method-user-serializer-validate','name':'UserSerializer.validate(self, data)','file':'backend1/serializers.py','line':37,'group':'Accounts','summary':'Checks profile-level rules after individual fields have been parsed.','logic':'Rejects non-positive height or weight values and converts an empty phone number to None. Returns the cleaned field dictionary.','signature':'def validate(self, data)','returns':'dict · validated profile fields.'},
    {'id':'method-user-serializer-create','name':'UserSerializer.create(self, validated_data)','file':'backend1/serializers.py','line':45,'group':'Accounts','summary':'Creates a user while storing the password as a hash.','logic':'Removes the raw password from the field dictionary, assigns it through set_password, saves the new User, and returns that user instance.','signature':'def create(self, validated_data)','returns':'User · the newly saved account.'},
    {'id':'method-user-serializer-update','name':'UserSerializer.update(self, instance, validated_data)','file':'backend1/serializers.py','line':52,'group':'Accounts','summary':'Updates an account and safely handles an optional password change.','logic':'If a new password is present, hashes it with set_password before saving the remaining validated profile fields through the parent serializer. Returns the updated User.','signature':'def update(self, instance, validated_data)','returns':'User · the updated account.'},
    {'id':'method-upload-serializer-create','name':'UserUploadWorkoutsSerializer.create(self, validated_data)','file':'backend1/serializers.py','line':19,'group':'Custom workouts','summary':'Creates a custom uploaded workout record.','logic':'Delegates record creation to Django REST Framework’s ModelSerializer using the already validated fields, including the owner supplied by the view.','signature':'def create(self, validated_data)','returns':'UserUploadWorkedouts · the newly saved custom workout.'},
    {'id':'method-saved-serializer-create','name':'SavedWorkoutSerializer.create(self, validated_data)','file':'backend1/serializers.py','line':79,'group':'Workouts','summary':'Creates a saved-workout record from a library exercise ID.','logic':'Removes the write-only exercise_id, loads the matching catalog Exercise, creates the SavedWorkout using the remaining validated values, and returns the record. Current save and planning routes use their own get_or_create logic instead of this serializer write method.','signature':'def create(self, validated_data)','returns':'SavedWorkout · the newly saved exercise record.'},
    {'id':'method-planned-serializer-validate','name':'PlannedWorkoutSerializer.validate(self, data)','file':'backend1/serializers.py','line':106,'group':'Workouts','summary':'Ensures a planned workout points to exactly one exercise source.','logic':'Rejects a plan that has both a saved library exercise and a custom exercise, or neither. Returns the accepted field dictionary.','signature':'def validate(self, data)','returns':'dict · validated planned-workout fields.'},
    {'id':'method-repetitions-representation','name':'PlanRepetitionsField.to_representation(self, value)','file':'backend1/serializers.py','line':86,'group':'Workouts','summary':'Returns repetition counts as numbers while preserving older text values.','logic':'Converts values that look like integers to int for consistent app responses. If an older free-text value cannot be converted, returns it unchanged.','signature':'def to_representation(self, value)','returns':'int | str · normalized number or legacy text.'},
    {'id':'method-media-representation','name':'MediaSerializerMixin.to_representation(self, instance)','file':'backend1/media.py','line':65,'group':'Images','summary':'Converts stored private image addresses into temporary links in API responses.','logic':'Starts with the parent serializer’s response data, then signs profile and exercise image addresses for reading. The database continues to store canonical object addresses.','signature':'def to_representation(self, instance)','returns':'dict · serialized fields with temporary image URLs.'},
    {'id':'method-media-validate-image','name':'MediaSerializerMixin.validate_image_url(self, value)','file':'backend1/media.py','line':73,'group':'Images','summary':'Validates a profile image address before saving it.','logic':'Checks the image address against the authenticated user’s S3 folder and rejects values longer than the model field supports. Returns the canonical address.','signature':'def validate_image_url(self, value)','returns':'str | None · canonical image address.' ,'references':['helper-canonical-media']},
    {'id':'method-media-validate-images','name':'MediaSerializerMixin.validate_img_url(self, value)','file':'backend1/media.py','line':81,'group':'Images','summary':'Validates exercise image addresses before saving them.','logic':'Checks each submitted image address against the authenticated user’s S3 folder and returns the canonical addresses as a list.','signature':'def validate_img_url(self, value)','returns':'list[str] · canonical image addresses.','references':['helper-canonical-media']},
]

PYTHON_HELPER_RETURNS = {
    'helper-generate-otp': 'str · a numeric one-time code.',
    'helper-send-otp': 'bool · True when email sends successfully; False if delivery fails.',
    'helper-send-track-update': 'None · sends a message through the Channels layer.',
    'helper-resolve-catalog-exercise': 'Exercise | None · the catalog match, or None when no match exists.',
    'helper-create-planned-workout': 'tuple[PlannedWorkout, bool] · the existing or new plan and whether it was created.',
    'helper-spotify-configured': 'bool · whether server settings and encryption are ready.',
    'helper-spotify-cipher': 'Fernet · the encryptor for stored Spotify credentials.',
    'helper-spotify-token-request': 'dict · validated Spotify token response; provider failures raise an API error.',
    'helper-spotify-store-tokens': 'None · saves encrypted tokens and their expiry on the connection.',
    'helper-spotify-player-request': 'dict | None · playback JSON for reads, or None for successful controls.',
    'helper-s3-client': 'botocore.client.S3 · configured AWS client.',
    'helper-media-origin': 'str · canonical S3 bucket origin.',
    'helper-display-media': 'str · temporary signed image URL, or the original URL when it is not in this bucket.',
    'helper-media-key': 'str | None · S3 object key for this bucket, or None for another address.',
    'helper-canonical-media': 'str | None · validated canonical image address.',
}

FRONTEND_METHODS = [
    ('Authentication', 'useAuth.checkToken()', 'Check the stored access token against GET /user/.', 'hooks/auth.ts'),
    ('Authentication', 'useVerifyToken.verifyToken(token)', 'Verify a JWT through POST /token/verify/.', 'hooks/auth.ts'),
    ('Authentication', 'useRegister.register(userData)', 'Create an account and trigger email verification.', 'hooks/auth.ts'),
    ('Authentication', 'useRegister.verifyOTP({email, otp})', 'Verify the code, store JWTs, then fetch the profile.', 'hooks/auth.ts'),
    ('Authentication', 'useRegister.resendOTP(email)', 'Request another email verification code.', 'hooks/auth.ts'),
    ('Authentication', 'useLogin.login(identifier, password)', 'Sign in, store JWTs, and load the user profile.', 'hooks/auth.ts'),
    ('Authentication', 'useLogin.appleLogin(appleObject)', 'Exchange Apple identity for app JWTs and profile.', 'hooks/auth.ts'),
    ('Authentication', 'useUser.getUser(token?)', 'Load the current profile.', 'hooks/auth.ts'),
    ('Authentication', 'useResetPassword.requestPasswordReset(email)', 'Request a password reset email.', 'hooks/auth.ts'),
    ('Authentication', 'useResetPassword.resetPassword({email, token, new_password})', 'Complete password reset.', 'hooks/auth.ts'),
    ('Authentication', 'useUpdateUser.updateUser(userData)', 'Update profile fields.', 'hooks/auth.ts'),
    ('Authentication', 'useDeleteProfile.deleteProfile()', 'Delete the account and clear client tokens.', 'hooks/auth.ts'),
    ('Authentication', 'useLogout.logout()', 'Clear local access and refresh tokens.', 'hooks/auth.ts'),
    ('Exercises', 'useExercises.searchExercises(search)', 'Search the catalog.', 'hooks/exercises.ts'),
    ('Exercises', 'useMuscleExercise(bodyPart).refresh()', 'Load the first page of catalog results for a muscle.', 'hooks/exercises.ts'),
    ('Exercises', 'useMuscleExercise(bodyPart).loadMoreExercises()', 'Load the next page of catalog results for the selected muscle.', 'hooks/exercises.ts'),
    ('Workouts', 'useSaveWorkOuts.saveWorkouts(exercise)', 'Save a catalog exercise.', 'hooks/exercises.ts'),
    ('Workouts', 'useSavePlannedWorkouts.savePlannedWorkouts(workout)', 'Create a planned calendar entry.', 'hooks/exercises.ts'),
    ('Workouts', 'useFetchedSavedWorkOuts.refresh()', 'Load saved catalog exercises.', 'hooks/exercises.ts'),
    ('Workouts', 'useFetchedPlanedWorkouts.fetchPlannedWorkouts()', 'Load planned calendar entries.', 'hooks/exercises.ts'),
    ('Workouts', 'useUploadWorkOuts.refresh()', 'Load the signed-in user’s custom workouts and, optionally, public workouts.', 'hooks/exercises.ts'),
    ('Workouts', 'useUploadWorkOuts.addWorkout(exercise)', 'Create a custom workout for the signed-in user.', 'hooks/exercises.ts'),
    ('Workouts', 'useDeleteWorkout.deleteSavedWorkout(id)', 'Delete a saved exercise.', 'hooks/exercises.ts'),
    ('Workouts', 'useDeleteWorkout.deletePlannedWorkout(id)', 'Delete a calendar entry.', 'hooks/exercises.ts'),
    ('Workouts', 'useDeleteWorkout.deleteUserSavedWorkout(id)', 'Delete a custom workout.', 'hooks/exercises.ts'),
    ('Images', 'useFilePicker.pickFile()', 'Select and validate a local image; no network request.', 'hooks/social.ts'),
    ('Images', 'useS3Uploader.uploadToS3(file, path)', 'Upload the selected image and return its URL.', 'hooks/social.ts'),
    ('Social', 'useUsers.fetchUsers()', 'Load the next page of visible user profiles.', 'hooks/social.ts'),
    ('Social', 'useReport.reportUser(reportObj)', 'Send an issue or content report.', 'hooks/exercises.ts'),
    ('Authentication', 'useUserContext()', 'Read or update the signed-in user and session state.', 'hooks/auth.ts'),
    ('Chat', 'useChat.sendMessage(text)', 'Send a question and recent conversation history to the bot.', 'context/ChatContext.tsx'),
    ('Chat', 'useChat.retryMessage()', 'Retry the last failed question.', 'context/ChatContext.tsx'),
    ('Chat', 'useChat.addWorkoutToCalendar(messageId)', 'Submit a bot-proposed plan after explicit user confirmation.', 'context/ChatContext.tsx'),
    ('Chat', 'useChat.clearConversation()', 'Clear the in-memory chat messages.', 'context/ChatContext.tsx'),
    ('Spotify', 'useSpotify.refresh()', 'Refresh connection and playback state.', 'context/NowPlayContextSpotify.tsx'),
    ('Spotify', 'useSpotify.connect()', 'Start OAuth and open the Spotify authorization page.', 'context/NowPlayContextSpotify.tsx'),
    ('Spotify', 'useSpotify.disconnect()', 'Disconnect the Spotify account.', 'context/NowPlayContextSpotify.tsx'),
    ('Spotify', 'useSpotify.control(action)', 'Play, pause, skip, or go to the previous track.', 'context/NowPlayContextSpotify.tsx'),
    ('Spotify', 'useSpotify.togglePlayer()', 'Show or hide the player and remember the choice for this account.', 'context/NowPlayContextSpotify.tsx'),
    ('Spotify', 'useSpotify()', 'Read Spotify connection status, player state, and available controls.', 'context/NowPlayContextSpotify.tsx'),
    ('Chat', 'useGPTExerciseChat()', 'Legacy alias for useChat; provides the same chat methods.', 'hooks/exercises.ts'),
    ('API client', 'apiFetch(url, options)', 'Attach/refresh the JWT, enforce the configured API origin, and handle session expiry.', 'services/api.ts'),
    ('API client', 'readResponse(response)', 'Parse JSON and convert API failures into client errors.', 'services/api.ts'),
    ('API client', 'fetchWithTimeout(url, options)', 'Send a request that stops waiting after 20 seconds.', 'services/api.ts'),
    ('API client', 'getAuthToken()', 'Read the saved access token or refresh it when needed.', 'services/api.ts'),
    ('API client', 'refreshAccessToken()', 'Use the saved refresh token to get a new access token.', 'services/api.ts'),
    ('API client', 'onSessionExpired(listener)', 'Register a callback for when the saved sign-in expires.', 'services/api.ts'),
    ('Exercises', 'useSetExercise()', 'Read or update the selected exercise through ExerciseContext.', 'hooks/exercises.ts'),
    ('Exercises', 'ExerciseContext.addExercises(exercise)', 'Add one or more exercises to the in-memory selection without duplicates.', 'context/ExerciseContext.tsx'),
    ('Exercises', 'ExerciseContext.removeExercise(id)', 'Remove an exercise from the in-memory selection.', 'context/ExerciseContext.tsx'),
    ('API client', 'exerciseRequest(path, method?, body?)', 'Shared JSON request helper used by workout and report hooks.', 'hooks/exercises.ts'),
    ('API client', 'expireSession()', 'Remove expired local tokens and notify session listeners.', 'services/api.ts'),
    ('Chat', 'ChatProvider.send(content, appendUser)', 'Shared chat submission flow used by send and retry.', 'context/ChatContext.tsx'),
    ('Chat', 'isCalendarWorkoutAction(value)', 'Check that a bot proposal has valid calendar fields before showing Add.', 'context/ChatContext.tsx'),
    ('Spotify', 'NowPlayingProvider.request(path?, method?, body?)', 'Shared authenticated request helper for Spotify connection and playback endpoints.', 'context/NowPlayContextSpotify.tsx'),
    ('Spotify', 'perform(work)', 'Prevent overlapping Spotify actions and keep player errors in context state.', 'context/NowPlayContextSpotify.tsx'),
    ('Exercises', 'fetchPage(url, append, version)', 'Load a catalog page and ignore results from an outdated request.', 'hooks/exercises.ts'),
    ('Custom workouts', 'loadAll(path)', 'Follow every cursor page when loading a user or public workout list.', 'hooks/exercises.ts'),
    ('Formatting', 'formatDate(dateObj, formatType)', 'Format a date in one of the app’s three display formats.', 'utils/utils.ts'),
    ('Formatting', 'convertToDecimalFeet(feet, inches)', 'Convert feet and inches into a decimal number of feet.', 'utils/utils.ts'),
    ('Formatting', 'formatDecimalFeet(decimalHeight)', 'Convert decimal feet back to feet-and-inches text.', 'utils/utils.ts'),
    ('Formatting', 'formatWeight(dirtyWeight)', 'Round a weight value to four significant digits.', 'utils/utils.ts'),
    ('Formatting', 'getImageUrl(url)', 'Convert a GitHub blob URL to its raw-file URL for display.', 'utils/utils.ts'),
    ('Formatting', 'determineStreakIcon()', 'Exported placeholder; this function currently has no implementation and returns undefined.', 'utils/utils.ts'),
]

# Each parameter records its name, plain type, whether it is required, and a
# short explanation. Return types describe the value callers receive, including
# common error behavior. These contracts are intentionally kept beside the
# route and method lists so the website and OpenAPI JSON share one source.
API_CONTRACTS = {
    '/register/': ([('email', 'string', True, 'Account email address.'), ('password', 'string', True, 'New account password.'), ('username', 'string', False, 'Optional display name.'), ('weight', 'number', False, 'Body weight, when provided.'), ('height', 'number', False, 'Height, when provided.')], 'object: {message: string}; validation errors return 400.'),
    '/verify-otp/': ([('email', 'string', True, 'Email used during registration.'), ('otp', 'string', True, 'Verification code sent by email.')], 'object: {message: string, user: User, access: string, refresh: string}.'),
    '/resend-otp/': ([('email', 'string', True, 'Email used during registration.')], 'object: {message: string}; rate limits may return 429.'),
    '/login/': ([('identifier', 'string', True, 'Username or email.'), ('password', 'string', True, 'Account password.')], 'object: {access: string, refresh: string}.'),
    '/social-login/': ([('id_token', 'string', True, 'Apple identity token.')], 'object: {access: string, refresh: string}.'),
    '/user/': ([], 'User object for the signed-in account.'),
    '/user/update/': ([('profile fields', 'object', False, 'One or more allowed User fields to update; send only fields you want to change.')], 'object: updated User profile.'),
    '/user/delete/': ([], 'No response body (HTTP 204).'),
    '/logout/': ([], 'object: {message: string}; mobile clients clear tokens locally.'),
    '/token/': ([('username', 'string', True, 'Configured Django username (email for this app).'), ('password', 'string', True, 'Account password.')], 'object: {access: string, refresh: string}.'),
    '/token/refresh/': ([('refresh', 'string', True, 'Refresh JWT.')], 'object: {access: string, refresh?: string}.'),
    '/token/verify/': ([('token', 'string', True, 'JWT to check.')], 'object: token-valid response; invalid tokens return 401.'),
    '/request-password-reset/': ([('email', 'string', True, 'Account email address.')], 'object: generic {message: string}, whether or not the account exists.'),
    '/reset-password/': ([('email', 'string', True, 'Account email address.'), ('token', 'string', True, 'One-time reset token from the email link.'), ('new_password', 'string', True, 'Replacement password.')], 'object: {message: string}; expired or invalid links return 400.'),
    '/password-reset/': ([('email', 'string', True, 'Email query parameter.'), ('token', 'string', True, 'Reset token query parameter.')], 'HTML page containing the password-reset form.'),
    '/exercises/': ([('search', 'string', False, 'Text to match exercise names.'), ('primaryMuscles', 'string', False, 'Filter by primary muscle.'), ('cursor', 'string', False, 'Page cursor returned by the prior response.')], 'object: {results: Exercise[], next: string|null, previous: string|null}.'),
    '/get-specific-exercises/': ([('bodyPart', 'string', True, 'Body-part filter (legacy request-data field).')], 'Exercise[]; this legacy route expects the filter in request data.'),
    '/saveWorkOuts': ([('workout.id', 'string', True, 'UUID of a catalog exercise.')], 'SavedWorkout object; duplicate saves return the existing record.'),
    '/userSavedWorkouts/': ([], 'SavedWorkout[] for the signed-in user.'),
    '/plannedWorkouts/': ([('workout', 'object', False, 'One calendar entry; alternatively provide workouts.'), ('workouts', 'object[]', False, 'Batch of 1–8 calendar entries.'), ('workouts[].exercise', 'object', True, 'Catalog or custom exercise reference.'), ('workouts[].day_of_the_week', 'string', True, 'Monday through Sunday.'), ('workouts[].time_of_day', 'string', False, 'Morning, Afternoon, Evening, or Anytime.'), ('workouts[].sets', 'integer', True, 'Number of sets, 1–100.'), ('workouts[].reps', 'integer|string', True, 'Repetitions (1–1000) or legacy text.')], 'PlannedWorkout or PlannedWorkout[]; batch creation is all-or-nothing.'),
    '/delete-saved-workout/{saved_workout_id}/': ([('saved_workout_id', 'integer', True, 'Saved workout record ID in the URL.')], 'No response body (HTTP 204).'),
    '/delete-planned-workout/{planned_workout_id}/': ([('planned_workout_id', 'integer', True, 'Calendar entry ID in the URL.')], 'No response body (HTTP 204).'),
    '/user-upload-workout/': ([('name', 'string', True, 'Workout name.'), ('primaryMuscles', 'string[]', False, 'Main muscle groups.'), ('secondaryMuscles', 'string[]', False, 'Additional muscle groups.'), ('equipment', 'string', False, 'Equipment used.'), ('instructions', 'string[]', False, 'Step-by-step instructions.'), ('img_url', 'string[]', False, 'Image URLs.')], 'object: {message: string}; created custom workout is stored for the user.'),
    '/user-upload-workouts/': ([('is_public', 'boolean', False, 'Set true to list public community workouts.'), ('cursor', 'string', False, 'Page cursor returned by the prior response.')], 'object: {results: Workout[], next: string|null, previous: string|null}.'),
    '/delete-user-workout/{workout_id}/': ([('workout_id', 'string', True, 'Custom workout UUID in the URL.')], 'No response body (HTTP 204).'),
    '/uploads/': ([('path', 'string', True, 'profile or exercises.'), ('file', 'file', True, 'JPEG, PNG, or WebP image up to 5 MB.')], 'object: {url: string}; storage-not-configured returns 503.'),
    '/users/': ([('search', 'string', False, 'Username prefix to search.'), ('cursor', 'string', False, 'Page cursor returned by the prior response.')], 'object: {results: PublicUser[], next: string|null, previous: string|null}.'),
    '/users/{user_id}/': ([('user_id', 'string', True, 'User UUID in the URL.')], 'PublicUser object; private/unavailable profiles return 404.'),
    '/streak/': ([('activity fields', 'object', False, 'The current view accepts an empty body.')], 'object: updated streak information.'),
    '/now_playing/update': ([('track fields', 'object', True, 'Now-playing fields accepted by the legacy activity view.')], 'object: updated now-playing status.'),
    '/now_playing/{user_id}/': ([('user_id', 'string', True, 'User UUID in the URL.')], 'Now-playing status object.'),
    '/report/': ([('reportObj.report_type', 'string', True, 'Report category.'), ('reportObj.reported_id', 'string', True, 'ID of reported account or content.'), ('reportObj.report_text', 'string', True, 'Reason for the report.')], 'object: {message: string}; mail-not-configured returns 503.'),
    '/gpt-chat/': ([('query', 'string', True, 'Question for the Exercise Bot.'), ('conversation', 'object[]', False, 'Recent {role, content} messages; at most 12 are sent by the app.')], 'object: {gpt_response: string, exercises?: Exercise[], calendar_action?: CalendarAction}; request limit returns 429.'),
    '/spotify/': ([], 'object: {configured: boolean, connected: boolean}.'),
    '/spotify/connect/': ([], 'object: {url: string} for Spotify authorization.'),
    '/spotify/callback/': ([('code', 'string', True, 'OAuth authorization code from Spotify.'), ('state', 'string', True, 'OAuth state value checked by the server.')], 'HTML connection result page and app return link.'),
    '/spotify/player/': ([('action', 'string', True, 'For POST: play, pause, next, or previous.')], 'For GET: PlayerState object. For POST: no body (HTTP 204).'),
    '/token/swap/': ([], 'No response body; always HTTP 410 Gone. Deprecated; use /spotify/connect/.', True, 'Retired token exchange. Use /spotify/connect/ and the Spotify callback.'),
    '/spotify/token/refresh/': ([], 'No response body; always HTTP 410 Gone. Deprecated; credentials stay on the server.', True, 'Retired token refresh route. Use /spotify/connect/ and /spotify/player/.')
}

FRONTEND_CONTRACTS = {
    'useAuth.checkToken()': ([], 'Promise<boolean>; updates isAuthenticated and isLoading.'),
    'useVerifyToken.verifyToken(token)': ([('token','string',True,'JWT to check.')], 'Promise<boolean>; false when invalid or the request fails.'),
    'useRegister.register(userData)': ([('userData','RegisterRequest',True,'Email, password, and optional registration fields.')], 'Promise<void>; sets otpSent when verification is needed; throws on failure.'),
    'useRegister.verifyOTP({email, otp})': ([('email','string',True,'Registration email.'),('otp','string',True,'Email verification code.')], 'Promise<boolean>; stores session tokens and loads the profile.'),
    'useRegister.resendOTP(email)': ([('email','string',True,'Registration email.')], 'Promise<object>; API confirmation or an error.'),
    'useLogin.login(identifier, password)': ([('identifier','string',True,'Username or email.'),('password','string',True,'Account password.')], 'Promise<boolean>; stores tokens and profile; throws on failure.'),
    'useLogin.appleLogin(appleObject)': ([('appleObject','{id_token: string}',True,'Apple identity response containing the identity token.')], 'Promise<boolean>; stores tokens and profile; returns false on failure.'),
    'useUser.getUser(token?)': ([('token','string|null',False,'Optional access JWT; stored token is used by default.')], 'Promise<User>; throws if the request fails.'),
    'useResetPassword.requestPasswordReset(email)': ([('email','string|object',True,'Account email as text, or an object containing email.')], 'Promise<string|undefined>; confirmation message.'),
    'useResetPassword.resetPassword({email, token, new_password})': ([('email','string',True,'Account email.'),('token','string',True,'One-time reset token.'),('new_password','string',True,'New password.')], 'Promise<string|undefined>; success confirmation or throws on failure.'),
    'useUpdateUser.updateUser(userData)': ([('userData','Partial<User>',True,'Profile fields to change.')], 'Promise<string>; confirmation message.'),
    'useDeleteProfile.deleteProfile()': ([], 'Promise<boolean>; true on success, then clears local session; false if it fails.'),
    'useLogout.logout()': ([], 'Promise<boolean>; true when local tokens are cleared.'),
    'useExercises.searchExercises(search)': ([('search','string',True,'Text to search for.')], 'Promise<Exercise[]>; catalog matches.'),
    'useMuscleExercise(bodyPart).refresh()': ([('bodyPart','string',True,'Primary muscle filter, passed when creating the hook.')], 'void; starts a fresh first-page request. Results and loading/error state are returned by the hook.'),
    'useMuscleExercise(bodyPart).loadMoreExercises()': ([], 'void; starts the next-page request when a next cursor exists.'),
    'useSaveWorkOuts.saveWorkouts(exercise)': ([('exercise','Exercise',True,'Catalog exercise with an id.')], 'Promise<SavedWorkout|null>; null when a save is already underway.'),
    'useSavePlannedWorkouts.savePlannedWorkouts(workout)': ([('workout','PlannedWorkoutInput',True,'One calendar entry; the hook sends it in the workout field.')], 'Promise<PlannedWorkout>; null while another save is underway.'),
    'useFetchedSavedWorkOuts.refresh()': ([], 'Promise<void>; updates fetchedExercises, loading, and error.'),
    'useFetchedPlanedWorkouts.fetchPlannedWorkouts()': ([], 'Promise<PlannedWorkout[]>; current user calendar entries.'),
    'useUploadWorkOuts.refresh()': ([], 'Promise<void>; updates userWorkouts, publicWorkouts, loading, and error state.'),
    'useUploadWorkOuts.addWorkout(exercise)': ([('exercise','CustomWorkoutInput',True,'Custom workout fields such as name, equipment, muscles, instructions, and image URLs.')], 'Promise<string>; creation confirmation message.'),
    'useDeleteWorkout.deleteSavedWorkout(id)': ([('id','integer',True,'Saved exercise record ID.')], 'Promise<boolean>; true after deletion.'),
    'useDeleteWorkout.deletePlannedWorkout(id)': ([('id','integer',True,'Calendar entry ID.')], 'Promise<boolean>; true after deletion.'),
    'useDeleteWorkout.deleteUserSavedWorkout(id)': ([('id','string',True,'Custom workout UUID.')], 'Promise<boolean>; true after deletion.'),
    'useFilePicker.pickFile()': ([], 'Promise<SelectedFile|null>; null on cancel or invalid file; updates file/error state.'),
    'useS3Uploader.uploadToS3(file, path)': ([('file','SelectedFile',True,'Local image URI with optional name and MIME type.'),('path',"'profile'|'exercises'",True,'Destination image category.')], 'Promise<string>; uploaded image URL; throws on failure.'),
    'useUsers.fetchUsers()': ([], 'Promise<void>; appends next page into users; loading/error/hasMore are hook state.'),
    'useReport.reportUser(reportObj)': ([('reportObj','{report_type: string, reported_id: string, report_text: string}',True,'Report details.')], 'Promise<string>; confirmation message.'),
    'useChat.sendMessage(text)': ([('text','string',True,'Question for the bot; AI consent must be granted.')], 'Promise<void>; appends reply or sets error state.'),
    'useChat.retryMessage()': ([], 'Promise<void>; retries the last failed question.'),
    'useChat.addWorkoutToCalendar(messageId)': ([('messageId','string',True,'Assistant message ID with a proposed calendar action.')], 'Promise<void>; saves plan after the user chooses Add, updates action status.'),
    'useChat.clearConversation()': ([], 'void; clears in-memory messages and errors.'),
    'useSpotify.refresh()': ([], 'Promise<void>; updates connection and player state.'),
    'useSpotify.connect()': ([], 'Promise<void>; opens Spotify authorization in the browser.'),
    'useSpotify.disconnect()': ([], 'Promise<void>; removes the connection.'),
    'useSpotify.control(action)': ([('action',"'play'|'pause'|'next'|'previous'",True,'Playback action.')], 'Promise<void>; refreshes player state after the request.'),
    'apiFetch(url, options)': ([('url','string',True,'API endpoint URL.'),('options','RequestInit',False,'Fetch options; authorization is attached by the helper.')], 'Promise<Response>; refreshes expired access tokens and handles session expiry.'),
    'readResponse(response)': ([('response','Response',True,'HTTP response from fetch.')], 'Promise<any>; parsed response data; throws a readable error for failed requests.'),
    'fetchWithTimeout(url, options)': ([('url','string',True,'Full request URL.'),('options','RequestInit',False,'Standard fetch options.')], 'Promise<Response>; aborts after 20 seconds.'),
    'getAuthToken()': ([], 'Promise<string|null>; current access token, refreshed token, or null.'),
    'refreshAccessToken()': ([], 'Promise<string|null>; refreshed access token or null when refresh fails.'),
    'onSessionExpired(listener)': ([('listener','() => void',True,'Function called after the local session is cleared.')], '() => void; call the returned function to stop listening.'),
    'useSetExercise()': ([], 'ExerciseContext value; throws if used outside ExerciseProvider.'),
    'useUserContext()': ([], 'UserContext value containing user, token, authentication, and update functions.'),
    'useSpotify()': ([], 'SpotifyContext value, or null when used outside NowPlayingProvider.'),
    'useSpotify.togglePlayer()': ([], 'Promise<void>; saves the visibility choice for this account and rolls back the display change if storage fails.'),
    'useGPTExerciseChat()': ([], 'Same return value as useChat(); this is a legacy alias.'),
    'ExerciseContext.addExercises(exercise)': ([('exercise','Exercise|Exercise[]',True,'One exercise or a list to add to the selected exercise list.')], 'void; adds only exercises whose IDs are not already selected.'),
    'ExerciseContext.removeExercise(id)': ([('id','string',True,'Exercise ID to remove from the current selection.')], 'void; updates the in-memory selected list.'),
    'exerciseRequest(path, method?, body?)': ([('path','string',True,'API path relative to API_URL.'),('method','string',False,'HTTP method; defaults to GET.'),('body','unknown',False,'Optional JSON request body.')], 'Promise<any>; parsed successful response; throws on network, HTTP, or response errors.'),
    'expireSession()': ([], 'Promise<void>; removes saved access and refresh tokens and notifies registered listeners.'),
    'ChatProvider.send(content, appendUser)': ([('content','string',True,'Question to send.'),('appendUser','boolean',True,'Whether to add a new user message before the request.')], 'Promise<void>; updates chat messages/loading/error state.'),
    'isCalendarWorkoutAction(value)': ([('value','unknown',True,'Untrusted calendar proposal returned by the bot.')], 'boolean; true only for a structurally valid workout proposal.'),
    'NowPlayingProvider.request(path?, method?, body?)': ([('path','string',False,'Spotify API path after /spotify/.'),('method','string',False,'HTTP method; defaults to GET.'),('body','object',False,'Optional JSON request body.')], 'Promise<any>; parsed Spotify API response or null for an empty response.'),
    'perform(work)': ([('work','() => Promise<void>',True,'Spotify request and the follow-up state update.')], 'Promise<void>; records errors and restores busy state when complete.'),
    'fetchPage(url, append, version)': ([('url','string',True,'Catalog page URL or next cursor.'),('append','boolean',True,'Whether to append to current results.'),('version','number',True,'Request generation that identifies stale results.')], 'Promise<void>; updates exercise list, cursor, and loading/error state.'),
    'loadAll(path)': ([('path','string',True,'Endpoint path to read across cursor pages.')], 'Promise<any[]>; combined result items from every page.'),
    'formatDate(dateObj, formatType)': ([('dateObj','string|Date',True,'Date string or Date value.'),('formatType',"'full'|'mm-dd-yy'|'mm-yy'",True,'Display format to use.')], 'string; formatted date, or an invalid-date/format message.'),
    'convertToDecimalFeet(feet, inches)': ([('feet','number',True,'Whole feet.'),('inches','number',True,'Additional inches.')], 'number; total height as decimal feet.'),
    'formatDecimalFeet(decimalHeight)': ([('decimalHeight','number',True,'Height in decimal feet.')], 'string; feet and rounded inches.'),
    'formatWeight(dirtyWeight)': ([('dirtyWeight','number|undefined',True,'Weight value to round.')], 'number|string; four-significant-digit number, or invalid-weight message.'),
    'getImageUrl(url)': ([('url','string',True,'GitHub blob URL.')], 'string; raw.githubusercontent.com URL.'),
    'determineStreakIcon()': ([], 'undefined; the exported function is currently an empty placeholder.'),
}

# React Native method details are written from the release branch call sites.
# Each entry explains the work in the order a caller experiences it; the
# signature, parameter table, result, and source link stay separately visible.
FRONTEND_METHOD_LOGIC = {
    'useAuth.checkToken()': 'Reads the saved access token (refreshing it if needed), requests the signed-in profile, updates isAuthenticated, and always clears the loading flag.',
    'useVerifyToken.verifyToken(token)': 'Posts the token to the verification endpoint and returns false when the server rejects it or the request fails. It always clears its loading flag.',
    'useRegister.register(userData)': 'Posts the registration fields and checks the response. When the server asks for email verification, it sets otpSent so the screen can show the code form. Failed requests are rethrown for the screen to handle.',
    'useRegister.verifyOTP({email, otp})': 'Submits the email and code, saves the returned access and refresh tokens, fetches the new profile, updates user/authentication context, and returns whether activation succeeded.',
    'useRegister.resendOTP(email)': 'Requests a replacement verification code for the email and returns the parsed confirmation or throws the API error.',
    'useLogin.login(identifier, password)': 'Sends the sign-in credentials, stores the token pair, fetches the profile, and updates user/authentication context. Failed credentials are surfaced as a readable error.',
    'useLogin.appleLogin(appleObject)': 'Sends Apple’s identity-token payload to the server, stores the returned tokens, fetches the profile, and marks the account signed in; returns false if the exchange fails.',
    'useUser.getUser(token?)': 'Uses the supplied token or obtains the saved/refreshed token, requests the current profile, checks the response, and returns the profile object.',
    'useResetPassword.requestPasswordReset(email)': 'Posts the account email to request a reset message and returns the server’s generic confirmation, whether or not that email belongs to an account.',
    'useResetPassword.resetPassword({email, token, new_password})': 'Posts the email, one-time link token, and replacement password, then returns the success message or a readable validation error.',
    'useUpdateUser.updateUser(userData)': 'Gets the current access token, posts only the supplied profile changes, parses the updated user, and replaces the profile held in context.',
    'useDeleteProfile.deleteProfile()': 'Deletes the signed-in account with the saved token, then runs logout and token checking so the app clears the removed account’s session.',
    'useLogout.logout()': 'Removes access and refresh tokens from device storage and clears user, token, and authenticated state in context. It does not depend on a server logout request.',
    'useExercises.searchExercises(search)': 'Encodes the search text for a URL, requests the matching catalog page through the shared authenticated client, and returns its results array.',
    'useMuscleExercise(bodyPart).refresh()': 'Invalidates older in-flight results, clears the current list and error, then requests the first catalog page for the selected muscle. The special legs category is left for its existing muscle-selection cards.',
    'useMuscleExercise(bodyPart).loadMoreExercises()': 'Does nothing while another page is loading or when there is no next cursor; otherwise requests that cursor and appends unique exercise IDs.',
    'useSaveWorkOuts.saveWorkouts(exercise)': 'Prevents overlapping saves, posts the selected catalog exercise, stores an error for the screen if saving fails, then releases the busy/loading state.',
    'useSavePlannedWorkouts.savePlannedWorkouts(workout)': 'Prevents duplicate taps while a request is active, posts the planned-workout payload, returns the created plan, and clears its loading guard even after a failure.',
    'useFetchedSavedWorkOuts.refresh()': 'Requests the signed-in user’s saved exercises and updates the list only if this request is still the newest one. It also records errors and finishes loading.',
    'useFetchedPlanedWorkouts.fetchPlannedWorkouts()': 'Requests the signed-in user’s calendar entries and returns the parsed list while exposing loading state to the screen.',
    'useUploadWorkOuts.refresh()': 'Loads all pages of the user’s custom workouts and, when enabled, all public workouts in parallel. It ignores stale responses after navigation and exposes loading/error state.',
    'useUploadWorkOuts.addWorkout(exercise)': 'Posts the custom workout fields, returns the server confirmation, and clears the loading state when the request finishes.',
    'useDeleteWorkout.deleteSavedWorkout(id)': 'Builds the saved-exercise delete route, sends DELETE through the shared request helper, and returns true when the record is removed.',
    'useDeleteWorkout.deletePlannedWorkout(id)': 'Builds the calendar-entry delete route, sends DELETE through the shared request helper, and returns true when the entry is removed.',
    'useDeleteWorkout.deleteUserSavedWorkout(id)': 'Builds the custom-workout delete route from its UUID, sends DELETE, and returns true after the server confirms deletion.',
    'useFilePicker.pickFile()': 'Opens the photo library for one compatible image, limits the chosen image to 5 MB, and stores the URI/name/type for later upload. Cancelled or invalid picks return null and update the error state.',
    'useS3Uploader.uploadToS3(file, path)': 'Builds multipart form data with the destination folder and local image, posts it to the backend upload route, then stores and returns the resulting display URL.',
    'useUsers.fetchUsers()': 'Requests the next profile page only when one exists and no request is already running, appends the results, and saves the next cursor. Search changes reset the list and wait briefly before the first request.',
    'useReport.reportUser(reportObj)': 'Sends the report details in the shape expected by the API, saves the returned confirmation message, and clears loading when complete.',
    'useUserContext()': 'Returns the shared signed-in user and session state. Throws a clear error when a screen calls it outside UserContextProvider.',
    'useChat.sendMessage(text)': 'Trims the question, prevents a second send while one is active, adds the user message, and sends up to 12 previous messages to the bot. It validates the reply/proposed calendar action, ignores stale replies after clearing or switching accounts, and stores failures for retry.',
    'useChat.retryMessage()': 'Resubmits the last failed question without adding a second copy of the user message; the same busy, stale-response, and error handling used by sendMessage applies.',
    'useChat.addWorkoutToCalendar(messageId)': 'Finds the selected assistant proposal, prevents duplicate saves, marks it as saving, posts the proposed exercises with weekday/time/sets/reps, and marks the proposal added or failed.',
    'useChat.clearConversation()': 'Invalidates pending replies, resets send/retry guards, and clears messages, loading, and error state from memory.',
    'useSpotify.refresh()': 'Checks connection status, requests playback only when configured and connected, and applies results only to the account that started the request. The provider refreshes on app resume, OAuth return, and while the visible player is active.',
    'useSpotify.connect()': 'Requests a short-lived authorization URL from the backend and opens it in the browser; the app refreshes status when Spotify returns through the app link.',
    'useSpotify.disconnect()': 'Asks the backend to remove this account’s Spotify connection, then clears the player track and connection status locally.',
    'useSpotify.control(action)': 'Sends one allowed playback action through the backend and refreshes the current player state after success.',
    'useSpotify.togglePlayer()': 'Shows or hides the player and saves that choice for the current account on the device; if storage fails, it restores the prior display state.',
    'useSpotify()': 'Returns the current Spotify context with connection/player state, loading/error information, and the refresh/connect/disconnect/control actions; returns null outside NowPlayingProvider.',
    'useGPTExerciseChat()': 'Legacy name that directly re-exports useChat, so it returns the same chat state and actions without making a separate request.',
    'apiFetch(url, options)': 'Rejects URLs outside the configured API host, attaches a saved/refreshed access token, sends the request, retries once after an expired-token response, and clears the local session when refresh fails.',
    'readResponse(response)': 'Returns null for an empty 204 response, otherwise parses JSON and turns server errors or malformed replies into readable JavaScript errors.',
    'fetchWithTimeout(url, options)': 'Sends a fetch request with a 20-second abort timer and converts a timeout into a user-readable error.',
    'getAuthToken()': 'Reads the stored access token first; if none is available, tries to refresh it from the saved refresh token.',
    'refreshAccessToken()': 'Sends the saved refresh token to the token endpoint, shares one in-flight refresh between simultaneous callers, saves rotated tokens, and clears the session if the server rejects it.',
    'onSessionExpired(listener)': 'Registers a callback that the API client runs after it removes an expired session; returns an unsubscribe function for cleanup.',
    'useSetExercise()': 'Returns ExerciseContext’s selected-exercise list and actions; throws if the provider is missing from the component tree.',
    'ExerciseContext.addExercises(exercise)': 'Accepts one exercise or a list, adds only IDs not already selected, and updates the in-memory context list.',
    'ExerciseContext.removeExercise(id)': 'Filters the selected-exercise list to remove the matching ID.',
    'exerciseRequest(path, method?, body?)': 'Builds a URL under the configured API origin, serializes an optional JSON body, sends it through apiFetch, and parses errors/results with readResponse.',
    'expireSession()': 'Removes both saved tokens and notifies every registered listener so user/session providers can clear their visible state.',
    'ChatProvider.send(content, appendUser)': 'Shared chat worker: validates non-empty text, prevents overlap, builds bounded conversation history, sends the request, checks the response, and stores either the assistant reply or retry information.',
    'isCalendarWorkoutAction(value)': 'Accepts a bot calendar action only when it has a day string, supported time slot, at least one workout, exercise IDs/names, and integer set/repetition counts.',
    'NowPlayingProvider.request(path?, method?, body?)': 'Adds the Spotify API base path and JSON headers when needed, then uses the authenticated API client and shared response parser.',
    'perform(work)': 'Runs at most one Spotify operation at a time, sets busy state, reports failures in context, and releases the operation guard when finished.',
    'fetchPage(url, append, version)': 'Loads one exercise-library cursor page, ignores it if refresh/navigation has made it stale, combines results without duplicate IDs, updates the next cursor, and resets loading flags.',
    'loadAll(path)': 'Follows each next-page URL until the server has no more results or a newer refresh invalidates the request.',
    'formatDate(dateObj, formatType)': 'Rejects missing or invalid dates and returns a localized month/year, short date, or month/year string depending on formatType.',
    'convertToDecimalFeet(feet, inches)': 'Converts the whole-foot value plus inches divided by 12 into decimal feet.',
    'formatDecimalFeet(decimalHeight)': 'Splits decimal feet into whole feet and rounded inches, then formats the result as feet-and-inches text.',
    'formatWeight(dirtyWeight)': 'Returns an invalid-weight label for missing or non-numeric input; otherwise rounds to four significant digits.',
    'getImageUrl(url)': 'Converts a GitHub repository blob URL to the raw.githubusercontent.com form used to display the image.',
    'determineStreakIcon()': 'This exported function has an empty body today. It does not choose or return an icon, so callers receive undefined.',
}

FRONTEND_METHOD_LINES = {
    'useAuth.checkToken()': 15, 'useVerifyToken.verifyToken(token)': 30,
    'useRegister.register(userData)': 90, 'useRegister.verifyOTP({email, otp})': 125,
    'useRegister.resendOTP(email)': 179, 'useLogin.login(identifier, password)': 292,
    'useLogin.appleLogin(appleObject)': 233, 'useUser.getUser(token?)': 197,
    'useResetPassword.requestPasswordReset(email)': 383, 'useResetPassword.resetPassword({email, token, new_password})': 356,
    'useUpdateUser.updateUser(userData)': 418, 'useDeleteProfile.deleteProfile()': 453,
    'useLogout.logout()': 64, 'useExercises.searchExercises(search)': 19,
    'useMuscleExercise(bodyPart).refresh()': 52, 'useMuscleExercise(bodyPart).loadMoreExercises()': 65,
    'useSaveWorkOuts.saveWorkouts(exercise)': 73, 'useSavePlannedWorkouts.savePlannedWorkouts(workout)': 86,
    'useFetchedSavedWorkOuts.refresh()': 100, 'useFetchedPlanedWorkouts.fetchPlannedWorkouts()': 119,
    'useUploadWorkOuts.refresh()': 139, 'useUploadWorkOuts.addWorkout(exercise)': 162,
    'useDeleteWorkout.deleteSavedWorkout(id)': 180, 'useDeleteWorkout.deletePlannedWorkout(id)': 181,
    'useDeleteWorkout.deleteUserSavedWorkout(id)': 182, 'useFilePicker.pickFile()': 37,
    'useS3Uploader.uploadToS3(file, path)': 19, 'useUsers.fetchUsers()': 92,
    'useReport.reportUser(reportObj)': 189, 'useUserContext()': 185,
    'useChat.sendMessage(text)': 101, 'useChat.retryMessage()': 101,
    'useChat.addWorkoutToCalendar(messageId)': 82, 'useChat.clearConversation()': 28,
    'useSpotify.refresh()': 34, 'useSpotify.connect()': 73, 'useSpotify.disconnect()': 77,
    'useSpotify.control(action)': 84, 'useSpotify.togglePlayer()': 88,
    'useSpotify()': 21, 'useGPTExerciseChat()': 196,
    'apiFetch(url, options)': 56, 'readResponse(response)': 75,
    'fetchWithTimeout(url, options)': 6, 'getAuthToken()': 25,
    'refreshAccessToken()': 30, 'onSessionExpired(listener)': 15,
    'useSetExercise()': 127, 'ExerciseContext.addExercises(exercise)': 22,
    'ExerciseContext.removeExercise(id)': 36, 'exerciseRequest(path, method?, body?)': 8,
    'expireSession()': 19, 'ChatProvider.send(content, appendUser)': 43,
    'isCalendarWorkoutAction(value)': 105, 'NowPlayingProvider.request(path?, method?, body?)': 33,
    'perform(work)': 64, 'fetchPage(url, append, version)': 40, 'loadAll(path)': 142,
    'formatDate(dateObj, formatType)': 1, 'convertToDecimalFeet(feet, inches)': 21,
    'formatDecimalFeet(decimalHeight)': 26, 'formatWeight(dirtyWeight)': 32,
    'getImageUrl(url)': 37,
    'determineStreakIcon()': 17,
}

# Routes are listed here by their client call sites so each client method can
# jump directly from its implementation notes to the matching API contract.
FRONTEND_API_ROUTES = {
    'useAuth.checkToken()': [('GET', '/user/')],
    'useVerifyToken.verifyToken(token)': [('POST', '/token/verify/')],
    'useRegister.register(userData)': [('POST', '/register/')],
    'useRegister.verifyOTP({email, otp})': [('POST', '/verify-otp/')],
    'useRegister.resendOTP(email)': [('POST', '/resend-otp/')],
    'useLogin.login(identifier, password)': [('POST', '/login/')],
    'useLogin.appleLogin(appleObject)': [('POST', '/social-login/')],
    'useUser.getUser(token?)': [('GET', '/user/')],
    'useResetPassword.requestPasswordReset(email)': [('POST', '/request-password-reset/')],
    'useResetPassword.resetPassword({email, token, new_password})': [('POST', '/reset-password/')],
    'useUpdateUser.updateUser(userData)': [('POST', '/user/update/')],
    'useDeleteProfile.deleteProfile()': [('DELETE', '/user/delete/')],
    'useExercises.searchExercises(search)': [('GET', '/exercises/')],
    'useMuscleExercise(bodyPart).refresh()': [('GET', '/exercises/')],
    'useMuscleExercise(bodyPart).loadMoreExercises()': [('GET', '/exercises/')],
    'useSaveWorkOuts.saveWorkouts(exercise)': [('POST', '/saveWorkOuts')],
    'useSavePlannedWorkouts.savePlannedWorkouts(workout)': [('POST', '/plannedWorkouts/')],
    'useFetchedSavedWorkOuts.refresh()': [('GET', '/userSavedWorkouts/')],
    'useFetchedPlanedWorkouts.fetchPlannedWorkouts()': [('GET', '/plannedWorkouts/')],
    'useUploadWorkOuts.refresh()': [('GET', '/user-upload-workouts/')],
    'useUploadWorkOuts.addWorkout(exercise)': [('POST', '/user-upload-workout/')],
    'useDeleteWorkout.deleteSavedWorkout(id)': [('DELETE', '/delete-saved-workout/{saved_workout_id}/')],
    'useDeleteWorkout.deletePlannedWorkout(id)': [('DELETE', '/delete-planned-workout/{planned_workout_id}/')],
    'useDeleteWorkout.deleteUserSavedWorkout(id)': [('DELETE', '/delete-user-workout/{workout_id}/')],
    'useS3Uploader.uploadToS3(file, path)': [('POST', '/uploads/')],
    'useUsers.fetchUsers()': [('GET', '/users/')],
    'useReport.reportUser(reportObj)': [('POST', '/report/')],
    'useChat.sendMessage(text)': [('POST', '/gpt-chat/')],
    'useChat.retryMessage()': [('POST', '/gpt-chat/')],
    'useChat.addWorkoutToCalendar(messageId)': [('POST', '/plannedWorkouts/')],
    'useSpotify.refresh()': [('GET', '/spotify/'), ('GET', '/spotify/player/')],
    'useSpotify.connect()': [('POST', '/spotify/connect/')],
    'useSpotify.disconnect()': [('DELETE', '/spotify/')],
    'useSpotify.control(action)': [('POST', '/spotify/player/')],
    'refreshAccessToken()': [('POST', '/token/refresh/')],
}

FRONTEND_METHOD_CALLS = {
    'useAuth.checkToken()': ['getAuthToken()', 'apiFetch(url, options)'],
    'useRegister.register(userData)': ['fetchWithTimeout(url, options)', 'readResponse(response)'],
    'useRegister.verifyOTP({email, otp})': ['fetchWithTimeout(url, options)', 'readResponse(response)', 'getAuthToken()', 'useUser.getUser(token?)'],
    'useLogin.login(identifier, password)': ['fetchWithTimeout(url, options)', 'readResponse(response)', 'getAuthToken()', 'useUser.getUser(token?)'],
    'useLogin.appleLogin(appleObject)': ['fetchWithTimeout(url, options)', 'readResponse(response)', 'getAuthToken()', 'useUser.getUser(token?)'],
    'useUser.getUser(token?)': ['apiFetch(url, options)', 'readResponse(response)'],
    'useResetPassword.requestPasswordReset(email)': ['fetchWithTimeout(url, options)', 'readResponse(response)'],
    'useResetPassword.resetPassword({email, token, new_password})': ['fetchWithTimeout(url, options)', 'readResponse(response)'],
    'useUpdateUser.updateUser(userData)': ['getAuthToken()', 'apiFetch(url, options)', 'readResponse(response)'],
    'useDeleteProfile.deleteProfile()': ['getAuthToken()', 'apiFetch(url, options)', 'useLogout.logout()'],
    'useExercises.searchExercises(search)': ['exerciseRequest(path, method?, body?)'],
    'useMuscleExercise(bodyPart).refresh()': ['fetchPage(url, append, version)'],
    'useMuscleExercise(bodyPart).loadMoreExercises()': ['fetchPage(url, append, version)'],
    'useSaveWorkOuts.saveWorkouts(exercise)': ['exerciseRequest(path, method?, body?)'],
    'useSavePlannedWorkouts.savePlannedWorkouts(workout)': ['exerciseRequest(path, method?, body?)'],
    'useFetchedSavedWorkOuts.refresh()': ['exerciseRequest(path, method?, body?)'],
    'useFetchedPlanedWorkouts.fetchPlannedWorkouts()': ['exerciseRequest(path, method?, body?)'],
    'useUploadWorkOuts.refresh()': ['loadAll(path)'],
    'useUploadWorkOuts.addWorkout(exercise)': ['exerciseRequest(path, method?, body?)'],
    'useDeleteWorkout.deleteSavedWorkout(id)': ['exerciseRequest(path, method?, body?)'],
    'useDeleteWorkout.deletePlannedWorkout(id)': ['exerciseRequest(path, method?, body?)'],
    'useDeleteWorkout.deleteUserSavedWorkout(id)': ['exerciseRequest(path, method?, body?)'],
    'useS3Uploader.uploadToS3(file, path)': ['apiFetch(url, options)', 'readResponse(response)'],
    'useReport.reportUser(reportObj)': ['exerciseRequest(path, method?, body?)'],
    'useChat.sendMessage(text)': ['ChatProvider.send(content, appendUser)', 'isCalendarWorkoutAction(value)', 'apiFetch(url, options)', 'readResponse(response)'],
    'useChat.retryMessage()': ['ChatProvider.send(content, appendUser)'],
    'useChat.addWorkoutToCalendar(messageId)': ['apiFetch(url, options)', 'readResponse(response)'],
    'useSpotify.refresh()': ['NowPlayingProvider.request(path?, method?, body?)'],
    'useSpotify.connect()': ['perform(work)', 'NowPlayingProvider.request(path?, method?, body?)'],
    'useSpotify.disconnect()': ['perform(work)', 'NowPlayingProvider.request(path?, method?, body?)'],
    'useSpotify.control(action)': ['perform(work)', 'NowPlayingProvider.request(path?, method?, body?)'],
    'apiFetch(url, options)': ['getAuthToken()', 'refreshAccessToken()', 'fetchWithTimeout(url, options)', 'expireSession()'],
    'getAuthToken()': ['refreshAccessToken()'],
    'refreshAccessToken()': ['fetchWithTimeout(url, options)', 'expireSession()'],
    'onSessionExpired(listener)': ['expireSession()'],
    'exerciseRequest(path, method?, body?)': ['apiFetch(url, options)', 'readResponse(response)'],
    'ChatProvider.send(content, appendUser)': ['apiFetch(url, options)', 'readResponse(response)', 'isCalendarWorkoutAction(value)'],
    'NowPlayingProvider.request(path?, method?, body?)': ['apiFetch(url, options)', 'readResponse(response)'],
    'perform(work)': ['useSpotify.refresh()'],
    'fetchPage(url, append, version)': ['apiFetch(url, options)', 'readResponse(response)'],
    'loadAll(path)': ['apiFetch(url, options)', 'readResponse(response)'],
}

ERROR_ANALYSIS = [
    {
        'group': 'Spotify playback',
        'signal': 'Spotify provider GET returns 204; app GET /api/spotify/player/ returns 200 with no track and device_active=false.',
        'meaning': 'The OAuth connection is valid, but Spotify reports no active playback session for this account.',
        'action': 'Start playback in Spotify on a device signed into the same Spotify account, then refresh the player.',
    },
    {
        'group': 'Spotify playback',
        'signal': 'spotify_playback_request method=POST action=next|previous status_code=200 followed by spotify_app_request_succeeded.',
        'meaning': 'The control succeeded. Spotify may return HTTP 200 with an empty response body for a playback action.',
        'action': 'The backend ignores control response bodies and returns 204 to the app. This behavior is covered by the HTTP 200 empty-body regression test (Heroku v94).',
    },
    {
        'group': 'Spotify playback',
        'signal': 'spotify_playback_no_active_device with provider status 404.',
        'meaning': 'Spotify has no device available for remote playback controls.',
        'action': 'Open Spotify and start or resume playback on a device connected to the same account.',
    },
    {
        'group': 'Spotify playback',
        'signal': 'spotify_playback_forbidden with provider status 403.',
        'meaning': 'Spotify denied the control request; the account may lack Premium playback access or app access may be restricted.',
        'action': 'Check the connected Spotify account and its playback entitlement. The API maps this provider rejection to a client validation error.',
    },
    {
        'group': 'Spotify playback',
        'signal': 'spotify_playback_rate_limited with provider status 429 and retry_after.',
        'meaning': 'Spotify rate-limited playback requests.',
        'action': 'Wait for the logged Retry-After interval before retrying. The backend returns 429.',
    },
    {
        'group': 'Spotify playback',
        'signal': 'spotify_playback_auth_rejected or spotify_stored_token_invalid.',
        'meaning': 'The stored access token failed after refresh, or could not be decrypted.',
        'action': 'The backend clears the unusable Spotify connection. Connect Spotify again in the app.',
    },
    {
        'group': 'Spotify playback',
        'signal': 'spotify_playback_network_error or spotify_playback_provider_error with status 5xx.',
        'meaning': 'The provider request timed out, could not connect, or Spotify returned a server error.',
        'action': 'Retry after connectivity recovers. Logs include the HTTP status or exception type and duration, never tokens or response bodies.',
    },
    {
        'group': 'Tracing a player request',
        'signal': 'Match spotify_playback_request and spotify_app_request_succeeded / spotify_app_request_failed by action and timestamp.',
        'meaning': 'The first event records Spotify’s provider response; the second records the app-facing outcome.',
        'action': 'If the provider returns 2xx but the app reports failure, compare the deployed Heroku release and the control response handling. Do not log OAuth tokens or provider response bodies.',
    },
]

API_RELEASE_NOTES = [
    {
        'group': 'v94 · October 27, 2026',
        'version': 'v94',
        'date': 'October 27, 2026',
        'category': 'Fixed',
        'title': 'Playback controls accept successful responses without a body',
        'endpoints': ['POST /api/spotify/player/'],
        'summary': 'Spotify returned HTTP 200 for a playback action, while the app received HTTP 503.',
        'details': 'The backend attempted to decode a response body that the control action does not use. Successful control responses are now accepted without parsing the body, and the app receives HTTP 204.',
        'diagnostics': [],
        'compatibility': 'No request or client changes are required. Existing play, pause, next, and previous controls use the corrected behavior.',
    },
    {
        'group': 'v93 · October 27, 2026',
        'version': 'v93',
        'date': 'October 27, 2026',
        'category': 'Diagnostics',
        'title': 'Spotify player requests include structured diagnostic events',
        'endpoints': ['GET /api/spotify/player/', 'POST /api/spotify/player/'],
        'summary': 'Provider outcomes and app-facing outcomes are logged separately so support can trace a request by action and timestamp.',
        'details': 'Playback logs include method, action, provider status, retry attempt, and duration. Network failures log exception type. Logs exclude access tokens and provider response bodies.',
        'diagnostics': [
            {'signal': 'Provider GET 204', 'meaning': 'No active playback session is available for this Spotify account.'},
            {'signal': 'Provider 403', 'meaning': 'Spotify denied playback access; check the connected account and its playback entitlement.'},
            {'signal': 'Provider 404', 'meaning': 'No active Spotify device is available for remote controls.'},
            {'signal': 'Provider 429', 'meaning': 'Spotify rate-limited the request; wait for the logged Retry-After interval.'},
            {'signal': '401 after refresh or invalid stored token', 'meaning': 'The backend clears the unusable connection; reconnect Spotify in the app.'},
            {'signal': 'Network failure or provider 5xx', 'meaning': 'Check connectivity/provider availability and retry after recovery.'},
        ],
        'compatibility': 'No API response shape changed. Match spotify_playback_request with spotify_app_request_succeeded or spotify_app_request_failed by action and timestamp.',
    },
]


@lru_cache(maxsize=16)
def _python_source_tree(source_path):
    source_file = Path(__file__).resolve().parent.parent / source_path
    try:
        return ast.parse(source_file.read_text(encoding='utf-8'))
    except (OSError, SyntaxError):
        return None


@lru_cache(maxsize=128)
def _python_source_info(source_path, symbol):
    """Read a Python definition’s signature and line for accurate source links."""
    if ' route (' in symbol:
        return None
    tree = _python_source_tree(source_path)
    if tree is None:
        return None
    owner, dot, method_name = symbol.rpartition('.')
    if dot:
        container = next((node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == owner), None)
        definitions = container.body if container else []
        definition = next((node for node in definitions if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == method_name), None)
    else:
        definition = next((node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == symbol), None)
    if definition is None:
        return None
    prefix = 'async def' if isinstance(definition, ast.AsyncFunctionDef) else 'def'
    signature = f"{prefix} {definition.name}({ast.unparse(definition.args)})"
    if definition.returns:
        signature += f" -> {ast.unparse(definition.returns)}"
    return {'line': definition.lineno, 'signature': signature}


def _reference_id(prefix, value):
    slug = ''.join(character.lower() if character.isalnum() else '-' for character in value)
    while '--' in slug:
        slug = slug.replace('--', '-')
    return f'{prefix}-{slug.strip("-")}'


def _python_helper_reference(item):
    source_info = _python_source_info(item['file'], item['name'].split('(')[0]) or {}
    line = source_info.get('line', item['line'])
    return dict(item, **source_info, returns=item.get('returns') or PYTHON_HELPER_RETURNS.get(item['id']),
                url=f"{GITHUB_SOURCE_ROOT}{item['file']}#L{line}")


def openapi_document():
    """Build a lightweight OpenAPI 3.1 reference from the published route catalog."""
    paths = {}
    python_methods = {}
    for group, method, path, summary, authenticated, request, response, frontend in ENDPOINTS:
        route = path.replace('{saved_workout_id}', '{saved_workout_id}').replace('{planned_workout_id}', '{planned_workout_id}').replace('{workout_id}', '{workout_id}').replace('{user_id}', '{user_id}')
        contract = API_CONTRACTS.get(path, ([], response))
        parameters, return_type = contract[:2]
        if method == 'GET' and path == '/spotify/player/':
            parameters = []
        if method == 'GET' and path == '/plannedWorkouts/':
            parameters = []
        if method == 'DELETE':
            parameters = [item for item in parameters if item[0].endswith('_id')]
        operation = {
            'summary': summary,
            'description': f'{group}. Request: {request or "none"} Response: {response} Frontend: {frontend}',
            'responses': {'200': {'description': response}, '400': {'description': 'Invalid request.'}, '401': {'description': 'Authentication required or token invalid.'}, '429': {'description': 'Rate limit exceeded.'}},
            'security': [{'BearerAuth': []}] if authenticated else [],
            'x-parameters': [dict(name=name, type=value_type, required=required, description=description) for name, value_type, required, description in parameters],
            'x-return-type': return_type,
        }
        operation_id = 'api-' + method.lower() + '-' + path.strip('/').replace('/', '-').replace('{', '').replace('}', '')
        if (method, path) in {(verb, route) for names in FRONTEND_API_ROUTES.values() for verb, route in names}:
            operation['x-frontend-methods'] = [
                _reference_id('frontend-method', name) for name, routes in FRONTEND_API_ROUTES.items()
                if (method, path) in routes
            ]
        if len(contract) > 2 and contract[2]:
            operation['deprecated'] = True
            operation['x-deprecation-notice'] = contract[3]
        source = PYTHON_HANDLERS.get((method, path))
        if source:
            source_path, line, symbol = source
            is_framework = ' route (' in symbol
            if is_framework:
                view_name = symbol.split(' route (', 1)[0]
                action = method.lower()
                method_symbol = f'{view_name}.{action}'
                method_id = _reference_id('framework-simplejwt', method_symbol)
                signature = None
                line = source[1]
            else:
                method_symbol = symbol
                view_name, separator, action = symbol.rpartition('.')
                if not separator:
                    view_name, action = symbol, 'function'
                method_id = _reference_id('python-method', f'{source_path}-{method_symbol}')
                source_info = _python_source_info(source_path, method_symbol)
                if source_info:
                    line = source_info['line']
                    signature = source_info['signature']
                else:
                    signature = f'{method_symbol}(...)'
            logic, helper_names = PYTHON_HANDLER_DETAILS.get(symbol, (summary, []))
            helper_ids = []
            for helper in helper_names:
                helper_id = next((item['id'] for item in PYTHON_HELPERS if item['name'].split('(')[0].split('.')[-1] == helper.split('.')[-1]), None)
                if helper_id and helper_id not in helper_ids:
                    helper_ids.append(helper_id)
            component_names = [name for name in helper_names if name.endswith('Serializer') or name.endswith('Field')]
            view_entry = python_methods.setdefault(method_id, {
                'id': method_id,
                'name': method_symbol,
                'class_name': view_name if '.' in method_symbol else None,
                'signature': signature,
                'kind': 'framework' if is_framework else 'handler' if '.' in method_symbol else 'function',
                'file': source_path if not is_framework else None,
                'url': f'{GITHUB_SOURCE_ROOT}{source_path}#L{line}' if not is_framework else None,
                'summary': PYTHON_VIEW_SUMMARIES.get(view_name, summary),
                'group': group,
                'endpoints': [],
            })
            endpoint_id = operation_id
            view_entry['endpoints'].append({
                'id': endpoint_id,
                'method': method.upper(),
                'handler': action,
                'path': path,
                'summary': summary,
                'business_logic': logic,
                'helpers': helper_ids,
                'components': component_names,
                'source_url': f'{GITHUB_SOURCE_ROOT}{source_path}#L{line}',
                'deprecated': operation.get('deprecated', False),
                'deprecation_notice': operation.get('x-deprecation-notice'),
            })
            operation['x-python-handler'] = {
                'id': method_id, 'name': method_symbol,
                'handler': action,
                'file': source_path if not is_framework else None,
                'url': f'{GITHUB_SOURCE_ROOT}{source_path}#L{line}' if not is_framework else None,
                'framework': 'Django REST Framework SimpleJWT' if is_framework else None,
            }
        openapi_parameters = []
        for name, value_type, required, description in parameters:
            if name.endswith('_id'):
                location = 'path'
            elif method == 'GET':
                location = 'query'
            else:
                continue
            openapi_parameters.append({'name': name, 'in': location, 'required': required or location == 'path', 'description': description, 'schema': {'type': 'string'}})
        if openapi_parameters:
            operation['parameters'] = openapi_parameters
        if method in ('POST', 'PUT', 'PATCH') and request and 'multipart/form-data' not in request:
            body_parameters = [dict(name=name, type=value_type, required=required, description=description) for name, value_type, required, description in parameters if name not in ('cursor', 'search', 'primaryMuscles') and not name.endswith('_id')]
            def schema_type(value_type):
                if '|' in value_type:
                    return {'anyOf': [{'type': part.strip()} for part in value_type.split('|')]}
                return {'type': {'integer': 'integer', 'number': 'number', 'string': 'string', 'boolean': 'boolean', 'object': 'object', 'object[]': 'array', 'string[]': 'array', 'file': 'string'}.get(value_type, 'string')}
            properties = {item['name']: {**schema_type(item['type']), 'description': item['description']} for item in body_parameters}
            operation['requestBody'] = {'required': True, 'content': {'application/json': {'schema': {'type': 'object', 'properties': properties, 'required': [item['name'] for item in body_parameters if item['required']]}, 'description': request}}}
        elif method in ('POST', 'PUT', 'PATCH') and 'multipart/form-data' in request:
            operation['requestBody'] = {'required': True, 'content': {'multipart/form-data': {'schema': {'type': 'object', 'properties': {'path': {'type': 'string', 'enum': ['profile', 'exercises']}, 'file': {'type': 'string', 'format': 'binary'}}, 'required': ['path', 'file']}}}}
        paths.setdefault('/' + route.lstrip('/'), {})[method.lower()] = operation
    return {
        'openapi': '3.1.0',
        'info': {'title': 'Exercise Plus API', 'version': '1.0.0', 'description': 'Backend HTTP API used by the Exercise Plus React Native client.'},
        'servers': [{'url': '/api', 'description': 'This Heroku application'}],
        'security': [{'BearerAuth': []}],
        'components': {'securitySchemes': {'BearerAuth': {'type': 'http', 'scheme': 'bearer', 'bearerFormat': 'JWT'}}},
        'paths': paths,
        'x-frontend-methods': [dict(
            id=_reference_id('frontend-method', name), group=group, name=name, signature=name,
            summary=summary, business_logic=FRONTEND_METHOD_LOGIC[name],
            source=f'exercisefrontend/{source}',
            url=f"{GITHUB_SOURCE_ROOT.replace('/exercise-backend/backend/', '/exercisefrontend/')}{source}#L{FRONTEND_METHOD_LINES[name]}",
            parameters=[dict(name=param, type=value_type, required=required, description=description) for param, value_type, required, description in FRONTEND_CONTRACTS.get(name, ([], 'void'))[0]],
            returns=FRONTEND_CONTRACTS.get(name, ([], 'Return type is documented in the method description.'))[1],
            api_operations=[
                'api-' + method.lower() + '-' + path.strip('/').replace('/', '-').replace('{', '').replace('}', '')
                for method, path in FRONTEND_API_ROUTES.get(name, [])
            ],
            calls=[_reference_id('frontend-method', called) for called in FRONTEND_METHOD_CALLS.get(name, [])],
            legacy=name == 'useGPTExerciseChat()',
            unimplemented=name == 'determineStreakIcon()',
        ) for group, name, summary, source in FRONTEND_METHODS],
        'x-python-methods': list(python_methods.values()),
        'x-python-helpers': [_python_helper_reference(item) for item in PYTHON_HELPERS],
        'x-data-models': [
            {'name': 'User', 'summary': 'A person’s account and profile. Private authentication fields stay on the server.', 'fields': [{'name':'id','type':'UUID','description':'Stable account identifier.'},{'name':'email','type':'string','description':'Unique sign-in email.'},{'name':'username','type':'string | null','description':'Optional public display name.'},{'name':'image_url','type':'string | null','description':'Profile image address.'},{'name':'height','type':'decimal | null','description':'Optional profile measurement.'},{'name':'weight','type':'decimal | null','description':'Optional current weight.'},{'name':'goal_weight','type':'decimal | null','description':'Optional target weight.'},{'name':'phone_number','type':'string | null','description':'Optional unique phone number.'},{'name':'streak','type':'integer','description':'Current activity streak.'},{'name':'last_active','type':'date | null','description':'Most recent activity date.'},{'name':'is_private','type':'boolean','description':'Whether profile details are private.'},{'name':'is_searchable','type':'boolean','description':'Whether others can find the profile.'}], 'relationships':['One account can own uploaded, saved, and planned workouts.'], 'source': {'file':'backend1/models.py','line':13,'url':f'{GITHUB_SOURCE_ROOT}backend1/models.py#L13'}},
            {'name': 'Exercise', 'summary': 'A built-in exercise in the shared exercise library.', 'fields': [{'name':'id','type':'UUID','description':'Stable exercise identifier.'},{'name':'name','type':'string','description':'Exercise name.'},{'name':'aliases','type':'JSON | null','description':'Alternative names.'},{'name':'primaryMuscles','type':'JSON | null','description':'Main muscles worked.'},{'name':'secondaryMuscles','type':'JSON | null','description':'Other muscles worked.'},{'name':'force, level, mechanic, equipment, category','type':'string | null','description':'Exercise classification details.'},{'name':'instructions, tips','type':'JSON | null','description':'Step-by-step guidance and tips.'},{'name':'description','type':'string | null','description':'Additional exercise information.'},{'name':'img_url','type':'JSON | null','description':'Exercise image addresses.'},{'name':'date_created, date_updated','type':'datetime','description':'Record creation and last update times.'}], 'relationships':['SavedWorkout records can point to a library Exercise.'], 'source': {'file':'backend1/models.py','line':56,'url':f'{GITHUB_SOURCE_ROOT}backend1/models.py#L56'}},
            {'name': 'UserUploadWorkedouts', 'summary': 'An exercise/workout entry uploaded by a user.', 'fields': [{'name':'id','type':'UUID','description':'Stable uploaded exercise identifier.'},{'name':'user','type':'User reference | null','description':'Owner account; deleting the account deletes its uploads.'},{'name':'name','type':'string','description':'Exercise name.'},{'name':'aliases, primaryMuscles, secondaryMuscles, instructions, tips, img_url','type':'JSON | null','description':'Flexible lists or image addresses.'},{'name':'force, level, mechanic, equipment, category','type':'string | null','description':'Exercise classification.'},{'name':'description','type':'string | null','description':'Additional details.'},{'name':'is_public, trainer_verified','type':'boolean | null','description':'Visibility and trainer review flags.'},{'name':'date_created, date_updated','type':'datetime','description':'Record creation and last update times.'}], 'relationships':['May be selected as the custom exercise for a PlannedWorkout.'], 'source': {'file':'backend1/models.py','line':78,'url':f'{GITHUB_SOURCE_ROOT}backend1/models.py#L78'}},
            {'name': 'SavedWorkout', 'summary': 'A library exercise saved to one person’s list.', 'fields': [{'name':'id','type':'integer','description':'Database-generated record identifier.'},{'name':'user','type':'User reference','description':'Account that saved it.'},{'name':'exercise','type':'Exercise reference','description':'Library exercise that was saved.'},{'name':'date_saved','type':'datetime','description':'When it was saved.'},{'name':'reps','type':'string | null','description':'Legacy optional repetition value.'}], 'relationships':['The same user cannot save the same exercise twice.'], 'source': {'file':'backend1/models.py','line':104,'url':f'{GITHUB_SOURCE_ROOT}backend1/models.py#L104'}},
            {'name': 'PlannedWorkout', 'summary': 'A workout scheduled for a weekday and time of day.', 'fields': [{'name':'id','type':'integer','description':'Database-generated record identifier.'},{'name':'user','type':'User reference','description':'Account that owns the plan.'},{'name':'saved_workout','type':'SavedWorkout reference | null','description':'Saved library exercise, when used.'},{'name':'custom_workout','type':'UserUploadWorkedouts reference | null','description':'User-uploaded exercise, when used.'},{'name':'day_of_the_week','type':'string','description':'Monday through Sunday.'},{'name':'time_of_day','type':'string','description':'Morning, Afternoon, Evening, or Anytime.'},{'name':'sets','type':'integer','description':'Number of sets.'},{'name':'reps','type':'string | null','description':'Repetitions; older free-text values remain readable.'}], 'relationships':['Exactly one of saved_workout or custom_workout must be set. A user can plan multiple sessions per day at different times.'], 'source': {'file':'backend1/models.py','line':116,'url':f'{GITHUB_SOURCE_ROOT}backend1/models.py#L116'}},
            {'name': 'NowPlayingTrack', 'summary': 'A cached display snapshot of a person’s current music track.', 'fields': [{'name':'id','type':'integer','description':'Database-generated record identifier.'},{'name':'user','type':'User reference','description':'One-to-one account link.'},{'name':'track_name','type':'string | null','description':'Track title.'},{'name':'artist_name','type':'string | null','description':'Artist name.'},{'name':'album_name','type':'string | null','description':'Album title.'},{'name':'album_image_url','type':'URL | null','description':'Album artwork address.'},{'name':'preview_url','type':'URL | null','description':'Optional preview address.'}], 'relationships':['At most one now-playing snapshot per account.'], 'source': {'file':'backend1/models.py','line':150,'url':f'{GITHUB_SOURCE_ROOT}backend1/models.py#L150'}},
            {'name': 'SpotifyConnection', 'summary': 'Private server-side Spotify authorization and token state.', 'fields': [{'name':'id','type':'integer','description':'Database-generated record identifier.'},{'name':'user','type':'User reference','description':'One-to-one account link.'},{'name':'access_token, refresh_token','type':'encrypted string','description':'Encrypted provider credentials; never returned by app APIs.'},{'name':'expires_at','type':'datetime | null','description':'Access-token expiry time.'},{'name':'pending_state, pending_verifier, pending_expires_at','type':'string / datetime','description':'Short-lived sign-in handshake state held by the backend.'}], 'relationships':['At most one Spotify connection per account.'], 'source': {'file':'backend1/models.py','line':161,'url':f'{GITHUB_SOURCE_ROOT}backend1/models.py#L161'}},
        ],
        'x-serializers': [
            {'name':'UserSerializer','model':'User','summary':'Creates and updates the signed-in user profile.','fields':[{'name':'id','type':'UUID','direction':'response only'},{'name':'email','type':'string','direction':'request and response'},{'name':'password','type':'string','direction':'request only; checked and hashed before storage'},{'name':'username','type':'string | null','direction':'request and response'},{'name':'streak','type':'integer','direction':'response only'},{'name':'image_url','type':'string | null','direction':'request and response'},{'name':'date_joined','type':'date string','direction':'response only'},{'name':'weight, height, goal_weight','type':'decimal | null','direction':'request and response'},{'name':'phone_number','type':'string | null','direction':'request and response'},{'name':'is_private, is_searchable','type':'boolean','direction':'request and response'}],'behavior':['Rejects non-positive measurements.','A response-only field is returned by the server but cannot be changed through this serializer.'],'source':{'file':'backend1/serializers.py','line':22,'url':f'{GITHUB_SOURCE_ROOT}backend1/serializers.py#L22'}},
            {'name':'PublicUserSerializer','model':'User','summary':'Returns only profile details intended for public views.','fields':[{'name':'id','type':'UUID','direction':'response'},{'name':'username','type':'string | null','direction':'response'},{'name':'image_url','type':'string | null','direction':'response'},{'name':'date_joined','type':'date string','direction':'response'},{'name':'streak','type':'integer','direction':'response'},{'name':'is_private, is_searchable','type':'boolean','direction':'response'}],'behavior':['Does not include email, password, or private authentication data.'],'source':{'file':'backend1/serializers.py','line':59,'url':f'{GITHUB_SOURCE_ROOT}backend1/serializers.py#L59'}},
            {'name':'ExerciseSerializer','model':'Exercise','summary':'Shapes library exercises for API responses.','fields':[{'name':'exercise fields except embedding','type':'model fields','direction':'response'}],'behavior':['Converts exercise image addresses into usable media links.','The internal 1536-number search embedding is deliberately omitted.'],'source':{'file':'backend1/serializers.py','line':7,'url':f'{GITHUB_SOURCE_ROOT}backend1/serializers.py#L7'}},
            {'name':'UserUploadWorkoutsSerializer','model':'UserUploadWorkedouts','summary':'Accepts and returns a user-uploaded exercise.','fields':[{'name':'img_url','type':'URL[]','direction':'request and response'},{'name':'primaryMuscles','type':'string[]','direction':'request and response'},{'name':'user','type':'User reference','direction':'response only'},{'name':'trainer_verified','type':'boolean','direction':'response only'},{'name':'other model fields','type':'model fields','direction':'request and response'}],'behavior':['Validates image addresses and formats image links for responses.'],'source':{'file':'backend1/serializers.py','line':12,'url':f'{GITHUB_SOURCE_ROOT}backend1/serializers.py#L12'}},
            {'name':'SavedWorkoutSerializer','model':'SavedWorkout','summary':'Creates a saved-exercise link and returns its exercise details.','fields':[{'name':'exercise_id','type':'UUID','direction':'request only'},{'name':'exercise','type':'Exercise object','direction':'response only'},{'name':'user','type':'User reference','direction':'response only'},{'name':'id, date_saved','type':'integer / datetime','direction':'response only'}],'behavior':['Looks up the exercise from exercise_id when saving.'],'source':{'file':'backend1/serializers.py','line':67,'url':f'{GITHUB_SOURCE_ROOT}backend1/serializers.py#L67'}},
            {'name':'PlannedWorkoutSerializer','model':'PlannedWorkout','summary':'Checks and returns scheduled workout details.','fields':[{'name':'saved_workout_details','type':'SavedWorkout object','direction':'response only'},{'name':'exercise','type':'UserUploadWorkedouts object','direction':'response only'},{'name':'reps','type':'integer 1–1000 or legacy string','direction':'request and response'},{'name':'sets','type':'integer 1–100','direction':'request and response'},{'name':'time_of_day','type':'Morning | Afternoon | Evening | Anytime','direction':'request and response; defaults to Anytime'},{'name':'user','type':'User reference','direction':'response only'}],'behavior':['Requires exactly one exercise source: saved workout or uploaded exercise.','Older free-text repetition values remain readable.'],'source':{'file':'backend1/serializers.py','line':93,'url':f'{GITHUB_SOURCE_ROOT}backend1/serializers.py#L93'}},
            {'name':'NowPlayingTrackSerializer','model':'NowPlayingTrack','summary':'Shapes the cached current-track snapshot.','fields':[{'name':'all model fields','type':'model fields','direction':'request and response'}],'behavior':[],'source':{'file':'backend1/serializers.py','line':111,'url':f'{GITHUB_SOURCE_ROOT}backend1/serializers.py#L111'}},
            {'name':'PlanRepetitionsField','model':'PlannedWorkout.reps','summary':'Reads numeric repetition counts while preserving legacy text.','fields':[{'name':'value','type':'integer or legacy string','direction':'request and response'}],'behavior':['Not a standalone API response; this field helper belongs to PlannedWorkoutSerializer.'],'source':{'file':'backend1/serializers.py','line':85,'url':f'{GITHUB_SOURCE_ROOT}backend1/serializers.py#L85'}},
            {'name':'MediaSerializerMixin','model':'User.image_url / UserUploadWorkedouts.img_url / Exercise.img_url','summary':'Shared helper for image ownership checks and temporary S3 display links.','fields':[{'name':'image address','type':'URL','direction':'validated on input and converted on output'}],'behavior':['Checks that uploaded media belongs to the signed-in user.','Creates one-hour signed read links from stable private S3 object addresses.'],'source':{'file':'backend1/media.py','line':59,'url':f'{GITHUB_SOURCE_ROOT}backend1/media.py#L59'}},
        ],
        'x-error-analysis': ERROR_ANALYSIS,
        'x-api-release-notes': API_RELEASE_NOTES,
    }
