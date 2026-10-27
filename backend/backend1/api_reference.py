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
    ('Exercises', 'useMuscleExercise.refresh() / loadMoreExercises()', 'Load and paginate catalog results by muscle.', 'hooks/exercises.ts'),
    ('Workouts', 'useSaveWorkOuts.saveWorkouts(exercise)', 'Save a catalog exercise.', 'hooks/exercises.ts'),
    ('Workouts', 'useSavePlannedWorkouts.savePlannedWorkouts(workout)', 'Create a planned calendar entry.', 'hooks/exercises.ts'),
    ('Workouts', 'useFetchedSavedWorkOuts.refresh()', 'Load saved catalog exercises.', 'hooks/exercises.ts'),
    ('Workouts', 'useFetchedPlanedWorkouts.fetchPlannedWorkouts()', 'Load planned calendar entries.', 'hooks/exercises.ts'),
    ('Workouts', 'useUploadWorkOuts.refresh() / addWorkout(exercise)', 'Load custom workouts or create one.', 'hooks/exercises.ts'),
    ('Workouts', 'useDeleteWorkout.deleteSavedWorkout(id)', 'Delete a saved exercise.', 'hooks/exercises.ts'),
    ('Workouts', 'useDeleteWorkout.deletePlannedWorkout(id)', 'Delete a calendar entry.', 'hooks/exercises.ts'),
    ('Workouts', 'useDeleteWorkout.deleteUserSavedWorkout(id)', 'Delete a custom workout.', 'hooks/exercises.ts'),
    ('Images', 'useFilePicker.pickFile()', 'Select and validate a local image; no network request.', 'hooks/social.ts'),
    ('Images', 'useS3Uploader.uploadToS3(file, path)', 'Upload the selected image and return its URL.', 'hooks/social.ts'),
    ('Social', 'useUsers.fetchUsers()', 'Load the next page of visible user profiles.', 'hooks/social.ts'),
    ('Chat', 'useChat.sendMessage(text)', 'Send a question and recent conversation history to the bot.', 'context/ChatContext.tsx'),
    ('Chat', 'useChat.retryMessage()', 'Retry the last failed question.', 'context/ChatContext.tsx'),
    ('Chat', 'useChat.addWorkoutToCalendar(messageId)', 'Submit a bot-proposed plan after explicit user confirmation.', 'context/ChatContext.tsx'),
    ('Chat', 'useChat.clearConversation()', 'Clear the in-memory chat messages.', 'context/ChatContext.tsx'),
    ('Spotify', 'useSpotify.refresh()', 'Refresh connection and playback state.', 'context/NowPlayContextSpotify.tsx'),
    ('Spotify', 'useSpotify.connect()', 'Start OAuth and open the Spotify authorization page.', 'context/NowPlayContextSpotify.tsx'),
    ('Spotify', 'useSpotify.disconnect()', 'Disconnect the Spotify account.', 'context/NowPlayContextSpotify.tsx'),
    ('Spotify', 'useSpotify.control(action)', 'Play, pause, skip, or go to the previous track.', 'context/NowPlayContextSpotify.tsx'),
    ('API client', 'apiFetch(url, options)', 'Attach/refresh the JWT, enforce the configured API origin, and handle session expiry.', 'services/api.ts'),
    ('API client', 'readResponse(response)', 'Parse JSON and convert API failures into client errors.', 'services/api.ts'),
]

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


def openapi_document():
    """Build a lightweight OpenAPI 3.1 reference from the published route catalog."""
    paths = {}
    for group, method, path, summary, authenticated, request, response, frontend in ENDPOINTS:
        route = path.replace('{saved_workout_id}', '{saved_workout_id}').replace('{planned_workout_id}', '{planned_workout_id}').replace('{workout_id}', '{workout_id}').replace('{user_id}', '{user_id}')
        operation = {
            'summary': summary,
            'description': f'{group}. Request: {request or "none"} Response: {response} Frontend: {frontend}',
            'responses': {'200': {'description': response}, '400': {'description': 'Invalid request.'}, '401': {'description': 'Authentication required or token invalid.'}, '429': {'description': 'Rate limit exceeded.'}},
            'security': [{'BearerAuth': []}] if authenticated else [],
        }
        if '{' in route:
            operation['parameters'] = [
                {'name': part.split('}', 1)[0], 'in': 'path', 'required': True, 'schema': {'type': 'string'}}
                for part in route.split('{')[1:]
            ]
        if method in ('POST', 'PUT', 'PATCH') and request and 'multipart/form-data' not in request:
            operation['requestBody'] = {'required': True, 'content': {'application/json': {'schema': {'type': 'object', 'additionalProperties': True}, 'description': request}}}
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
        'x-frontend-methods': [dict(group=group, name=name, summary=summary, source=source) for group, name, summary, source in FRONTEND_METHODS],
        'x-error-analysis': ERROR_ANALYSIS,
    }
