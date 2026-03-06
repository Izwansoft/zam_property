-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PROPERTY_COMPANY', 'MANAGEMENT_COMPANY', 'AGENCY');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CompanyAdminRole" AS ENUM ('ADMIN', 'PIC');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'COMPANY_ADMIN';

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "registration_no" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "business_license" TEXT,
    "ssm_document" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_admins" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "CompanyAdminRole" NOT NULL DEFAULT 'ADMIN',
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_tenant_id_status_idx" ON "companies"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "companies_tenant_id_registration_no_key" ON "companies"("tenant_id", "registration_no");

-- CreateIndex
CREATE INDEX "company_admins_user_id_idx" ON "company_admins"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_admins_company_id_user_id_key" ON "company_admins"("company_id", "user_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_admins" ADD CONSTRAINT "company_admins_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_admins" ADD CONSTRAINT "company_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
