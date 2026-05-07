/*
  Warnings:

  - You are about to alter the column `merk` on the `baterai_laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `jenis` on the `baterai_laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `kapasitas` on the `baterai_laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `no_seri` on the `baterai_laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `merk` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `prosesor` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `ssd_hdd` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `ram` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `monitor` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `printer` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `keyboard` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `unit` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `untuk` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `site` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `status` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `surat_jalan` on the `laptops` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `nama` on the `lifts` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `pt` on the `lifts` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.
  - You are about to alter the column `departemen` on the `lifts` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE "baterai_laptops" ALTER COLUMN "merk" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "jenis" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "kapasitas" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "no_seri" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "laptops" ALTER COLUMN "merk" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "prosesor" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "ssd_hdd" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "ram" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "monitor" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "printer" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "keyboard" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "unit" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "untuk" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "site" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "status" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "surat_jalan" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "lifts" ALTER COLUMN "nama" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "pt" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "departemen" SET DATA TYPE VARCHAR(191),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "idx_baterai_laptops_laptop_id" ON "baterai_laptops"("laptop_id");

-- CreateIndex
CREATE INDEX "idx_laptops_site" ON "laptops"("site");

-- CreateIndex
CREATE INDEX "idx_laptops_status" ON "laptops"("status");

-- CreateIndex
CREATE INDEX "idx_lifts_departemen" ON "lifts"("departemen");

-- CreateIndex
CREATE INDEX "idx_lifts_pt" ON "lifts"("pt");
