-- CreateEnum
CREATE TYPE "CompanyDocumentType" AS ENUM ('SSM_CERTIFICATE', 'BOVAEA_LICENSE', 'INSURANCE_CERTIFICATE', 'TAX_CERTIFICATE', 'BANK_STATEMENT', 'OTHER');

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" UUID NOT NULL,
    "bio" TEXT,
    "website" TEXT,
    "established" INTEGER,
    "team_size" INTEGER,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "service_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "linkedin_url" TEXT,
    "youtube_url" TEXT,
    "tiktok_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_brandings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" UUID NOT NULL,
    "logo" TEXT,
    "logo_icon" TEXT,
    "logo_dark" TEXT,
    "favicon" TEXT,
    "primary_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_brandings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" UUID NOT NULL,
    "default_commission_rate" DECIMAL(5,2),
    "commission_split" DECIMAL(5,2),
    "notification_email" TEXT,
    "enable_email_alerts" BOOLEAN NOT NULL DEFAULT true,
    "enable_sms_alerts" BOOLEAN NOT NULL DEFAULT false,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "bank_account_name" TEXT,
    "bank_swift_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" UUID NOT NULL,
    "type" "CompanyDocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_custom_roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_custom_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_admin_custom_roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_admin_id" UUID NOT NULL,
    "custom_role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_admin_custom_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_company_id_key" ON "company_profiles"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_brandings_company_id_key" ON "company_brandings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "company_settings"("company_id");

-- CreateIndex
CREATE INDEX "company_documents_company_id_type_idx" ON "company_documents"("company_id", "type");

-- CreateIndex
CREATE INDEX "company_custom_roles_company_id_idx" ON "company_custom_roles"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_custom_roles_company_id_name_key" ON "company_custom_roles"("company_id", "name");

-- CreateIndex
CREATE INDEX "company_admin_custom_roles_custom_role_id_idx" ON "company_admin_custom_roles"("custom_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_admin_custom_roles_company_admin_id_custom_role_id_key" ON "company_admin_custom_roles"("company_admin_id", "custom_role_id");

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_brandings" ADD CONSTRAINT "company_brandings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_custom_roles" ADD CONSTRAINT "company_custom_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_admin_custom_roles" ADD CONSTRAINT "company_admin_custom_roles_company_admin_id_fkey" FOREIGN KEY ("company_admin_id") REFERENCES "company_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_admin_custom_roles" ADD CONSTRAINT "company_admin_custom_roles_custom_role_id_fkey" FOREIGN KEY ("custom_role_id") REFERENCES "company_custom_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
