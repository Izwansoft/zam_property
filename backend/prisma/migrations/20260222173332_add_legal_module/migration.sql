-- CreateTable
CREATE TABLE "legal_cases" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "tenancy_id" UUID NOT NULL,
    "case_number" TEXT NOT NULL,
    "status" "LegalCaseStatus" NOT NULL DEFAULT 'NOTICE_SENT',
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount_owed" DECIMAL(12,2) NOT NULL,
    "lawyer_id" UUID,
    "notice_date" TIMESTAMP(3),
    "notice_deadline" TIMESTAMP(3),
    "court_date" TIMESTAMP(3),
    "judgment_date" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "settlement_amount" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panel_lawyers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "firm" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "specialization" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panel_lawyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "case_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "generated_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_cases_case_number_key" ON "legal_cases"("case_number");

-- CreateIndex
CREATE INDEX "legal_cases_tenant_id_status_idx" ON "legal_cases"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "legal_cases_tenancy_id_idx" ON "legal_cases"("tenancy_id");

-- CreateIndex
CREATE INDEX "legal_cases_lawyer_id_idx" ON "legal_cases"("lawyer_id");

-- CreateIndex
CREATE INDEX "panel_lawyers_tenant_id_is_active_idx" ON "panel_lawyers"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "legal_documents_case_id_idx" ON "legal_documents"("case_id");

-- AddForeignKey
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "panel_lawyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panel_lawyers" ADD CONSTRAINT "panel_lawyers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "legal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
