-- CreateTable
CREATE TABLE "owner_payouts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "payout_number" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "gross_rental" DECIMAL(12,2) NOT NULL,
    "platform_fee" DECIMAL(12,2) NOT NULL,
    "maintenance_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_payout" DECIMAL(12,2) NOT NULL,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "bank_account_name" TEXT,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "bank_reference" TEXT,
    "bank_file" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_line_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "payout_id" UUID NOT NULL,
    "tenancy_id" UUID NOT NULL,
    "billing_id" UUID,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owner_payouts_payout_number_key" ON "owner_payouts"("payout_number");

-- CreateIndex
CREATE INDEX "owner_payouts_tenant_id_idx" ON "owner_payouts"("tenant_id");

-- CreateIndex
CREATE INDEX "owner_payouts_owner_id_period_start_idx" ON "owner_payouts"("owner_id", "period_start");

-- CreateIndex
CREATE INDEX "owner_payouts_status_idx" ON "owner_payouts"("status");

-- CreateIndex
CREATE INDEX "payout_line_items_payout_id_idx" ON "payout_line_items"("payout_id");

-- AddForeignKey
ALTER TABLE "owner_payouts" ADD CONSTRAINT "owner_payouts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_payouts" ADD CONSTRAINT "owner_payouts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_line_items" ADD CONSTRAINT "payout_line_items_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "owner_payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
