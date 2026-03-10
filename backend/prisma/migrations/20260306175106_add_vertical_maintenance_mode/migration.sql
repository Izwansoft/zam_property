-- AlterTable
ALTER TABLE "vertical_definitions" ADD COLUMN     "maintenance_end_at" TIMESTAMP(3),
ADD COLUMN     "maintenance_message" TEXT,
ADD COLUMN     "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maintenance_scheduled_by" UUID,
ADD COLUMN     "maintenance_start_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "vertical_definitions_maintenance_mode_idx" ON "vertical_definitions"("maintenance_mode");
