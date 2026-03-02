# Code Map

## `prisma/schema.prisma`
Purpose:
- Defines the Phase 1 PostgreSQL schema and Prisma models used by the monolith.

Exports / declarations:
- Prisma `datasource db` (PostgreSQL via `DATABASE_URL`)
- Prisma `generator client` (`prisma-client-js`)
- Models: `User`, `BootstrapProbe`

Model notes:
- `User`
  - Responsibility: stores credential identity records for upcoming auth flow.
  - Key fields: `email` (unique), `passwordHash`, timestamps.
  - Side effects: rows are created/updated by auth flows in later phases.
  - Constraints: `email` must be unique.
  - Extend/tweak: add profile fields or relations here before generating a migration.
- `BootstrapProbe`
  - Responsibility: stores a seed probe row to prove DB write/read connectivity.
  - Key fields: `key` (unique), `value`, timestamps.
  - Side effects: written by `prisma/seed.mjs`.
  - Constraints: `key` must be unique.
  - Extend/tweak: can be removed once production health checks replace this bootstrap verification.

## `prisma/seed.mjs`
Purpose:
- Runs Phase 1 seed logic that proves Prisma -> Postgres connectivity by upserting and reading a probe row.

Exported functions/classes/constants:
- `main()`
- `BOOTSTRAP_PROBE_KEY`

Function details:
- `main()`
  - Responsibility: upsert probe row and read it back; print readback to stdout.
  - Inputs/outputs: no inputs; returns `Promise<void>`.
  - Side effects: DB write to `BootstrapProbe`, DB read from `BootstrapProbe`, console logging.
  - Key rules/edge cases:
    - Throws if readback is missing after upsert.
    - Ensures Prisma disconnect runs in `finally`.
  - Extend/tweak:
    - Add more seed records here for demo data.
    - Keep idempotent by using `upsert` keyed by stable unique identifiers.

Constant details:
- `BOOTSTRAP_PROBE_KEY`
  - Meaning: unique key used to identify the connectivity probe row.
  - Used in: `main()` upsert/read operations.
  - Safe values/constraints: any unique string; should stay stable across runs for idempotent updates.

## `src/lib/prisma.ts`
Purpose:
- Provides a singleton Prisma client instance for server-side runtime use.

Exported functions/classes/constants:
- Default export: `prisma` (`PrismaClient` instance)

Behavior details:
- Responsibility:
  - Reuses one Prisma client in development to prevent connection exhaustion during hot reload.
- Inputs/outputs:
  - No function inputs; exports initialized client object.
- Side effects:
  - Instantiates Prisma client process-wide.
- Key rules/edge cases:
  - Caches client on `global.prismaClient` when `NODE_ENV !== "production"`.
- Extend/tweak:
  - Add Prisma middleware or logging config in this file when needed.

## `src/app/page.tsx`
Purpose:
- Public landing page for Phase 1, including DB status card from probe readback.

Exported functions/classes/constants:
- `getBootstrapProbe()`
- Default export: `HomePage()`
- `BOOTSTRAP_PROBE_KEY`

Function details:
- `getBootstrapProbe()`
  - Responsibility: fetches the probe row and safely handles DB unavailability.
  - Inputs/outputs: no inputs; returns `Promise<BootstrapProbe | null>`.
  - Side effects: DB read via Prisma.
  - Key rules/edge cases:
    - Returns `null` on query failure so landing page still renders.
  - Extend/tweak:
    - Replace with richer health checks or diagnostics route once auth/app routes are added.

- `HomePage()`
  - Responsibility: renders app shell and Phase 1 status UI.
  - Inputs/outputs: no explicit inputs; returns React server component tree.
  - Side effects: triggers `getBootstrapProbe()` server-side DB read during render.
  - Key rules/edge cases:
    - Displays success alert when probe exists.
    - Displays warning alert when probe missing or DB unreachable.
  - Extend/tweak:
    - Replace status-only content with product landing/auth CTAs in later phases.

Constant details:
- `BOOTSTRAP_PROBE_KEY`
  - Meaning: lookup key for the seed connectivity row.
  - Used in: `getBootstrapProbe()`.
  - Safe values/constraints: must match seed script key to produce success state.

## `src/theme/theme.ts`
Purpose:
- Central MUI theme definition for palette, shape, and typography defaults.

Exported functions/classes/constants:
- `appTheme`

Constant details:
- `appTheme`
  - Meaning: shared MUI theme object.
  - Used in: `src/components/app-providers.tsx` `ThemeProvider`.
  - Safe values/constraints:
    - `palette`, `shape`, and `typography` values should remain MUI-compatible.

## `src/lib/validation/auth.ts`
Purpose:
- Centralizes Zod schemas for credentials validation and signup validation.

