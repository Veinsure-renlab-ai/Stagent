# apps/edge — implementation notes

## Windows: EBUSY on miniflare teardown

When running `vitest` on Windows, miniflare's cleanup of DO SQLite files
(`*.sqlite`, `*.sqlite-shm`, `*.sqlite-wal`) under `%TEMP%\miniflare-*` often
fails with `EBUSY: resource busy or locked, unlink ...`. The test process
exits non-zero **after** all tests have already passed.

This does **not** indicate a real test failure. To verify pass/fail, parse
the line `Tests  N passed (M)` rather than relying on exit code.

`isolatedStorage: false` works around the cleanup but breaks per-test DO
isolation, so tests leak state into each other. Not acceptable.

CI plan: pin a non-Windows runner for `pnpm test`, or detect the EBUSY in
a wrapper and treat it as success when the summary reports all-passed.

## Plan deviations

- **Task 0 + Task 2 reorder:** plan ordered `Task 0` (spike) before `Task 2`
  (scaffold), but the spike test depends on `apps/edge/{package.json,
  wrangler.toml, vitest.config.ts}` from Task 2. Executed Task 2 → Task 0
  → Task 1 → Task 3+ instead.

- **Task 0 vitest config override:** `vitest.config.ts` temporarily set
  `main: "./src/spike-worker.ts"` to route `SELF` past the placeholder
  `worker.ts`. Reverted in Task 3 once `worker.ts` carries the real
  router.

- **Task 3 router test for `/api/tables`:** plan asserted `status < 500`
  but stubbed `tables-api.ts` returns `501 not implemented`. The intent
  of the assertion is "URL was routed, not 404'd"; updated to
  `expect(res.status).not.toBe(404)` to match.

## Compatibility date

`wrangler.toml` declares `compatibility_date = "2026-04-01"`. The
installed `workerd` only supports up to `2024-12-30` and prints a warning
falling back to that. No functional impact at this stage; revisit when
upgrading workerd.
