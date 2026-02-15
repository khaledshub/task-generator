import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BOOTSTRAP_PROBE_KEY = "phase1-connectivity";

/**
 * Writes and reads a probe row to prove Prisma can connect to PostgreSQL.
 */
async function main() {
  const seedTimestamp = new Date().toISOString();

  await prisma.bootstrapProbe.upsert({
    where: { key: BOOTSTRAP_PROBE_KEY },
    update: { value: seedTimestamp },
    create: {
      key: BOOTSTRAP_PROBE_KEY,
      value: seedTimestamp,
    },
  });

  const probe = await prisma.bootstrapProbe.findUnique({
    where: { key: BOOTSTRAP_PROBE_KEY },
  });

  if (!probe) {
    throw new Error("Seed connectivity probe was not found after upsert.");
  }

  console.log(
    `[seed] bootstrap probe readback: key=${probe.key} value=${probe.value}`,
  );
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
