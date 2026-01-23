-- CreateEnum
CREATE TYPE "FeatureFlagType" AS ENUM ('BOOLEAN', 'PERCENTAGE');

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(120) NOT NULL,
    "type" "FeatureFlagType" NOT NULL DEFAULT 'BOOLEAN',
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "default_value" BOOLEAN NOT NULL DEFAULT false,
    "rollout_percentage" INTEGER,
    "allowed_verticals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowed_roles" "Role"[] DEFAULT ARRAY[]::"Role"[],
    "review_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_overrides" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "feature_flag_id" UUID NOT NULL,
    "tenant_id" UUID,
    "vertical_type" TEXT,
    "role" "Role",
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "value" BOOLEAN NOT NULL,
    "rollout_percentage" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flag_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_user_targets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "feature_flag_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "value" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flag_user_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "success_metrics" TEXT,
    "variants" JSONB NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "feature_flag_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_tenant_opt_ins" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "experiment_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiment_tenant_opt_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_is_archived_idx" ON "feature_flags"("is_archived");

-- CreateIndex
CREATE INDEX "feature_flags_key_idx" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flag_overrides_feature_flag_id_idx" ON "feature_flag_overrides"("feature_flag_id");

-- CreateIndex
CREATE INDEX "feature_flag_overrides_tenant_id_idx" ON "feature_flag_overrides"("tenant_id");

-- CreateIndex
CREATE INDEX "feature_flag_overrides_vertical_type_idx" ON "feature_flag_overrides"("vertical_type");

-- CreateIndex
CREATE INDEX "feature_flag_overrides_role_idx" ON "feature_flag_overrides"("role");

-- CreateIndex
CREATE INDEX "feature_flag_overrides_is_emergency_idx" ON "feature_flag_overrides"("is_emergency");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flag_overrides_feature_flag_id_tenant_id_vertical_t_key" ON "feature_flag_overrides"("feature_flag_id", "tenant_id", "vertical_type", "role", "is_emergency");

-- CreateIndex
CREATE INDEX "feature_flag_user_targets_tenant_id_idx" ON "feature_flag_user_targets"("tenant_id");

-- CreateIndex
CREATE INDEX "feature_flag_user_targets_user_id_idx" ON "feature_flag_user_targets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flag_user_targets_feature_flag_id_tenant_id_user_id_key" ON "feature_flag_user_targets"("feature_flag_id", "tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "experiments_key_key" ON "experiments"("key");

-- CreateIndex
CREATE INDEX "experiments_is_active_idx" ON "experiments"("is_active");

-- CreateIndex
CREATE INDEX "experiments_starts_at_idx" ON "experiments"("starts_at");

-- CreateIndex
CREATE INDEX "experiments_ends_at_idx" ON "experiments"("ends_at");

-- CreateIndex
CREATE INDEX "experiment_tenant_opt_ins_tenant_id_idx" ON "experiment_tenant_opt_ins"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_tenant_opt_ins_experiment_id_tenant_id_key" ON "experiment_tenant_opt_ins"("experiment_id", "tenant_id");

-- AddForeignKey
ALTER TABLE "entitlement_snapshots" ADD CONSTRAINT "entitlement_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_snapshots" ADD CONSTRAINT "entitlement_snapshots_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_user_targets" ADD CONSTRAINT "feature_flag_user_targets_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_user_targets" ADD CONSTRAINT "feature_flag_user_targets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_user_targets" ADD CONSTRAINT "feature_flag_user_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "feature_flags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_tenant_opt_ins" ADD CONSTRAINT "experiment_tenant_opt_ins_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_tenant_opt_ins" ADD CONSTRAINT "experiment_tenant_opt_ins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
