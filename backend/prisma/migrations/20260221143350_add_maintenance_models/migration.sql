-- CreateTable
CREATE TABLE "maintenance_tickets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenancy_id" UUID NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "reported_by" UUID NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),
    "verification_notes" TEXT,
    "assigned_to" TEXT,
    "assigned_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "resolution" TEXT,
    "estimated_cost" DECIMAL(12,2),
    "actual_cost" DECIMAL(12,2),
    "paid_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_attachments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "maintenance_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_updates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "maintenance_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_tickets_ticket_number_key" ON "maintenance_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "maintenance_tickets_tenancy_id_status_idx" ON "maintenance_tickets"("tenancy_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_tickets_status_priority_idx" ON "maintenance_tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "maintenance_attachments_maintenance_id_idx" ON "maintenance_attachments"("maintenance_id");

-- CreateIndex
CREATE INDEX "maintenance_updates_maintenance_id_idx" ON "maintenance_updates"("maintenance_id");

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_attachments" ADD CONSTRAINT "maintenance_attachments_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "maintenance_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_updates" ADD CONSTRAINT "maintenance_updates_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "maintenance_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
