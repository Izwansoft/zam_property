-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('BOOKING', 'RENEWAL');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "agent_commissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_id" UUID NOT NULL,
    "tenancy_id" UUID NOT NULL,
    "type" "CommissionType" NOT NULL,
    "deal_value" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "paid_ref" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_commissions_agent_id_status_idx" ON "agent_commissions"("agent_id", "status");

-- CreateIndex
CREATE INDEX "agent_commissions_tenancy_id_idx" ON "agent_commissions"("tenancy_id");

-- AddForeignKey
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
