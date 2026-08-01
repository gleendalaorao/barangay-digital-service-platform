-- CreateTable
CREATE TABLE "ResidentImportSession" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "rows" JSONB NOT NULL,
    "mappings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ResidentImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentImportMappingPreference" (
    "barangayId" TEXT NOT NULL,
    "normalizedHeader" TEXT NOT NULL,
    "residentField" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentImportMappingPreference_pkey" PRIMARY KEY ("barangayId","normalizedHeader")
);

-- CreateIndex
CREATE INDEX "ResidentImportSession_expiresAt_idx" ON "ResidentImportSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ResidentImportSession_barangayId_userId_idx" ON "ResidentImportSession"("barangayId", "userId");

-- AddForeignKey
ALTER TABLE "ResidentImportSession" ADD CONSTRAINT "ResidentImportSession_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentImportSession" ADD CONSTRAINT "ResidentImportSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentImportMappingPreference" ADD CONSTRAINT "ResidentImportMappingPreference_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
