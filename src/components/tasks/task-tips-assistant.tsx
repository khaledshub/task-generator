"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  TASK_AI_PROVIDER_LABELS,
  type LocalAiModelValue,
  type TaskAiProviderValue,
} from "@/lib/tasks/config";

interface TaskTipsAssistantProps {
  taskId: string;
  title: string;
  description?: string | null;
  starterStep: string;
  aiProvider: TaskAiProviderValue;
  initialTips: string[];
  localModel?: LocalAiModelValue | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PersistedTaskChatState {
  messages: ChatMessage[];
  isChatOpen: boolean;
  isChatArchived: boolean;
}
const TASK_CHAT_STORAGE_EVENT = "task-tips-chat-storage-updated";
const EMPTY_PERSISTED_CHAT_STATE: PersistedTaskChatState = {
  messages: [],
  isChatOpen: false,
  isChatArchived: false,
};
const taskChatSnapshotCache = new Map<
  string,
  { raw: string | null; state: PersistedTaskChatState }
>();

interface TaskInsightsResponse {
  tips?: string[];
  answer?: string;
  error?: string;
}

const TASK_TIPS_CACHE_PREFIX = "task-tips-cache:";
const taskInsightsRequestCache = new Map<string, Promise<TaskInsightsFetchResult>>();

interface TaskInsightsFetchResult {
  ok: boolean;
  data: TaskInsightsResponse;
}

export function TaskTipsAssistant({
  taskId,
  title,
  description,
  starterStep,
  aiProvider,
  initialTips,
  localModel,
}: TaskTipsAssistantProps) {
  const storageKey = `task-tips-chat:${taskId}`;
  const tipsCacheKey = `${TASK_TIPS_CACHE_PREFIX}${taskId}`;
  const [tips, setTips] = useState<string[]>(initialTips);
  const [tipsStatus, setTipsStatus] = useState<"idle" | "loading" | "error">(
    initialTips.length > 0 ? "idle" : "loading",
  );
  const [tipsError, setTipsError] = useState<string | null>(null);
  const [initialAnswer, setInitialAnswer] = useState<string | null>(null);
  const [latestChatAnswer, setLatestChatAnswer] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const hasRequestedInitialTipsRef = useRef(false);
  const hasResolvedTipsRef = useRef(initialTips.length > 0);
  const subscribeToChatState = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const handleChange = (event: Event) => {
        if (event.type === "storage") {
          const storageEvent = event as StorageEvent;
          if (storageEvent.key && storageEvent.key !== storageKey) {
            return;
          }
        }

        if (event.type === TASK_CHAT_STORAGE_EVENT) {
          const customEvent = event as CustomEvent<string | undefined>;
          if (customEvent.detail && customEvent.detail !== storageKey) {
            return;
          }
        }

        onStoreChange();
      };

      window.addEventListener("storage", handleChange);
      window.addEventListener(TASK_CHAT_STORAGE_EVENT, handleChange as EventListener);

      return () => {
        window.removeEventListener("storage", handleChange);
        window.removeEventListener(TASK_CHAT_STORAGE_EVENT, handleChange as EventListener);
      };
    },
    [storageKey],
  );
  const chatState = useSyncExternalStore(
    subscribeToChatState,
    () => getTaskChatSnapshot(storageKey),
    () => EMPTY_PERSISTED_CHAT_STATE,
  );
  const messages = chatState.messages;
  const isChatOpen = chatState.isChatOpen;
  const isChatArchived = chatState.isChatArchived;

  const normalizedTips = useMemo(
    () =>
      tips
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 3),
    [tips],
  );
  const answerPreview = isChatOpen ? latestChatAnswer || initialAnswer || "" : initialAnswer || "";
  const hasInitialInsightsResponse =
    initialTips.length > 0 || tipsStatus === "idle" || tipsStatus === "error";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (initialTips.length > 0) {
      window.localStorage.setItem(tipsCacheKey, JSON.stringify(initialTips.slice(0, 3)));
    }
  }, [initialTips, tipsCacheKey]);

  useEffect(() => {
    if (initialTips.length > 0) {
      hasResolvedTipsRef.current = true;
      return;
    }

    if (hasRequestedInitialTipsRef.current) {
      return;
    }

    hasRequestedInitialTipsRef.current = true;
    void generateTips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTips.length]);

  useEffect(() => {
    if (!isChatOpen || !chatScrollRef.current) {
      return;
    }

    chatScrollRef.current.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isChatOpen, isAsking, messages]);

  const updateChatState = useCallback(
    (
      updater: (
        current: PersistedTaskChatState,
      ) => PersistedTaskChatState,
    ) => {
      if (typeof window === "undefined") {
        return;
      }

      const current = getTaskChatSnapshot(storageKey);
      const next = updater(current);
      const raw = JSON.stringify(next);
      window.localStorage.setItem(storageKey, raw);
      taskChatSnapshotCache.set(storageKey, { raw, state: next });
      window.dispatchEvent(new CustomEvent(TASK_CHAT_STORAGE_EVENT, { detail: storageKey }));
    },
    [storageKey],
  );

  async function generateTips() {
    setTipsStatus("loading");
    setTipsError(null);
    setLatestChatAnswer(null);

    if (typeof window !== "undefined") {
      const cachedTips = readCachedTips(tipsCacheKey);
      if (cachedTips.length > 0) {
        hasResolvedTipsRef.current = true;
        setTips(cachedTips);
        setTipsStatus("idle");
        return;
      }
    }

    const { ok, data } = await fetchTaskInsightsOnce({
      taskId,
      title,
      description: description ?? undefined,
      starterStep,
      aiProvider,
      localModel: localModel ?? undefined,
    });

    if (!ok) {
      setTipsStatus("error");
      setTipsError(data.error ?? "Could not generate getting-started tips.");
      return;
    }

    if (Array.isArray(data.tips) && data.tips.length > 0) {
      if (hasResolvedTipsRef.current) {
        setTipsStatus("idle");
        return;
      }

      hasResolvedTipsRef.current = true;
      setTips(data.tips);
      setTipsStatus("idle");
      setInitialAnswer((data.answer ?? "").trim() || null);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(tipsCacheKey, JSON.stringify(data.tips.slice(0, 3)));
      }
      return;
    }

    setTipsStatus("error");
    setTipsError("No tips were generated.");
  }

  async function askQuestion() {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedQuestion,
    };
    const nextHistory = [...messages, userMessage];

    updateChatState((current) => ({
      ...current,
      messages: nextHistory,
      isChatOpen: true,
      isChatArchived: false,
    }));
    setQuestion("");
    setChatError(null);
    setIsAsking(true);

    const response = await fetch("/api/ai/task-insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId,
        title,
        description: description ?? undefined,
        starterStep,
        aiProvider,
        localModel: localModel ?? undefined,
        question: trimmedQuestion,
        history: nextHistory.slice(-8),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as TaskInsightsResponse;

    if (!response.ok) {
      setChatError(data.error ?? "Could not generate an answer.");
      setIsAsking(false);
      return;
    }

    if (Array.isArray(data.tips) && data.tips.length > 0 && tips.length === 0) {
      setTips(data.tips);
      setTipsStatus("idle");
    }

    const answer = (data.answer ?? "").trim();
    if (answer.length > 0) {
      setLatestChatAnswer(answer);
      updateChatState((current) => ({
        ...current,
        messages: [...current.messages, { role: "assistant", content: answer }],
      }));
    } else {
      updateChatState((current) => ({
        ...current,
        messages: [
          ...current.messages,
          { role: "assistant", content: "I could not generate a response. Try rephrasing." },
        ],
      }));
    }

    setIsAsking(false);
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Generated with {TASK_AI_PROVIDER_LABELS[aiProvider]}.
      </Typography>

      {tipsStatus === "loading" ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={16} />
          <Typography color="text.secondary">Generating best-practice tips...</Typography>
        </Stack>
      ) : null}

      {tipsStatus === "error" ? <Alert severity="warning">{tipsError}</Alert> : null}

      {normalizedTips.length > 0 ? (
        <Stack component="ul" sx={{ m: 0, pl: 3 }}>
          {normalizedTips.map((tip) => (
            <Typography component="li" key={tip}>
              {tip}
            </Typography>
          ))}
        </Stack>
      ) : null}

      {answerPreview && !isChatOpen ? (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
          <Stack spacing={1.5} alignItems="flex-start">
            <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
              {answerPreview}
            </Typography>
            <Button
              onClick={() => {
                updateChatState((current) => ({
                  ...current,
                  isChatArchived: false,
                  isChatOpen: true,
                }));
              }}
              variant="outlined"
            >
              {isChatArchived ? "Open Archived Chat" : "Ask More"}
            </Button>
          </Stack>
        </Paper>
      ) : null}

      {!answerPreview && !isChatOpen && hasInitialInsightsResponse ? (
        <Box>
          <Button
            onClick={() => {
              updateChatState((current) => ({
                ...current,
                isChatArchived: false,
                isChatOpen: true,
              }));
            }}
            variant="outlined"
          >
            {isChatArchived ? "Open Archived Chat" : "Ask"}
          </Button>
        </Box>
      ) : null}

      {isChatOpen && !isChatArchived ? (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={700}>
                Task research chat
              </Typography>
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  updateChatState((current) => ({
                    ...current,
                    isChatArchived: true,
                    isChatOpen: false,
                  }));
                }}
              >
                Archive Chat
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Ask follow-up questions. Use this thread as implementation documentation.
            </Typography>

            <Stack
              ref={chatScrollRef}
              spacing={1}
              sx={{ maxHeight: 280, overflowY: "auto", pr: 0.5 }}
            >
              {messages.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  Start by asking a concrete question about this task.
                </Typography>
              ) : (
                messages.map((message, index) => (
                  <Paper
                    key={`${message.role}-${index}`}
                    variant="outlined"
                    sx={{
                      p: 1,
                      bgcolor: message.role === "user" ? "action.hover" : "background.paper",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {message.role === "user" ? "You" : "GenAI"}
                    </Typography>
                    <Typography whiteSpace="pre-wrap">{message.content}</Typography>
                  </Paper>
                ))
              )}

              {isAsking ? (
                <Paper variant="outlined" sx={{ p: 1, bgcolor: "background.paper" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={14} />
                    <Typography variant="body2" color="text.secondary">
                      Agent is typing...
                    </Typography>
                  </Stack>
                </Paper>
              ) : null}
            </Stack>

            {chatError ? <Alert severity="error">{chatError}</Alert> : null}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="Ask about this task"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void askQuestion();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={() => void askQuestion()}
                disabled={isAsking || question.trim().length === 0}
              >
                {isAsking ? "Thinking..." : "Ask"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}

async function fetchTaskInsightsOnce(input: {
  taskId: string;
  title: string;
  description?: string;
  starterStep: string;
  aiProvider: TaskAiProviderValue;
  localModel?: LocalAiModelValue;
}): Promise<TaskInsightsFetchResult> {
  const requestKey = JSON.stringify(input);
  const existingRequest = taskInsightsRequestCache.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async (): Promise<TaskInsightsFetchResult> => {
    const response = await fetch("/api/ai/task-insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = (await response.json().catch(() => ({}))) as TaskInsightsResponse;
    return {
      ok: response.ok,
      data,
    };
  })();

  taskInsightsRequestCache.set(requestKey, request);

  try {
    return await request;
  } finally {
    taskInsightsRequestCache.delete(requestKey);
  }
}

function readCachedTips(cacheKey: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(cacheKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 3);
  } catch {
    return [];
  }
}

function getTaskChatSnapshot(storageKey: string): PersistedTaskChatState {
  if (typeof window === "undefined") {
    return EMPTY_PERSISTED_CHAT_STATE;
  }

  const raw = window.localStorage.getItem(storageKey);
  const cachedSnapshot = taskChatSnapshotCache.get(storageKey);
  if (cachedSnapshot && cachedSnapshot.raw === raw) {
    return cachedSnapshot.state;
  }

  if (!raw) {
    taskChatSnapshotCache.set(storageKey, {
      raw: null,
      state: EMPTY_PERSISTED_CHAT_STATE,
    });
    return EMPTY_PERSISTED_CHAT_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid chat state payload");
    }

    const objectValue = parsed as Record<string, unknown>;
    const messages = Array.isArray(objectValue.messages)
      ? objectValue.messages
          .filter(
            (item): item is ChatMessage =>
              !!item &&
              typeof item === "object" &&
              !Array.isArray(item) &&
              (item as { role?: unknown }).role !== undefined &&
              (item as { content?: unknown }).content !== undefined &&
              ((item as { role?: unknown }).role === "user" ||
                (item as { role?: unknown }).role === "assistant") &&
              typeof (item as { content?: unknown }).content === "string",
          )
          .slice(0, 200)
      : [];

    const state: PersistedTaskChatState = {
      messages,
      isChatOpen: objectValue.isChatOpen === true,
      isChatArchived: objectValue.isChatArchived === true,
    };
    taskChatSnapshotCache.set(storageKey, { raw, state });
    return state;
  } catch {
    taskChatSnapshotCache.set(storageKey, {
      raw,
      state: EMPTY_PERSISTED_CHAT_STATE,
    });
    return EMPTY_PERSISTED_CHAT_STATE;
  }
}
