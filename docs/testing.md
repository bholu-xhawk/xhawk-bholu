# Testing Guide

This repo is a PNPM workspace with two apps:
- apps/web: React + Vite. Jest for unit/integration. Playwright for browser E2E.
- apps/api: Express. Vitest for integration tests.

## Web app (apps/web)

Unit/Integration (Jest):
- From apps/web: pnpm test
- From repo root: pnpm test:web

E2E (Playwright):
- One-time per machine: pnpm -C apps/web exec playwright install
- Start the dev server in another terminal: pnpm -C apps/web dev
- Run E2E tests: pnpm -C apps/web test:e2e
  - The example at apps/web/e2e/example.spec.js is marked test.skip by default. Remove .skip locally to enable it.
- Variants:
  - Headed mode: pnpm -C apps/web test:e2e:headed
  - UI mode: pnpm -C apps/web test:e2e:ui
- Config: apps/web/playwright.config.js
  - Default baseURL is http://localhost:5173. Override with PLAYWRIGHT_BASE_URL if your dev server runs on a different port.

## API (apps/api)

Integration tests (Vitest):
- From apps/api: pnpm test
- From repo root: pnpm test:api

## Workspace-wide

- Run all tests in all packages: pnpm test (at repo root)
- Build all packages: pnpm run build (at repo root)

Notes:
- We intentionally use Jest in apps/web and Vitest in apps/api. Mixing runners across packages is fine in a workspace.
- Playwright downloads browser binaries on first install per machine; that step is not needed in CI unless E2E is enabled.
