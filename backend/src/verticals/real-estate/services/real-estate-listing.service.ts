/**
 * Real Estate Vertical - Listing Service
 * Provides real estate specific listing operations with validation
 */

import { Injectable, BadRequestException, Scope } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PartnerContextService } from '@core/partner-context';
import { PrismaService } from '@infrastructure/database';

import {
  REAL_ESTATE_ATTRIBUTE_SCHEMA,
  REAL_ESTATE_FIELDS,
  getRequiredForDraft,
  getRequiredForPublish,
  isLandedProperty,
  isHighriseProperty,
  PROPERTY_TYPE_OPTIONS,
  LISTING_TYPE_OPTIONS,
  TENURE_OPTIONS,
  FURNISHING_OPTIONS,
  CONDITION_OPTIONS,
  FACING_OPTIONS,
  FACILITIES_OPTIONS,
  NEARBY_AMENITIES_OPTIONS,
  MINIMUM_RENTAL_PERIOD_OPTIONS,
} from '../registry/attribute.schema';

import {
  validateForDraft,
  validateForPublish,
  ValidationResult,
} from '../registry/validation.rules';

import {
  buildRealEstateFilters,
  buildRealEstateAggregations,
  RealEstateFilterParams,
} from '../registry/search.mapping';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RealEstateAttributes {
  propertyType: string;
  listingType: 'sale' | 'rent';
  tenure?: string;
  builtUpSize?: number;
  landSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  carParks?: number;
  furnishing?: string;
  floorLevel?: string;
  condition?: string;
  yearBuilt?: number;
  facing?: string;
  facilities?: string[];
  nearbyAmenities?: string[];
  rentalDeposit?: string;
  minimumRentalPeriod?: string;
  additionalFeatures?: string[];
}

export interface CreateRealEstateListingData {
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  priceType?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  };
  attributes: RealEstateAttributes;
  vendorId: string;
}

export interface UpdateRealEstateListingData {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  priceType?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  };
  attributes?: Partial<RealEstateAttributes>;
}

export interface RealEstateListingView {
  id: string;
  partnerId: string;
  vendorId: string;
  verticalType: string;
  title: string;
  description: string | null;
  slug: string;
  price: number | null;
  currency: string;
  priceType: string | null;
  location: Record<string, unknown> | null;
  attributes: RealEstateAttributes;
  status: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
  isFeatured: boolean;
  featuredUntil: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ scope: Scope.REQUEST })
export class RealEstateListingService {
  private readonly verticalType = 'real_estate';

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // SCHEMA ACCESS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the attribute schema for real estate vertical
   */
  getAttributeSchema() {
    return REAL_ESTATE_ATTRIBUTE_SCHEMA;
  }

  /**
   * Get attribute field definitions
   */
  getFieldDefinitions() {
    return REAL_ESTATE_FIELDS;
  }