Exported functions/classes/constants:
- `credentialsSchema`
- `signupSchema`
- Types: `CredentialsInput`, `SignupInput`
- Constants: `MIN_PASSWORD_LENGTH`, `MAX_PASSWORD_LENGTH`

Schema details:
- `credentialsSchema`
  - Responsibility: validates login credentials, normalizes email.
  - Inputs/outputs: raw credentials object -> parsed `{ email, password }`.
  - Side effects: none.
  - Key rules/edge cases: email must be valid; password length bounded.
  - Extend/tweak: update constraints or add extra fields (e.g. MFA code).
- `signupSchema`
  - Responsibility: validates signup credentials with confirmation matching.
  - Inputs/outputs: signup payload -> parsed `SignupInput`.
  - Side effects: none.
  - Key rules/edge cases: rejects mismatched password confirmation.
  - Extend/tweak: add password complexity checks here.

Constant details:
- `MIN_PASSWORD_LENGTH` / `MAX_PASSWORD_LENGTH`
  - Meaning: allowed password length range for credentials auth.
  - Used in: `credentialsSchema`.
  - Safe values/constraints: keep minimum >= 8; avoid overly small maxima.

## `src/lib/auth/password.ts`
Purpose:
- Encapsulates password hashing and verification.

Exported functions/classes/constants:
- `hashPassword(password)`
- `verifyPassword(password, passwordHash)`
- `PASSWORD_SALT_ROUNDS`

Function details:
- `hashPassword(password)`
  - Responsibility: bcrypt-hashes plain password before DB storage.
  - Inputs/outputs: `string` -> `Promise<string>`.
  - Side effects: CPU-intensive hashing.
  - Key rules/edge cases: assumes validated password input.
  - Extend/tweak: increase/decrease rounds for security/performance tradeoff.
- `verifyPassword(password, passwordHash)`
  - Responsibility: compares candidate password against stored hash.
  - Inputs/outputs: `string`, `string` -> `Promise<boolean>`.
  - Side effects: CPU-intensive verification.
  - Key rules/edge cases: returns `false` for invalid hashes/inputs.
  - Extend/tweak: keep same algorithm as hash function.

Constant details:
- `PASSWORD_SALT_ROUNDS`
  - Meaning: bcrypt work factor.
  - Used in: `hashPassword`.
  - Safe values/constraints: typical safe range 10-14 for web workloads.

## `src/lib/auth/options.ts`
Purpose:
- Defines shared NextAuth configuration and credentials authorization logic.

Exported functions/classes/constants:
- `authOptions`
- `authorizeCredentials(rawCredentials)`

Function details:
- `authorizeCredentials(rawCredentials)`
  - Responsibility: validate credentials, fetch user, verify password, map auth payload.
  - Inputs/outputs: `unknown` -> `Promise<{id:string;email:string} | null>`.
  - Side effects: DB read from `User` table.
  - Key rules/edge cases:
    - Returns `null` on validation failure, missing user, or password mismatch.
    - Uses normalized email from schema.
  - Extend/tweak:
    - Add lockout/rate-limit or email verification checks here.

Constant/config details:
- `authOptions`
  - Meaning: NextAuth runtime config (providers, pages, callbacks, session strategy).
  - Used in: auth route handler and server session checks.
  - Safe values/constraints:
    - `session.strategy` must align with callback expectations.
    - `pages.signIn` should point to an existing route.

## `src/app/api/auth/[...nextauth]/route.ts`
Purpose:
- Exposes NextAuth route handlers for GET/POST auth operations.

Exported functions/classes/constants:
- `GET`, `POST` route handlers (from `NextAuth(authOptions)`).

Behavior details:
- Responsibility: handles login/signout/callback/session endpoints.
- Inputs/outputs: HTTP requests -> NextAuth-managed responses.
- Side effects: sets/clears auth cookies.
- Extend/tweak: update `authOptions` rather than editing this file.

## `src/app/api/auth/signup/route.ts`
Purpose:
- Handles account creation for email/password credentials.

Exported functions/classes/constants:
- `POST(request)`

Function details:
- `POST(request)`
  - Responsibility: validate payload, enforce unique email, hash password, create user row.
  - Inputs/outputs: `Request` -> JSON response with status 201/400/409.
  - Side effects: DB read+write to `User`.
  - Key rules/edge cases:
    - Rejects malformed payload.
    - Rejects duplicate emails.
  - Extend/tweak:
    - Add email verification token creation before activating account.

## `src/components/auth/login-form.tsx`
Purpose:
- Client login form that submits credentials to NextAuth and handles UI errors.

Exported functions/classes/constants:
- `LoginForm()`

