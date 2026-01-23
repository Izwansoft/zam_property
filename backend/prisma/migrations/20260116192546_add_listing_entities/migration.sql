-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "vertical_type" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL DEFAULT '1.0',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "price" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "price_type" TEXT,
    "location" JSONB,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_until" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_media" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "media_type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "storage_key" TEXT NOT NULL,
    "cdn_url" TEXT,
    "thumbnail_key" TEXT,
    "thumbnail_url" TEXT,
    "processing_status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PUBLIC',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "alt_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listings_tenant_id_idx" ON "listings"("tenant_id");

-- CreateIndex
CREATE INDEX "listings_vendor_id_idx" ON "listings"("vendor_id");

-- CreateIndex
CREATE INDEX "listings_vertical_type_idx" ON "listings"("vertical_type");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_published_at_idx" ON "listings"("published_at");

-- CreateIndex
CREATE INDEX "listings_expires_at_idx" ON "listings"("expires_at");

-- CreateIndex
CREATE INDEX "listings_is_featured_idx" ON "listings"("is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "listings_tenant_id_slug_key" ON "listings"("tenant_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "listing_media_storage_key_key" ON "listing_media"("storage_key");

-- CreateIndex
CREATE INDEX "listing_media_tenant_id_idx" ON "listing_media"("tenant_id");

-- CreateIndex
CREATE INDEX "listing_media_listing_id_idx" ON "listing_media"("listing_id");

-- CreateIndex
CREATE INDEX "listing_media_media_type_idx" ON "listing_media"("media_type");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
