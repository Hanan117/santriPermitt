-- DropForeignKey
ALTER TABLE "ContactMessage" DROP CONSTRAINT "ContactMessage_userId_fkey";

-- CreateTable
CREATE TABLE "WaliSantri" (
    "santriId" TEXT NOT NULL,
    "waliUserId" TEXT NOT NULL,
    "hubungan" TEXT NOT NULL DEFAULT 'Wali',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaliSantri_pkey" PRIMARY KEY ("santriId","waliUserId")
);

-- CreateIndex
CREATE INDEX "WaliSantri_waliUserId_idx" ON "WaliSantri"("waliUserId");

-- AddForeignKey
ALTER TABLE "WaliSantri" ADD CONSTRAINT "WaliSantri_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;
