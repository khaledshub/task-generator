# Requirements: Figma Design Integration

## Goal

Enable the agent to implement Figma designs accurately in this repository with predictable file placement, minimal ambiguity, and consistent quality gates.

## Acceptance Criteria

1. Agent has a documented setup path for Figma MCP connectivity.
2. Agent follows a fixed extraction flow (`design_context` + screenshot before coding).
3. Agent has explicit file-target mapping for this codebase.
4. Agent has implementation rules for:
- token usage
- component reuse
- accessibility
- responsive behavior
5. Agent validates visual parity and route-level behavior before closing work.

## Inputs Required Per Figma Task

- Figma URL with `node-id` (or `fileKey` + `nodeId`)
- Scope statement:
  - New screen
  - Existing screen update
  - Component only
- Route target (if screen-level)

## Out of Scope

- Editing `.env`
- Replacing existing architecture with a different framework
- Introducing a new UI library without explicit request

