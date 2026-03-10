-- Migration: Remove User.vendorId FK
-- Migrate existing User.vendorId data to UserVendor junction table first,
-- then drop the column.

-- Step 1: Migrate existing vendor_id assignments to user_vendors junction table
-- Only insert if not already present (idempotent)
INSERT INTO "user_vendors" ("id", "user_id", "vendor_id", "role", "is_primary", "created_at")
SELECT
  uuid_generate_v4(),
  u."id",
  u."vendor_id",
  CASE
    WHEN u."role" = 'VENDOR_ADMIN' THEN 'OWNER'::"UserVendorRole"
    ELSE 'MEMBER'::"UserVendorRole"
  END,
  true,
  NOW()
FROM "users" u
WHERE u."vendor_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "user_vendors" uv
    WHERE uv."user_id" = u."id" AND uv."vendor_id" = u."vendor_id"
  );

-- Step 2: Drop the FK constraint, index, and column
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_vendor_id_fkey";

DROP INDEX IF EXISTS "users_vendor_id_idx";

ALTER TABLE "users" DROP COLUMN "vendor_id";
