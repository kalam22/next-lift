-- Drop email index first
DROP INDEX IF EXISTS "idx_users_email";

-- Drop email column from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";
