CREATE TABLE "DiagnosticLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "method" TEXT,
    "path" TEXT,
    "status" INTEGER,
    "durationMs" INTEGER,
    "origin" TEXT,
    "telegramUserId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiagnosticLog_createdAt_idx" ON "DiagnosticLog"("createdAt");
CREATE INDEX "DiagnosticLog_level_idx" ON "DiagnosticLog"("level");
CREATE INDEX "DiagnosticLog_source_idx" ON "DiagnosticLog"("source");
CREATE INDEX "DiagnosticLog_telegramUserId_idx" ON "DiagnosticLog"("telegramUserId");
