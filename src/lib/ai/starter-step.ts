import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { logger } from "@/lib/logger";
import { buildLocalGetStartedPrompt } from "@/lib/ai/prompts/local-get-started-template";
import { LOCAL_AI_MODELS } from "@/lib/tasks/config";

const DEFAULT_OPENAI_MODEL = "gpt-5";
const DEFAULT_OLLAMA_MODEL = "gpt-oss:20b";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const OLLAMA_DOCKER_HOST_BASE_URL = "http://host.docker.internal:11434";
const MAX_OUTPUT_TOKENS = 90;

interface GenerateStarterStepResult {
  starterStep: string;
  todoSteps: string[];
  tips: string[];
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

/**
 * Generates a concise 2-minute starter step from task context.
 */
export async function generateStarterStep(input: {
  provider: "OPENAI" | "LOCAL";
  title: string;
  description?: string;
  starterStepPrompt?: string;
  localModel?: (typeof LOCAL_AI_MODELS)[number];
}): Promise<GenerateStarterStepResult> {
  if (input.provider === "LOCAL") {
    return generateWithOllama(input);
  }

  return generateWithOpenAi(input);
}

async function generateWithOpenAi(input: {
  title: string;
  description?: string;
  starterStepPrompt?: string;
}): Promise<GenerateStarterStepResult> {
  const apiKey = await resolveOpenAiApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing OpenAI API key. Set OPENAI_API_KEY or secrets/openai_api_key.txt.",
    );
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;

  const response = await client.responses.create({
    model,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    input: [
      {
        role: "system",
        content:
          "You create practical, fast task plans. Return JSON only with keys: starterStep, todoSteps.",
      },
      {
        role: "user",
        content: buildPrompt(input),
      },
    ],
  });

  const rawText = (response.output_text ?? "").trim();
  const parsed = parseAiTaskPlan(rawText);
  const todoSteps = ensureChecklistTemplate({
    steps: parsed.todoSteps,
    starterStep: parsed.starterStep,
    title: input.title,
  });
  const tips = parsed.tips;
  const starterStep = clampStarterStep(parsed.starterStep ?? todoSteps[0] ?? rawText);

  if (!starterStep) {
    throw new Error("AI response was empty.");
  }

  return {
    starterStep,
    todoSteps,
    tips,
    usage: {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    },
  };
}

async function generateWithOllama(input: {
  title: string;
  description?: string;
  starterStepPrompt?: string;
  localModel?: (typeof LOCAL_AI_MODELS)[number];
}): Promise<GenerateStarterStepResult> {
  const configuredBaseUrl = process.env.OLLAMA_BASE_URL;
  const baseUrls = configuredBaseUrl
    ? [configuredBaseUrl]
    : [DEFAULT_OLLAMA_BASE_URL, OLLAMA_DOCKER_HOST_BASE_URL];
  const model = input.localModel ?? process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
  const payload = await requestOllamaGenerate({
    baseUrls,
    model,
    prompt: buildLocalGetStartedPrompt(input),
  });
  const rawText = (payload.response ?? "").trim();
  const parsed = parseAiTaskPlan(rawText);
  const todoSteps = ensureChecklistTemplate({
    steps: parsed.todoSteps,
    starterStep: parsed.starterStep,
    title: input.title,
  });
  const tips = parsed.tips;
  const starterStep = clampStarterStep(parsed.starterStep ?? todoSteps[0] ?? rawText);

  if (!starterStep) {
    throw new Error("Ollama response was empty.");
  }

  return {
    starterStep,
    todoSteps,
    tips,
    usage: {
      inputTokens: payload.prompt_eval_count,
      outputTokens: payload.eval_count,
    },
  };
}

async function requestOllamaGenerate(input: {
  baseUrls: string[];
  model: string;
  prompt: string;
}): Promise<{
  response?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}> {
  let lastNetworkError: Error | null = null;

  for (const baseUrl of input.baseUrls) {
    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: input.model,
          stream: false,
          prompt: input.prompt,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(
          `Ollama request failed at ${baseUrl} (${response.status}): ${errorBody}`,
        );
      }

      return (await response.json()) as {
        response?: string;
        prompt_eval_count?: number;
        eval_count?: number;
      };
    } catch (error) {
      if (isNetworkError(error)) {
        lastNetworkError = error instanceof Error ? error : new Error(String(error));
        logger.warn({ error, baseUrl }, "Ollama network request failed, trying next base URL");
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    `Ollama request failed for all endpoints: ${input.baseUrls.join(", ")}. ${lastNetworkError?.message ?? ""}`.trim(),
  );
}

