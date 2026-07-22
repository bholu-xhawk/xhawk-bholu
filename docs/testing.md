# Testing

This workspace uses Jest for package unit and integration tests, and Playwright for browser E2E tests in the Vite web app.

## Prerequisites

- Node.js 20 or newer (see the root `.nvmrc`).
- pnpm available on your `PATH`.
- Workspace dependencies installed with `pnpm install` from the repository root.
- Playwright browser binaries installed before running E2E tests:

  ```sh
  pnpm --filter web exec playwright install
  ```

Playwright browser installation is intentionally separate from `test:e2e` so local workstations and CI images can provision browsers explicitly.

## Running all Jest tests

From the repository root:

```sh
pnpm test
```

This runs each workspace package's `test` script through the root workspace test entry point. The root `test:unit` script is an alias for the same Jest-focused path:

```sh
pnpm test:unit
```

## Running package tests individually

Run the API Jest integration tests:

```sh
pnpm --filter @workspace/api test
```

Run only the API health endpoint example:

```sh
pnpm --filter @workspace/api test -- --runTestsByPath src/server.test.js
```

Run the web Jest examples:

```sh
pnpm --filter web test
```

## Running browser E2E tests

After installing Playwright browsers, run the web E2E suite from the repository root:

```sh
pnpm test:e2e
```

Or run it directly in the web package:

```sh
pnpm --filter web test:e2e
```

Run the deterministic navigation example on Chromium only:

```sh
pnpm --filter web test:e2e -- e2e/navigation.spec.js --project=chromium
```

For local debugging, the web package also exposes Playwright UI mode:

```sh
pnpm --filter web test:e2e:ui
```
