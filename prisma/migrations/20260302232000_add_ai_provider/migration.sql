-- CreateEnum
CREATE TYPE "public"."AiProvider" AS ENUM ('OPENAI', 'LOCAL');

-- AlterTable
ALTER TABLE "public"."Task"
ADD COLUMN "aiProvider" "public"."AiProvider" NOT NULL DEFAULT 'OPENAI';
