"""Published backend routes and React Native call sites for the API reference."""

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
# Python signatures copied from the request handlers so the methods section
# documents the code shape as well as the HTTP contract exposed to the app.
PYTHON_SIGNATURES = {
    'RegisterAPIView.post': 'def post(self, request)', 'VerifyOTPAPIView.post': 'def post(self, request)',
    'ResendOTPAPIView.post': 'def post(self, request)', 'LoginAPIView.post': 'def post(self, request)',
    'SigninWIthApple.post': 'def post(self, request)', 'UserView.get': 'def get(self, request)',
    'EditUserView.post': 'def post(self, request)', 'DeleteUserAccountView.delete': 'def delete(self, request)',
    'LogoutView.post': 'def post(self, request)', 'RequestPasswordResetAPIView.post': 'def post(self, request)',
    'ResetPasswordAPIView.post': 'def post(self, request)', 'password_reset_landing': 'def password_reset_landing(request)',
    'ExerciseListView.get_queryset': 'def get_queryset(self)', 'GetBodyPartWorkOutView.get': 'def get(self, request)',
    'SaveWorkOutView.post': 'def post(self, request)', 'UserSavedWorkoutsView.get': 'def get(self, request, *args, **kwargs)',
    'UserPlannedWorkoutsView.get': 'def get(self, request)', 'UserPlannedWorkoutsView.post': 'def post(self, request)',
    'DeleteSavedWorkoutView.delete': 'def delete(self, request, saved_workout_id)',
    'DeletePlannedWorkoutView.delete': 'def delete(self, request, planned_workout_id)',
    'UploadWorkOutView.post': 'def post(self, request)', 'GetUserUploadedWorkOutView.get_queryset': 'def get_queryset(self)',
    'DeleteUserUploadedWorkoutView.delete': 'def delete(self, request, workout_id)',
    'ImageUploadView.post': 'def post(self, request)', 'UserListView.get_queryset': 'def get_queryset(self)',
    'UserDetailView.get': 'def get(self, request, user_id)', 'TrackStreakView.post': 'def post(self, request)',
    'UpdateNowPlayingView.post': 'def post(self, request)', 'NowPlayingForUserView.get': 'def get(self, request, user_id)',
    'ReportIssueView.post': 'def post(self, request)', 'ExerciseChatView.post': 'def post(self, request)',
    'SpotifyStatusView.get': 'def get(self, request)', 'SpotifyStatusView.delete': 'def delete(self, request)',
    'SpotifyConnectView.post': 'def post(self, request)', 'SpotifyCallbackView.get': 'def get(self, request)',
    'SpotifyPlayerView.get': 'def get(self, request)', 'SpotifyPlayerView.post': 'def post(self, request)',
    'LegacySpotifyTokenView.post': 'def post(self, request)',
}
PYTHON_RETURNS = {
    'ExerciseListView.get_queryset': 'QuerySet[Exercise] — filtered exercises for the list view.',
    'GetUserUploadedWorkOutView.get_queryset': 'QuerySet[UserUploadWorkedouts] — records visible to this request.',
    'UserListView.get_queryset': 'QuerySet[User] — profiles allowed by the visibility and search filters.',
    'password_reset_landing': 'HttpResponse — HTML password reset form.',
    'TokenObtainPairView route (Django REST Framework SimpleJWT)': 'Response — access and refresh JWT pair, supplied by SimpleJWT.',
    'TokenRefreshView route (Django REST Framework SimpleJWT)': 'Response — refreshed access token, supplied by SimpleJWT.',
    'TokenVerifyView route (Django REST Framework SimpleJWT)': 'Response — token validity result, supplied by SimpleJWT.',
}
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
    ('Workouts', 'useUpdatePlannedWorkout.updatePlannedWorkout(id, changes)', 'Attempts to change a planned calendar entry. The matching PATCH route is not currently registered by this backend.', 'hooks/exercises.ts'),
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
    ('Spotify', 'useSpotify()', 'Read Spotify connection status, player state, and available controls.', 'context/NowPlayContextSpotify.tsx'),
    ('Chat', 'useGPTExerciseChat()', 'Legacy alias for useChat; provides the same chat methods.', 'hooks/exercises.ts'),
    ('API client', 'apiFetch(url, options)', 'Attach/refresh the JWT, enforce the configured API origin, and handle session expiry.', 'services/api.ts'),
    ('API client', 'readResponse(response)', 'Parse JSON and convert API failures into client errors.', 'services/api.ts'),
    ('API client', 'fetchWithTimeout(url, options)', 'Send a request that stops waiting after 20 seconds.', 'services/api.ts'),
    ('API client', 'getAuthToken()', 'Read the saved access token or refresh it when needed.', 'services/api.ts'),
    ('API client', 'refreshAccessToken()', 'Use the saved refresh token to get a new access token.', 'services/api.ts'),
    ('API client', 'onSessionExpired(listener)', 'Register a callback for when the saved sign-in expires.', 'services/api.ts'),
    ('Exercises', 'useSetExercise()', 'Read or update the selected exercise through ExerciseContext.', 'hooks/exercises.ts'),
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
    'useSavePlannedWorkouts.savePlannedWorkouts(workout)': ([('workout','PlannedWorkoutInput|PlannedWorkoutInput[]',True,'One or more calendar entries.')], 'Promise<PlannedWorkout|PlannedWorkout[]>; null while another save is underway.'),
    'useUpdatePlannedWorkout.updatePlannedWorkout(id, changes)': ([('id','integer',True,'Planned entry ID.'),('changes','PlannedWorkoutChanges',True,'day_of_the_week, time_of_day, sets, reps.')], 'Promise<PlannedWorkout>; currently fails until the backend registers PATCH /plannedWorkouts/{id}/.'),
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
    'useGPTExerciseChat()': ([], 'Same return value as useChat(); this is a legacy alias.')
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
        source = PYTHON_HANDLERS.get((method, path))
        if source:
            source_path, line, symbol = source
            method_id = f"{source_path.replace('/', '-')}-{symbol}".lower().replace('_', '-')
            method_id = ''.join(character if character.isalnum() or character == '-' else '-' for character in method_id)
            method_entry = python_methods.setdefault(method_id, {
                'id': method_id, 'name': symbol, 'file': source_path,
                'url': f'{GITHUB_SOURCE_ROOT}{source_path}#L{line}',
                'summary': summary, 'group': group, 'endpoints': [],
                'signature': PYTHON_SIGNATURES.get(symbol, 'Framework-provided method; see source registration.'),
                'python_return': PYTHON_RETURNS.get(symbol, 'rest_framework.response.Response — an HTTP response with a status code and response data.'),
            })
            method_entry['endpoints'].append({
                'method': method.upper(), 'path': path, 'summary': summary,
                'parameters': [dict(name=name, type=value_type, required=required, description=description) for name, value_type, required, description in parameters],
                'returns': return_type,
                'http_responses': operation['responses'],
                'deprecated': operation.get('deprecated', False),
                'deprecation_notice': operation.get('x-deprecation-notice'),
            })
            operation['x-python-handler'] = {
                'id': method_id, 'name': symbol,
                'file': source_path,
                'url': f'{GITHUB_SOURCE_ROOT}{source_path}#L{line}',
            }
        if len(contract) > 2 and contract[2]:
            operation['deprecated'] = True
            operation['x-deprecation-notice'] = contract[3]
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
        'x-frontend-methods': [dict(group=group, name=name, summary=summary, source=source,
            parameters=[dict(name=param, type=value_type, required=required, description=description) for param, value_type, required, description in FRONTEND_CONTRACTS.get(name, ([], 'void'))[0]],
            returns=FRONTEND_CONTRACTS.get(name, ([], 'Return type is documented in the method description.'))[1]) for group, name, summary, source in FRONTEND_METHODS],
        'x-python-methods': list(python_methods.values()),
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
