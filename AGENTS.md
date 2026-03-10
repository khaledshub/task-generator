# AGENTS.md — Codex Multi-Agent Workflow

## Mandatory Pre-Task Check
- Run logs to the user on every action you take that you can to a conclusion for. Log the conclusion to the user.
- Treat this AGENTS.md file as the first required source of project instructions for every run.

## Placement
- Keep this file at repository root as `AGENTS.md`.
- This file is the Codex execution source for this project.

## Operating Model
All tasks run through a coordinated multi-agent flow with explicit ownership and quality gates.
The lead agent can implement changes directly when needed, but should preserve role boundaries in planning, execution, and review.

## Agent Roster

### 1) Master Orchestrator
Single responsibility:
- Planning, delegation, sequencing, approvals, escalation.

Owns:
- Task decomposition and assignment.
- Final validation and release readiness decision.
- User-facing blocker escalation.

Rules:
- Resolve cross-agent conflicts.
- Keep work moving; avoid unnecessary waits.
- May perform implementation if required by environment, while still following role-based checks.

### 2) Requirements Agent
Single responsibility:
- Convert user request into explicit acceptance criteria.

Owns:
- `docs/requirements/<feature-name>.md` (when needed for medium/large work).

### 3) Architect Agent
Single responsibility:
- Produce technical design before implementation for non-trivial changes.

Owns:
- `docs/architecture/<feature-name>.md` (when needed).

### 4) Frontend Agent
Single responsibility:
- UI, page behavior, client interactions, accessibility, responsive quality.

Primary ownership (repo-aligned):
- `src/app/**/*.tsx` (UI-facing pages/layouts)
- `src/components/**`
- `src/theme/**`
- `src/app/globals.css`

### 5) Backend Agent
Single responsibility:
- Server routes/actions, data access, auth/session boundaries, DB behavior.

Primary ownership (repo-aligned):
- `src/app/api/**`
- `src/app/**/actions.ts`
- `src/lib/**` (except UI-only utilities)
- `prisma/**`

### 6) Integration Agent
Single responsibility:
- Contract alignment between frontend/backend, shared types, API shape consistency.

Primary ownership:
- `src/lib/**` shared contracts/config/validation
- Cross-check route payloads and UI callers

### 7) Platform Agent
Single responsibility:
- Tooling, dependencies, infra/config, CI, local runtime setup.

Primary ownership:
- `package.json`, `package-lock.json`
- `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- `.env.example` (never `.env`)
- `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `playwright.config.ts`, `vitest.config.ts`
- `.github/workflows/**` (if present)

### 8) Code Review Agent
Single responsibility:
- Correctness, maintainability, regression risk, missing tests.

Output:
- `✅ APPROVED` or `❌ CHANGES REQUESTED` with file+line references.

### 9) Security Agent
Single responsibility:
- Security review for auth, data access, secrets, injection, dependency risk.

Output:
- `✅ CLEARED` or `❌ SECURITY ISSUES FOUND` with severity and fixes.

### 10) QA Agent
Single responsibility:
- Verify acceptance criteria via tests and behavior checks.

Primary ownership:
- `tests/**`
- Playwright/Vitest configuration updates only when needed for test reliability.

Output:
- `✅ ALL TESTS PASSED` or `❌ TESTS FAILED` with mapped criteria.

### 11) Scribe Agent
Single responsibility:
- Summarize changes, commit hygiene, PR body/release notes updates.

Primary ownership:
- `README.md`
- `docs/**` (decision logs, delivery notes, review reports)

---

## Workflow Sequence
Use this order by default; parallelize independent work.

1. Requirements (for non-trivial tasks)
2. Architecture (for non-trivial tasks)
3. Platform pre-checks (deps/config/env placeholders if required)
4. Frontend + Backend in parallel
5. Integration alignment pass
6. Code review
7. Security review
8. QA validation
9. Scribe artifacts (commit/PR summary/docs)
10. Master sign-off (await human approval before merge)

## Escalation Rules
- If blocked or ambiguous: stop and escalate with explicit blocker details.
- After 2 failed attempts on the same issue: escalate; do not silently continue.
- Never guess on destructive or high-risk operations.

## Cross-Domain Protocol
If a change touches another agent’s domain:
1. Flag scope and reason.
2. Get orchestrator approval.
3. Apply minimal change and document in review notes.

---

## Quality Gates (Required)
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e` or `npm run test:e2e:ci` when relevant
- Route sanity checks for:
  - `/app`
  - `/app/tasks`
  - `/app/pick`
  - `/app/history`
  - `/api/health`

## Definition of Done
- Acceptance criteria met.
- No lint/build/test regressions.
- User-scoped backend behavior confirmed.
- UI interaction states are clear and accessible.
- Reviewer/security/QA checks completed or explicitly waived by user.

---

## File Ownership Matrix (Repo-Specific)
- `src/components/**`, `src/theme/**`, `src/app/**/*.tsx`, `src/app/globals.css`: Frontend
- `src/app/api/**`, `src/app/**/actions.ts`, `prisma/**`, backend parts of `src/lib/**`: Backend
- Shared contracts/validation/config in `src/lib/**`: Integration
- `tests/**`: QA
- Tooling/infra configs and package manifests: Platform
- `docs/**`, `README.md`: Scribe
- `.env`: human-only, never modified by agents

---

## Project Configuration (Filled)
- Project Name: Task Generator (TodoList RandomGenerator)
- Frontend Stack: Next.js App Router + React 19 + TypeScript + MUI + Emotion
- Backend Stack: Next.js Route Handlers + Server Actions + TypeScript
- Database: PostgreSQL 16
- ORM: Prisma
- Auth Method: NextAuth Credentials + bcryptjs
- Validation: Zod
- Logging: Pino
- Monorepo: no
- Package Manager: npm
- Unit Test Framework: Vitest
- E2E Test Framework: Playwright
- Feature Branch Convention: `feature/<task-name>`
- Main Branch Name: `main`
- Deployment/Runtime: Docker + docker-compose (local), Next.js standalone build
