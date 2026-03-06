-- CreateTable
CREATE TABLE "claims" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenancy_id" UUID NOT NULL,
    "maintenance_id" UUID,
    "claim_number" TEXT NOT NULL,
    "type" "ClaimType" NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "claimed_amount" DECIMAL(12,2) NOT NULL,
    "approved_amount" DECIMAL(12,2),
    "submitted_by" UUID NOT NULL,
    "submitted_role" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "settled_at" TIMESTAMP(3),
    "settlement_method" TEXT,
    "is_disputed" BOOLEAN NOT NULL DEFAULT false,
    "dispute_reason" TEXT,
    "disputed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_evidence" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "claim_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "description" TEXT,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claims_maintenance_id_key" ON "claims"("maintenance_id");

-- CreateIndex
CREATE UNIQUE INDEX "claims_claim_number_key" ON "claims"("claim_number");

-- CreateIndex
CREATE INDEX "claims_tenancy_id_status_idx" ON "claims"("tenancy_id", "status");

-- CreateIndex
CREATE INDEX "claims_type_idx" ON "claims"("type");

-- CreateIndex
CREATE INDEX "claim_evidence_claim_id_idx" ON "claim_evidence"("claim_id");

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "maintenance_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
