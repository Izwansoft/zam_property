-- CreateTable
CREATE TABLE "inspections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenancy_id" UUID NOT NULL,
    "type" "InspectionType" NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_date" TIMESTAMP(3),
    "scheduled_time" TEXT,
    "video_requested" BOOLEAN NOT NULL DEFAULT false,
    "video_requested_at" TIMESTAMP(3),
    "video_url" TEXT,
    "video_submitted_at" TIMESTAMP(3),
    "onsite_required" BOOLEAN NOT NULL DEFAULT false,
    "onsite_date" TIMESTAMP(3),
    "onsite_inspector" TEXT,
    "report_url" TEXT,
    "overall_rating" INTEGER,
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "completed_by" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "inspection_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "condition" TEXT,
    "notes" TEXT,
    "photo_urls" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspections_tenancy_id_type_idx" ON "inspections"("tenancy_id", "type");

-- CreateIndex
CREATE INDEX "inspections_status_idx" ON "inspections"("status");

-- CreateIndex
CREATE INDEX "inspection_items_inspection_id_idx" ON "inspection_items"("inspection_id");

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