  /**
   * Get all available options for enum fields
   */
  getEnumOptions() {
    return {
      propertyType: PROPERTY_TYPE_OPTIONS,
      listingType: LISTING_TYPE_OPTIONS,
      tenure: TENURE_OPTIONS,
      furnishing: FURNISHING_OPTIONS,
      condition: CONDITION_OPTIONS,
      facing: FACING_OPTIONS,
      facilities: FACILITIES_OPTIONS,
      nearbyAmenities: NEARBY_AMENITIES_OPTIONS,
      minimumRentalPeriod: MINIMUM_RENTAL_PERIOD_OPTIONS,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validate attributes for draft status
   */
  validateForDraft(attributes: Record<string, unknown>): ValidationResult {
    return validateForDraft(attributes);
  }

  /**
   * Validate attributes for publish status
   */
  validateForPublish(attributes: Record<string, unknown>): ValidationResult {
    return validateForPublish(attributes);
  }

  /**
   * Get required fields for draft
   */
  getRequiredForDraft(): string[] {
    return getRequiredForDraft();
  }

  /**
   * Get required fields for publish
   */
  getRequiredForPublish(): string[] {
    return getRequiredForPublish();
  }

  /**
   * Check if property type is landed
   */
  isLandedProperty(propertyType: string): boolean {
    return isLandedProperty(propertyType);
  }

  /**
   * Check if property type is high-rise
   */
  isHighriseProperty(propertyType: string): boolean {
    return isHighriseProperty(propertyType);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new real estate listing
   */
  async create(data: CreateRealEstateListingData): Promise<RealEstateListingView> {
    const partnerId = this.PartnerContext.partnerId;
    if (!partnerId) {
      throw new BadRequestException('Partner context required');
    }

    // Validate attributes for draft
    const validation = this.validateForDraft(data.attributes as unknown as Record<string, unknown>);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid attributes',
        errors: validation.errors,
      });
    }

    // Generate slug
    const slug = await this.generateSlug(partnerId, data.title);

    // Determine price type from listing type
    const priceType =
      data.priceType || (data.attributes.listingType === 'rent' ? 'monthly' : 'sale');

    const listing = await this.prisma.listing.create({
      data: {
        partnerId: partnerId,
        vendorId: data.vendorId,
        verticalType: this.verticalType,
        schemaVersion: '1.0',
        title: data.title,
        description: data.description,
        slug,
        price: data.price ? new Prisma.Decimal(data.price) : null,
        currency: data.currency || 'MYR',
        priceType: priceType,
        location: data.location as Prisma.InputJsonValue,
        attributes: data.attributes as unknown as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
    });

    return this.mapToView(listing);
  }

  /**
   * Update a real estate listing
   */
  async update(id: string, data: UpdateRealEstateListingData): Promise<RealEstateListingView> {
    const partnerId = this.PartnerContext.partnerId;
    if (!partnerId) {
      throw new BadRequestException('Partner context required');
    }

    // Get existing listing
    const existing = await this.prisma.listing.findFirst({
      where: { id, partnerId, verticalType: this.verticalType, deletedAt: null },
    });

    if (!existing) {
      throw new BadRequestException('Listing not found');
    }

    // Merge attributes if provided
    let mergedAttributes = existing.attributes as Record<string, unknown>;
    if (data.attributes) {
      mergedAttributes = { ...mergedAttributes, ...data.attributes } as Record<string, unknown>;
    }

    // Validate merged attributes
    const validation = this.validateForDraft(mergedAttributes as Record<string, unknown>);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid attributes',
        errors: validation.errors,
      });
    }

    // Update slug if title changed
    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = await this.generateSlug(partnerId, data.title, id);
    }

    // Merge location if provided
    let location = existing.location as Prisma.JsonValue;
    if (data.location) {
      location = {
        ...(existing.location as Record<string, unknown>),
        ...data.location,
      } as Prisma.JsonValue;
    }

    const listing = await this.prisma.listing.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && {
          price: data.price ? new Prisma.Decimal(data.price) : null,
        }),
        ...(data.currency && { currency: data.currency }),
        ...(data.priceType && { priceType: data.priceType }),
        ...(data.location && { location: location as Prisma.InputJsonValue }),
        ...(data.attributes && {
          attributes: mergedAttributes as unknown as Prisma.InputJsonValue,
        }),
        slug,
      },
    });

    return this.mapToView(listing);
  }

  /**
   * Get a real estate listing by ID
   */
  async findById(id: string): Promise<RealEstateListingView | null> {
    const partnerId = this.PartnerContext.partnerId;
    if (!partnerId) {
      throw new BadRequestException('Partner context required');
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id, partnerId, verticalType: this.verticalType, deletedAt: null },
    });

    return listing ? this.mapToView(listing) : null;
  }

  /**
   * Validate listing for publish and return errors/warnings
   */
  async validateForPublishById(id: string): Promise<ValidationResult> {
    const listing = await this.findById(id);
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    return this.validateForPublish(listing.attributes as unknown as Record<string, unknown>);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build OpenSearch filters for real estate search
   */
  buildSearchFilters(params: RealEstateFilterParams): Record<string, unknown>[] {
    return buildRealEstateFilters(params);
  }

  /**
   * Build aggregations for real estate facets
   */
  buildSearchAggregations(): Record<string, unknown> {
    return buildRealEstateAggregations();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private async generateSlug(partnerId: string, title: string, excludeId?: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);

    let slug = baseSlug;
    let counter = 1;
    const MAX_ATTEMPTS = 100;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.listing.findFirst({
        where: {
          partnerId: partnerId,
          slug,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;

      if (counter > MAX_ATTEMPTS) {
        // Safety: append random suffix
        slug = `${baseSlug}-${Date.now()}`;
        return slug;
      }
    }
  }

  private mapToView(listing: {
    id: string;
    partnerId: string;
    vendorId: string;
    verticalType: string;
    title: string;
    description: string | null;
    slug: string;
    price: Prisma.Decimal | null;
    currency: string;
    priceType: string | null;
    location: Prisma.JsonValue;
    attributes: Prisma.JsonValue;
    status: string;
    publishedAt: Date | null;
    expiresAt: Date | null;
    isFeatured: boolean;
    featuredUntil: Date | null;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): RealEstateListingView {
    return {
      id: listing.id,
      partnerId: listing.partnerId,
      vendorId: listing.vendorId,
      verticalType: listing.verticalType,
      title: listing.title,
      description: listing.description,
      slug: listing.slug,
      price: listing.price ? Number(listing.price) : null,
      currency: listing.currency,
      priceType: listing.priceType,
      location: listing.location as Record<string, unknown> | null,
      attributes: listing.attributes as unknown as RealEstateAttributes,
      status: listing.status,
      publishedAt: listing.publishedAt,
      expiresAt: listing.expiresAt,
      isFeatured: listing.isFeatured,
      featuredUntil: listing.featuredUntil,
      viewCount: listing.viewCount,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }
}
