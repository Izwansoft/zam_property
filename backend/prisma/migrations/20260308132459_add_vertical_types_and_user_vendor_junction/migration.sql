-- CreateEnum
CREATE TYPE "UserVendorRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "vertical_type" TEXT;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "vertical_types" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "vertical_type" TEXT;

-- CreateTable
CREATE TABLE "user_vendors" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "role" "UserVendorRole" NOT NULL DEFAULT 'MEMBER',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_vendors_user_id_idx" ON "user_vendors"("user_id");

-- CreateIndex
CREATE INDEX "user_vendors_vendor_id_idx" ON "user_vendors"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_vendors_user_id_vendor_id_key" ON "user_vendors"("user_id", "vendor_id");

-- CreateIndex
CREATE INDEX "agents_vertical_type_idx" ON "agents"("vertical_type");

-- CreateIndex
CREATE INDEX "companies_vertical_types_idx" ON "companies"("vertical_types");

-- CreateIndex
CREATE INDEX "vendors_vertical_type_idx" ON "vendors"("vertical_type");

-- AddForeignKey
ALTER TABLE "user_vendors" ADD CONSTRAINT "user_vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vendors" ADD CONSTRAINT "user_vendors_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
