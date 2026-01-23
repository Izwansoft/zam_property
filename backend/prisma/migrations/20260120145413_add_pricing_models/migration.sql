-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('SAAS', 'LEAD_BASED', 'COMMISSION', 'LISTING_BASED', 'HYBRID');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('SUBSCRIPTION', 'LEAD', 'INTERACTION', 'COMMISSION', 'LISTING', 'ADDON', 'OVERAGE');

-- CreateTable
CREATE TABLE "pricing_configs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "model" "PricingModel" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "vertical_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pricing_config_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL,
    "charge_type" "ChargeType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "conditions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "charge_type" "ChargeType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "event_type" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID NOT NULL,
    "pricing_config_id" UUID,
    "pricing_rule_id" UUID,
    "metadata" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "invoice_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charge_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_configs_tenant_id_idx" ON "pricing_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "pricing_configs_model_idx" ON "pricing_configs"("model");

-- CreateIndex
CREATE INDEX "pricing_configs_is_active_idx" ON "pricing_configs"("is_active");

-- CreateIndex
CREATE INDEX "pricing_configs_vertical_id_idx" ON "pricing_configs"("vertical_id");

-- CreateIndex
CREATE INDEX "pricing_rules_pricing_config_id_idx" ON "pricing_rules"("pricing_config_id");

-- CreateIndex
CREATE INDEX "pricing_rules_event_type_idx" ON "pricing_rules"("event_type");

-- CreateIndex
CREATE INDEX "pricing_rules_is_active_idx" ON "pricing_rules"("is_active");

-- CreateIndex
CREATE INDEX "charge_events_tenant_id_idx" ON "charge_events"("tenant_id");

-- CreateIndex
CREATE INDEX "charge_events_charge_type_idx" ON "charge_events"("charge_type");

-- CreateIndex
CREATE INDEX "charge_events_event_type_idx" ON "charge_events"("event_type");

-- CreateIndex
CREATE INDEX "charge_events_resource_type_resource_id_idx" ON "charge_events"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "charge_events_processed_idx" ON "charge_events"("processed");

-- CreateIndex
CREATE INDEX "charge_events_invoice_id_idx" ON "charge_events"("invoice_id");

-- AddForeignKey
ALTER TABLE "pricing_configs" ADD CONSTRAINT "pricing_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_pricing_config_id_fkey" FOREIGN KEY ("pricing_config_id") REFERENCES "pricing_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_events" ADD CONSTRAINT "charge_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
