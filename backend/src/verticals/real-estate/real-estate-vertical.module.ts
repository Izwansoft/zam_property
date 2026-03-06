/**
 * Real Estate Vertical Module
 * Part 29 - Complete Reference Implementation
 *
 * This module registers the real estate vertical with the vertical registry
 * and provides real estate specific services and search endpoints.
 */

import { Module, OnModuleInit, Logger } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { SearchModule } from '@infrastructure/search';
import { PartnerContextModule } from '@core/partner-context';
import { ValidationModule } from '@core/validation';
import { VerticalModule, VerticalService } from '@modules/vertical';

import { RealEstateListingService, RealEstateSearchService } from './services';
import { RealEstateSearchController } from './controllers';
import { RealEstateValidator } from './validators';
import {
  REAL_ESTATE_ATTRIBUTE_SCHEMA,
  REAL_ESTATE_VALIDATION_CONFIG,
  REAL_ESTATE_SEARCH_MAPPING,
} from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_VERTICAL_DEFINITION = {
  type: 'real_estate',
  name: 'Real Estate',
  description: 'Residential and commercial property listings for sale and rent',
  icon: 'home',
  color: '#2563eb',
  schemaVersion: '1.0',
  isActive: true,
  isCore: true,
  supportedStatuses: ['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'],
  displayMetadata: {
    version: '1.0',
    listView: {
      primaryField: 'title',
      secondaryFields: ['location.city', 'attributes.propertyType'],
      badgeField: 'attributes.listingType',
      thumbnailField: 'primaryImageUrl',
    },
    cardView: {
      titleField: 'title',
      subtitleField: 'location.city',
      priceField: 'price',
      locationField: 'location.address',
      imageField: 'primaryImageUrl',
      badges: ['isFeatured', 'attributes.listingType'],
    },
    detailView: {
      sections: [
        {
          id: 'basic',
          label: 'Basic Information',
          fields: ['propertyType', 'listingType', 'tenure'],
          layout: 'grid',
        },
        { id: 'size', label: 'Size', fields: ['builtUpSize', 'landSize'], layout: 'grid' },
        {
          id: 'rooms',
          label: 'Rooms',
          fields: ['bedrooms', 'bathrooms', 'carParks'],
          layout: 'inline',
        },
        {
          id: 'details',
          label: 'Details',
          fields: ['furnishing', 'condition', 'yearBuilt', 'facing', 'floorLevel'],
          layout: 'grid',
        },
        { id: 'facilities', label: 'Facilities', fields: ['facilities'], layout: 'list' },
        { id: 'amenities', label: 'Nearby Amenities', fields: ['nearbyAmenities'], layout: 'list' },
        {
          id: 'rental',
          label: 'Rental Terms',
          fields: ['rentalDeposit', 'minimumRentalPeriod'],
          layout: 'grid',
        },
        {
          id: 'features',
          label: 'Additional Features',
          fields: ['additionalFeatures'],
          layout: 'list',
        },
      ],
    },
    form: {
      steps: [
        { id: 'basic', label: 'Basic Info', fields: ['propertyType', 'listingType', 'tenure'] },
        {
          id: 'size-rooms',
          label: 'Size & Rooms',
          fields: ['builtUpSize', 'landSize', 'bedrooms', 'bathrooms', 'carParks'],
        },
        {
          id: 'details',
          label: 'Property Details',
          fields: ['furnishing', 'condition', 'yearBuilt', 'facing', 'floorLevel'],
        },
        {
          id: 'features',
          label: 'Features',
          fields: ['facilities', 'nearbyAmenities', 'additionalFeatures'],
        },
        { id: 'rental', label: 'Rental Terms', fields: ['rentalDeposit', 'minimumRentalPeriod'] },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  imports: [DatabaseModule, PartnerContextModule, VerticalModule, SearchModule, ValidationModule],
  controllers: [RealEstateSearchController],
  providers: [RealEstateListingService, RealEstateSearchService, RealEstateValidator],
  exports: [RealEstateListingService, RealEstateSearchService, RealEstateValidator],
})
export class RealEstateVerticalModule implements OnModuleInit {
  private readonly logger = new Logger(RealEstateVerticalModule.name);

  constructor(private readonly verticalService: VerticalService) {}

  async onModuleInit(): Promise<void> {
    await this.registerVertical();
  }

  /**
   * Register the real estate vertical with the vertical registry
   * This ensures the database has the correct schema definitions
   */
  private async registerVertical(): Promise<void> {
    try {
      // Check if vertical already exists
      let existing: { id: string } | null = null;
      try {
        existing = await this.verticalService.getVerticalDefinitionByType('real_estate');
      } catch {
        // Vertical doesn't exist yet
        existing = null;
      }

      if (existing) {
        this.logger.log('Real estate vertical already registered, updating schema...');

        // Update the schema to latest version
        await this.verticalService.updateVerticalDefinition(existing.id, {
          attributeSchema: REAL_ESTATE_ATTRIBUTE_SCHEMA as unknown as Record<string, unknown>,
          validationRules: REAL_ESTATE_VALIDATION_CONFIG as unknown as Record<string, unknown>,
          searchMapping: REAL_ESTATE_SEARCH_MAPPING as unknown as Record<string, unknown>,
          displayMetadata: REAL_ESTATE_VERTICAL_DEFINITION.displayMetadata,
          schemaVersion: REAL_ESTATE_VERTICAL_DEFINITION.schemaVersion,
        });

        this.logger.log('Real estate vertical schema updated');
      } else {
        this.logger.log('Registering real estate vertical...');

        // Create new vertical definition
        await this.verticalService.createVerticalDefinition({
          type: REAL_ESTATE_VERTICAL_DEFINITION.type,
          name: REAL_ESTATE_VERTICAL_DEFINITION.name,
          description: REAL_ESTATE_VERTICAL_DEFINITION.description,
          icon: REAL_ESTATE_VERTICAL_DEFINITION.icon,
          color: REAL_ESTATE_VERTICAL_DEFINITION.color,
          schemaVersion: REAL_ESTATE_VERTICAL_DEFINITION.schemaVersion,
          isActive: REAL_ESTATE_VERTICAL_DEFINITION.isActive,
          isCore: REAL_ESTATE_VERTICAL_DEFINITION.isCore,
          attributeSchema: REAL_ESTATE_ATTRIBUTE_SCHEMA as unknown as Record<string, unknown>,
          validationRules: REAL_ESTATE_VALIDATION_CONFIG as unknown as Record<string, unknown>,
          searchMapping: REAL_ESTATE_SEARCH_MAPPING as unknown as Record<string, unknown>,
          supportedStatuses: REAL_ESTATE_VERTICAL_DEFINITION.supportedStatuses,
          displayMetadata: REAL_ESTATE_VERTICAL_DEFINITION.displayMetadata,
        });

        this.logger.log('Real estate vertical registered successfully');
      }
    } catch (error) {
      // Log error but don't fail module init - vertical may already exist from seed
      this.logger.warn(`Failed to register real estate vertical: ${(error as Error).message}`);
    }
  }
}
