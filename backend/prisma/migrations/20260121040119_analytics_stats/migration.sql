-- CreateTable
CREATE TABLE "listing_stats" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "vertical_type" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "inquiries_count" INTEGER NOT NULL DEFAULT 0,
    "leads_count" INTEGER NOT NULL DEFAULT 0,
    "enquiries_count" INTEGER NOT NULL DEFAULT 0,
    "bookings_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_stats" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "inquiries_count" INTEGER NOT NULL DEFAULT 0,
    "leads_count" INTEGER NOT NULL DEFAULT 0,
    "enquiries_count" INTEGER NOT NULL DEFAULT 0,
    "bookings_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_stats_tenant_id_date_idx" ON "listing_stats"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "listing_stats_vendor_id_date_idx" ON "listing_stats"("vendor_id", "date");

-- CreateIndex
CREATE INDEX "listing_stats_listing_id_date_idx" ON "listing_stats"("listing_id", "date");

-- CreateIndex
CREATE INDEX "listing_stats_vertical_type_date_idx" ON "listing_stats"("vertical_type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "listing_stats_tenant_id_listing_id_date_key" ON "listing_stats"("tenant_id", "listing_id", "date");

-- CreateIndex
CREATE INDEX "vendor_stats_tenant_id_date_idx" ON "vendor_stats"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "vendor_stats_vendor_id_date_idx" ON "vendor_stats"("vendor_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_stats_tenant_id_vendor_id_date_key" ON "vendor_stats"("tenant_id", "vendor_id", "date");

-- AddForeignKey
ALTER TABLE "listing_stats" ADD CONSTRAINT "listing_stats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_stats" ADD CONSTRAINT "listing_stats_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_stats" ADD CONSTRAINT "listing_stats_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_stats" ADD CONSTRAINT "vendor_stats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_stats" ADD CONSTRAINT "vendor_stats_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
