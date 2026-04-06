# PostgreSQL Seed Export/Import Validation (Local)

This guide validates that local PostgreSQL data can be exported and re-imported as seed data for Docker init-only seeding.

## Prereqs
- Local PostgreSQL running
- `psql`, `pg_dump`, `createdb`, `dropdb` available
- Database name: `exerciseplus`
- User: `cdubbx` (adjust if needed)

## 1) Export current DB to plain SQL

```bash
pg_dump -h localhost -p 5432 -U cdubbx -d exerciseplus \
  --no-owner --no-privileges \
  -f /tmp/exerciseplus_seed.sql
```

## 2) Create throwaway test DB and import dump

```bash
createdb -h localhost -p 5432 -U cdubbx exerciseplus_seed_test
psql -h localhost -p 5432 -U cdubbx -d exerciseplus_seed_test -f /tmp/exerciseplus_seed.sql
```

## 3) Validate import

```bash
psql -h localhost -p 5432 -U cdubbx -d exerciseplus_seed_test -c "\dt"
psql -h localhost -p 5432 -U cdubbx -d exerciseplus_seed_test -c "SELECT COUNT(*) FROM django_migrations;"
```

## 4) Clean up test DB (optional)

```bash
dropdb -h localhost -p 5432 -U cdubbx exerciseplus_seed_test
```

---

## Persistence Notes (for later Docker implementation)

- Docker DB persistence should use a named volume.
- Seeding should be init-only:
  - import seed SQL only when DB is empty/new
  - preserve developer changes across restarts
- Reset behavior:
  - `docker compose down` keeps DB data
  - `docker compose down -v` removes DB volume and triggers fresh seed on next startup

---

## Add Seed To Docker Compose (Init-Only)

This section shows one way to wire seed data into Docker so all developers start from the same DB snapshot, while still keeping persistence.

### 1) Move seed SQL into repo

Copy the validated dump into your backend repo, for example:

```bash
mkdir -p db/seed
cp /tmp/exerciseplus_seed.sql db/seed/seed.sql
```

### 2) Add a Postgres service with persistent volume

Example Compose service:

```yaml
services:
  postgres:
    image: ankane/pgvector:latest
    environment:
      POSTGRES_DB: exerciseplus
      POSTGRES_USER: cdubbx
      POSTGRES_PASSWORD: your_password_here
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/seed/seed.sql:/docker-entrypoint-initdb.d/001-seed.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cdubbx -d exerciseplus"]
      interval: 5s
      timeout: 3s
      retries: 20

volumes:
  postgres_data:
```

### 3) Point backend to Postgres

In backend service environment:

```yaml
DATABASE_URL: "postgresql://cdubbx:your_password_here@postgres:5432/exerciseplus"
```

Important: use `postgres` (service name), not `localhost`, when backend runs in Docker.

### 4) Understand init-only behavior

Files in `/docker-entrypoint-initdb.d/` run only when Postgres initializes a new empty data directory.

- First run with a new `postgres_data` volume: seed executes.
- Normal restarts: seed does not re-run.
- Reset and re-seed:

```bash
docker compose down -v
docker compose up --build
```

### 5) Optional: ensure pgvector extension

If your seed does not include extension setup, add at top of `seed.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Mixed OS Teams (Windows + macOS + Linux)

If your team uses mixed operating systems, the cleanest approach is to keep DB creation and seeding inside Docker/Postgres startup so nobody depends on host shell scripts.

- Put SQL files in `db/seed/`.
- Mount them into Postgres at `/docker-entrypoint-initdb.d/`.
- Use a named Postgres volume for persistence.
- Use `docker compose down -v` only when you want a full DB reset and re-seed.

This avoids differences between Bash, PowerShell, Git Bash, and WSL setup.

---

## How To Add SQL Files For Docker Init

Use this structure in your backend project:

```text
exercise-backend/backend/
  db/
    seed/
      001_extensions.sql
      010_schema_or_seed.sql
      020_more_seed.sql
```

### 1) Create folder and copy SQL files

```bash
mkdir -p db/seed
cp /tmp/exerciseplus_seed.sql db/seed/010_schema_or_seed.sql
```

Optional extension file:

```bash
cat > db/seed/001_extensions.sql <<'SQL'
CREATE EXTENSION IF NOT EXISTS vector;
SQL
```

### 2) Mount SQL directory in Compose

In your `postgres` service:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./db/seed:/docker-entrypoint-initdb.d:ro
```

Postgres runs files in that directory in filename order on first initialization of an empty DB volume.

### 3) File ordering convention

Use numeric prefixes so run order is predictable:

- `001_...sql` -> extensions/setup
- `010_...sql` -> schema/base objects (if applicable)
- `020_...sql` -> seed data

### 4) Apply changes

- First-time init (or after reset):

```bash
docker compose down -v
docker compose up --build
```

- Normal restart (keeps DB, does not re-run init SQL):

```bash
docker compose down
docker compose up
```
