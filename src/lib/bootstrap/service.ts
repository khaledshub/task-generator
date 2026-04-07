import prisma from "@/lib/prisma";

const BOOTSTRAP_PROBE_KEY = "phase1-connectivity";

export interface BootstrapProbeStatus {
  key: string;
  updatedAt: Date;
}

/**
 * Reads the bootstrap probe row that seed writes during container startup.
 * Returns null when the database is unavailable or the probe has not been seeded.
 */
export async function getBootstrapProbeStatus(): Promise<BootstrapProbeStatus | null> {
  try {
    const probe = await prisma.bootstrapProbe.findUnique({
      where: { key: BOOTSTRAP_PROBE_KEY },
      select: {
        key: true,
        updatedAt: true,
      },
    });

    return probe;
  } catch {
    return null;
  }
}
