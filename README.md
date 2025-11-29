# Exercise App Workspace

This repository contains the source for a small exercise/training app with separate backend and frontend code. The workspace includes a Django backend (development and a production-like copy) and a React Native frontend for iOS/Android.

**Layout (top-level)**
- `exercise-backend/` — primary Django project used for development.
  - `manage.py`, `requirements.txt`, `runtime.txt` and `db.sqlite3` (local SQLite DB)
  - `backend/` — Django app package with settings and URL config
  - `fixed_exercises.json`, `datadump.json` — sample data files
- `exercise-backend-production/` — production-like copy / deployment artifacts
  - `Procfile`, `requirements.txt`, `runtime.txt`, `db.sqlite3`, `data.json` and other dump files
  - Useful for reference when deploying (Heroku / similar)
- `exercisefrontend/` — React Native frontend
  - `package.json`, `App.tsx`, TypeScript sources, `ios/` and `android/` projects
  - `components/`, `screens/`, `context/`, `hooks/` etc.

## Quick Overview
- Backend: Django (Python). Uses SQLite for local development; see `exercise-backend/backend` for Django settings.
- Frontend: React Native + TypeScript. Uses Metro bundler and can be opened in Xcode via `ios/exercisefrontend.xcworkspace` for iOS simulator.

## Requirements (macOS / zsh)
- Python 3.x (same interpreter used to create `myenv` if present)
- Node.js + npm / Yarn for React Native
- Xcode (for iOS simulator builds)

## Backend — Setup & Run (development)
1. Open a terminal and create/activate a Python virtualenv (if not using provided `myenv`):

```bash
python3 -m venv myenv
source myenv/bin/activate
pip install -r exercise-backend/requirements.txt
```

2. Run migrations and start the dev server:

```bash
cd exercise-backend
python manage.py migrate
python manage.py loaddata fixed_exercises.json  # optional sample data
python manage.py runserver 0.0.0.0:8000
```

3. Database and dumps
- Local DB is `exercise-backend/db.sqlite3`. There are JSON dumps in `exercise-backend/` and `exercise-backend-production/`.

## Frontend — Setup & Run (React Native)
1. Install dependencies and start Metro:

```bash
cd exercisefrontend
npm install
npm start      # starts Metro bundler
```

2. Run on iOS simulator (macOS):

```bash
cd exercisefrontend/ios
open exercisefrontend.xcworkspace
# then build & run from Xcode (select a simulator)
```

Or run from CLI (if react-native CLI is set up):

```bash
npx react-native run-ios
```

3. Notes
- If Metro fails after code changes, try `npm start -- --reset-cache`.
- The frontend expects API endpoints from the backend; update API base URLs in `exercisefrontend/utils` or relevant context hooks.

## Production / Deployment Notes
- The `exercise-backend-production/` folder contains artifacts and sample `Procfile` used for deployment. Use the production `requirements.txt` and `runtime.txt` as reference.
- Always back up or export DB data before migrating/overwriting `db.sqlite3`.

## Helpful file references
- `exercise-backend/backend/settings.py` — Django settings (check DEBUG, allowed hosts, DB config)
- `exercisefrontend/App.tsx` — App entry for React Native
- `exercisefrontend/components/FloatingButton.tsx` — current working file in the editor

## Troubleshooting
- Backend: if migrations fail, ensure virtualenv Python version matches project expectations and dependencies are installed.
- Frontend: clear Metro cache or delete `node_modules` and reinstall when encountering unexpected bundler/runtime errors.

## Next steps I can help with
- Run the backend or frontend locally and verify connectivity
- Update README with specific API endpoints or environment variable examples
- Add quick npm scripts or Makefile to streamline start commands

If you want, I can open `exercisefrontend` and run `npm install` or start the iOS simulator now — tell me which you'd like.
