# Backend Dev With Docker

This backend supports a Docker-first dev loop so you do not need to re-initialize dependencies every run.

## What this setup gives you
- One command startup for Django + Redis
- Live code reload from your local files
- Persistent SQLite database in a Docker volume, initialized from the local development database on first start
- Local test account data for signing in during development
- Same command surface for running tests and management commands

## Start
From `exercise-backend/backend`:

```bash
docker compose up --build
```

Backend will be available at `http://localhost:8000`.

The first start copies `db.sqlite3` into the Docker volume, applies migrations, and loads `fixed_exercises.json` (873 catalog exercises). Together with the 34 exercise records in the checked-in database, a fresh database starts with 907 exercises. The database also includes the local account whose email is `cwwantong@gmail.com` (the saved username is also accepted by the login screen). Use that account's existing password. Normal restarts keep the volume and preserve changes. `docker compose down -v` removes it; the next start recreates it and loads the fixture again. If you already have an older volume, run `docker compose exec backend python manage.py loaddata fixed_exercises.json` once to add the catalog.

## Common commands

```bash
# start in background
docker compose up -d

# view logs
docker compose logs -f backend

# run tests
docker compose exec backend python manage.py test

# open Django shell
docker compose exec backend python manage.py shell

# stop services
docker compose down

# stop + remove persisted sqlite volume (hard reset)
docker compose down -v
```

## Environment notes
- Your existing `.env` file supplies Django and Docker email settings (`python-dotenv` loads it from the project directory, and Compose passes the email variables into the container).
- `DATABASE_URL` is set by Docker Compose to `sqlite:////data/db.sqlite3` so DB state survives container rebuilds.
- `REDIS_URL` is set to `redis://redis:6379/0` for Channels when running in Docker.

