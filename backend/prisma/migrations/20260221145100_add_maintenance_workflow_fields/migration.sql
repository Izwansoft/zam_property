-- AlterTable
ALTER TABLE "maintenance_tickets" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "contractor_name" TEXT,
ADD COLUMN     "contractor_phone" TEXT,
ADD COLUMN     "started_at" TIMESTAMP(3);
