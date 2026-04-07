# Frontend Standards

## Purpose
This codebase uses Next.js App Router, React 19, MUI, and Framer Motion to ship a dark-first task workspace with restrained branded surfaces. The standard is to preserve that identity while keeping styling decisions centralized, composable, and accessible.

## Core Rules
- Use theme tokens before raw literals.
- Use shared UI primitives before ad hoc `Paper` shells on entry screens and main app surfaces.
- Keep route files focused on data loading, auth checks, and parameter parsing.
- Put reusable presentation into `src/components/**`.
- Keep branded gradients, glass treatments, borders, and focus rings in theme tokens or shared style helpers.
- Use `sx` for local layout composition, not for re-encoding shared branded recipes.

## Approved Primitives
- `AppShell`: page chrome, width, and shell spacing
- `PageIntro`: page-level title/subtitle treatment
- `FeaturePanel` and `ActionPanel`: branded and neutral surfaces
- `ListSection`: section wrapper for lists, logs, and summaries
- `FilterToolbar`: high-contrast filter form shell
- `StatusBadgeCluster`: chip/badge wrapping
- `EmptyState`: zero-data messaging
- `MotionReveal`: shared reduced-motion-aware entrance transition

## Styling Guidance
- Favor one dominant visual idea per section.
- Avoid stacked generic cards when plain layout or a single section surface is enough.
- Use typography hierarchy from the theme; avoid arbitrary font sizing unless a shared primitive owns it.
- Use visible hover, focus-visible, disabled, and pending states on interactive controls.
- Use reduced-motion-safe transitions through shared motion wrappers.

## Route Boundaries
- Route `page.tsx` and `layout.tsx` files should not become style dumping grounds.
- Entry screens and top-level app pages should compose shared primitives instead of raw `Paper` wrappers.
- If a screen introduces a repeated UI pattern, extract a component instead of copying another `sx` block.

## MUI Usage
- MUI remains the component foundation.
- Theme augmentation lives in `src/theme/mui.d.ts`.
- App-level semantic tokens live in `theme.app`.
- Shared style helpers live in `src/theme/patterns.ts`.

## Motion
- Framer Motion remains the motion layer.
- Use `MotionReveal` for standard entrance transitions.
- Motion should reinforce hierarchy or feedback, not decorate routine layout.

## Accessibility
- Maintain contrast on text over branded surfaces.
- Preserve keyboard focus visibility using shared focus ring styles.
- Respect `prefers-reduced-motion`.
- Keep action copy literal and scannable on product surfaces.