function buildPrompt(input: {
  title: string;
  description?: string;
  starterStepPrompt?: string;
}): string {
  const promptTemplate = `
Task title: "{title}"
Task description: "{description}"
2-minute starter hint: "{starterHint}"

Generate a compact plan for this task.
Return JSON only in this shape:
{
  "starterStep": "string",
  "todoSteps": ["string", "string", "string"]
}

Rules:
- starterStep: one tiny action the user can do immediately (<= 120 chars).
- todoSteps: exactly 3 checklist lines with this exact structure:
  - "Start: <milestone that marks work kickoff>"
  - "In Progress: <milestone that shows active execution>"
  - "Done: <milestone that defines completion>"
- keep each checklist line <= 90 chars.
- Keep todoSteps focused on progress status checkpoints, not implementation advice.
`;

  return promptTemplate
    .replace("{title}", input.title.slice(0, 180))
    .replace("{description}", (input.description ?? "").slice(0, 1000))
    .replace("{starterHint}", (input.starterStepPrompt ?? "").slice(0, 300))
    .trim();
}

async function resolveOpenAiApiKey(): Promise<string | null> {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY.trim();
  }

  const configuredPath = process.env.OPENAI_API_KEY_FILE ?? "./secrets/openai_api_key.txt";
  const filePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);

  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    return fileContent.trim() || null;
  } catch (error) {
    logger.debug({ error, filePath }, "OpenAI key file not found or unreadable");
    return null;
  }
}

function clampStarterStep(value: string): string {
  const singleLine = value.replace(/\s+/g, " ").trim();
  const withoutQuotes = singleLine.replace(/^["']|["']$/g, "");
  return withoutQuotes.slice(0, 220);
}

function toTodoSteps(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);
}

function toTips(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 5);
}

function parseAiTaskPlan(rawText: string): {
  starterStep?: string;
  todoSteps: string[];
  tips: string[];
} {
  try {
    const payload = extractJsonObject(rawText);
    const parsed = JSON.parse(payload) as {
      starterStep?: unknown;
      todoSteps?: unknown;
      tips?: unknown;
    };

    const starterStep =
      typeof parsed.starterStep === "string" ? parsed.starterStep.trim() : undefined;
    const todoSteps = toShortStringArray(parsed.todoSteps, 3);
    const tips = toShortStringArray(parsed.tips, 5);

    return {
      starterStep,
      todoSteps,
      tips,
    };
  } catch {
    return {
      starterStep: undefined,
      todoSteps: toTodoSteps(rawText),
      tips: toTips(rawText),
    };
  }
}

function extractJsonObject(raw: string): string {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in AI response.");
  }

  return raw.slice(firstBrace, lastBrace + 1);
}

function toShortStringArray(value: unknown, maxItems = 3): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function ensureChecklistTemplate(input: {
  steps: string[];
  starterStep?: string;
  title: string;
}): string[] {
  const normalized = input.steps
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
    .slice(0, 3);

  const start = extractChecklistContent(normalized[0], "Start")
    || (input.starterStep ? input.starterStep.trim() : "")
    || `Begin ${input.title.slice(0, 48).toLowerCase()} now.`;
  const inProgress = extractChecklistContent(normalized[1], "In Progress")
    || "Core execution milestone is actively underway.";
  const done = extractChecklistContent(normalized[2], "Done")
    || "Completion milestone is met and verified.";

  return [
    `Start: ${clampChecklistContent(start)}`,
    `In Progress: ${clampChecklistContent(inProgress)}`,
    `Done: ${clampChecklistContent(done)}`,
  ];
}

function extractChecklistContent(raw: string | undefined, label: "Start" | "In Progress" | "Done"): string | null {
  if (!raw) {
    return null;
  }

  const match = raw.match(new RegExp(`^${label}:\\s*(.+)$`, "i"));
  if (match?.[1]) {
    return match[1].trim();
  }

  return raw.trim();
}

function clampChecklistContent(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 90);
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "TypeError" ||
    error.message.toLowerCase().includes("fetch failed") ||
    error.message.toLowerCase().includes("ecconnrefused") ||
    error.message.toLowerCase().includes("econnrefused") ||
    error.message.toLowerCase().includes("failed to connect")
  );
}
