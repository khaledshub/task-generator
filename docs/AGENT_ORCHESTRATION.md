# Multi-Agent Delivery Orchestration

## Objective
Run this Task Generator as a coordinated multi-agent system with a clear owner, execution boundaries, and quality gates suitable for a 2026 production workflow.

## Agent Roster

### 1) Leader Agent (Primary Controller)
- Owns planning and sequencing.
- Creates work contracts for each specialized agent.
- Reviews all outputs against quality gates before merge.
- Blocks release if any gate fails.

### 2) Frontend + UI Agent
- Owns visual language, interaction quality, accessibility, and responsive behavior.
- Validates:
  - Mobile and desktop usability.
  - Keyboard navigation and focus behavior.
  - Interactive flow polish (dialogs, drawers, snackbar, loading and feedback states).
- Deliverables:
  - Theme and layout enhancements.
  - Interactive UX shell for task creation and guidance.

### 3) Backend + Connections Agent
- Owns API reliability and service integration checks.
- Validates:
  - Database connectivity.
  - Authentication environment readiness.
  - API error handling quality.
- Deliverables:
  - `/api/health` endpoint for operational checks.
  - Connection diagnostics included in release verification.

### 4) Business Logic + QA Agent
- Owns task picker behavior and rules correctness.
- Validates:
  - Weighted random selector behavior.
  - Constraint handling for context, mode, and time window.
  - Fairness penalties and boosts.
- Deliverables:
  - Unit tests covering edge conditions and selection boundaries.

### 5) Independent Reviewer Agent
- Reviews all completed work from every other agent.
- Confirms each deliverable is complete, tested, and documented.
- Produces final pass/fail recommendation for leader.

## Operating Protocol
1. Leader defines acceptance criteria.
2. Specialists execute in parallel where possible.
3. Independent reviewer audits all specialist outputs.
4. Leader runs full-system checks and signs off only on green status.

## Quality Gates
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e` (env-gated smoke path)
- Manual app validation for core routes:
  - `/app`
  - `/app/tasks`
  - `/app/pick`
  - `/app/history`
  - `/api/health`

## Definition of Done
- No lint/type/build regressions.
- Business logic tests pass.
- UI is responsive and interactive with clear user feedback.
- Backend health diagnostics report expected status.
- Reviewer confirms all agent scopes are complete.
