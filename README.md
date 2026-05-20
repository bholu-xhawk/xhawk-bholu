# xhawk-bholu

A minimal Node.js + TypeScript application scaffold with Jest, ESLint, Prettier, Husky, and GitHub Actions CI. Uses native ESM and targets Node 20.

## Requirements

- Node.js 20.x (see .nvmrc)
- npm 10+

## Setup

- Install dependencies: `npm ci`
- Install Git hooks (Husky): `npm run prepare`

## Development

- Run in watch mode (ts-node ESM loader): `npm run dev`
- Lint code: `npm run lint`
- Format code: `npm run format`

## Build & Run

- Build TypeScript to dist: `npm run build`
- Start built app: `npm start`

## Testing

- Run Jest tests: `npm test`

## Project Structure

- `src/` — Source TypeScript
- `src/index.ts` — Entrypoint exporting `greet()`; prints a greeting when run
- `src/__tests__/` — Jest tests
- `dist/` — Compiled JavaScript output

## Git Hooks

- pre-commit: Runs lint-staged (ESLint + Prettier on changed files)
- pre-push: Runs test suite

If hooks are not installed, run `npm run prepare`.

## Continuous Integration

GitHub Actions runs lint, build, and tests on Node 20 for pushes and pull requests.