Function details:
- `LoginForm()`
  - Responsibility: collect credentials, call `signIn("credentials")`, navigate on success.
  - Inputs/outputs: none (component), user form input -> auth request.
  - Side effects: auth cookie creation via NextAuth endpoint; client navigation.
  - Key rules/edge cases:
    - Shows a generic invalid-credentials message on auth failure.
  - Extend/tweak:
    - Add remember-me or SSO buttons here.

## `src/components/auth/signup-form.tsx`
Purpose:
- Client signup form that calls signup API and handles response states.

Exported functions/classes/constants:
- `SignupForm()`

Function details:
- `SignupForm()`
  - Responsibility: collect signup fields and POST to `/api/auth/signup`.
  - Inputs/outputs: none (component), user form input -> signup request.
  - Side effects: triggers DB user creation via API; client navigation to login.
  - Key rules/edge cases:
    - Displays server-provided error messages.
  - Extend/tweak:
    - Add password strength meter and terms acceptance controls.

## `src/components/logout-button.tsx`
Purpose:
- Client action button for ending authenticated sessions.

Exported functions/classes/constants:
- `LogoutButton()`

Function details:
- `LogoutButton()`
  - Responsibility: calls NextAuth `signOut` with callback redirect.
  - Inputs/outputs: none (component).
  - Side effects: clears session cookies and navigates to login.
  - Extend/tweak:
    - Add confirmation modal or analytics tracking before signout.

## `src/app/app/layout.tsx`
Purpose:
- Protected app shell that enforces authentication server-side.

Exported functions/classes/constants:
- `ProtectedAppLayout({ children })`

Function details:
- `ProtectedAppLayout({ children })`
  - Responsibility: load session, redirect unauthenticated users, render app top bar.
  - Inputs/outputs: `children` -> protected layout tree.
  - Side effects: server redirect to `/login` when no session.
  - Key rules/edge cases:
    - Session lookup happens on each request.
  - Extend/tweak:
    - Add app-wide navigation and user menu here.

## `src/app/login/page.tsx`
Purpose:
- Public login page with authenticated-user redirect to `/app`.

Exported functions/classes/constants:
- `LoginPage()`

Function details:
- `LoginPage()`
  - Responsibility: gate login page for signed-in users and render login form.
  - Inputs/outputs: none.
  - Side effects: server redirect when session already exists.
  - Extend/tweak:
    - Add forgot-password/reset links here.

## `src/app/signup/page.tsx`
Purpose:
- Public signup page with authenticated-user redirect to `/app`.

Exported functions/classes/constants:
- `SignupPage()`

Function details:
- `SignupPage()`
  - Responsibility: gate signup page for signed-in users and render signup form.
  - Inputs/outputs: none.
  - Side effects: server redirect when session already exists.
  - Extend/tweak:
    - Add onboarding hints and legal links.

## `src/types/next-auth.d.ts`
Purpose:
- Extends NextAuth Session typings to include `session.user.id`.

Exported functions/classes/constants:
- Module augmentation for `next-auth` `Session` interface.

Behavior details:
- Responsibility: keep auth-related server components type-safe.
- Side effects: TypeScript compile-time typing only.
- Extend/tweak: add additional session fields as auth payload grows.

## `prisma/schema.prisma` (Phase 3 updates)
Purpose:
- Adds full task domain entities and enum constraints.

New declarations:
- Enums: `TaskFrequency`, `TaskContext`, `TaskType`, `TaskEnergy`
- Model: `Task`
- Relation: `User.tasks`

Model details:
- `Task`
  - Responsibility: stores all task metadata required by picker flow.
  - Inputs/outputs: persisted by task server actions and read by tasks pages.
  - Side effects: task CRUD writes in Prisma.
  - Key rules/edge cases:
    - `starterStep` required.
    - `isArchived` soft-archive flag.
    - JSON fields (`checklistItems`, `tips`) allow array persistence.
  - Extend/tweak:
    - Add priority/scoring fields here for richer picker behavior later.

## `src/lib/tasks/config.ts`
Purpose:
- Central task constants and allowed enum-like values for UI + validation.

Exported functions/classes/constants:
- Limits: `TASK_TITLE_MAX_LENGTH`, `TASK_DESCRIPTION_MAX_LENGTH`, `TASK_STARTER_STEP_MAX_LENGTH`, `TASK_LIST_ITEM_MAX_LENGTH`, `TASK_TIP_MAX_LENGTH`, `TASK_MAX_LIST_ITEMS`, `TASK_MAX_TIPS`, `TASK_MAX_TIME_MINUTES`
- Allowed value arrays: `TASK_FREQUENCIES`, `TASK_CONTEXTS`, `TASK_TYPES`, `TASK_ENERGIES`, `TASK_TIME_OPTIONS`
- Labels: `TASK_FREQUENCY_LABELS`, `TASK_CONTEXT_LABELS`, `TASK_TYPE_LABELS`, `TASK_ENERGY_LABELS`
- Defaults: `DEFAULT_TASK_TIPS`

