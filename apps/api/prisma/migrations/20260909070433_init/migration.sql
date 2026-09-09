-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SANTRI', 'WALI', 'ADMIN');

-- CreateEnum
CREATE TYPE "JenisIzin" AS ENUM ('KELUAR', 'PULANG');

-- CreateEnum
CREATE TYPE "StatusIzin" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK', 'SEDANG_KELUAR', 'SUDAH_KEMBALI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SANTRI',
    "santriId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Santri" (
    "id" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "kamar" TEXT NOT NULL,
    "foto" TEXT,
    "alamat" TEXT,
    "noHp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Santri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "jenisIzin" "JenisIzin" NOT NULL,
    "tujuan" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "keterangan" TEXT,
    "tanggalKeluar" DATE NOT NULL,
    "jamKeluar" TEXT NOT NULL,
    "tanggalKembali" DATE NOT NULL,
    "jamKembali" TEXT NOT NULL,
    "status" "StatusIzin" NOT NULL DEFAULT 'MENUNGGU',
    "rejectionReason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_santriId_idx" ON "User"("santriId");

-- CreateIndex
CREATE UNIQUE INDEX "Santri_nis_key" ON "Santri"("nis");

-- CreateIndex
CREATE INDEX "Santri_nama_idx" ON "Santri"("nama");

-- CreateIndex
CREATE INDEX "Santri_kelas_idx" ON "Santri"("kelas");

-- CreateIndex
CREATE INDEX "Permission_santriId_idx" ON "Permission"("santriId");

-- CreateIndex
CREATE INDEX "Permission_status_idx" ON "Permission"("status");

-- CreateIndex
CREATE INDEX "Permission_jenisIzin_idx" ON "Permission"("jenisIzin");

-- CreateIndex
CREATE INDEX "Permission_createdAt_idx" ON "Permission"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;
