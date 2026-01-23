/**
 * Real Estate Vertical - Validation Rules
 * Part 29 - Complete Reference Implementation
 */

import { ValidationRulesConfig, ValidationRule } from '@modules/vertical/types';
import { LANDED_PROPERTY_TYPES } from './attribute.schema';

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RULES
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_VALIDATION_RULES: ValidationRule[] = [
  // === REQUIRED FIELD RULES ===
  {
    id: 'property_type_required',
    type: 'required',
    field: 'propertyType',
    message: 'Property type is required',
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'listing_type_required',
    type: 'required',
    field: 'listingType',
    message: 'Listing type (sale/rent) is required',
    severity: 'error',
    applyOn: 'both',
  },

  // === REQUIRED ON PUBLISH ===
  {
    id: 'builtup_size_required_on_publish',
    type: 'requiredOnPublish',
    field: 'builtUpSize',
    message: 'Built-up size is required before publishing',
    severity: 'error',
    applyOn: 'publish',
  },
  {
    id: 'bedrooms_required_on_publish',
    type: 'requiredOnPublish',
    field: 'bedrooms',
    message: 'Number of bedrooms is required before publishing',
    severity: 'error',
    applyOn: 'publish',
  },
  {
    id: 'bathrooms_required_on_publish',
    type: 'requiredOnPublish',
    field: 'bathrooms',
    message: 'Number of bathrooms is required before publishing',
    severity: 'error',
    applyOn: 'publish',
  },

  // === RANGE VALIDATION ===
  {
    id: 'price_positive',
    type: 'min',
    field: 'price',
    message: 'Price must be greater than 0',
    params: { min: 1 },
    severity: 'error',
    applyOn: 'publish',
  },
  {
    id: 'builtup_size_min',
    type: 'min',
    field: 'builtUpSize',
    message: 'Built-up size must be at least 1 sq ft',
    params: { min: 1 },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'builtup_size_max',
    type: 'max',
    field: 'builtUpSize',
    message: 'Built-up size cannot exceed 1,000,000 sq ft',
    params: { max: 1000000 },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'land_size_min',
    type: 'min',
    field: 'landSize',
    message: 'Land size must be at least 1 sq ft',
    params: { min: 1 },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'land_size_max',
    type: 'max',
    field: 'landSize',
    message: 'Land size cannot exceed 10,000,000 sq ft',
    params: { max: 10000000 },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'bedrooms_range',
    type: 'range',
    field: 'bedrooms',
    message: 'Bedrooms must be between 0 and 20',
    params: { min: 0, max: 20 },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'bathrooms_range',
    type: 'range',
    field: 'bathrooms',
    message: 'Bathrooms must be between 0 and 20',
    params: { min: 0, max: 20 },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'car_parks_range',
    type: 'range',
    field: 'carParks',
    message: 'Car parks must be between 0 and 10',
    params: { min: 0, max: 10 },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'year_built_range',
    type: 'range',
    field: 'yearBuilt',
    message: 'Year built must be between 1900 and 2030',
    params: { min: 1900, max: 2030 },
    severity: 'error',
    applyOn: 'both',
  },

  // === ENUM VALIDATION ===
  {
    id: 'property_type_enum',
    type: 'enum',
    field: 'propertyType',
    message: 'Invalid property type',
    params: {
      values: [
        'apartment',
        'condominium',
        'terrace',
        'semi_detached',
        'bungalow',
        'townhouse',
        'studio',
        'penthouse',
        'duplex',
        'villa',
        'shop_lot',
        'office',
        'warehouse',
        'factory',
        'land',
        'other',
      ],
    },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'listing_type_enum',
    type: 'enum',
    field: 'listingType',
    message: 'Listing type must be either sale or rent',
    params: { values: ['sale', 'rent'] },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'tenure_enum',
    type: 'enum',
    field: 'tenure',
    message: 'Invalid tenure type',
    params: { values: ['freehold', 'leasehold', 'malay_reserve', 'bumi_lot'] },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'furnishing_enum',
    type: 'enum',
    field: 'furnishing',
    message: 'Invalid furnishing type',
    params: { values: ['unfurnished', 'partially_furnished', 'fully_furnished'] },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'condition_enum',
    type: 'enum',
    field: 'condition',
    message: 'Invalid property condition',
    params: { values: ['new', 'good', 'renovated', 'needs_renovation'] },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'facing_enum',
    type: 'enum',
    field: 'facing',
    message: 'Invalid facing direction',
    params: {
      values: [
        'north',
        'south',
        'east',
        'west',
        'north_east',
        'north_west',
        'south_east',
        'south_west',
      ],
    },
    severity: 'error',
    applyOn: 'both',
  },
  {
    id: 'minimum_rental_period_enum',
    type: 'enum',
    field: 'minimumRentalPeriod',
    message: 'Invalid minimum rental period',
    params: { values: ['6_months', '12_months', '24_months', 'flexible'] },
    severity: 'error',
    applyOn: 'both',
  },

  // === CONDITIONAL RULES ===
  {
    id: 'land_size_required_for_landed',
    type: 'conditional',
    fields: ['propertyType', 'landSize'],
    message: 'Land size is required for landed properties',
    params: {
      condition: 'propertyType IN [:landedTypes]',
      landedTypes: LANDED_PROPERTY_TYPES,
      requiredFields: ['landSize'],
    },
    severity: 'warning',
    applyOn: 'publish',
  },
  {
    id: 'tenure_for_sale',
    type: 'conditional',
    fields: ['listingType', 'tenure'],
    message: 'Tenure information helps buyers make decisions',
    params: {
      condition: 'listingType == "sale"',
      recommendedFields: ['tenure'],
    },
    severity: 'warning',
    applyOn: 'publish',
  },
  {
    id: 'rental_fields_for_rent',
    type: 'conditional',
    fields: ['listingType', 'rentalDeposit', 'minimumRentalPeriod'],
    message: 'Consider adding rental terms for better listing quality',
    params: {
      condition: 'listingType == "rent"',
      recommendedFields: ['rentalDeposit', 'minimumRentalPeriod'],
    },
    severity: 'warning',
    applyOn: 'publish',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CROSS-FIELD VALIDATION RULES
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_CROSS_FIELD_RULES = [
  {
    id: 'builtup_vs_land_size',
    name: 'Built-up vs Land Size',
    description: 'Built-up size should not exceed 5x land size',
    fields: ['builtUpSize', 'landSize'],
    validate: 'landSize == null || builtUpSize == null || builtUpSize <= landSize * 5',
    message: 'Built-up size seems large compared to land size',
  },
  {
    id: 'bedrooms_vs_size',
    name: 'Bedrooms vs Size',
    description: 'Number of bedrooms should be reasonable for the size',
    fields: ['bedrooms', 'builtUpSize'],
    validate: 'builtUpSize == null || bedrooms == null || bedrooms <= (builtUpSize / 100)',
    message: 'Number of bedrooms seems high for the built-up size',
  },
  {
    id: 'bathrooms_vs_bedrooms',
    name: 'Bathrooms vs Bedrooms',
    description: 'Bathrooms typically do not exceed bedrooms significantly',
    fields: ['bedrooms', 'bathrooms'],
    validate: 'bedrooms == null || bathrooms == null || bathrooms <= bedrooms + 2',
    message: 'Number of bathrooms seems unusually high compared to bedrooms',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE VALIDATION CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_VALIDATION_CONFIG: ValidationRulesConfig = {
  version: '1.0',
  rules: REAL_ESTATE_VALIDATION_RULES,
  crossFieldRules: REAL_ESTATE_CROSS_FIELD_RULES,
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPER TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  rule: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate real estate attributes for draft status
 */
export function validateForDraft(attributes: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check required fields
  if (!attributes.propertyType) {
    errors.push({
      field: 'propertyType',
      rule: 'property_type_required',
      message: 'Property type is required',
    });
  }

  if (!attributes.listingType) {
    errors.push({
      field: 'listingType',
      rule: 'listing_type_required',
      message: 'Listing type (sale/rent) is required',
    });
  }

  // Validate enums if provided
  if (attributes.propertyType) {
    const validTypes = [
      'apartment',
      'condominium',
      'terrace',
      'semi_detached',
      'bungalow',
      'townhouse',
      'studio',
      'penthouse',
      'duplex',
      'villa',
      'shop_lot',
      'office',
      'warehouse',
      'factory',
      'land',
      'other',
    ];
    if (!validTypes.includes(attributes.propertyType as string)) {
      errors.push({
        field: 'propertyType',
        rule: 'property_type_enum',
        message: 'Invalid property type',
      });
    }
  }

  if (attributes.listingType) {
    if (!['sale', 'rent'].includes(attributes.listingType as string)) {
      errors.push({
        field: 'listingType',
        rule: 'listing_type_enum',
        message: 'Listing type must be either sale or rent',
      });
    }
  }

  // Validate ranges if provided
  validateNumericRange(attributes, 'builtUpSize', 1, 1000000, errors);
  validateNumericRange(attributes, 'landSize', 1, 10000000, errors);
  validateNumericRange(attributes, 'bedrooms', 0, 20, errors);
  validateNumericRange(attributes, 'bathrooms', 0, 20, errors);
  validateNumericRange(attributes, 'carParks', 0, 10, errors);
  validateNumericRange(attributes, 'yearBuilt', 1900, 2030, errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate real estate attributes for publish status
 */
export function validateForPublish(attributes: Record<string, unknown>): ValidationResult {
  // First run draft validation
  const draftResult = validateForDraft(attributes);
  const errors = [...draftResult.errors];
  const warnings = [...draftResult.warnings];

  // Additional required fields for publish
  if (!attributes.builtUpSize) {
    errors.push({
      field: 'builtUpSize',
      rule: 'builtup_size_required_on_publish',
      message: 'Built-up size is required before publishing',
    });
  }

  if (attributes.bedrooms === undefined || attributes.bedrooms === null) {
    errors.push({
      field: 'bedrooms',
      rule: 'bedrooms_required_on_publish',
      message: 'Number of bedrooms is required before publishing',
    });
  }

  if (attributes.bathrooms === undefined || attributes.bathrooms === null) {
    errors.push({
      field: 'bathrooms',
      rule: 'bathrooms_required_on_publish',
      message: 'Number of bathrooms is required before publishing',
    });
  }

  // Conditional validations
  const propertyType = attributes.propertyType as string;
  const listingType = attributes.listingType as string;

  // Land size warning for landed properties
  if (LANDED_PROPERTY_TYPES.includes(propertyType as (typeof LANDED_PROPERTY_TYPES)[number])) {
    if (!attributes.landSize) {
      warnings.push({
        field: 'landSize',
        rule: 'land_size_required_for_landed',
        message: 'Land size is required for landed properties',
      });
    }
  }

  // Tenure recommendation for sale
  if (listingType === 'sale' && !attributes.tenure) {
    warnings.push({
      field: 'tenure',
      rule: 'tenure_for_sale',
      message: 'Tenure information helps buyers make decisions',
    });
  }

  // Rental terms recommendation
  if (listingType === 'rent') {
    if (!attributes.rentalDeposit && !attributes.minimumRentalPeriod) {
      warnings.push({
        field: 'rentalDeposit',
        rule: 'rental_fields_for_rent',
        message: 'Consider adding rental terms for better listing quality',
      });
    }
  }

  // Cross-field validations
  if (attributes.builtUpSize && attributes.landSize) {
    const builtUp = attributes.builtUpSize as number;
    const land = attributes.landSize as number;
    if (builtUp > land * 5) {
      warnings.push({
        field: 'builtUpSize',
        rule: 'builtup_vs_land_size',
        message: 'Built-up size seems large compared to land size',
      });
    }
  }

  if (attributes.bedrooms && attributes.builtUpSize) {
    const bedrooms = attributes.bedrooms as number;
    const builtUp = attributes.builtUpSize as number;
    if (bedrooms > builtUp / 100) {
      warnings.push({
        field: 'bedrooms',
        rule: 'bedrooms_vs_size',
        message: 'Number of bedrooms seems high for the built-up size',
      });
    }
  }

  if (attributes.bedrooms !== undefined && attributes.bathrooms !== undefined) {
    const bedrooms = attributes.bedrooms as number;
    const bathrooms = attributes.bathrooms as number;
    if (bathrooms > bedrooms + 2) {
      warnings.push({
        field: 'bathrooms',
        rule: 'bathrooms_vs_bedrooms',
        message: 'Number of bathrooms seems unusually high compared to bedrooms',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function validateNumericRange(
  attributes: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
  errors: ValidationError[],
): void {
  const value = attributes[field];
  if (value !== undefined && value !== null) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push({
        field,
        rule: `${field}_invalid`,
        message: `${field} must be a number`,
      });
    } else if (numValue < min || numValue > max) {
      errors.push({
        field,
        rule: `${field}_range`,
        message: `${field} must be between ${min} and ${max}`,
      });
    }
  }
}
