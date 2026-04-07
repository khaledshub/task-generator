# TodoList RandomGenerator

A production-style TypeScript monolith built with Next.js App Router, PostgreSQL, Prisma, NextAuth credentials auth, MUI, Vitest, Playwright, Docker, and structured server logging.

The app helps users beat procrastination by selecting a weighted-random "best next task" based on:
- Context: Home / Out / Computer
- Mode: Chill / Normal / Grind
- Time available: 10 / 30 / 60 minutes

## Stack
- Node.js 22
- Next.js (App Router) + TypeScript
- PostgreSQL 16
- Prisma ORM + SQL migrations
- Auth: NextAuth Credentials (email/password + bcrypt)
- Validation: Zod
- UI: Material UI (MUI)
- Unit tests: Vitest
- E2E tests: Playwright
- Logging: pino
- Containers: Docker multi-stage + docker-compose

## Prerequisites
- Node.js 22+
- npm 10+
- Docker + Docker Compose (for containerized run)

## Environment Variables
Create `.env` from `.env.example`.

Required:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Optional:
- `LOG_LEVEL` (`info` by default)

### `.env.example`
See `/Users/khaledahmed/GitHub/task-generator/.env.example`.

## Scripts
- `npm run dev` - start Next.js dev server (webpack)
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - ESLint
- `npm run prisma:generate` - generate Prisma client
- `npm run db:migrate` - apply migrations (`prisma migrate deploy`)
- `npm run db:seed` - seed connectivity probe row
- `npm test` - unit tests (Vitest)
- `npm run test:e2e` - Playwright E2E (smoke test is env-gated)

## Local Development (without Docker app container)
1. Install dependencies:
```bash
npm install
```
2. Start Postgres (example using Docker only for DB):
```bash
docker compose up -d postgres
```
3. Apply migrations and seed:
```bash
npm run db:migrate
npm run db:seed
```
4. Start app:
```bash
npm run dev
```
5. Open [http://localhost:3000](http://localhost:3000)

## Full Docker Run
Run app + postgres together:
```bash
docker compose up --build
```

Startup behavior of `app` service:
1. `npm run db:migrate`
2. `npm run db:seed`
3. `npm run start`

App URL: [http://localhost:3000](http://localhost:3000)

## Auth Flow
- Sign up at `/signup`
- Log in at `/login`
- Protected area at `/app`

## Main App Routes
- `/` - public landing
- `/login` - login
- `/signup` - signup
- `/app/tasks` - create/list/archive tasks
- `/app/tasks/[taskId]` - task detail + quick actions + task event history
- `/app/tasks/[taskId]/edit` - edit task
- `/app/pick` - intent chooser + weighted pick + status actions
- `/app/history` - event timeline

## Tests
### Unit tests
```bash
npm test
```

### E2E tests
Default run:
```bash
npm run test:e2e
```

When Playwright auto-starts the app server, it resets and seeds the database through a local-only safety guard. If `DATABASE_URL` points at a non-local host, the run aborts unless you explicitly set `PLAYWRIGHT_UNSAFE_DB_RESET=1`.

The smoke spec is gated by `RUN_E2E=1` to avoid false failures in environments without full DB/browser setup.

Full smoke run example:
```bash
RUN_E2E=1 npm run test:e2e
```

## Picker Business Rules (MVP)
- Context must match selected context.
- Energy compatibility:
  - `CHILL` -> `LOW` only
  - `NORMAL` -> `LOW` / `MEDIUM`
  - `GRIND` -> `LOW` / `MEDIUM` / `HIGH`
- Time matching:
  - strict: `task.timeEstimateMinutes <= selectedTime`
  - fallback: allow up to `+15` minutes when strict pool is empty (with weight penalty)
- Fairness weighting:
  - boost tasks marked `avoiding=true`
  - penalize tasks picked in last 3 picks
  - penalize tasks completed in recent 7 days
- Persists one-line "why" explanation at pick time in `PickEvent.why`.

## Troubleshooting
### Docker daemon not running
If `docker compose up --build` fails with daemon connection errors, start Docker Desktop/daemon first.

### Port 3000 already in use
Stop the conflicting process or change published port in `docker-compose.yml`.

### Prisma connection errors
- Verify `DATABASE_URL`
- Ensure Postgres is reachable
- Re-run:
```bash
npm run db:migrate
npm run db:seed
```

### E2E tests skipped
Expected unless `RUN_E2E=1` is set.

## Documentation Map
- Phase-by-phase notes: `/Users/khaledahmed/GitHub/task-generator/docs/PHASE_NOTES.md`
- Detailed code map: `/Users/khaledahmed/GitHub/task-generator/docs/CODEMAP.md`
- Figma MCP setup: `/Users/khaledahmed/GitHub/task-generator/docs/FIGMA_MCP_SETUP.md`
- Figma integration requirements: `/Users/khaledahmed/GitHub/task-generator/docs/requirements/figma-design-integration.md`
- Figma integration architecture: `/Users/khaledahmed/GitHub/task-generator/docs/architecture/figma-design-integration.md`
- Figma implementation playbook: `/Users/khaledahmed/GitHub/task-generator/docs/playbooks/FIGMA_IMPLEMENTATION_PLAYBOOK.md`
