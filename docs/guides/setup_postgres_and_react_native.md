# Setup Guide: PostgreSQL and React Native

This guide walks you through setting up a local PostgreSQL database and a React Native development environment for Android and iOS. It is designed for contributors who need a reliable local setup. Where tools evolve quickly, we link to official docs.

Note: React Native apps should not talk directly to PostgreSQL. The app should call your backend API (REST/GraphQL), and the backend connects to Postgres. This guide helps you stand up Postgres locally and prepare your RN tooling; wiring to a backend depends on your project.

## Overview

- PostgreSQL: install locally (Docker or native), create DB/user, set environment variables, verify connectivity
- React Native: install Node/Watchman/JDK, configure Android Studio & SDKs, set iOS tools on macOS (Xcode & CocoaPods), verify by running a sample app

## Prerequisites

- Git and a terminal
- Admin rights on your machine
- macOS, Linux, or Windows 10/11 (WSL2 recommended on Windows for local Unix-like tooling)

## PostgreSQL Setup

You can run Postgres via Docker (recommended for isolation) or install natively.

### Option A: Docker (single container)

1) Ensure Docker Desktop is installed and running.
2) Start Postgres:

```bash
docker run --name local-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_db -p 5432:5432 -d postgres:16
```

- Container name: local-postgres
- Default credentials: postgres/postgres
- Default DB: app_db

To persist data between restarts, add a volume:

```bash
docker run --name local-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_db -v pgdata:/var/lib/postgresql/data -p 5432:5432 -d postgres:16
```

### Option B: Docker Compose

Create docker-compose.yml in your project root:

```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_db
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Start:

```bash
docker compose up -d
```

### Option C: Native install (macOS, Linux)

- macOS (Homebrew):

```bash
brew install postgresql@16
brew services start postgresql@16
# Add to PATH if needed (Homebrew prints guidance)
```

- Ubuntu/Debian:

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

- Fedora:

```bash
sudo dnf install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

### Initialize database and user

Connect using psql and create an app user and database (skip user/db creation if you used POSTGRES_DB/USER above and are fine with defaults):

```bash
# If using Docker with default envs
psql "postgresql://postgres:postgres@localhost:5432/postgres" <<'SQL'
CREATE DATABASE app_db;
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user'
   ) THEN
      CREATE ROLE app_user LOGIN PASSWORD 'app_password';
   END IF;
END
$$;
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
SQL
```

Alternatively, attach to the container then run psql interactively:

```bash
docker exec -it local-postgres psql -U postgres
# inside psql
CREATE DATABASE app_db;
CREATE ROLE app_user LOGIN PASSWORD 'app_password';
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
```

#### App schema ownership (optional)
After DB creation, you may want the app user to own the schema:

```bash
psql "postgresql://postgres:postgres@localhost:5432/app_db" -c "ALTER SCHEMA public OWNER TO app_user;"
```

### Environment variables

Create a .env file at the project root (or wherever your backend expects) and add:

```env
# Postgres connection string for backend services
DATABASE_URL=postgresql://app_user:app_password@localhost:5432/app_db
# Alternative for Postgres superuser (use only locally)
PG_URL_SUPER=postgresql://postgres:postgres@localhost:5432/postgres
```

If you use tools like Prisma/TypeORM/Knex, adapt the variable names accordingly.

### Verification

- Check Postgres is listening:

```bash
pg_isready -h localhost -p 5432 || echo "pg_isready not found; try docker logs local-postgres"
```

- Connect via psql:

```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

- Using Docker logs:

```bash
docker logs --tail=100 local-postgres
```

## React Native setup

React Native requires platform-specific tooling. Follow these steps per OS.

### Core tooling

- Node.js LTS (18 or 20). Use nvm if available.

```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# restart shell, then
nvm install --lts
nvm use --lts

# Verify
node -v
npm -v
```

- Watchman (recommended on macOS):

```bash
# macOS
brew install watchman
```

- JDK 17:

```bash
# macOS (Homebrew)
brew install openjdk@17
sudo ln -sfn $(brew --prefix openjdk@17)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
# Linux (Debian/Ubuntu)
sudo apt update && sudo apt install -y openjdk-17-jdk
java -version
```

### Android development environment

1) Install Android Studio (latest stable). Open it once to install SDK components.
2) Install SDK platforms and tools:
   - Android SDK Platform 14+ (Android 14 / API 34) and optionally lower API for device coverage
   - Android SDK Build-Tools 34.x
   - Android SDK Command-line Tools
   - Android Emulator (optional if using physical device)
3) Configure environment variables in your shell profile (~/.bashrc, ~/.zshrc):

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"  # macOS default
# Linux default might be: $HOME/Android/Sdk
export ANDROID_HOME=${ANDROID_HOME:-$HOME/Android/Sdk}
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

4) Accept SDK licenses:

```bash
yes | sdkmanager --licenses || echo "Use Android Studio SDK Manager if sdkmanager not in PATH"
```

5) Start an emulator from Android Studio or connect a device with USB debugging enabled.

### iOS development environment (macOS only)

- Install Xcode from the App Store, open it once, and accept licenses.
- Install Command Line Tools:

```bash
xcode-select --install || true
```

- Install CocoaPods:

```bash
sudo gem install cocoapods
pod --version
```

### Creating/running a React Native app

If your project already exists, install dependencies and run from the project directory. If you need to sanity-check the environment with a fresh app:

```bash
npx react-native@latest init DemoApp --version 0.74
cd DemoApp
npm install
```

Run on Android:

```bash
npx react-native run-android
```

Run on iOS (macOS):

```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

### Connecting RN app to your backend

- Keep secrets out of the app bundle. Use env files at build time, or remote config.
- On Android emulator, host loopback from RN app uses 10.0.2.2 to reach your machine.
- On iOS simulator, use localhost.

Example base URL selection:

```js
const baseURL = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
});
```

Your backend should in turn use DATABASE_URL to connect to Postgres.

## Common issues & fixes

- Android build fails with "No acceptable Java found": ensure JDK 17 is installed and JAVA_HOME points to it.
- Metro bundler stuck/cached: stop all node processes, clear cache: `watchman watch-del-all; rm -rf $TMPDIR/metro-*; npx react-native start --reset-cache`.
- iOS pods fail: ensure Ruby works and CocoaPods is up-to-date. Try `pod repo update`.
- Port conflicts on 5432: another Postgres is running. Change published port or stop the other service.
- Cannot connect from Android emulator to localhost: use 10.0.2.2 instead of localhost.

## Troubleshooting

- Verify Postgres network:
  - `ss -ltnp | grep 5432` (Linux) or `lsof -iTCP:5432 -sTCP:LISTEN` (macOS)
- Check container health: `docker ps`, `docker logs local-postgres`
- Check Android SDK paths: `sdkmanager --list` and PATH contents
- Reset Gradle caches: remove `~/.gradle/caches` if builds behave strangely

## Resources

- PostgreSQL: https://www.postgresql.org/docs/
- React Native Getting Started: https://reactnative.dev/docs/environment-setup
- Android Studio: https://developer.android.com/studio
- CocoaPods: https://guides.cocoapods.org/using/getting-started.html
- Prisma: https://www.prisma.io/docs/ (if applicable)
- TypeORM: https://typeorm.io
