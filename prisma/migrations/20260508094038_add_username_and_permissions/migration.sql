-- Add username column as nullable first to handle existing rows
ALTER TABLE "users" ADD COLUMN "username" VARCHAR(100);

-- Derive username from email (take the part before @)
UPDATE "users" SET "username" = split_part(email, '@', 1) WHERE "username" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");

-- Add index on username
CREATE INDEX "idx_users_username" ON "users"("username");

-- CreateTable user_permissions
CREATE TABLE "user_permissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "menu" VARCHAR(50) NOT NULL,
    "permission" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex unique constraint
CREATE UNIQUE INDEX "idx_user_permissions_unique" ON "user_permissions"("user_id", "menu", "permission");

-- CreateIndex
CREATE INDEX "idx_user_permissions_user_menu" ON "user_permissions"("user_id", "menu");

-- CreateIndex
CREATE INDEX "idx_user_permissions_lookup" ON "user_permissions"("user_id", "menu", "permission");
