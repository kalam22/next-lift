-- CreateTable
CREATE TABLE IF NOT EXISTS "lifts" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "pt" TEXT NOT NULL,
    "departemen" TEXT,
    "berlaku" TIMESTAMP(3),
    "akses" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "laptops" (
    "id" SERIAL NOT NULL,
    "merk" TEXT NOT NULL,
    "prosesor" TEXT NOT NULL,
    "ssd_hdd" TEXT NOT NULL,
    "ram" TEXT NOT NULL,
    "monitor" TEXT,
    "printer" TEXT,
    "keyboard" TEXT,
    "masuk" TIMESTAMP(3) NOT NULL,
    "kirim" TIMESTAMP(3),
    "unit" TEXT,
    "untuk" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "po" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "kerusakan" TEXT,
    "surat_jalan" TEXT,
    "catatan" TEXT,
    "gambar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laptops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "baterai_laptops" (
    "id" SERIAL NOT NULL,
    "merk" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "kapasitas" TEXT NOT NULL,
    "no_seri" TEXT NOT NULL,
    "laptop_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baterai_laptops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "baterai_laptops_no_seri_key" ON "baterai_laptops"("no_seri");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'baterai_laptops_laptop_id_fkey'
    ) THEN
        ALTER TABLE "baterai_laptops" ADD CONSTRAINT "baterai_laptops_laptop_id_fkey" 
        FOREIGN KEY ("laptop_id") REFERENCES "laptops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Remove asset_id column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'laptops' 
        AND column_name = 'asset_id'
    ) THEN
        ALTER TABLE "laptops" DROP COLUMN "asset_id";
    END IF;
END $$;




































