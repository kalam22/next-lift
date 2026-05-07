-- DropTable
DROP TABLE "ups_stock_transactions";

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" SERIAL NOT NULL,
    "kategori" VARCHAR(20) NOT NULL,
    "tipe_transaksi" VARCHAR(10) NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "tujuan" TEXT,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_stock_transactions_kategori" ON "stock_transactions"("kategori");

-- CreateIndex
CREATE INDEX "idx_stock_transactions_tipe" ON "stock_transactions"("tipe_transaksi");

-- CreateIndex
CREATE INDEX "idx_stock_transactions_tanggal" ON "stock_transactions"("tanggal");

-- CreateIndex
CREATE INDEX "idx_stock_transactions_kategori_tanggal" ON "stock_transactions"("kategori", "tanggal");
