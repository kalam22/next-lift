-- DropIndex
DROP INDEX IF EXISTS "idx_stock_transactions_kategori";

-- DropIndex
DROP INDEX IF EXISTS "idx_stock_transactions_kategori_tanggal";

-- DropIndex
DROP INDEX IF EXISTS "idx_stock_transactions_tipe";

-- AlterTable
ALTER TABLE "stock_transactions"
DROP COLUMN IF EXISTS "jumlah",
DROP COLUMN IF EXISTS "kategori",
DROP COLUMN IF EXISTS "tipe_transaksi",
DROP COLUMN IF EXISTS "tujuan",
ADD COLUMN "nama_barang" VARCHAR(191) NOT NULL DEFAULT '',
ADD COLUMN "part_type" VARCHAR(10) NOT NULL DEFAULT '',
ADD COLUMN "quality" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "type_barang" VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN "vendor_tujuan" VARCHAR(191);

-- Remove defaults after adding columns
ALTER TABLE "stock_transactions"
ALTER COLUMN "nama_barang" DROP DEFAULT,
ALTER COLUMN "part_type" DROP DEFAULT,
ALTER COLUMN "quality" DROP DEFAULT,
ALTER COLUMN "type_barang" DROP DEFAULT;

-- Drop old ups_stock_transactions if still exists
DROP TABLE IF EXISTS "ups_stock_transactions";

-- CreateTable
CREATE TABLE IF NOT EXISTS "stock_item_types" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_item_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "idx_stock_item_types_nama" ON "stock_item_types"("nama");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_stock_transactions_part_type" ON "stock_transactions"("part_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_stock_transactions_type_barang" ON "stock_transactions"("type_barang");
