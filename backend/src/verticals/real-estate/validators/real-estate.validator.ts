/**
 * Real Estate Vertical Validator
 * Part 7 & Part 29 - Vertical-specific validation
 *
 * Implements IVerticalValidator for real estate attributes.
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

import { BaseVerticalValidator } from '@core/validation/validators';
import {
  VerticalValidationConfig,
  ValidationContext,
  ValidationResult,
  ValidationIssue,
  AttributeFieldValidationDef,
} from '@core/validation/types';
import { AttributeSchemaRegistry } from '@core/validation/services';

import {
  REAL_ESTATE_VALIDATION_CONFIG,
  validateForDraft,
  validateForPublish,
} from '../registry/validation.rules';
import { REAL_ESTATE_FIELDS, LANDED_PROPERTY_TYPES } from '../registry/attribute.schema';

// ─────────────────────────────────────────────────────────────────────────────
// REAL ESTATE VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RealEstateValidator extends BaseVerticalValidator implements OnModuleInit {
  private readonly log = new Logger(RealEstateValidator.name);

  constructor(private readonly schemaRegistry: AttributeSchemaRegistry) {
    super('real_estate');
  }

  async onModuleInit(): Promise<void> {
    // Register schema with the registry
    this.registerWithRegistry();
    this.log.log('Real estate validator initialized and registered');
  }

  /**
   * Register the real estate schema with the central registry
   */
  private registerWithRegistry(): void {
    // Convert field definitions to validation format
    const fields: AttributeFieldValidationDef[] = REAL_ESTATE_FIELDS.map((field) => ({
      name: field.name,
      type: field.type,
      label: field.label,
      required: field.required,
      requiredOnPublish: field.requiredOnPublish,
      min: field.min,
      max: field.max,
      options: field.options,
      defaultValue: field.defaultValue,
    }));

    this.schemaRegistry.register('real_estate', '1.0', fields, this.getValidationConfig());
  }

  /**
   * Get the validation configuration
   */
  getValidationConfig(): VerticalValidationConfig {
    return REAL_ESTATE_VALIDATION_CONFIG;
  }

  /**
   * Validate for draft - uses the pre-built validation function
   */
  validateForDraft(
    attributes: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationResult {
    const result = validateForDraft(attributes);

    return {
      valid: result.valid,
      errors: result.errors.map((e) => ({
        ruleId: e.rule,
        field: e.field,
        message: e.message,
        severity: 'error' as const,
      })),
      warnings: result.warnings.map((w) => ({
        ruleId: w.rule,
        field: w.field,
        message: w.message,
        severity: 'warning' as const,
      })),
      info: [],
      verticalType: this.verticalType,
      schemaVersion: context.schemaVersion,
      phase: 'draft',
      validatedAt: new Date(),
    };
  }

  /**
   * Validate for publish - uses the pre-built validation function
   */
  validateForPublish(
    attributes: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationResult {
    const result = validateForPublish(attributes);

    return {
      valid: result.valid,
      errors: result.errors.map((e) => ({
        ruleId: e.rule,
        field: e.field,
        message: e.message,
        severity: 'error' as const,
      })),
      warnings: result.warnings.map((w) => ({
        ruleId: w.rule,
        field: w.field,
        message: w.message,
        severity: 'warning' as const,
      })),
      info: [],
      verticalType: this.verticalType,
      schemaVersion: context.schemaVersion,
      phase: 'publish',
      validatedAt: new Date(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CUSTOM VALIDATORS (Real Estate Specific)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validate that landed properties have land size
   */
  validateLandedProperty(attributes: Record<string, unknown>): ValidationIssue | null {
    const propertyType = attributes.propertyType as string;

    if (LANDED_PROPERTY_TYPES.includes(propertyType as (typeof LANDED_PROPERTY_TYPES)[number])) {
      if (!attributes.landSize) {
        return {
          ruleId: 'landed_requires_land_size',
          field: 'landSize',
          message: 'Land size is required for landed properties',
          severity: 'warning',
        };
      }
    }

    return null;
  }

  /**
   * Validate rental terms for rental listings
   */
  validateRentalTerms(attributes: Record<string, unknown>): ValidationIssue | null {
    const listingType = attributes.listingType as string;

    if (listingType === 'rent') {
      if (!attributes.rentalDeposit && !attributes.minimumRentalPeriod) {
        return {
          ruleId: 'rental_terms_recommended',
          field: 'rentalDeposit',
          message: 'Consider adding rental terms for better listing quality',
          severity: 'info',
        };
      }
    }

    return null;
  }

  /**
   * Validate built-up vs land size ratio
   */
  validateSizeRatio(attributes: Record<string, unknown>): ValidationIssue | null {
    const builtUpSize = attributes.builtUpSize as number | undefined;
    const landSize = attributes.landSize as number | undefined;

    if (builtUpSize && landSize && builtUpSize > landSize * 5) {
      return {
        ruleId: 'size_ratio_warning',
        field: 'builtUpSize',
        message: 'Built-up size seems unusually large compared to land size',
        severity: 'warning',
        context: {
          builtUpSize,
          landSize,
          ratio: builtUpSize / landSize,
        },
      };
    }

    return null;
  }

  /**
   * Validate bedrooms vs size ratio
   */
  validateBedroomRatio(attributes: Record<string, unknown>): ValidationIssue | null {
    const bedrooms = attributes.bedrooms as number | undefined;
    const builtUpSize = attributes.builtUpSize as number | undefined;

    if (bedrooms && builtUpSize && bedrooms > builtUpSize / 100) {
      return {
        ruleId: 'bedroom_ratio_warning',
        field: 'bedrooms',
        message: 'Number of bedrooms seems high for the built-up size',
        severity: 'warning',
        context: {
          bedrooms,
          builtUpSize,
          sqftPerBedroom: builtUpSize / bedrooms,
        },
      };
    }

    return null;
  }

  /**
   * Run all custom validators
   */
  runCustomValidations(attributes: Record<string, unknown>): {
    warnings: ValidationIssue[];
    info: ValidationIssue[];
  } {
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];

    const validators = [
      () => this.validateLandedProperty(attributes),
      () => this.validateRentalTerms(attributes),
      () => this.validateSizeRatio(attributes),
      () => this.validateBedroomRatio(attributes),
    ];

    for (const validator of validators) {
      const issue = validator();
      if (issue) {
        if (issue.severity === 'warning') {
          warnings.push(issue);
        } else if (issue.severity === 'info') {
          info.push(issue);
        }
      }
    }

    return { warnings, info };
  }
}
