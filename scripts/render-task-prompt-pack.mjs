import fs from "node:fs";
import path from "node:path";

const [, , taskIdArg, ...approvedSliceArgs] = process.argv;
const approvedSlice = approvedSliceArgs.join(" ").trim() || "{{APPROVED_SLICE}}";

if (!taskIdArg) {
  console.error(
    "Usage: node scripts/render-task-prompt-pack.mjs TG-002 [approved slice text]",
  );
  process.exit(1);
}

const repoRoot = process.cwd();
const backlogPath = path.join(repoRoot, "project-backlog-todo-tasks.txt");

if (!fs.existsSync(backlogPath)) {
  console.error("Could not find project-backlog-todo-tasks.txt in the current workspace.");
  process.exit(1);
}

const backlogText = fs.readFileSync(backlogPath, "utf8");
const task = extractTask(backlogText, taskIdArg.trim());

if (!task) {
  console.error(`Could not find task ${taskIdArg} in project-backlog-todo-tasks.txt.`);
  process.exit(1);
}

const prompts = buildPrompts(task, approvedSlice);

console.log(`# Prompt Pack for ${task.id} — ${task.title}\n`);
for (const prompt of prompts) {
  console.log(`prompt ${prompt.number}:`);
  console.log(`"${prompt.body}"`);
  console.log("");
}

function extractTask(backlogText, taskId) {
  const lines = backlogText.split(/\r?\n/);
  const taskHeaderPattern = new RegExp(`^${escapeRegex(taskId)}\\s+—\\s+(.+)$`);

  const startIndex = lines.findIndex((line) => taskHeaderPattern.test(line.trim()));
  if (startIndex === -1) {
    return null;
  }

  const titleMatch = lines[startIndex].trim().match(taskHeaderPattern);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const block = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i];
    if (i > startIndex && /^TG-\d{3}\s+—\s+/.test(line.trim())) {
      break;
    }
    if (i > startIndex && /^Cycle\s+\d+\s+—\s+/.test(line.trim())) {
      break;
    }
    block.push(line);
  }

  return {
    id: taskId,
    title,
    block: block.join("\n").trim(),
    area: findField(block, "Area"),
    priority: findField(block, "Priority"),
    status: findField(block, "Status"),
    why: findField(block, "Why it matters"),
    scopeBlock: extractSectionBlock(block, "Scope"),
    questionsBlock: extractSectionBlock(block, "Questions to answer"),
    filesBlock: extractSectionBlock(block, "Files"),
  };
}

function findField(lines, fieldName) {
  const prefix = `${fieldName}:`;
  const line = lines.find((entry) => entry.trim().startsWith(prefix));
  return line ? line.trim().slice(prefix.length).trim() : "";
}

function extractSectionBlock(lines, sectionName) {
  const prefix = `${sectionName}:`;
  const startIndex = lines.findIndex((entry) => entry.trim() === prefix);

  if (startIndex === -1) {
    return "";
  }

  const sectionLines = [];

  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (sectionLines.length > 0) {
        break;
      }
      continue;
    }

    if (
      /^[A-Za-z].*:$/.test(trimmed) &&
      !trimmed.startsWith("•") &&
      !trimmed.startsWith("-")
    ) {
      break;
    }

    sectionLines.push(normalizeBulletLine(line));
  }

  return sectionLines.join("\n").trim();
}

function normalizeBulletLine(line) {
  const trimmed = line.trim();
  return trimmed.replace(/^•\s*/, "- ");
}

function renderBacklogContext(task) {
  const lines = [
    "Backlog context:",
    `- Area: ${task.area || "{{AREA}}"}`,
    `- Priority: ${task.priority || "{{PRIORITY}}"}`,
    `- Status: ${task.status || "{{STATUS}}"}`,
    `- Why it matters: ${task.why || "{{WHY_IT_MATTERS}}"}`,
    renderOptionalBlock("Scope:", task.scopeBlock),
    renderOptionalBlock("Questions to answer:", task.questionsBlock),
    renderOptionalBlock("Files:", task.filesBlock),
  ].filter(Boolean);

  return lines.join("\n");
}

function renderOptionalBlock(label, block) {
  if (!block) {
    return "";
  }

  return `${label}\n${block}`;
}

