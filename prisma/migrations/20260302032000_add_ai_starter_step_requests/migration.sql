-- CreateEnum
CREATE TYPE "public"."AiStepsGenerationStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "public"."Task"
ADD COLUMN "generateAiStepsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "aiStepsGenerationStatus" "public"."AiStepsGenerationStatus" NOT NULL DEFAULT 'SKIPPED',
ADD COLUMN "aiGeneratedSteps" JSONB,
ADD COLUMN "aiGeneratedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."AiStarterStepRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "generatedStep" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiStarterStepRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiStarterStepRequest_userId_taskId_key" ON "public"."AiStarterStepRequest"("userId", "taskId");

-- CreateIndex
CREATE INDEX "AiStarterStepRequest_userId_createdAt_idx" ON "public"."AiStarterStepRequest"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."AiStarterStepRequest" ADD CONSTRAINT "AiStarterStepRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiStarterStepRequest" ADD CONSTRAINT "AiStarterStepRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
