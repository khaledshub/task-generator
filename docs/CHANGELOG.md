# Changelog

## 2026-03-09 - Tips Assistant, Checklist UX, Picker Flexibility, and Docs

### Added
- Figma integration documentation set:
  - `docs/FIGMA_MCP_SETUP.md`
  - `docs/requirements/figma-design-integration.md`
  - `docs/architecture/figma-design-integration.md`
  - `docs/playbooks/FIGMA_IMPLEMENTATION_PLAYBOOK.md`
- Task insights AI flow:
  - `POST /api/ai/task-insights`
  - AI generation module for task-specific tips and follow-up Q&A
  - request validation for task insights payloads
- `TaskTipsAssistant` with:
  - generated best-practice/get-started tips
  - in-page interactive chat
  - typing indicator
  - auto-scroll to latest assistant response
  - persisted per-task chat state
  - archive/reopen chat actions
- Reusable `Checklist` component with persisted completion state.

### Changed
- Task detail page:
  - checklist and tips UX restructuring
  - checklist loading indicator while AI generation is pending
- Picker UX on Home and Pick pages:
  - removed default preselected filters
  - added `Any` options for context/mode/time
  - empty filters now support random picking from all available tasks
- Picker backend:
  - optional filters supported in validation/types/algorithm/service
  - updated rationale text for unfiltered picks
- Home create flow:
  - includes `createdTaskId` in success state
  - adds direct open-to-tasks CTA
  - highlights newly created task on Tasks page

### Fixed
- Hydration and render loop issues in checklist/chat persistence:
  - stabilized snapshot behavior for client storage subscriptions
  - removed hydration-unsafe initial state patterns
  - resolved maximum update depth and hydration mismatch errors

