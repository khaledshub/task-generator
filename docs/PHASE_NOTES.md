# Phase Notes

## Phase 1 - Repo Bootstrap + Tooling + Docker Base

### What was built
- Bootstrapped a Next.js App Router monolith in TypeScript.
- Added MUI and created a reusable provider/theme setup for the app shell.
- Added Prisma ORM with PostgreSQL datasource.
- Added initial Prisma models:
  - `User` (for upcoming auth phase)
  - `BootstrapProbe` (used to prove DB write/read connectivity)
- Added migration files in `prisma/migrations/`.
- Added a seed script (`prisma/seed.mjs`) that upserts then reads a probe row.
- Added Docker production setup:
  - Multi-stage `Dockerfile`
  - `docker-compose.yml` for `app` + `postgres`
  - Postgres volume + health check + app startup migration/seed flow
- Added `.env` and `.env.example` with required variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
- Added npm scripts for Prisma generate/migrate/seed.

### Architecture for this phase (UI -> server -> DB)
- `src/app/page.tsx` is a server component that calls `getBootstrapProbe()`.
- `getBootstrapProbe()` uses the shared Prisma client from `src/lib/prisma.ts`.
- Prisma client connects to Postgres using `DATABASE_URL` and reads from `BootstrapProbe`.
- Docker startup command in `docker-compose.yml` runs:
  - `npm run db:migrate` (apply migrations)
  - `npm run db:seed` (write+read connectivity probe)
  - `npm run start` (serve app)

### Key decisions and why
- Prisma pinned to `v6.14.0`:
  - Chosen for stable, conventional schema + migration behavior in this setup.
- Added `BootstrapProbe` model:
  - Keeps Phase 1 DB verification explicit and isolated from future business entities.
- Build script uses `next build --webpack`:
  - Avoids environment-specific Turbopack process constraints in this workspace.
- Removed remote Google font fetching:
  - Keeps build reproducible in restricted/offline environments.

### Where to change behavior
- Landing shell UI: `src/app/page.tsx`
- Theme colors/shape/typography: `src/theme/theme.ts`
- Prisma client lifecycle: `src/lib/prisma.ts`
- DB schema/models: `prisma/schema.prisma`
- Seed behavior/probe key: `prisma/seed.mjs`
- Container build/runtime: `Dockerfile`, `docker-compose.yml`
- Migration execution command: `package.json` scripts (`db:migrate`, `db:seed`)

## Phase 2 - Auth (Credentials) fully working

### What was built
- Added NextAuth credentials authentication with JWT sessions.
- Added signup API endpoint (`POST /api/auth/signup`) that:
  - validates input with Zod
  - hashes password with bcrypt
  - writes user to Postgres
- Added login UI (`/login`) and signup UI (`/signup`) using MUI.
- Added protected app area (`/app`) with server-side session enforcement and redirect to `/login` when unauthenticated.
- Added logout button using NextAuth client `signOut`.
- Added NextAuth route handler (`/api/auth/[...nextauth]`).
- Added Session type augmentation so `session.user.id` is available in TypeScript.

### Architecture for this phase (UI -> API/server -> DB)
- Signup flow:
  - `src/components/auth/signup-form.tsx` submits JSON to `POST /api/auth/signup`.
  - `src/app/api/auth/signup/route.ts` validates payload (`signupSchema`), checks uniqueness, hashes password, inserts user.
  - Prisma writes `User` row in Postgres.
- Login flow:
  - `src/components/auth/login-form.tsx` calls NextAuth `signIn("credentials")`.
  - NextAuth route uses `authOptions` provider authorize function.
  - `authorizeCredentials()` validates input, reads user from DB, verifies bcrypt hash.
  - On success, JWT session cookie is issued.
- Route protection:
  - `src/app/app/layout.tsx` calls `getServerSession(authOptions)`.
  - Missing session triggers `redirect("/login")`.

### Key decisions and why
- Used NextAuth v4 route-handler pattern:
  - Stable with current dependency resolution and App Router compatibility.
- Used JWT sessions (no session table in DB):
  - Keeps MVP auth simple while still storing users in Postgres.
- Password policy constants centralized in validation/password modules:
  - Makes security constraints easy to adjust and audit.
- Enforced auth on server-rendered layout (not edge middleware):
  - Avoids edge-runtime restrictions while still protecting `/app` effectively.