function buildPrompts(task, approvedSliceText) {
  const taskLine = `Your task: ${task.id} — ${task.title}`;
  const backlogContext = renderBacklogContext(task);

  return [
    {
      number: 1,
      body: `${taskLine}

${backlogContext}

Do not modify any files yet.

First, perform a concise diagnostics and task-focused status review of this repository.

Please provide:
1. A short summary of the app/service area relevant to this backlog task
2. The main architecture and important modules relevant to this task
3. Key entry points, routes, handlers, components, or services related to this task
4. Relevant data flows for the most likely impact area
5. Existing patterns and conventions that should be preserved
6. Current tests, validation, and error-handling approach related to this task
7. The smallest repo-relative file set likely relevant to this task
8. Any risks, ambiguity, missing context, or hidden dependencies
9. The safest place to start, and any riskier areas to avoid touching early

Constraints:
- Read and analyze only
- Do not edit code
- Use repo-relative paths only
- Keep the output structured, concise, and easy to scan in under 90 seconds
- Prioritize only the most relevant areas for this task, not the whole repo
- Prefer bullets over long paragraphs
- Call out uncertainty explicitly instead of guessing`,
    },
    {
      number: 2,
      body: `${taskLine}

${backlogContext}

Based on this backlog task and the current repository structure, analyze the best implementation shape before changing code.

Please answer:
1. What part of the system should change first?
2. What should remain unchanged?
3. Is this best solved as deterministic logic, AI-assisted logic, a hybrid, or a pure review/decision task?
4. What are the main tradeoffs and risks?
5. What edge cases, failure paths, or contract risks matter most?
6. What is the smallest production-leaning solution that fits this task?
7. What should be the first implementation slice, and what should be deferred?

Constraints:
- Do not edit files yet
- Prefer existing repo patterns over new abstractions
- Avoid over-engineering
- Use repo-relative paths only
- Separate must-have vs nice-to-have
- Be concrete, not generic
- If this task is mainly analysis/decision-oriented, say so explicitly instead of forcing a code-change plan`,
    },
    {
      number: 3,
      body: `${taskLine}

${backlogContext}

Now propose a minimal implementation plan for this task.

Please provide:
1. The exact first slice I should implement first
2. A step-by-step plan in execution order
3. Exact repo-relative files likely to change in the first slice
4. What each file change should accomplish
5. Any new files only if truly necessary
6. The highest-value tests to add or update first
7. Acceptance criteria for the first working version
8. Hidden assumptions, blockers, or risks
9. What should explicitly be deferred to a later slice

Constraints:
- Do not implement yet
- Keep scope tight and production-leaning
- Preserve current project style and architecture
- Prefer existing repo patterns over new abstractions
- Use repo-relative paths only
- Avoid unrelated refactors
- Be specific enough that I could implement the first slice immediately
- If the task is primarily review/decision-oriented, convert this into the smallest review/decision plan instead of forcing implementation`,
    },
    {
      number: 4,
      body: `${taskLine}

${backlogContext}

Implement only the smallest approved slice for this task.

Approved slice:
${approvedSliceText}

Constraints:
- Keep scope tight and production-leaning
- Preserve current project style and architecture
- Prefer existing repo patterns over new abstractions
- Use repo-relative paths only
- Avoid unrelated refactors
- Keep business rules explicit and readable
- Reuse existing types, helpers, and utilities where appropriate
- If something is ambiguous, choose the safest narrow interpretation and call it out clearly
- If this task turns out to contain a blocker that invalidates the slice, stop expanding scope and describe the narrowest safe patch direction instead

At the end, provide:
1. What changed
2. Why those files changed
3. Which backlog concern(s) the changes address
4. Any assumptions made
5. What should come next
6. Verification performed (tests, lint, typecheck, etc.)`,
    },
    {
      number: 5,
      body: `${taskLine}

${backlogContext}

Review the current implementation for this backlog task and add or update the highest-value tests.

Focus on:
1. Main success path
2. The most important failure paths
3. Validation, malformed input/output, or contract handling
4. Regression risks introduced by this slice
5. Any gaps between implementation behavior and intended backlog outcome

Constraints:
- Keep tests aligned with existing repo style
- Prefer a small, high-signal test set over excessive coverage
- Use repo-relative paths only
- Do not rewrite unrelated tests
- If the code is hard to test, suggest the smallest refactor needed
- If this task is not code-change-oriented, reinterpret this as "validate the highest-value assertions/checks for the decision or analysis outcome"

At the end, summarize:
1. What behaviors are now covered
2. Important remaining gaps
3. Brittle areas worth follow-up
4. Verification performed`,
    },
    {
      number: 6,
      body: `${taskLine}

${backlogContext}

Act as a strict senior reviewer and critique the implemented slice for this backlog task.

Review for:
1. Correctness
2. Hidden assumptions
3. Edge cases not handled
4. API, contract, state, or lifecycle risks
5. Security, validation, or data-integrity concerns
6. Maintainability and readability
7. Test gaps
8. Whether the solution is too complex or too broad for the task
9. Whether the implementation actually satisfies the backlog item as written

Please provide:
1. Findings
2. Top 3 blocking concerns, if any
3. Top 3 non-blocking improvements
4. Whether the backlog item should be marked:
   - Done
   - Implemented / Needs follow-up
   - Blocked
   - Split into follow-up tasks

Constraints:
- Use repo-relative paths only
- Be specific and practical
- Prioritize correctness over style
- Distinguish blockers from non-blockers
- If the main issue is that the backlog item itself is underspecified, say that explicitly`,
    },
  ];
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
