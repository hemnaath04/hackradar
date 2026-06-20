-- CreateTable
CREATE TABLE "Hackathon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dedupeKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isBoston" BOOLEAN NOT NULL DEFAULT false,
    "isUsa" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "datesText" TEXT,
    "prizeText" TEXT,
    "participants" INTEGER,
    "themes" TEXT,
    "openState" TEXT,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Hackathon_dedupeKey_key" ON "Hackathon"("dedupeKey");

-- CreateIndex
CREATE INDEX "Hackathon_startDate_idx" ON "Hackathon"("startDate");

-- CreateIndex
CREATE INDEX "Hackathon_isBoston_idx" ON "Hackathon"("isBoston");

-- CreateIndex
CREATE INDEX "Hackathon_isOnline_idx" ON "Hackathon"("isOnline");
