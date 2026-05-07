-- CreateTable (if not exists, for shadow database compatibility)
CREATE TABLE IF NOT EXISTS "mouse" (
    "id" SERIAL NOT NULL,
    "brand" VARCHAR(191) NOT NULL,
    "jumlah_orderan" INTEGER NOT NULL,
    "diperuntukan" VARCHAR(191) NOT NULL,
    "site" VARCHAR(191) NOT NULL,
    "nomor_po" VARCHAR(191) NOT NULL,
    "nomor_surat_jalan" VARCHAR(191),
    "status_barang" VARCHAR(191) NOT NULL,
    "tanggal_masuk" TIMESTAMP(3) NOT NULL,
    "tanggal_kirim" TIMESTAMP(3),
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mouse_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add foto column to mouse table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mouse' 
        AND column_name = 'foto'
    ) THEN
        ALTER TABLE "mouse" ADD COLUMN "foto" VARCHAR(191);
    END IF;
END $$;
