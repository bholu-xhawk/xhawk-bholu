# PostgreSQL Local Development Setup

This guide walks through installing and configuring PostgreSQL for local development. It covers native installs (macOS/Linux/Windows), a Docker option, creating a development database and user, wiring up environment variables, verifying connectivity, and troubleshooting common issues.

## Overview

- Choose an install method (package manager or Docker)
- Start the server
- Create a dedicated dev role and database
- Configure environment variables (e.g., DATABASE_URL)
- Verify with psql
- Run migrations/seeds (tooling-agnostic examples provided)

## Prerequisites

- A terminal with basic Unix tooling
- Admin privileges for installing packages
- Recommended: a password manager for storing local DB credentials

## Installation Options

### macOS

- Homebrew (recommended)
  - Install latest Postgres:
    ```bash
    brew update
    brew install postgresql@16
    # You can list other versions: brew search postgresql
    ```
  - Add to PATH (if Homebrew suggests it):
    ```bash
    echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
    source ~/.zshrc
    ```
  - Initialize and start (if not managed by brew services):
    ```bash
    initdb --locale=en_US.UTF-8 -D "$(brew --prefix)/var/postgresql@16"
    pg_ctl -D "$(brew --prefix)/var/postgresql@16" -l logfile start
    ```
  - Or use launch agent with Homebrew services:
    ```bash
    brew services start postgresql@16
    ```

### Ubuntu/Debian Linux

```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
# Service control
sudo service postgresql status
sudo service postgresql start
```

If multiple Postgres versions are installed, you can select the active cluster using `pg_lsclusters` and `pg_ctlcluster`.

### Fedora/CentOS/RHEL

```bash
sudo dnf install -y postgresql-server postgresql-contrib
# Initialize data dir (first time only)
sudo postgresql-setup --initdb
# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows

- Option 1: PostgreSQL official installer (EDB):
  - Download from https://www.postgresql.org/download/windows/
  - During installation, set a password for the `postgres` superuser and remember the port (default 5432).
- Option 2: Chocolatey
  ```powershell
  choco install postgresql
  ```
  Then use the “Stack Builder” or psql to verify.

### Docker (Any OS)

If you prefer containerized Postgres and to avoid host installs:

```bash
docker run --name app-postgres -e POSTGRES_USER=app_user -e POSTGRES_PASSWORD=app_password -e POSTGRES_DB=app_db -p 5432:5432 -d postgres:16
```

- Persist data with a volume:
  ```bash
  docker run --name app-postgres \
    -e POSTGRES_USER=app_user \
    -e POSTGRES_PASSWORD=app_password \
    -e POSTGRES_DB=app_db \
    -p 5432:5432 \
    -v "$HOME/.local/share/app-postgres:/var/lib/postgresql/data" \
    -d postgres:16
  ```
- Using Docker Compose (example snippet):
  ```yaml
  services:
    db:
      image: postgres:16
      ports:
        - "5432:5432"
      environment:
        POSTGRES_USER: app_user
        POSTGRES_PASSWORD: app_password
        POSTGRES_DB: app_db
      volumes:
        - db_data:/var/lib/postgresql/data
  volumes:
    db_data:
  ```

## Starting and Stopping the Server

- macOS (Homebrew services): `brew services start postgresql@16` and `brew services stop postgresql@16`
- Linux (systemd): `sudo systemctl start postgresql` and `sudo systemctl stop postgresql`
- Debian/Ubuntu SysV: `sudo service postgresql start` and `sudo service postgresql stop`
- Docker: `docker start app-postgres` and `docker stop app-postgres`

## Create a Dev Role and Database

Use `psql` to create a dedicated application role and database. The commands below assume you can connect as a superuser (e.g., `postgres`). On macOS Homebrew installs, your OS user may map to a superuser via peer/local trust.

```bash
# Connect as a superuser
psql -h localhost -U postgres
# or if peer auth is configured and your user is trusted:
# psql
```

Inside psql:

```sql
-- Replace with your desired credentials
CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
ALTER ROLE app_user CREATEDB;
CREATE DATABASE app_db OWNER app_user;

-- Optional: ensure app_user can create extensions in app_db
\c app_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Notes:
- On some Linux distros, default auth is "peer" for local connections, which maps OS users. You may need to switch methods in `pg_hba.conf` to `md5` or `scram-sha-256` if you want password auth.
- To change role passwords later:
  ```sql
  ALTER ROLE app_user WITH PASSWORD 'new_password';
  ```

## Environment Variables & Connection String

Standard variables for local development:

```bash
# .env.local (example)
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_DB=app_db
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
# General connection string (Postgres URI):
DATABASE_URL=postgresql://app_user:app_password@127.0.0.1:5432/app_db
```

- For Docker on Apple Silicon using colima or rancher-desktop, host may still be `127.0.0.1` if port is published.
- For remote devices/emulators, use your machine's LAN IP instead of `127.0.0.1`.

## Verify Connectivity

- Check server version:
  ```bash
  psql --version
  ```
- Connect using env vars (bash/zsh):
  ```bash
  psql "$DATABASE_URL" -c 'SELECT 1;'
  # or explicitly
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'SELECT current_database(), current_user;'
  ```
- Inspect databases and roles:
  ```bash
  psql -h localhost -U postgres -c '\l'
  psql -h localhost -U postgres -c '\du'
  ```

## Migrations and Seed Data (tooling-agnostic examples)

Replace these with the commands your project actually uses.

- Prisma (Node):
  ```bash
  npx prisma migrate dev
  npx prisma db seed
  ```
- Knex:
  ```bash
  npx knex migrate:latest
  npx knex seed:run
  ```
- Sequelize:
  ```bash
  npx sequelize db:migrate
  npx sequelize db:seed:all
  ```
- Flyway:
  ```bash
  flyway migrate
  ```

## Basic psql Cheat Sheet

```psql
\l           -- list databases
\c dbname    -- connect to database
\dt          -- list tables in current DB
\d table     -- describe table
\du          -- list roles
\q           -- quit
```

## Common Issues & Troubleshooting

- Port already in use (5432):
  - Another Postgres instance or service is running. Stop it or change your instance port.
  - On macOS with multiple versions, check `brew services list` and stop the unwanted version.
- Authentication failures (peer vs md5/scram):
  - Edit `pg_hba.conf` to set the appropriate method for your connection type, then reload:
    ```bash
    psql -c 'SELECT pg_reload_conf();'
    ```
- "database does not exist" or "role does not exist":
  - Recreate the role/db via the commands above, confirm owner matches.
- PATH problems (command not found):
  - Add the Postgres bin directory to your shell PATH (see macOS step above; on Linux it is often `/usr/lib/postgresql/<version>/bin` or `/usr/pgsql-<version>/bin`).
- Docker container not starting:
  - Check logs: `docker logs app-postgres`
  - Remove and recreate if the data dir has old permissions or a mismatched Postgres major version.
- Apple Silicon images:
  - Use `postgres:16` (multi-arch) or ensure your Docker runtime supports arm64.

## Next Steps

- Add a link to this guide from the repository README if desired.
- Align environment variable names with your application's backend configuration.