### Where to change behavior
- Auth provider/session callbacks: `src/lib/auth/options.ts`
- Password hashing strength: `src/lib/auth/password.ts` (`PASSWORD_SALT_ROUNDS`)
- Signup validation policy: `src/lib/validation/auth.ts` (`MIN_PASSWORD_LENGTH`, `MAX_PASSWORD_LENGTH`)
- Signup API behavior/messages: `src/app/api/auth/signup/route.ts`
- Login UI behavior: `src/components/auth/login-form.tsx`
- Signup UI behavior: `src/components/auth/signup-form.tsx`
- Protected route behavior and redirect: `src/app/app/layout.tsx`

## Phase 3 - Tasks CRUD end-to-end (DB-connected)

### What was built
- Extended Prisma schema with full `Task` model and enums:
  - `TaskFrequency`, `TaskContext`, `TaskType`, `TaskEnergy`
- Added migration SQL for task enums/table/indexes/foreign key.
- Implemented authenticated task CRUD flows with user isolation:
  - Create task (`/app/tasks`)
  - Edit task (`/app/tasks/[taskId]/edit`)
  - Archive task (action button in tasks list)
- Added reusable MUI task form with all required task metadata fields.
- Enforced required `starterStep` in validation.
- Added Zod validation for task input and multiline parsing for checklist/tips.
- Added app navigation links to Home/Tasks in protected layout.

### Architecture for this phase (UI -> API/server -> DB)
- `src/app/app/tasks/page.tsx` (server component) loads user-scoped tasks via Prisma and renders create form + list.
- `src/components/tasks/task-form.tsx` (client component) posts to server actions.
- Server actions in `src/app/app/tasks/actions.ts`:
  - parse/validate form input via `taskFormDataToInput()`
  - enforce authenticated user via `requireSessionUserId()`
  - perform Prisma writes (`create`, `updateMany`, `updateMany` archive)
  - revalidate task routes.
- Edit page `src/app/app/tasks/[taskId]/edit/page.tsx` enforces owner-scoped lookup (`id + userId`) before rendering form.

### Key decisions and why
- Used server actions for CRUD mutations:
  - keeps task writes typed and colocated with App Router pages.
- Used `updateMany` with `id + userId` for mutation safety:
  - guarantees cross-user writes are blocked even if a foreign `taskId` is submitted.
- Stored checklist/tips as JSON arrays (`Json` fields):
  - simple MVP persistence and easy rendering/editing without extra tables.
- Centralized task constants in `src/lib/tasks/config.ts`:
  - avoids hidden numeric/string rules across validation and UI.

### Where to change behavior
- Task schema and enums: `prisma/schema.prisma`
- Task validation rules/parsing: `src/lib/validation/task.ts`
- Task constants/allowed options: `src/lib/tasks/config.ts`
- Task CRUD write behavior: `src/app/app/tasks/actions.ts`
- Task form UI fields and layout: `src/components/tasks/task-form.tsx`
- Task list/edit page behavior: `src/app/app/tasks/page.tsx`, `src/app/app/tasks/[taskId]/edit/page.tsx`

## Phase 4 - Intent capture + Picker algorithm + History events

### What was built
- Added Prisma models and enums for intent/history:
  - `DailyIntent`
  - `PickEvent`
  - `IntentMode`, `PickAction`, `SkippedReason`
- Implemented weighted-random picker algorithm with fairness and explanation output.
- Added picker config constants in `src/lib/picker/config.ts` (all weight/time windows centralized).
- Added API routes:
  - `POST /api/intents/pick` (creates intent + picks task + creates PICKED event)
  - `POST /api/pick-events` (creates STARTED/DONE/SKIPPED events)
- Built `/app/pick` screen with:
  - context/mode/time chooser
  - pick result card with why + starter step + checklist + tips
  - Started/Done/Skipped actions
- Built `/app/tasks/[taskId]` detail page with:
  - starter step/checklist/tips
  - quick actions Started/Done/Skipped
  - latest pick history for the task
- Built `/app/history` page listing pick events.
- Updated app navigation to include Pick and History.

### Architecture for this phase (UI -> API/server -> DB)
- Picker flow:
  - `src/components/picker/pick-task-panel.tsx` calls `POST /api/intents/pick`.
  - `src/app/api/intents/pick/route.ts` validates intent and calls `createIntentAndPickTask()`.
  - `src/lib/picker/service.ts` writes `DailyIntent`, reads active tasks + fairness history, runs algorithm (`selectTaskForIntent()`), writes `PickEvent` with `action=PICKED` and saved `why`.
