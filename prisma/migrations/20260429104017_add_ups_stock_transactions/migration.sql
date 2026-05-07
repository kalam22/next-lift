-- CreateTable
CREATE TABLE "ups_stock_transactions" (
    "id" SERIAL NOT NULL,
    "tipeTransaksi" VARCHAR(10) NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ups_stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ups_stock_tipe" ON "ups_stock_transactions"("tipeTransaksi");

-- CreateIndex
CREATE INDEX "idx_ups_stock_tanggal" ON "ups_stock_transactions"("tanggal");
