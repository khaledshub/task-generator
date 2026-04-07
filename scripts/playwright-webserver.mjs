import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const LOCAL_DB_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "postgres",
  "host.docker.internal",
]);

function readEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const contents = readFileSync(filePath, "utf8");
  const entries = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const rootDir = process.cwd();
  const dotEnv = readEnvFile(resolve(rootDir, ".env"));
  const dotEnvLocal = readEnvFile(resolve(rootDir, ".env.local"));

  return dotEnvLocal.DATABASE_URL ?? dotEnv.DATABASE_URL;
}

function assertSafeDatabaseUrl(databaseUrl) {
  if (process.env.PLAYWRIGHT_UNSAFE_DB_RESET === "1") {
    return;
  }

  let hostname;

  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    throw new Error(
      "Playwright DB reset guard could not parse DATABASE_URL. Set PLAYWRIGHT_UNSAFE_DB_RESET=1 to bypass if this is intentional.",
    );
  }

  if (LOCAL_DB_HOSTS.has(hostname)) {
    return;
  }

  throw new Error(
    `Refusing to run 'prisma migrate reset' against non-local database host '${hostname}'. Set PLAYWRIGHT_UNSAFE_DB_RESET=1 only if you intentionally want that destructive behavior.`,
  );
}

function runCommand(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(
        new Error(
          `Command failed: ${command} ${args.join(" ")} (code=${code ?? "null"}, signal=${signal ?? "null"})`,
        ),
      );
    });

    child.on("error", rejectPromise);
  });
}

async function main() {
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for the Playwright web server bootstrap.",
    );
  }

  assertSafeDatabaseUrl(databaseUrl);
  process.env.DATABASE_URL = databaseUrl;

  await runCommand("npx", ["prisma", "migrate", "reset", "--force"]);
  await runCommand("npm", ["run", "db:seed"]);

  const devServer = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    env: process.env,
  });

  const shutdown = (signal) => {
    if (!devServer.killed) {
      devServer.kill(signal);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  devServer.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  devServer.on("error", (error) => {
    throw error;
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
