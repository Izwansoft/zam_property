/**
 * Listing Validation Helper
 * Part 7 - Attribute Engine & Validation System
 *
 * Helper service that integrates attribute validation with the listing workflow.
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';

import {
  ValidationService,
  AttributeSchemaRegistry,
  ValidationResult,
  formatValidationResult,
} from '@core/validation';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ListingValidationContext {
  tenantId: string;
  vendorId?: string;
  currentStatus: string;
  targetStatus?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTING VALIDATION HELPER
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ListingValidationHelper {
  private readonly logger = new Logger(ListingValidationHelper.name);

  constructor(
    private readonly validationService: ValidationService,
    private readonly schemaRegistry: AttributeSchemaRegistry,
  ) {}

  /**
   * Validate attributes when creating a new listing (draft mode)
   */
  validateForCreate(
    verticalType: string,
    attributes: Record<string, unknown>,
    context: ListingValidationContext,
  ): ValidationResult {
    this.ensureVerticalRegistered(verticalType);

    return this.validationService.validateForDraft(verticalType, attributes, {
      tenantId: context.tenantId,
      vendorId: context.vendorId,
      currentStatus: 'DRAFT',
      isNew: true,
    });
  }

  /**
   * Validate attributes when updating a listing
   * Uses draft validation unless the listing is already published
   */
  validateForUpdate(
    verticalType: string,
    attributes: Record<string, unknown>,
    context: ListingValidationContext,
  ): ValidationResult {
    this.ensureVerticalRegistered(verticalType);

    // If updating a published listing, use publish validation
    const phase = context.currentStatus === 'PUBLISHED' ? 'publish' : 'draft';

    return this.validationService.validate(verticalType, attributes, phase, {
      tenantId: context.tenantId,
      vendorId: context.vendorId,
      currentStatus: context.currentStatus,
      isNew: false,
    });
  }

  /**
   * Validate attributes when publishing a listing
   * Uses full publish validation
   */
  validateForPublish(
    verticalType: string,
    attributes: Record<string, unknown>,
    context: ListingValidationContext,
  ): ValidationResult {
    this.ensureVerticalRegistered(verticalType);

    return this.validationService.validateForPublish(verticalType, attributes, {
      tenantId: context.tenantId,
      vendorId: context.vendorId,
      currentStatus: context.currentStatus,
      targetStatus: 'PUBLISHED',
      isNew: false,
    });
  }

  /**
   * Validate and throw if invalid
   */
  validateOrThrow(
    verticalType: string,
    attributes: Record<string, unknown>,
    context: ListingValidationContext,
    mode: 'create' | 'update' | 'publish',
  ): void {
    let result: ValidationResult;

    switch (mode) {
      case 'create':
        result = this.validateForCreate(verticalType, attributes, context);
        break;
      case 'update':
        result = this.validateForUpdate(verticalType, attributes, context);
        break;
      case 'publish':
        result = this.validateForPublish(verticalType, attributes, context);
        break;
    }

    if (!result.valid) {
      const formatted = formatValidationResult(result);
      throw new BadRequestException({
        statusCode: 400,
        error: 'Validation Error',
        message: `Attribute validation failed: ${result.errors.map((e) => e.message).join('; ')}`,
        code: 'VAL_ATTRIBUTE_VALIDATION_FAILED',
        details: {
          ...formatted,
          verticalType: result.verticalType,
          schemaVersion: result.schemaVersion,
          phase: result.phase,
        },
      });
    }

    // Log warnings if any
    if (result.warnings.length > 0) {
      this.logger.warn(
        `Validation passed with warnings for ${verticalType}: ${result.warnings.map((w) => w.message).join('; ')}`,
      );
    }
  }

  /**
   * Check if vertical is registered
   */
  isVerticalRegistered(verticalType: string): boolean {
    return this.schemaRegistry.isRegistered(verticalType);
  }

  /**
   * Get supported verticals
   */
  getSupportedVerticals(): string[] {
    return this.schemaRegistry.getRegisteredVerticals();
  }

  /**
   * Get schema for a vertical
   */
  getSchema(verticalType: string) {
    return this.schemaRegistry.getSchema(verticalType);
  }

  /**
   * Get validation configuration for a vertical
   */
  getValidationConfig(verticalType: string) {
    return this.schemaRegistry.getValidationConfig(verticalType);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private ensureVerticalRegistered(verticalType: string): void {
    if (!this.schemaRegistry.isRegistered(verticalType)) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Vertical '${verticalType}' is not registered`,
        code: 'VAL_VERTICAL_NOT_REGISTERED',
      });
    }
  }
}