Constant details:
- Value arrays (`TASK_*`)
  - Meaning: canonical allowed values for forms/validation.
  - Used in: task form selects and Zod schemas.
  - Safe values/constraints: must stay aligned with Prisma enum values.
- Numeric limits
  - Meaning: validation boundaries.
  - Used in: `src/lib/validation/task.ts`.
  - Safe values/constraints: keep user-facing and DB expectations consistent.

## `src/lib/tasks/types.ts`
Purpose:
- Shared task form state/value types and DB-to-form mapping helpers.

Exported functions/classes/constants:
- `TaskFormState`
- `TaskFormValues`
- `DEFAULT_TASK_FORM_VALUES`
- `mapTaskToFormValues(task)`
- `toStringArray(value)`

Function details:
- `mapTaskToFormValues(task)`
  - Responsibility: convert Prisma task record to editable form defaults.
  - Inputs/outputs: task-like object -> `TaskFormValues`.
  - Side effects: none.
  - Key rules/edge cases: handles nullable description and JSON arrays safely.
  - Extend/tweak: map new task fields here when schema grows.
- `toStringArray(value)`
  - Responsibility: safely extract string arrays from JSON values.
  - Inputs/outputs: `Prisma.JsonValue` -> `string[]`.
  - Side effects: none.
  - Key rules/edge cases: non-array values return empty array.
  - Extend/tweak: add stricter coercion logic if needed.

## `src/lib/validation/task.ts`
Purpose:
- Zod schema and form-data parsing logic for task create/edit.

Exported functions/classes/constants:
- `taskInputSchema`
- `taskFormDataToInput(formData)`
- `parseMultilineText(value)`
- `normalizeOptionalText(value)`
- Type: `TaskInput`

Function details:
- `taskFormDataToInput(formData)`
  - Responsibility: parse raw form data and validate into strongly typed task input.
  - Inputs/outputs: `FormData` -> `TaskInput` (throws on invalid input).
  - Side effects: none.
  - Key rules/edge cases:
    - `starterStep` required.
    - checkbox parsed from `"on"`.
    - checklist/tips parsed from multiline text.
  - Extend/tweak: add new form fields and include them in `taskInputSchema`.
- `parseMultilineText(value)`
  - Responsibility: normalize multi-line textarea data into non-empty list.
  - Inputs/outputs: `string` -> `string[]`.
  - Side effects: none.
- `normalizeOptionalText(value)`
  - Responsibility: collapse blank optional text to `undefined`.
  - Inputs/outputs: `string` -> `string | undefined`.
  - Side effects: none.

## `src/lib/auth/session.ts`
Purpose:
- Auth helper for server-side routes/actions requiring user context.

Exported functions/classes/constants:
- `requireSessionUserId()`

Function details:
- `requireSessionUserId()`
  - Responsibility: load current session and return authenticated user id.
  - Inputs/outputs: none -> `Promise<string>`.
  - Side effects: redirects to `/login` when unauthenticated.
  - Key rules/edge cases: requires `session.user.id` augmentation.
  - Extend/tweak: attach role checks/permissions in this central gate.

## `src/app/app/tasks/actions.ts`
Purpose:
- Server actions for task create/update/archive mutations.

Exported functions/classes/constants:
- `createTaskAction(previousState, formData)`
- `updateTaskAction(taskId, previousState, formData)`
- `archiveTaskAction(taskId)`
- Internal: `toTaskFormError(error)`

Function details:
- `createTaskAction(...)`
  - Responsibility: validate input, create user task, return form state.
  - Inputs/outputs: action state + `FormData` -> `Promise<TaskFormState>`.
  - Side effects: DB insert, route revalidation.
  - Key rules/edge cases: returns validation errors from Zod issues.
  - Extend/tweak: add server-side logging or post-create hooks.
- `updateTaskAction(taskId, ...)`
  - Responsibility: owner-scoped update with validation.
  - Inputs/outputs: `taskId`, action state, `FormData` -> `Promise<TaskFormState>`.
  - Side effects: DB update, route revalidation.
  - Key rules/edge cases: uses `updateMany` with `id + userId` to prevent cross-user edits.
  - Extend/tweak: add optimistic-lock/version checks if needed.
- `archiveTaskAction(taskId)`
  - Responsibility: owner-scoped soft archive.
  - Inputs/outputs: `taskId` -> `Promise<void>`.
  - Side effects: DB update, route revalidation.
  - Key rules/edge cases: silently no-ops if task not owned/found.

## `src/components/tasks/task-form.tsx`
Purpose:
- Reusable client-side task form UI for create/edit flows.

Exported functions/classes/constants:
- `TaskForm({ action, initialValues, submitLabel })`
- Internal: `SubmitButton({ label })`

