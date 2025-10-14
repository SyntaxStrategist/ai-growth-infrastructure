-- CreateTable
CREATE TABLE IF NOT EXISTS "lead_memory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "aiSummary" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lead_memory_timestamp_idx" ON "lead_memory"("timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lead_memory_email_idx" ON "lead_memory"("email");

