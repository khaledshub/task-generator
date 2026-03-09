import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { logger } from "@/lib/logger";
import { type LocalAiModelValue } from "@/lib/tasks/config";

const DEFAULT_OPENAI_MODEL = "gpt-5";
const DEFAULT_OLLAMA_MODEL = "gpt-oss:20b";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const OLLAMA_DOCKER_HOST_BASE_URL = "http://host.docker.internal:11434";
const MAX_OUTPUT_TOKENS = 420;

interface TaskInsightsMessage {
  role: "user" | "assistant";
  content: string;
}

interface GenerateTaskInsightsInput {
  provider: "OPENAI" | "LOCAL";
  title: string;
  description?: string;
  starterStep?: string;
  question?: string;
  history?: TaskInsightsMessage[];
  localModel?: LocalAiModelValue;
}

interface GenerateTaskInsightsResult {
  tips: string[];
  answer?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export async function generateTaskInsights(
  input: GenerateTaskInsightsInput,
): Promise<GenerateTaskInsightsResult> {
  if (input.provider === "LOCAL") {
    return generateWithOllama(input);
  }

  return generateWithOpenAi(input);
}

async function generateWithOpenAi(
  input: GenerateTaskInsightsInput,
): Promise<GenerateTaskInsightsResult> {
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
          "You are a pragmatic task coach. Return JSON only with keys: tips (array), answer (string). Format answer to match the user's request type.",
      },
      {
        role: "user",
        content: buildPrompt(input),
      },
    ],
  });

  const parsed = parseInsightsResponse((response.output_text ?? "").trim());

  return {
    tips: parsed.tips,
    answer: parsed.answer,
    usage: {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    },
  };
}

async function generateWithOllama(
  input: GenerateTaskInsightsInput,
): Promise<GenerateTaskInsightsResult> {
  const configuredBaseUrl = process.env.OLLAMA_BASE_URL;
  const baseUrls = configuredBaseUrl
    ? [configuredBaseUrl]
    : [DEFAULT_OLLAMA_BASE_URL, OLLAMA_DOCKER_HOST_BASE_URL];
  const model = input.localModel ?? process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;

  const payload = await requestOllamaGenerate({
    baseUrls,
    model,
    prompt: buildPrompt(input),
  });

  const parsed = parseInsightsResponse((payload.response ?? "").trim());

  return {
    tips: parsed.tips,
    answer: parsed.answer,
    usage: {
      inputTokens: payload.prompt_eval_count,
      outputTokens: payload.eval_count,
    },
  };
}

function buildPrompt(input: GenerateTaskInsightsInput): string {
  const contextLines = (input.history ?? [])
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return `
Task title: "${input.title.slice(0, 180)}"
Task description: "${(input.description ?? "").slice(0, 1000)}"
Starter step: "${(input.starterStep ?? "").slice(0, 280)}"

Conversation so far:
${contextLines || "(none)"}

Current user question:
"${(input.question ?? "").slice(0, 500)}"

Return JSON only:
{
  "tips": ["...", "...", "..."],
  "answer": "..."
}

Rules:
- tips: exactly 3 practical best-practice/get-started tips for this task, <= 120 chars each.
- answer: if question is present, choose the best structure for the user's intent.
  - If they ask for an email/message/template, return a ready-to-copy draft with placeholders.
  - If they ask for steps, return numbered steps.
  - If they ask for explanation/summary, return short paragraphs.
  - Use bullets only when bullets are the most natural format.
- answer: if question is empty, return one short line inviting the user to ask follow-up questions.
- Keep content specific to this task, not generic productivity advice.
`.trim();
}

function parseInsightsResponse(rawText: string): { tips: string[]; answer?: string } {
  try {
    const payload = extractJsonObject(rawText);
    const parsed = JSON.parse(payload) as {
      tips?: unknown;
      answer?: unknown;
    };

    const tips = toShortStringArray(parsed.tips, 3);
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : undefined;

    return {
      tips,
      answer,
    };
  } catch {
    return {
      tips: [],
      answer: rawText || undefined,
    };
  }
}

function toShortStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function extractJsonObject(raw: string): string {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in AI response.");
  }

  return raw.slice(firstBrace, lastBrace + 1);
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
        logger.warn({ error, baseUrl }, "Ollama insights request failed, trying next base URL");
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    `Ollama request failed for all endpoints: ${input.baseUrls.join(", ")}. ${lastNetworkError?.message ?? ""}`.trim(),
  );
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
