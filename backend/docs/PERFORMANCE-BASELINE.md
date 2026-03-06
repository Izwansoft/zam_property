# Backend Performance Baseline

> Record repeatable baseline numbers here (staging/prod-like environment).
> The goal is to catch regressions and guide optimization.

## How to run

- Start the server in the target environment (staging is ideal).
- Run: `pnpm perf:smoke`

Environment variables:
- `PERF_BASE_URL` (default `http://localhost:3000`)
- `PERF_DURATION_SECONDS` (default `10`)
- `PERF_CONNECTIONS` (default `20`)
- `PERF_PIPELINING` (default `1`)

## Baselines

### /health (unauthenticated)

| Date | Env | Connections | Duration(s) | RPS | p95 (ms) | Non-2xx | Notes |
|------|-----|-------------|------------|-----|----------|---------|-------|
| 2026-01-21 | local | 20 | 10 | (record) | (record) | 0 | Initial perf harness added |
| 2026-01-27 | local | 20 | 10 | 3373 | N/A | 0 | Ran against /api/v1/health |

## Next Targets (Suggested)

- Public search endpoint (with realistic query mix)
- Listing create/publish (authenticated; requires representative DB)
- Vendor action endpoints (approve/reject/suspend)
