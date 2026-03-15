# Backlog Task Prompt Workflow

Use this workflow when you want to run the same 6-prompt loop for a backlog item in `project-backlog-todo-tasks.txt`.

## Goal

For any task ID like `TG-002`, generate the same prompt sequence with the task title and backlog context already filled in.

## Prompt Sequence

1. Repository diagnostics and status review
2. Implementation-shape analysis
3. Minimal implementation plan
4. Implement only the approved slice
5. Add or update the highest-value tests
6. Strict senior review of the implemented slice

## Recommended Usage

1. Pick a task ID from `project-backlog-todo-tasks.txt`
2. Generate the prompt pack:

```bash
node scripts/render-task-prompt-pack.mjs TG-002
```

3. Paste prompt 1 into Codex
4. Work through prompts in order
5. For prompt 4, narrow the slice if the earlier prompts expose blockers
6. After prompt 6, either:
   - update the backlog item status, or
   - create the next follow-up task ID for unresolved blockers

## Notes

- The script prints the backlog task title, area, priority, status, why it matters, and any scope/questions/files block it can detect.
- The prompts are intentionally conservative and reuse the repository style you already established during `TG-001`.
- If a task is mainly review/decision-oriented, prompt 4 should be interpreted as “implement the smallest approved slice” only if a code change is actually warranted.
