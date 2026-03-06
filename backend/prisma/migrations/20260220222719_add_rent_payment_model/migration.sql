-- CreateTable
CREATE TABLE "rent_payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "billing_id" UUID NOT NULL,
    "payment_number" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "RentPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'MYR',
    "gateway_id" TEXT,
    "gateway_data" JSONB,
    "client_secret" TEXT,
    "reference" TEXT,
    "receipt_number" TEXT,
    "receipt_url" TEXT,
    "payment_date" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "payer_name" TEXT,
    "payer_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rent_payments_payment_number_key" ON "rent_payments"("payment_number");

-- CreateIndex
CREATE UNIQUE INDEX "rent_payments_receipt_number_key" ON "rent_payments"("receipt_number");

-- CreateIndex
CREATE INDEX "rent_payments_tenant_id_idx" ON "rent_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "rent_payments_billing_id_idx" ON "rent_payments"("billing_id");

-- CreateIndex
CREATE INDEX "rent_payments_status_idx" ON "rent_payments"("status");

-- CreateIndex
CREATE INDEX "rent_payments_gateway_id_idx" ON "rent_payments"("gateway_id");

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "rent_billings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
