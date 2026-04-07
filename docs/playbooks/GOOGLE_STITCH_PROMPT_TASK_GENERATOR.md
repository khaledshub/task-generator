# Google Stitch Master Prompt: Task Generator (Visual-Forward UI)

## Context
You are designing a full product UI from scratch in Google Stitch for **Task Generator**, a weighted next-action picker for personal productivity.

Product definition:
- Users create structured tasks with context, energy, type, time estimate, starter step, checklist, and tips.
- A weighted picker recommends the best next task based on how the user feels now.
- Users track action outcomes (picked, started, done, skipped) and review history.

Design objective:
- Preserve current workflows and information architecture.
- Evolve visuals to be richer and more expressive so iteration/design changes are easier to visualize.
- Keep usability high: fast scanning, clear hierarchy, obvious primary actions.

Tone and behavior:
- Energetic, focus-friendly, high-clarity, not toy-like.
- Modern, premium productivity atmosphere.
- Strong visual rhythm, without clutter.

Constraints:
- Responsive on mobile and desktop.
- Keyboard-friendly interaction patterns.
- Accessible color contrast and focus states.
- Reduced-motion variant for users with motion sensitivity.

## Screen Requirements
Create all screens below and keep route-level parity.

### Public and auth entry
- `/`
  - Public landing with value proposition and system status card.
  - CTAs: `Create account`, `Log in`, `Join as guest`, `Refresh status`.
- `/login`
  - Login card with form, helper links, and auth CTA.
- `/signup`
  - Signup card with form and link to login.

### Shared authenticated shell
- Sticky authenticated header with:
  - Primary nav: `Home`, `Tasks`, `Pick`, `History`.
  - User action area and logout action.
  - Theme toggle affordance.

### Main app
- `/app` (dashboard)
  - Hero/create spotlight section (`Create Your Next Task` / `Task command center`).
  - Quick picker filter bar (`Context`, `Mode`, `Time`) and `Pick task` CTA.
  - Stat cards: active tasks, completed actions, archived.
  - Informational banner/status area.
  - Modal result pattern for picked task details.

- `/app/tasks`
  - Purpose header.
  - In-place create spotlight (opens dialog form).
  - Active tasks list as rich cards with chips/tags:
    - status, context, energy, type, frequency, time, avoiding, checklist count, tips count.
  - Per-task row actions: open, edit, archive/restore, etc.
  - Archived section for recently archived tasks.

- `/app/pick`
  - Purpose header.
  - Filter controls: `Context`, `Mode`, `Time available`.
  - `Pick my task` CTA.
  - States:
    - loading (`Computing your weighted pick...`)
    - no match
    - picked task result
  - Picked result content:
    - title, description, why selected, starter step, AI steps, checklist, tips.
  - Progress actions area:
    - `Started`, `Done`, `Skipped` + skipped reason + optional notes.

- `/app/history`
  - Purpose header.
  - Date filter bar (`From`, `To`, `Filter`).
  - Task history timeline/list.
  - Recent events timeline/list with chips for action type.
  - Empty and pagination/"show more" style handling.

- `/app/tasks/[taskId]` (task detail)
  - Task summary hero with chips and task metadata.
  - `Back to tasks` and `Edit task` actions.
  - Sections:
    - starter step
    - checklist (including AI generation pending/stale variants)
    - tips assistant
    - quick actions
    - latest pick history for task

- `/app/tasks/[taskId]/edit`
  - Edit hero card.
  - Full task form-heavy editing experience.
  - Actions: back, cancel, save.

- `/app/user`
  - Account summary card.
  - Change password section.
  - Recent pick activity list.
  - Recent AI generation requests list.

## Visual System
Use an evolved version of blue/cyan glassmorphism with stronger depth and hierarchy.

Design direction:
- Ambient gradient canvas background with soft radial glows.
- Layered translucent surfaces for hero/filter cards.
- Higher contrast text hierarchy than decorative surfaces.
- Distinct visual weight between primary and secondary actions.

### Tokens (compact design-system spec)
- Color roles:
  - `primary`: deep-to-bright blue ramp.
  - `secondary`: cyan/teal accent ramp.
  - `surface.base`: page backgrounds.
  - `surface.glass`: translucent elevated containers.
  - `text.primary`, `text.secondary`.
  - `state.success`, `state.warning`, `state.error`, `state.info`.
- Spacing scale:
  - Base 4px system: `4, 8, 12, 16, 24, 32, 40, 48`.
- Radius scale:
  - `sm 10`, `md 14`, `lg 18`, `xl 24`, `pill 999`.
- Elevation:
  - `e1` subtle card, `e2` raised card, `e3` hero spotlight, `e4` modal/dialog.
- Motion:
  - Durations: `140ms`, `220ms`, `350ms`, `450ms`.
  - Easing: `ease-out` for entry, `ease-in-out` for hover pulses.
  - Reduced motion: disable float/pulse animations, keep opacity-only transitions.

### Layout rules
- Mobile-first breakpoints:
  - `xs` phone single-column.
  - `sm` tighter two-column where safe.
  - `md+` multi-column dashboard/list layouts.
- Density behavior:
  - Compact controls in headers/filters.
  - Relaxed spacing in hero/result/read-heavy sections.
- Max width:
  - Constrain content to readable center column with breathable margins.

## Components
Define reusable primitives and compose screens from them.

Required primitives:
- Sticky app bar/navigation shell.
- Page purpose header (title + supporting subtitle).
- Gradient hero card and glass paper container.
- Buttons (contained, outlined, text) with clear hierarchy.
- Form controls:
  - text field, select, switch, checkbox.
- Chips/tags for metadata and statuses.
- Alerts/banners for success/info/warning/error.
- Modal dialog and side drawer.
- Progress/status banner with dismiss action.
- Timeline/list row patterns for history and activity.

State coverage per relevant component:
- `loading`
- `empty`
- `success`
- `warning`
- `error`
- `disabled`

## Interaction
Interaction intent:
- Primary CTAs feel prominent and immediate.
- Hover/press feedback is clear but restrained.
- Motion communicates hierarchy and state change, not decoration-only.

Motion patterns:
- Page/section enter: short upward fade.
- Hero/spotlight surfaces: subtle ambient pulse.
- Buttons/cards: micro-lift on hover, slight press compression.
- Modal result reveal: brief scale+fade emphasis for “picked task” moment.

Usability rules:
- Keep core actions always obvious:
  - create task
  - pick task
  - mark progress
  - edit task
  - view history
- Preserve scanning efficiency in list-heavy pages.
- Keep forms readable and progressive, especially in edit/create flows.

## Accessibility
- Ensure WCAG-compliant contrast for text on gradients and glass surfaces.
- All interactive controls must show visible focus indicators.
- Keyboard traversal order should match visual order.
- Support reduced-motion preferences with equivalent non-motion cues.
- Use clear labels for all fields and status regions.
- Avoid color-only signaling; pair state with text/icon cues.

## Output Expectations
Generate:
1. A complete screen set for all required routes.
2. Reusable component primitives and style tokens.
3. Mobile and desktop variants for all core screens.
4. State variants for loading/empty/success/warning/error/disabled.
5. A cohesive visual language that is visibly richer than a basic dashboard while staying practical for productivity workflows.

Quality gates for generated output:
- No required route is missing.
- Information architecture matches the route map above.
- Primary actions remain obvious on every relevant screen.
- Form-heavy and dashboard-heavy views both remain clear and usable.
- Accessibility requirements are explicitly reflected in component behavior.
