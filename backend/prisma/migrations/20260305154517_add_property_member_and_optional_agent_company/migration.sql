-- CreateEnum
CREATE TYPE "PropertyRole" AS ENUM ('PROPERTY_ADMIN', 'PROPERTY_MANAGER', 'LEASING_MANAGER', 'MAINTENANCE_STAFF', 'PROPERTY_STAFF');

-- AlterTable
ALTER TABLE "agents" ALTER COLUMN "company_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "property_members" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "PropertyRole" NOT NULL DEFAULT 'PROPERTY_STAFF',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "removed_at" TIMESTAMP(3),

    CONSTRAINT "property_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_members_user_id_idx" ON "property_members"("user_id");

-- CreateIndex
CREATE INDEX "property_members_listing_id_idx" ON "property_members"("listing_id");

-- CreateIndex
CREATE INDEX "property_members_tenant_id_idx" ON "property_members"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_members_listing_id_user_id_key" ON "property_members"("listing_id", "user_id");

-- AddForeignKey
ALTER TABLE "property_members" ADD CONSTRAINT "property_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_members" ADD CONSTRAINT "property_members_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_members" ADD CONSTRAINT "property_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