Function details:
- `TaskForm(...)`
  - Responsibility: render all task fields and submit via server action.
  - Inputs/outputs: server action + initial values -> form UI.
  - Side effects: submits form data to server action.
  - Key rules/edge cases:
    - Supports success/error alert rendering from action state.
    - Ensures starter step field is required in UI.
  - Extend/tweak: add new fields while keeping names aligned with parser.

## `src/app/app/tasks/page.tsx`
Purpose:
- Task list/create page for authenticated users.

Exported functions/classes/constants:
- `TasksPage()`

Function details:
- `TasksPage()`
  - Responsibility: load active/archived tasks, render create form and archive/edit actions.
  - Inputs/outputs: none.
  - Side effects: reads user-scoped tasks from DB.
  - Key rules/edge cases: only current user's tasks are queried.
  - Extend/tweak: add filtering/sorting controls here.

## `src/app/app/tasks/[taskId]/edit/page.tsx`
Purpose:
- Owner-scoped task edit page.

Exported functions/classes/constants:
- `EditTaskPage({ params })`

Function details:
- `EditTaskPage({ params })`
  - Responsibility: load task by `id + userId` and render update form.
  - Inputs/outputs: route params -> edit page.
  - Side effects: DB read; returns 404 when missing/non-owned.
  - Key rules/edge cases: cross-user task IDs cannot be loaded.
  - Extend/tweak: add delete/unarchive controls if needed.

## `prisma/schema.prisma` (Phase 4 updates)
Purpose:
- Adds intent/pick-event history entities required by picker and progress tracking.

New declarations:
- Enums: `IntentMode`, `PickAction`, `SkippedReason`
- Models: `DailyIntent`, `PickEvent`
- Relations:
  - `User.intents`, `User.pickEvents`
  - `Task.pickEvents`

Model details:
- `DailyIntent`
  - Responsibility: persists one "feeling today" selection set (context/mode/time).
  - Side effects: written when user requests a pick.
  - Extend/tweak: add date bucketing or device metadata here.
- `PickEvent`
  - Responsibility: immutable event log for PICKED/STARTED/DONE/SKIPPED transitions.
  - Side effects: written by pick service and quick-action endpoints.
  - Key rules/edge cases: `intentId` is nullable but linked when available.
  - Extend/tweak: add duration/effort metrics for analytics.

## `src/lib/picker/config.ts`
Purpose:
- Single source for picker intent options and weighting/fairness constants.

Exported functions/classes/constants:
- Intent options/labels: `INTENT_CONTEXT_OPTIONS`, `INTENT_MODE_OPTIONS`, `INTENT_TIME_OPTIONS`, `INTENT_MODE_LABELS`, `INTENT_TIME_LABELS`
- Action options/labels: `PICK_ACTION_OPTIONS`, `SKIPPED_REASON_OPTIONS`, `SKIPPED_REASON_LABELS`
- Fairness constants:
  - `RECENT_PICK_LOOKBACK_COUNT`
  - `RECENT_DONE_LOOKBACK_DAYS`
  - `BASE_CANDIDATE_WEIGHT`
  - `AVOIDING_TASK_WEIGHT_MULTIPLIER`
  - `RECENT_PICK_WEIGHT_MULTIPLIER`
  - `RECENT_DONE_WEIGHT_MULTIPLIER`
  - `TIME_FALLBACK_WINDOW_MINUTES`
  - `TIME_FALLBACK_WEIGHT_MULTIPLIER`
  - `MIN_CANDIDATE_WEIGHT`

Constant details:
- Weight multipliers and windows
  - Meaning: control fairness and fallback behavior.
  - Used in: `src/lib/picker/algorithm.ts`, `src/lib/picker/service.ts`.
  - Safe values/constraints:
    - multipliers should stay > 0
    - lookback windows should remain small to avoid over-penalizing.

## `src/lib/picker/types.ts`
Purpose:
- Shared types for intent payloads, candidate scoring, and picker result objects.

Exported functions/classes/constants:
- `IntentInput`, `PickerTask`, `FairnessInputs`, `CandidateScore`, `PickerSuccess`, `PickerNoMatch`, `PickerResult`

Behavior details:
- Responsibility: keep algorithm/service boundary explicit and testable.
- Side effects: none (types only).
- Extend/tweak: add score-breakdown fields if UI needs detailed diagnostics.

## `src/lib/picker/algorithm.ts`
Purpose:
- Pure weighted-random selection logic with fairness rules and why-line generation.

Exported functions/classes/constants:
- `selectTaskForIntent(tasks, intent, fairness, options)`
- `scoreCandidate(task, intent, fairness, usedTimeFallback)`
- `chooseWeighted(candidates, random)`
- `buildWhyLine(candidate, intent)`