- Progress actions:
  - picker/task-detail action UIs call `POST /api/pick-events`.
  - route validates payload and writes `PickEvent` rows with `STARTED`/`DONE`/`SKIPPED`.
- History/task detail:
  - server components read `PickEvent` rows scoped by `userId` (and by `taskId` for detail page).

### Key decisions and why
- Mode->energy rule selected:
  - `CHILL` => `LOW` only
  - `NORMAL` => `LOW`/`MEDIUM`
  - `GRIND` => `LOW`/`MEDIUM`/`HIGH`
  - Chosen for clear, predictable behavior.
- Time matching strategy:
  - strict `timeEstimate <= selected time`
  - fallback allows up to `+15` minutes with weight penalty when strict set is empty.
- Fairness rules implemented:
  - penalize tasks picked in last 3 picks
  - penalize tasks done recently (last 7 days)
  - boost tasks marked `avoiding=true`
- Kept algorithm pure in `src/lib/picker/algorithm.ts`:
  - easier to unit test independently from DB.

### Where to change behavior
- Picker weights/windows and intent options: `src/lib/picker/config.ts`
- Algorithm filtering/weighting/why text: `src/lib/picker/algorithm.ts`
- Intent + pick persistence flow: `src/lib/picker/service.ts`
- Intent/event payload validation: `src/lib/validation/picker.ts`
- Picker UI interactions: `src/components/picker/pick-task-panel.tsx`
- Task quick action UI: `src/components/tasks/task-quick-actions.tsx`
- History listing/query behavior: `src/app/app/history/page.tsx`

## Phase 5 - Tests + E2E + hardening

### What was built
- Added Vitest unit test setup (`vitest.config.ts`).
- Added unit tests:
  - picker algorithm fairness/weighting behavior (`src/lib/picker/algorithm.test.ts`)
  - task input validation/starter-step enforcement (`src/lib/validation/task.test.ts`)
- Added Playwright E2E setup (`playwright.config.ts`) and smoke flow test (`tests/e2e/smoke.spec.ts`) covering:
  - signup
  - login
  - create task
  - pick task
  - mark done
  - verify history
- Added server-side pino logger (`src/lib/logger.ts`) and wired logging for key events:
  - task creation
  - pick creation/no-match
  - status event recording
- Added testing scripts:
  - `npm test`
  - `npm run test:e2e`
- Added test artifact ignores in `.gitignore`.

### Architecture for this phase (UI -> API/server -> DB)
- Unit tests target pure logic modules directly (`algorithm.ts`, `validation/task.ts`).
- E2E test drives the UI and relies on existing API/auth/task/picker DB flows.
- pino logger is imported into server mutation/service layers where key business events happen.

### Key decisions and why
- Kept picker logic pure and separately tested:
  - allows deterministic fairness tests without DB setup.
- E2E smoke is environment-gated via `RUN_E2E=1`:
  - default `npm run test:e2e` can run in restricted environments, while full smoke is available when Postgres/browser runtime is ready.
- Logged only key mutation events with structured payloads:
  - enough observability without excessive log noise.

### Where to change behavior
- Unit test behavior and expectations: `src/lib/picker/algorithm.test.ts`, `src/lib/validation/task.test.ts`
- Playwright web server/base URL/runtime: `playwright.config.ts`
- E2E smoke scenario steps/selectors: `tests/e2e/smoke.spec.ts`
- Logging format/level: `src/lib/logger.ts`
- Logged event payloads and messages: `src/app/app/tasks/actions.ts`, `src/lib/picker/service.ts`

## Phase 6 - Documentation + polish

### What was built
- Replaced default README with full project documentation:
  - stack overview
  - local dev setup
  - Docker run/deploy
  - env vars
  - scripts
  - route map
  - picker business rules
  - troubleshooting
- Updated `.env.example` to include optional `LOG_LEVEL`.
- Confirmed final quality checks:
  - lint passes
  - build passes
  - unit tests pass
  - Playwright command runs (smoke currently skipped unless `RUN_E2E=1`)

### Architecture for this phase (UI -> API/server -> DB)
- No runtime architecture changes; this phase focused on operational documentation and developer ergonomics.

### Key decisions and why
- Kept docs explicit and command-oriented for fast onboarding.
- Documented E2E gating (`RUN_E2E=1`) to avoid confusion in restricted environments.

### Where to change behavior
- Project setup/deploy/testing docs: `README.md`
- Environment variable template: `.env.example`
