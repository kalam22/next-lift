-- CreateTable
CREATE TABLE "laptop_histories" (
    "id" SERIAL NOT NULL,
    "laptop_id" INTEGER NOT NULL,
    "pic" VARCHAR(191) NOT NULL,
    "tanggal_terima" TIMESTAMP(3) NOT NULL,
    "site" VARCHAR(191) NOT NULL,
    "departemen" VARCHAR(191),
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laptop_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_laptop_histories_laptop_id" ON "laptop_histories"("laptop_id");

-- CreateIndex
CREATE INDEX "idx_laptop_histories_tanggal_terima" ON "laptop_histories"("tanggal_terima");

-- CreateIndex
CREATE INDEX "idx_laptop_histories_laptop_id_tanggal" ON "laptop_histories"("laptop_id", "tanggal_terima");

-- AddForeignKey
ALTER TABLE "laptop_histories" ADD CONSTRAINT "laptop_histories_laptop_id_fkey" FOREIGN KEY ("laptop_id") REFERENCES "laptops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
