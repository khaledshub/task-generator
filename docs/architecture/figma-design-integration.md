# Architecture: Figma-to-Code Execution for Task Generator

## System Intent

Translate Figma nodes into production-ready Next.js + MUI code with 1:1 visual intent while preserving repository conventions.

## Flow

1. Parse Figma link and extract node scope.
2. Fetch MCP design context.
3. Fetch screenshot for visual source of truth.
4. Map design elements to existing app structure.
5. Implement in owned files only.
6. Run quality gates and route sanity checks.

## Repo File Mapping Rules

### Screen/Page Layout
- `src/app/**/*.tsx`

### Reusable UI Components
- `src/components/**`
- `src/theme/**`
- `src/app/globals.css` (only when theme tokens cannot represent the design)

### API/Server/Data
- `src/app/api/**`
- `src/app/**/actions.ts`
- `src/lib/**` (non-UI utilities/validation/contracts)
- `prisma/**` (only if design introduces required persisted fields)

## Design Translation Rules

1. Prefer existing MUI/themed components over creating new primitives.
2. Use tokenized spacing, color, radius, and typography via theme first.
3. Add new component variants before creating entirely new component families.
4. Keep route/data patterns intact; UI changes should not silently alter business logic.

## Fidelity and Accessibility Contract

1. Match:
- hierarchy
- spacing rhythm
- typography scale/weight
- color contrast and states
2. Verify keyboard navigation and focus visibility for interactive elements.
3. Preserve responsive behavior based on Figma constraints and current breakpoints.

## Validation Contract

Run:
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e` (or `npm run test:e2e:ci` when relevant)

Then sanity-check:
- `/app`
- `/app/tasks`
- `/app/pick`
- `/app/history`
- `/api/health`

