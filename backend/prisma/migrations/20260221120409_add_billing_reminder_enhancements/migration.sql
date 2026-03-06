/*
  Warnings:

  - Added the required column `tenant_id` to the `rent_billing_reminders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'LEGAL_NOTICE';

-- AlterTable
ALTER TABLE "rent_billing_reminders" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "escalated_at" TIMESTAMP(3),
ADD COLUMN     "escalated_to" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SENT',
ADD COLUMN     "tenant_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "rent_billing_reminders_tenant_id_idx" ON "rent_billing_reminders"("tenant_id");

-- CreateIndex
CREATE INDEX "rent_billing_reminders_billing_id_sequence_idx" ON "rent_billing_reminders"("billing_id", "sequence");

-- AddForeignKey
ALTER TABLE "rent_billing_reminders" ADD CONSTRAINT "rent_billing_reminders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
