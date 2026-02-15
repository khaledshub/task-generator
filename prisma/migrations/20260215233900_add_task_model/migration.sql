-- CreateEnum
CREATE TYPE "public"."TaskFrequency" AS ENUM ('ONE_OFF', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."TaskContext" AS ENUM ('HOME', 'OUT', 'COMPUTER');

-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('CHORE', 'REPAIR', 'BUSINESS', 'HEALTH', 'SOCIAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."TaskEnergy" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "public"."TaskFrequency" NOT NULL DEFAULT 'ONE_OFF',
    "context" "public"."TaskContext" NOT NULL,
    "type" "public"."TaskType" NOT NULL,
    "energy" "public"."TaskEnergy" NOT NULL,
    "timeEstimateMinutes" INTEGER NOT NULL,
    "avoiding" BOOLEAN NOT NULL DEFAULT false,
    "starterStep" TEXT NOT NULL,
    "checklistItems" JSONB NOT NULL,
    "tips" JSONB NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_userId_isArchived_idx" ON "public"."Task"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "Task_userId_context_energy_idx" ON "public"."Task"("userId", "context", "energy");

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
