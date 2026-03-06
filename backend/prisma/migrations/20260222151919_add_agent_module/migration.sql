-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'AGENT';

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ren_number" TEXT,
    "ren_expiry" TIMESTAMP(3),
    "total_listings" INTEGER NOT NULL DEFAULT 0,
    "total_deals" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "referral_code" TEXT,
    "referred_by" UUID,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_listings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(3),

    CONSTRAINT "agent_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_referral_code_key" ON "agents"("referral_code");

-- CreateIndex
CREATE INDEX "agents_company_id_status_idx" ON "agents"("company_id", "status");

-- CreateIndex
CREATE INDEX "agents_referral_code_idx" ON "agents"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "agents_company_id_user_id_key" ON "agents"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "agent_listings_listing_id_idx" ON "agent_listings"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_listings_agent_id_listing_id_key" ON "agent_listings"("agent_id", "listing_id");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_listings" ADD CONSTRAINT "agent_listings_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_listings" ADD CONSTRAINT "agent_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
