import pino from "pino";

/**
 * Shared server-side logger instance.
 */
export const logger = pino({
  name: "todolist-randomgenerator",
  level: process.env.LOG_LEVEL ?? "info",
});
