# PostgreSQL Setup

This guide walks you through installing and running PostgreSQL for local development across macOS, Windows, and Linux. It also covers creating a dedicated database and user, configuring environment variables, and troubleshooting common issues.

If your project has additional requirements (e.g., specific schemas or migrations), treat this as a baseline and update sections accordingly.

## Prerequisites

- PostgreSQL 14 or newer is recommended
- Basic command line familiarity
- Optional: Docker (if you prefer containerized setup)

## Install Options

Choose ONE of the following approaches.

### Option A: Native installation

- macOS (Homebrew):
  - Install Homebrew (https://brew.sh) if you don’t have it
  - Install PostgreSQL:
    - brew update
    - brew install postgresql@14
  - Start the service:
    - brew services start postgresql@14
  - Client tools are available via `psql` after you add the versioned bin to your PATH (Homebrew gives guidance after install)

- Ubuntu/Debian:
  - sudo apt update
  - sudo apt install -y postgresql postgresql-contrib
  - Verify version: psql --version
  - Service typically starts automatically; check status:
    - sudo systemctl status postgresql

- Fedora/CentOS/RHEL:
  - Using the distro packages (example):
    - sudo dnf install -y postgresql-server postgresql-contrib
  - Initialize and start:
    - sudo postgresql-setup --initdb
    - sudo systemctl enable --now postgresql

- Windows:
  - Use the PostgreSQL installer from https://www.postgresql.org/download/windows/ OR
  - Chocolatey: choco install postgresql14 -y OR
  - winget: winget install -e --id PostgreSQL.PostgreSQL
  - After installation, ensure `psql` is in your PATH and the Windows service is running

### Option B: Docker

Run a local Postgres container with a persistent volume:

- One-off docker run:
  - docker run --name dev-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=appdb -p 5432:5432 -v pgdata:/var/lib/postgresql/data -d postgres:14

- docker-compose.yml snippet:
  
  version: '3.8'
  services:
    db:
      image: postgres:14
      restart: unless-stopped
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: appdb
      ports:
        - "5432:5432"
      volumes:
        - pgdata:/var/lib/postgresql/data
  volumes:
    pgdata:

- Logs and lifecycle:
  - docker logs -f dev-postgres
  - docker stop dev-postgres && docker start dev-postgres

## Initialize Database and User

If you used the Docker command above with POSTGRES_USER/DB set, you can skip to Connectivity Test. Otherwise, create a user and database with `psql`.

1) Connect to Postgres as an admin/superuser:
- macOS/Linux native: `sudo -u postgres psql` or `psql -U postgres`
- Docker: `docker exec -it dev-postgres psql -U postgres`

2) Create application role and database (adjust names/passwords):

CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
ALTER ROLE app_user CREATEDB;
CREATE DATABASE app_db OWNER app_user;
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;

3) Optional: enable extensions (inside the target database):

\c app_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

## Configuration

Set and document these standard variables in your .env or your runtime environment. Many frameworks and ORMs recognize similar variables. Adjust to your project as needed.

- POSTGRES_HOST=localhost
- POSTGRES_PORT=5432
- POSTGRES_DB=app_db
- POSTGRES_USER=app_user
- POSTGRES_PASSWORD=app_password

Example connection URL format (if your app prefers a single DSN):
- DATABASE_URL=postgresql://app_user:app_password@localhost:5432/app_db

## Connectivity Test

- Using psql with env vars:
  - PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT version();"

- Direct:
  - psql "host=localhost port=5432 user=app_user dbname=app_db password=app_password" -c "SELECT 1;"

- From Docker host to container:
  - psql -h localhost -p 5432 -U postgres -d appdb -c "\l"

## Migrations (placeholder)

- If this repository uses a migration tool (e.g., Prisma, Knex, Flyway, Liquibase, Django migrations), list the commands here
- Example:
  - npm run db:migrate
  - npm run db:seed

## Troubleshooting

- Port 5432 already in use
  - Another Postgres instance may be running
  - macOS/Homebrew: `brew services list` and stop any duplicate versions
  - Docker: check for a running container mapping 5432: `docker ps` and stop conflicting containers or change the published port

- Authentication failed for user
  - Verify POSTGRES_USER/POSTGRES_PASSWORD
  - Reset password (as admin): `ALTER USER app_user WITH PASSWORD 'new_password';`
  - In Docker, remember that environment variable changes require recreating the container to take effect

- Cannot connect with psql
  - Confirm service is running and listening on 0.0.0.0 or localhost
  - Check pg_hba.conf for host-based authentication settings (native installs)
  - Firewalls or corporate VPNs can block localhost or ports; try another port if needed

- Upgrading major versions
  - Back up data with `pg_dump` or `pg_dumpall`
  - For production-like data, consider `pg_upgrade` procedures

- Client tools missing
  - Ensure your PATH includes the bin directory where `psql` is installed (Homebrew often uses /opt/homebrew/opt/postgresql@14/bin on Apple Silicon)
