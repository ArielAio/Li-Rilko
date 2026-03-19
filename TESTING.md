# Testing and Deployment Gate

## Stack
- Unit/Integration: Vitest + Testing Library
- E2E smoke: Playwright (Chromium)
- CI pipeline: GitHub Actions (`.github/workflows/quality-gate.yml`)
- Admin persistence does not use GitHub anymore; CI only validates tests/builds.

## Commands
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e:smoke`
- `npm run test:known-issues`
- `npm run test:gate` (unit + integration + build + e2e smoke)
- `npm run supabase:seed` (importa catálogo inicial, atendentes e imagens no projeto Supabase configurado no ambiente)

## Supabase bootstrap
- Migration inicial: [supabase/migrations/20260319_000001_catalog_phase1.sql](/Users/arielaio/Desktop/Arquivos/Projetos/Projetos%20com%20Siconeli/Li%20Rilko/supabase/migrations/20260319_000001_catalog_phase1.sql)
- Seed local: [scripts/supabase-seed.cjs](/Users/arielaio/Desktop/Arquivos/Projetos/Projetos%20com%20Siconeli/Li%20Rilko/scripts/supabase-seed.cjs)
- O bucket `product-images` precisa existir no projeto antes do seed.

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
