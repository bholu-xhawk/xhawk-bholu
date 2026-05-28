# PostgreSQL and React Native Setup Plan

This document standardizes local development setup for two key parts of the stack:
- PostgreSQL (via Docker Compose) for a consistent local database
- React Native (via Expo) for fast mobile development across iOS/Android/Web

It is documentation-only. No containers or app code are added to the repository yet. You can copy-paste the snippets into your local environment to get productive quickly. We can later upstream a docker-compose.yml and an apps/mobile skeleton as needed.

## Overview

- Database: PostgreSQL 15 (Docker) with a persistent local volume
- Mobile: Expo-managed React Native app (TypeScript) in apps/mobile
- Tooling: pnpm for JS/TS, psql for DB access
- Env: .env files for DB creds and mobile API base URL

## Prerequisites

- Docker Desktop (or Docker Engine) 24+
- Docker Compose v2
- Node.js LTS (18.x or 20.x)
  - Note: Expo SDKs often lag behind the latest Node majors. If you hit issues on Node 20+, try Node 18 LTS.
- pnpm 8+
- Git
- macOS or Linux recommended; Windows WSL2 works. For iOS simulator, macOS + Xcode is required.
- Optional for native builds:
  - iOS: Xcode + Command Line Tools
  - Android: Android Studio, SDK, platform tools, an emulator

## PostgreSQL Setup

This section uses a dedicated Docker Compose service for PostgreSQL so everyone shares a consistent local DB setup.

1) Create a local folder (not checked in) to hold your compose file and data volume, e.g. .dev/local-db

2) docker-compose.yml (example)

```yaml
version: "3.9"
services:
  db:
    image: postgres:15
    container_name: local-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: appsecret
      POSTGRES_DB: appdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10
    volumes:
      - ./pgdata:/var/lib/postgresql/data
```

- POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB are defaults; feel free to change them.
- Data is stored on your host at ./.dev/local-db/pgdata (relative to the compose file).

3) Start the DB

- cd .dev/local-db
- docker compose up -d
- docker compose ps

4) Verify and connect with psql

- docker exec -it local-postgres psql -U appuser -d appdb
- Or from host (if you have psql installed): psql "postgres://appuser:appsecret@localhost:5432/appdb"

5) Basic security and hygiene

- These credentials are for local-only. Do not reuse in production.
- Prefer network bindings to 127.0.0.1 only (default on Desktop). If you must expose to LAN, change the ports mapping and firewall.
- Back up or snapshot pgdata if you care about state. To reset, stop the container and delete pgdata.

6) Environment variables for apps

Expose a standard connection string for local apps:

- DATABASE_URL=postgres://appuser:appsecret@localhost:5432/appdb

Consider placing this in a project-level .env.local (not checked in) and using a library like dotenv or platform-specific env loaders.

### Optional: Migrations

Pick the tool that matches your server stack. A few common choices:
- Prisma Migrate (Node/TypeScript)
- Knex migrations (Node/TypeScript)
- Sequelize CLI (Node)
- Flyway or Liquibase (language-agnostic)

Regardless of tool, standardize:
- One command to apply migrations locally, e.g., pnpm db:migrate
- One command to reset + seed, e.g., pnpm db:reset
- Ensure migration commands accept DATABASE_URL from env

## React Native Setup (Expo)

This section outlines an Expo-managed workflow placed under apps/mobile. If the repository doesn’t yet contain this directory, you can bootstrap locally and later PR the skeleton.

1) Install Expo CLI

- pnpm dlx expo-cli --version
- If not installed globally: pnpm dlx create-expo-app@latest apps/mobile --template
  - Choose TypeScript template

2) Directory structure (recommended)

- apps/mobile
  - app/ (Expo Router or screens)
  - src/
  - package.json
  - tsconfig.json
  - .env (not checked in)

3) Install dependencies

Within apps/mobile:
- pnpm install

4) Environment configuration

Mobile apps often need to talk to your local API. Add an env var like EXPO_PUBLIC_API_BASE_URL:

- Create apps/mobile/.env (not committed):
  - EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

Notes:
- EXPO_PUBLIC_ prefix exposes the variable to the app. Do not put secrets here.
- For Android emulators, localhost from the emulator is the emulator itself:
  - Android Emulator: http://10.0.2.2:3000
  - Genymotion: http://10.0.3.2:3000
- For iOS Simulator, http://localhost:3000 works if the API runs on the host.
- For physical devices on the same Wi‑Fi, use your host’s LAN IP, e.g., http://192.168.1.10:3000

5) Run the app

From apps/mobile:
- pnpm expo start
- Press i for iOS simulator (macOS only)
- Press a for Android emulator
- Press w for web (Expo for Web)
- Or scan the QR code with the Expo Go app on your device

6) TypeScript and linting

- Use TS strict mode where possible
- Add ESLint + Prettier with a shared config if the monorepo already has one

7) API client wiring

- Centralize the base URL in a config module reading from process.env.EXPO_PUBLIC_API_BASE_URL
- Consider react-query or SWR for data fetching, and axios or fetch with a small wrapper

### Platform requirements and caveats

- iOS builds require macOS + Xcode
- Android builds require Android SDK and an emulator or device
- Simulator/device permissions (camera, location) need app.json/app.config updates
- Node compatibility: If the repo enforces Node 20 in .nvmrc or engines, confirm Expo SDK compatibility for that Node version; otherwise use Node 18

## Networking notes

- CORS: If your API enforces CORS, allow requests from the Expo dev server origin during development
- HTTPS: Most local APIs are HTTP. If you use HTTPS with a self-signed cert, devices may reject it; prefer HTTP on LAN for development
- Tunneling: Expo can tunnel via ngrok. If teammates can’t reach your API over LAN, use expo start --tunnel

## CI/CD pointers (future)

- Add a docker-compose.yml under infra/ or dev/ and a Makefile with targets (db-up, db-down, db-reset)
- For mobile, add EAS (Expo Application Services) config for build and submit
- For DB schema, enforce migrations in CI (apply to a disposable DB and run tests)

## Troubleshooting

- Port 5432 already in use: Stop other Postgres instances or map to a different host port (e.g., 5433:5432)
- Docker cannot mount volume on Windows: Use WSL2 and locate the compose project under the Linux filesystem
- Expo cannot connect to local API:
  - Use the correct base URL for your platform (localhost vs 10.0.2.2 vs LAN IP)
  - Ensure your machine firewall allows connections from simulator/device
  - Verify the API is running and reachable via curl from the emulator/device shell
- Node version mismatch: Switch Node versions with nvm (nvm use 18) if Expo SDK demands it