Function details:
- `selectTaskForIntent(...)`
  - Responsibility: filter candidates by context/mode/time, apply fallback, score, and choose.
  - Inputs/outputs: tasks + intent + fairness + optional RNG -> `PickerResult`.
  - Side effects: none.
  - Key rules/edge cases:
    - CHILL mode allows LOW energy only.
    - strict time first; fallback +15 minutes only when strict pool is empty.
    - returns `no_match` with guidance when pool is empty.
  - Extend/tweak: modify energy compatibility or fallback logic here.
- `scoreCandidate(...)`
  - Responsibility: apply multiplier-based weighting and expose score flags.
  - Inputs/outputs: candidate task + fairness context -> `CandidateScore`.
  - Side effects: none.
- `chooseWeighted(...)`
  - Responsibility: draw one candidate proportionally to score.
  - Inputs/outputs: scored candidates + RNG -> selected `CandidateScore`.
  - Side effects: none.
- `buildWhyLine(...)`
  - Responsibility: produce persisted one-line explanation for pick event.
  - Inputs/outputs: selected score + intent -> `string`.
  - Side effects: none.

## `src/lib/picker/service.ts`
Purpose:
- DB-backed picker orchestration and status-event persistence.

Exported functions/classes/constants:
- `createIntentAndPickTask(userId, intent)`
- `createTaskStatusEvent(userId, payload)`
- Type: `PickTaskServiceResult`
- Internal helpers: `toActionWhyLine(payload)`, `subtractDays(date, days)`

Function details:
- `createIntentAndPickTask(...)`
  - Responsibility: create intent, gather tasks/fairness history, run algorithm, persist PICKED event.
  - Inputs/outputs: `userId`, validated intent payload -> pick result object.
  - Side effects: DB writes to `DailyIntent` and `PickEvent`; DB reads tasks/history.
  - Key rules/edge cases:
    - returns `no_match` while still preserving the captured intent.
    - stores `why` exactly at pick time.
  - Extend/tweak: add transaction wrapping if more atomic guarantees are needed.
- `createTaskStatusEvent(...)`
  - Responsibility: validate user ownership and persist STARTED/DONE/SKIPPED event.
  - Inputs/outputs: `userId`, validated event payload -> created event id.
  - Side effects: DB read+write on task/intent/event tables.
  - Key rules/edge cases:
    - rejects events for non-owned tasks.
    - links optional intent only when it belongs to the same user.
  - Extend/tweak: enforce additional state-transition rules if needed.

## `src/lib/validation/picker.ts`
Purpose:
- Zod validation schemas for picker intent submission and status-action events.

Exported functions/classes/constants:
- `intentInputSchema`
- `pickEventActionSchema`
- Types: `IntentPayload`, `PickEventActionPayload`

Schema details:
- `intentInputSchema`
  - Responsibility: ensure context/mode/time are valid allowed values.
  - Key rules/edge cases: time must be 10/30/60.
- `pickEventActionSchema`
  - Responsibility: enforce event action rules.
  - Key rules/edge cases:
    - `skippedReason` required for `SKIPPED`.
    - `skippedReason` forbidden for non-skipped actions.

## `src/app/api/intents/pick/route.ts`
Purpose:
- Authenticated API endpoint to capture intent and return a weighted pick result.

Exported functions/classes/constants:
- `POST(request)`

Function details:
- `POST(request)`
  - Responsibility: session check, payload validation, pick service invocation.
  - Inputs/outputs: HTTP request -> JSON pick/no-match response.
  - Side effects: writes intent and maybe pick event.

## `src/app/api/pick-events/route.ts`
Purpose:
- Authenticated API endpoint for STARTED/DONE/SKIPPED event logging.

Exported functions/classes/constants:
- `POST(request)`

Function details:
- `POST(request)`
  - Responsibility: session check, payload validation, status-event persistence.
  - Inputs/outputs: HTTP request -> JSON event id/error.
  - Side effects: DB event writes.

## `src/components/picker/pick-task-panel.tsx`
Purpose:
- Client picker UI flow: intent chooser, pick request, result rendering, and progress actions.

Exported functions/classes/constants:
- `PickTaskPanel()`
- Internal: `DividerLine()`

Function details:
- `PickTaskPanel()`
  - Responsibility: orchestrate UX for pick + action logging.
  - Inputs/outputs: user input -> API requests -> result card.
  - Side effects: calls `/api/intents/pick` and `/api/pick-events`.
  - Key rules/edge cases:
    - handles no-match state.
    - requires skipped reason for skip action.

## `src/components/tasks/task-quick-actions.tsx`
Purpose:
- Reusable client quick-action controls for task detail screens.

Exported functions/classes/constants:
- `TaskQuickActions({ taskId, intentId })`

