-- CreateTable
CREATE TABLE "ITIRecommendation" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "itiId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasons" JSONB,
    "status" TEXT NOT NULL DEFAULT 'RECOMMENDED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ITIRecommendation_itiId_idx" ON "ITIRecommendation"("itiId");

-- CreateIndex
CREATE UNIQUE INDEX "ITIRecommendation_requirementId_itiId_key" ON "ITIRecommendation"("requirementId", "itiId");

-- AddForeignKey
ALTER TABLE "ITIRecommendation" ADD CONSTRAINT "ITIRecommendation_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "WorkRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITIRecommendation" ADD CONSTRAINT "ITIRecommendation_itiId_fkey" FOREIGN KEY ("itiId") REFERENCES "ITI"("id") ON DELETE CASCADE ON UPDATE CASCADE;
