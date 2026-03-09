# Figma Implementation Playbook

Use this playbook whenever implementing a Figma design in this repo.

## 1) Task Intake Template

Use this exact request format:

```md
Implement this Figma node in Task Generator:
URL: <figma-url-with-node-id>
Scope: <new screen | update existing screen | component only>
Target route: <route-or-n/a>
Constraints:
- Reuse existing components where possible
- Match design with high fidelity
- Keep existing behavior unless explicitly changed
```

## 2) Mandatory Agent Sequence

1. Read:
- `AGENT.md`
- `docs/requirements/figma-design-integration.md`
- `docs/architecture/figma-design-integration.md`
2. Fetch Figma:
- `get_design_context`
- `get_screenshot`
3. Decide file targets using mapping rules from architecture doc.
4. Implement minimal changes in correct ownership paths.
5. Validate quality gates and route checks.
6. Report:
- what changed
- what matched design
- any deliberate deviations

## 3) File Placement Decision Matrix

- New route UI: `src/app/<route>/page.tsx` + `src/components/**`
- Existing route polish: edit route page and local components only
- Shared visual primitive: `src/components/**` and, if required, `src/theme/**`
- Backend required by new UI behavior: only then touch `src/app/api/**`, `src/app/**/actions.ts`, `src/lib/**`

## 4) Accuracy Checklist (Required)

- [ ] Layout structure and spacing match screenshot
- [ ] Typography size/weight/line-height match intent
- [ ] Colors and component states match intent
- [ ] Hover/focus/disabled states are implemented
- [ ] Mobile + desktop behavior verified
- [ ] No unrelated files changed

## 5) Safe Deviation Rules

Deviate only for:
- Accessibility compliance
- Existing design-system constraints
- Technical constraints in current app architecture

When deviating, include a short note in the final change summary.

