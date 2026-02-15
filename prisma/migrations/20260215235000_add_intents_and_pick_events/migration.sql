-- CreateEnum
CREATE TYPE "public"."IntentMode" AS ENUM ('CHILL', 'NORMAL', 'GRIND');

-- CreateEnum
CREATE TYPE "public"."PickAction" AS ENUM ('PICKED', 'STARTED', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."SkippedReason" AS ENUM ('TOO_HARD', 'NO_TIME', 'NOT_TODAY', 'BLOCKED', 'OTHER');

-- CreateTable
CREATE TABLE "public"."DailyIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextChoice" "public"."TaskContext" NOT NULL,
    "modeChoice" "public"."IntentMode" NOT NULL,
    "timeAvailableMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PickEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "intentId" TEXT,
    "pickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "public"."PickAction" NOT NULL,
    "skippedReason" "public"."SkippedReason",
    "notes" TEXT,
    "why" TEXT NOT NULL,

    CONSTRAINT "PickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyIntent_userId_createdAt_idx" ON "public"."DailyIntent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PickEvent_userId_pickedAt_idx" ON "public"."PickEvent"("userId", "pickedAt");

-- CreateIndex
CREATE INDEX "PickEvent_taskId_pickedAt_idx" ON "public"."PickEvent"("taskId", "pickedAt");

-- CreateIndex
CREATE INDEX "PickEvent_intentId_idx" ON "public"."PickEvent"("intentId");

-- AddForeignKey
ALTER TABLE "public"."DailyIntent" ADD CONSTRAINT "DailyIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PickEvent" ADD CONSTRAINT "PickEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PickEvent" ADD CONSTRAINT "PickEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PickEvent" ADD CONSTRAINT "PickEvent_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "public"."DailyIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
