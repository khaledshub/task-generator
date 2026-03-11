import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      auth: {
        hasSecret: Boolean(process.env.NEXTAUTH_SECRET),
        hasUrl: Boolean(process.env.NEXTAUTH_URL),
      },
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        database: "unreachable",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
