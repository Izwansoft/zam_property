-- CreateTable
CREATE TABLE "vertical_definitions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "attributeSchema" JSONB NOT NULL,
    "validationRules" JSONB NOT NULL,
    "searchMapping" JSONB NOT NULL,
    "supportedStatuses" TEXT[] DEFAULT ARRAY['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED']::TEXT[],
    "displayMetadata" JSONB,
    "schema_version" TEXT NOT NULL DEFAULT '1.0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vertical_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_verticals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vertical_id" UUID NOT NULL,
    "config_overrides" JSONB,
    "custom_fields" JSONB,
    "listing_limit" INTEGER,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "enabled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_verticals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_version" TEXT NOT NULL DEFAULT '1.0',
    "tenant_id" UUID,
    "correlation_id" TEXT NOT NULL,
    "causation_id" UUID,
    "actor_type" TEXT NOT NULL,
    "actor_id" UUID,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vertical_definitions_type_key" ON "vertical_definitions"("type");

-- CreateIndex
CREATE INDEX "vertical_definitions_type_idx" ON "vertical_definitions"("type");

-- CreateIndex
CREATE INDEX "vertical_definitions_is_active_idx" ON "vertical_definitions"("is_active");

-- CreateIndex
CREATE INDEX "tenant_verticals_tenant_id_idx" ON "tenant_verticals"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_verticals_vertical_id_idx" ON "tenant_verticals"("vertical_id");

-- CreateIndex
CREATE INDEX "tenant_verticals_is_enabled_idx" ON "tenant_verticals"("is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_verticals_tenant_id_vertical_id_key" ON "tenant_verticals"("tenant_id", "vertical_id");

-- CreateIndex
CREATE INDEX "event_logs_tenant_id_occurred_at_idx" ON "event_logs"("tenant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "event_logs_event_type_occurred_at_idx" ON "event_logs"("event_type", "occurred_at");

-- CreateIndex
CREATE INDEX "event_logs_correlation_id_idx" ON "event_logs"("correlation_id");

-- CreateIndex
CREATE INDEX "event_logs_occurred_at_idx" ON "event_logs"("occurred_at");

-- AddForeignKey
ALTER TABLE "tenant_verticals" ADD CONSTRAINT "tenant_verticals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_verticals" ADD CONSTRAINT "tenant_verticals_vertical_id_fkey" FOREIGN KEY ("vertical_id") REFERENCES "vertical_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
