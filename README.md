# Exercise App

A React Native exercise app with a Django API. The original screens, artwork, colors, and tab layout are retained. The core release focuses on authentication, exercise search, saved/custom exercises, weekly plans with sets and repetitions, profiles, uploads, and the tutorial.

## Backend

Use `exercise-backend/backend` as the canonical backend for this release. The older `exercise-backend-production` reference is a separate backend repository; it is not required for local setup and is not changed by this release.

```sh
cd exercise-backend/backend
cp .env.example .env
docker compose up --build
```

In another terminal, seed the exercise catalog once:

```sh
cd exercise-backend/backend
docker compose exec backend python manage.py loaddata fixed_exercises.json
```

Docker uses persistent volumes for the database and uploaded images. Without Docker, install `requirements.txt` in a virtual environment, run `python manage.py migrate`, load the same exercise fixture, then run `python manage.py runserver`.

Development email defaults to the console: verification codes and password-reset links appear in backend logs. Configure SMTP to send real email. Redis provides a shared OTP/throttle cache when configured; otherwise development uses an in-process cache.

## Mobile app

```sh
cd exercisefrontend
cp .env.example .env
npm ci
npm start
```

Set `API_BASE_URL` before starting Metro. Use `http://localhost:8000/api` for the iOS simulator, `http://10.0.2.2:8000/api` for the Android emulator, and an accessible HTTPS backend URL for physical devices/production. Restart Metro after changing the environment file.

On macOS, install the existing Gemfile/CocoaPods dependencies and run `bundle exec pod install` inside `ios`. Open `ios/exercisefrontend.xcworkspace` and build the `exercisefrontend` scheme, or run `npm run ios`. Both shared scheme names now point to the app target. Run `npm run android` with an Android emulator configured.

AWS credentials belong on the backend only. Mobile uploads send multipart images to the authenticated `/api/uploads/` endpoint. Local development stores images under `media/`. For S3, configure the backend bucket, AWS credential provider/role, region, and a readable HTTPS media base URL. Production must serve local media through persistent storage and a web server, or use S3.

## Checks

```sh
cd exercise-backend/backend
python manage.py test backend1
python manage.py makemigrations --check --dry-run
```

```sh
cd exercisefrontend
npm test -- --runInBand
npm run typecheck
npm run lint:core
```

See [core release notes](docs/core-release.md) for issue mapping, migration notes, and the remaining device checks. This release does not deploy or replace the existing hosted backend automatically.