Function details:
- `TaskQuickActions(...)`
  - Responsibility: send STARTED/DONE/SKIPPED events for a specific task.
  - Inputs/outputs: task identifiers + user interactions.
  - Side effects: POST to `/api/pick-events`.
  - Extend/tweak: add additional actions (e.g. blocked-until date).

## `src/app/app/pick/page.tsx`
Purpose:
- Protected page wrapper for picker workflow.

Exported functions/classes/constants:
- `PickTaskPage()`

Function details:
- `PickTaskPage()`
  - Responsibility: enforce auth and render picker panel.
  - Inputs/outputs: none.
  - Side effects: redirects unauthenticated users.

## `src/app/app/tasks/[taskId]/page.tsx`
Purpose:
- Task detail view with starter step, checklist, tips, quick actions, and latest event history.

Exported functions/classes/constants:
- `TaskDetailPage({ params })`

Function details:
- `TaskDetailPage({ params })`
  - Responsibility: owner-scoped load of task + recent events, render detail UI.
  - Inputs/outputs: route param -> detail page.
  - Side effects: DB reads on task/event tables.
  - Key rules/edge cases: returns 404 for missing/non-owned task.

## `src/app/app/history/page.tsx`
Purpose:
- Protected history log page for pick events with optional date filtering.

Exported functions/classes/constants:
- `HistoryPage({ searchParams })`
- Internal: `endOfDay(date)`, `parseDate(value)`

Function details:
- `HistoryPage({ searchParams })`
  - Responsibility: query user-scoped events and render event timeline.
  - Inputs/outputs: optional `from/to` query params -> history list.
  - Side effects: DB reads.
  - Key rules/edge cases:
    - invalid dates are ignored safely.
  - Extend/tweak: add pagination and richer filter facets.

## `src/lib/logger.ts`
Purpose:
- Provides shared structured server-side logging using pino.

Exported functions/classes/constants:
- `logger`

Constant details:
- `logger`
  - Meaning: app-wide pino logger with configurable level.
  - Used in: task actions and picker service.
  - Safe values/constraints: set `LOG_LEVEL` env to tune verbosity.

## `vitest.config.ts`
Purpose:
- Configures Vitest execution and TS path aliases.

Exported functions/classes/constants:
- default `defineConfig(...)`

Behavior details:
- Responsibility: run unit tests in Node environment for `src/**/*.test.ts`.
- Side effects: test-runner configuration only.
- Extend/tweak: add coverage thresholds/reporter options here.

## `src/lib/picker/algorithm.test.ts`
Purpose:
- Unit tests for weighted picker behavior and fairness constraints.

Exported functions/classes/constants:
- Test suite only.

Coverage notes:
- Verifies no-match behavior.
- Verifies time fallback behavior.
- Verifies fairness/avoidance weighting flags.
- Verifies CHILL energy filtering.

## `src/lib/validation/task.test.ts`
Purpose:
- Unit tests for task form-data parsing and validation rules.

Exported functions/classes/constants:
- Test suite only.

Coverage notes:
- Valid input parsing.
- Required starter-step enforcement.
- Invalid time rejection.

## `playwright.config.ts`
Purpose:
- Configures Playwright E2E runner and local web server startup.

Exported functions/classes/constants:
- default `defineConfig(...)`

Behavior details:
- Responsibility: run tests under `tests/e2e` against local/base URL.
- Key rules/edge cases:
  - uses `PLAYWRIGHT_BASE_URL` when provided.
  - otherwise starts local app server via `npm run dev`.
- Extend/tweak: tune timeout, trace, or browser projects here.

## `tests/e2e/smoke.spec.ts`
Purpose:
- End-to-end smoke flow for auth, task CRUD, picker, and history.

Exported functions/classes/constants:
- Playwright tests only.

Behavior details:
- Responsibility: validate core user journey from signup through done-event history.
- Key rules/edge cases:
  - gated by `RUN_E2E=1` to support environments without full runtime dependencies.
- Extend/tweak: add multi-user isolation or failure-path smoke cases.

## `src/app/app/tasks/actions.ts` (Phase 5 logging update)
Purpose:
- Added structured logging for task creation events.

Behavior update:
- `createTaskAction(...)` now logs `userId`, `taskId`, and `title` when creation succeeds.

## `src/lib/picker/service.ts` (Phase 5 logging update)
Purpose:
- Added structured logging for picker and status-event lifecycle.

Behavior update:
- Logs no-match outcomes, successful picks, and STARTED/DONE/SKIPPED event writes.

## Phase 6 Note
Purpose:
- No business-logic code changes were introduced in Phase 6.
- Changes were limited to operational documentation (`README.md`) and env template polish (`.env.example`).

## `src/components/ui/app-snackbar-provider.tsx`
Purpose:
- Global snackbar infrastructure with enqueue-style API for client UX feedback.

