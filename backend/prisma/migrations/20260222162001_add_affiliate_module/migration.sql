-- CreateEnum
CREATE TYPE "AffiliateType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('OWNER_REGISTRATION', 'TENANT_BOOKING', 'AGENT_SIGNUP');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AffiliatePayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "affiliates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "AffiliateType" NOT NULL DEFAULT 'INDIVIDUAL',
    "bank_name" TEXT,
    "bank_account" TEXT,
    "bank_account_name" TEXT,
    "total_referrals" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unpaid_earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_referrals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "affiliate_id" UUID NOT NULL,
    "referral_type" "ReferralType" NOT NULL,
    "referred_id" UUID NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "commission_amount" DECIMAL(12,2) NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "confirmed_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_payouts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "affiliate_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "AffiliatePayoutStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_code_key" ON "affiliates"("code");

-- CreateIndex
CREATE INDEX "affiliates_code_idx" ON "affiliates"("code");

-- CreateIndex
CREATE INDEX "affiliates_tenant_id_status_idx" ON "affiliates"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_tenant_id_user_id_key" ON "affiliates"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "affiliate_referrals_affiliate_id_status_idx" ON "affiliate_referrals"("affiliate_id", "status");

-- CreateIndex
CREATE INDEX "affiliate_referrals_referred_id_idx" ON "affiliate_referrals"("referred_id");

-- CreateIndex
CREATE INDEX "affiliate_payouts_affiliate_id_idx" ON "affiliate_payouts"("affiliate_id");

-- CreateIndex
CREATE INDEX "affiliate_payouts_status_idx" ON "affiliate_payouts"("status");

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "affiliate_referrals_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
