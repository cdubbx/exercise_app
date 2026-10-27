# Backend Dev With Docker

This backend now supports a Docker-first dev loop so you do not need to re-initialize dependencies every run.

## What this setup gives you
- One command startup for Django + Redis
- Live code reload from your local files
- Persistent SQLite database in a Docker volume
- Same command surface for running tests and management commands

## Start
From `exercise-backend/backend`:

```bash
docker compose up --build
```

Backend will be available at `http://localhost:8000`.

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
- Your existing `.env` file is still used by Django (`python-dotenv` loads it from the project directory).
- `DATABASE_URL` is set by Docker Compose to `sqlite:////data/db.sqlite3` so DB state survives container rebuilds.
- `REDIS_URL` is set to `redis://redis:6379/0` for Channels when running in Docker.