Exported functions/classes/constants:
- `AppSnackbarProvider({ children })`
- `useAppSnackbar()`
- Types: `AppSnackbarOptions`
- Internal constant: `DEFAULT_AUTO_HIDE_MS`

Function details:
- `AppSnackbarProvider({ children })`
  - Responsibility: host snackbar queue state, render one active snackbar, process queued messages.
  - Inputs/outputs: React children -> provider + snackbar renderer.
  - Side effects: UI notifications only.
  - Key rules/edge cases:
    - sequential queue processing via `TransitionProps.onExited`.
    - default severity is `info`.
  - Extend/tweak:
    - change queue behavior, anchor position, or default duration here.
- `useAppSnackbar()`
  - Responsibility: expose `enqueueSnackbar(message, options)` to client components.
  - Inputs/outputs: none -> context API.
  - Side effects: throws if called outside provider.

Constant details:
- `DEFAULT_AUTO_HIDE_MS`
  - Meaning: fallback snackbar visible duration.
  - Used in: `Snackbar.autoHideDuration` fallback.
  - Safe values/constraints: keep between ~1500 and ~6000ms for usability.

## `src/components/ui/app-dialog.tsx`
Purpose:
- Accessible shared dialog wrapper for modal workflows.

Exported functions/classes/constants:
- `AppDialog({...})`

Function details:
- `AppDialog({...})`
  - Responsibility: render standardized dialog shell with title, optional description, and close control.
  - Inputs/outputs:
    - inputs: `open`, `onClose`, `title`, `description`, `maxWidth`, `fullWidth`, `children`
    - output: configured MUI `Dialog`.
  - Side effects: modal open/close UI behavior.
  - Key rules/edge cases:
    - uses generated unique ids for `aria-labelledby` and `aria-describedby`.
    - close button routes through shared `onClose` callback.
  - Extend/tweak:
    - adjust sizing defaults or title/action layout here.

## `src/components/ui/app-drawer.tsx`
Purpose:
- Accessible shared drawer wrapper for in-place workflows.

Exported functions/classes/constants:
- `AppDrawer({...})`

Function details:
- `AppDrawer({...})`
  - Responsibility: render standardized drawer shell with dialog semantics and close controls.
  - Inputs/outputs:
    - inputs: `open`, `onClose`, `title`, `description`, `anchor`, `width`, `children`
    - output: configured MUI `Drawer`.
  - Side effects: modal-like drawer UI behavior.
  - Key rules/edge cases:
    - sets dialog ARIA attributes on drawer paper.
    - width constrained to viewport.
  - Extend/tweak:
    - change default anchor, width, or keepMounted behavior.

## `src/components/tasks/tasks-ux-shell.tsx`
Purpose:
- Phase-1 UX scaffolding on tasks page to validate dialog/drawer/snackbar primitives without changing core task flow.

Exported functions/classes/constants:
- `TasksUxShell({ createAction, defaultValues })`

Function details:
- `TasksUxShell({ createAction, defaultValues })`
  - Responsibility:
    - render preview actions to open modal and drawer
    - render existing `TaskForm` inside reusable dialog
    - emit snackbar feedback on modal open.
  - Inputs/outputs:
    - `createAction` (existing create server action), `defaultValues` (task form defaults)
    - returns client UI shell.
  - Side effects:
    - invokes existing create server action when modal form submits.
    - emits snackbar events.
  - Key rules/edge cases:
    - existing inline create section remains available in parallel.
  - Extend/tweak:
    - this is the main handoff point for Phase 2 migration to primary modal create UX.

## `src/components/app-providers.tsx` (Phase-1 UX update)
Purpose:
- Updated provider composition to include global snackbar infrastructure.

Behavior update:
- `AppProviders` now wraps children with `AppSnackbarProvider` under `ThemeProvider`.

## `src/app/app/tasks/page.tsx` (Phase-1 UX update)
Purpose:
- Updated tasks page to mount shared UX shell preview without removing existing flows.

Behavior update:
- Added `TasksUxShell` mount with existing create action + defaults.
- Existing inline create form and list/edit/archive behavior remain unchanged.

## Quick UX Tweak Pointers (Phase 1)
- Snackbar defaults and queueing:
  - file: `src/components/ui/app-snackbar-provider.tsx`
  - symbols: `DEFAULT_AUTO_HIDE_MS`, `enqueueSnackbar`, `processNext`
- Shared modal accessibility/sizing:
  - file: `src/components/ui/app-dialog.tsx`
  - symbol: `AppDialog`
- Shared drawer accessibility/sizing:
  - file: `src/components/ui/app-drawer.tsx`
  - symbol: `AppDrawer`
- Tasks page UX shell behavior:
  - file: `src/components/tasks/tasks-ux-shell.tsx`
  - symbol: `TasksUxShell`
