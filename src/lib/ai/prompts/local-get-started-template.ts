/**
 * Local GenAI prompt template focused on concrete, anti-procrastination execution.
 * This is designed to reduce broad/generic tips and force actionable output.
 */
export const LOCAL_GET_STARTED_PROMPT_TEMPLATE = `
You generate a "Get started" plan for a single todo/chore.

Rules:
- Output must follow the exact headings below.
- Be concrete: actions someone can do physically.
- No generic motivation. No therapy language.
- Keep checklist lines short and operational.
- Use the user's task wording. If task is vague, make ONE reasonable assumption and proceed.
- If email is requested, create an email template.

You must return JSON only in this shape:
{
  "starterStep": "string",
  "todoSteps": ["string", "string", "string"]
}

Additional constraints:
- starterStep: one tiny action user can do immediately (<= 120 chars).
- todoSteps: exactly 3 checklist lines with exact prefixes:
  - "Start: ..."
  - "In Progress: ..."
  - "Done: ..."
- keep each checklist line <= 90 chars.
- Keep todoSteps focused on progress checkpoints only (not implementation tips).
- Make each line specific to the task title/description below.
`;

export function buildLocalGetStartedPrompt(input: {
  title: string;
  description?: string;
  starterStepPrompt?: string;
}): string {
  return `
Task title: "${input.title.slice(0, 180)}"
Task description: "${(input.description ?? "").slice(0, 1000)}"
2-minute starter hint: "${(input.starterStepPrompt ?? "").slice(0, 300)}"

${LOCAL_GET_STARTED_PROMPT_TEMPLATE}
`.trim();
}
