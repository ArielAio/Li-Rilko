# Testing and Deployment Gate

## Stack
- Unit/Integration: Vitest + Testing Library
- E2E smoke: Playwright (Chromium)
- CI pipeline: GitHub Actions (`.github/workflows/quality-gate.yml`)

## Commands
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e:smoke`
- `npm run test:known-issues`
- `npm run test:gate` (unit + integration + build + e2e smoke)

## Gate policy
`test:gate` is the blocking suite for important deploys (push/merge to `main`).

## Known issues policy
`test:known-issues` intentionally tracks unresolved risks and may fail.
In CI it runs in a non-blocking job (`known-issues`) and uploads artifacts.

## Suite layout
- `tests/unit`: deterministic domain/server tests
- `tests/integration`: provider behavior with jsdom
- `tests/e2e/smoke`: user journey smoke coverage
- `tests/known-issues`: regression risks tracked outside gate
