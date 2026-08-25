# xhawk-bholu

## Web app

The Vite React app lives in `apps/web`. Its home page calls the Node books API and renders the shared library with starred-status controls.

### Run the integrated books app locally

Run these commands from the two sibling repository checkouts:

1. Start MongoDB from `xhawk-bholu-tw-08090adbaa20b6fab1719c282d54befb`:

   ```sh
   docker-compose up -d mongo
   ```

   Or provide `MONGODB_URI` to the Node API if you use another MongoDB instance.

2. Start the Node backend from `xhawk-bholu-tw-08090adbaa20b6fab1719c282d54befb`:

   ```sh
   npm install --prefix node_api
   npm start --prefix node_api
   ```

   The frontend expects this API at `http://127.0.0.1:3000` by default.

3. Start the frontend from this repository:

   ```sh
   npm install --prefix apps/web
   npm run dev --prefix apps/web
   ```

   Set `VITE_BOOKS_API_URL` only when the Node backend is not available at `http://127.0.0.1:3000`.

### Frontend checks

```sh
npm run build --prefix apps/web
npm test --prefix apps/web
```

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)
