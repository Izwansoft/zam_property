-- CreateEnum
CREATE TYPE "ManagementType" AS ENUM ('SELF_MANAGED', 'PENDING_MANAGEMENT', 'TENANT_MANAGED');

-- CreateEnum
CREATE TYPE "OccupantStatus" AS ENUM ('PENDING', 'SCREENING', 'APPROVED', 'REJECTED', 'ACTIVE', 'NOTICE_GIVEN', 'VACATED');

-- CreateEnum
CREATE TYPE "TenancyStatus" AS ENUM ('DRAFT', 'BOOKED', 'DEPOSIT_PAID', 'CONTRACT_PENDING', 'ACTIVE', 'MAINTENANCE_HOLD', 'INSPECTION_PENDING', 'TERMINATION_REQUESTED', 'TERMINATED', 'EXTENDED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'PARTIALLY_SIGNED', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED');

-- CreateEnum
CREATE TYPE "RentBillingStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "RentBillingLineItemType" AS ENUM ('RENT', 'UTILITY', 'LATE_FEE', 'CLAIM_DEDUCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "RentBillingReminderType" AS ENUM ('EMAIL', 'SMS', 'LETTER', 'LEGAL_NOTICE');

-- CreateEnum
CREATE TYPE "RentPaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'COLLECTED', 'HELD', 'PARTIALLY_REFUNDED', 'FULLY_REFUNDED', 'FORFEITED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('MOVE_IN', 'PERIODIC', 'MOVE_OUT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'VIDEO_REQUESTED', 'VIDEO_SUBMITTED', 'ONSITE_PENDING', 'COMPLETED', 'REPORT_GENERATED');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('DAMAGE', 'CLEANING', 'MISSING_ITEM', 'UTILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'SETTLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'CALCULATED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LegalCaseStatus" AS ENUM ('NOTICE_SENT', 'RESPONSE_PENDING', 'MEDIATION', 'COURT_FILED', 'HEARING_SCHEDULED', 'JUDGMENT', 'ENFORCING', 'CLOSED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OCCUPANT';

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "management_type" "ManagementType" NOT NULL DEFAULT 'SELF_MANAGED';

-- CreateTable
CREATE TABLE "occupants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "status" "OccupantStatus" NOT NULL DEFAULT 'PENDING',
    "employment_type" TEXT,
    "monthly_income" DECIMAL(12,2),
    "employer" TEXT,
    "ic_number" TEXT,
    "passport_number" TEXT,
    "ic_verified" BOOLEAN NOT NULL DEFAULT false,
    "income_verified" BOOLEAN NOT NULL DEFAULT false,
    "emergency_name" TEXT,
    "emergency_phone" TEXT,
    "emergency_relation" TEXT,
    "screening_score" INTEGER,
    "screening_notes" TEXT,
    "screened_at" TIMESTAMP(3),
    "screened_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupant_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "occupant_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "occupant_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vendor_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenancies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "occupant_id" UUID NOT NULL,
    "status" "TenancyStatus" NOT NULL DEFAULT 'DRAFT',
    "application_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "move_in_date" TIMESTAMP(3),
    "move_out_date" TIMESTAMP(3),
    "lease_start_date" TIMESTAMP(3),
    "lease_end_date" TIMESTAMP(3),
    "actual_end_date" TIMESTAMP(3),
    "monthly_rent" DECIMAL(12,2) NOT NULL,
    "security_deposit" DECIMAL(12,2) NOT NULL,
    "utility_deposit" DECIMAL(12,2),
    "key_deposit" DECIMAL(12,2),
    "billing_day" INTEGER NOT NULL DEFAULT 1,
    "payment_due_day" INTEGER NOT NULL DEFAULT 7,
    "late_fee_percent" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenancy_status_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenancy_id" UUID NOT NULL,
    "from_status" "TenancyStatus",
    "to_status" "TenancyStatus" NOT NULL,
    "reason" TEXT,
    "changed_by" UUID NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenancy_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenancy_id" UUID NOT NULL,
    "contract_number" TEXT NOT NULL,
    "template_id" UUID,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "signed_date" TIMESTAMP(3),
    "owner_signed_at" TIMESTAMP(3),
    "owner_signed_by" UUID,
    "owner_signature_url" TEXT,
    "occupant_signed_at" TIMESTAMP(3),
    "occupant_signed_by" UUID,
    "occupant_signature_url" TEXT,
    "document_url" TEXT,
    "document_hash" TEXT,
    "terms" JSONB NOT NULL DEFAULT '{}',
    "renewed_from_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenancy_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "collected_at" TIMESTAMP(3),
    "collected_via" TEXT,
    "payment_ref" TEXT,
    "refundable_amount" DECIMAL(12,2),
    "deductions" DECIMAL(12,2),
    "refunded_amount" DECIMAL(12,2),
    "refunded_at" TIMESTAMP(3),
    "refund_ref" TEXT,
    "deduction_claims" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_billings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenancy_id" UUID NOT NULL,
    "bill_number" TEXT NOT NULL,
    "billing_period" TIMESTAMP(3) NOT NULL,
    "status" "RentBillingStatus" NOT NULL DEFAULT 'DRAFT',
    "rent_amount" DECIMAL(12,2) NOT NULL,
    "late_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustments" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_due" DECIMAL(12,2) NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_billings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_billing_line_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "billing_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "claim_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rent_billing_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_billing_reminders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "billing_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "sent_to" TEXT NOT NULL,
    "response" TEXT,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "rent_billing_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "occupants_tenant_id_status_idx" ON "occupants"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "occupants_user_id_idx" ON "occupants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "occupants_user_id_tenant_id_key" ON "occupants"("user_id", "tenant_id");

-- CreateIndex
CREATE INDEX "occupant_documents_occupant_id_type_idx" ON "occupant_documents"("occupant_id", "type");

-- CreateIndex
CREATE INDEX "vendor_documents_vendor_id_type_idx" ON "vendor_documents"("vendor_id", "type");

-- CreateIndex
CREATE INDEX "tenancies_tenant_id_status_idx" ON "tenancies"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tenancies_owner_id_idx" ON "tenancies"("owner_id");

-- CreateIndex
CREATE INDEX "tenancies_occupant_id_idx" ON "tenancies"("occupant_id");

-- CreateIndex
CREATE INDEX "tenancies_listing_id_idx" ON "tenancies"("listing_id");

-- CreateIndex
CREATE INDEX "tenancy_status_history_tenancy_id_idx" ON "tenancy_status_history"("tenancy_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_tenancy_id_key" ON "contracts"("tenancy_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_number_key" ON "contracts"("contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_renewed_from_id_key" ON "contracts"("renewed_from_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_contract_number_idx" ON "contracts"("contract_number");

-- CreateIndex
CREATE INDEX "contract_templates_tenant_id_is_active_idx" ON "contract_templates"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "deposits_tenancy_id_type_idx" ON "deposits"("tenancy_id", "type");

-- CreateIndex
CREATE INDEX "deposits_status_idx" ON "deposits"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rent_billings_bill_number_key" ON "rent_billings"("bill_number");

-- CreateIndex
CREATE INDEX "rent_billings_tenancy_id_billing_period_idx" ON "rent_billings"("tenancy_id", "billing_period");

-- CreateIndex
CREATE INDEX "rent_billings_status_due_date_idx" ON "rent_billings"("status", "due_date");

-- CreateIndex
CREATE INDEX "rent_billing_line_items_billing_id_idx" ON "rent_billing_line_items"("billing_id");

-- CreateIndex
CREATE INDEX "rent_billing_reminders_billing_id_idx" ON "rent_billing_reminders"("billing_id");

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupant_documents" ADD CONSTRAINT "occupant_documents_occupant_id_fkey" FOREIGN KEY ("occupant_id") REFERENCES "occupants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_occupant_id_fkey" FOREIGN KEY ("occupant_id") REFERENCES "occupants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancy_status_history" ADD CONSTRAINT "tenancy_status_history_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_renewed_from_id_fkey" FOREIGN KEY ("renewed_from_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_billings" ADD CONSTRAINT "rent_billings_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_billing_line_items" ADD CONSTRAINT "rent_billing_line_items_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "rent_billings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_billing_reminders" ADD CONSTRAINT "rent_billing_reminders_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "rent_billings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
