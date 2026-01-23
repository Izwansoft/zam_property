/**
 * Validation Decorators
 * Part 7 - Attribute Engine & Validation System
 *
 * Decorators for automatic attribute validation in controllers.
 */

import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

import { ValidationService } from '../services';
import { ValidationPhase, ValidationResult } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// METADATA KEYS
// ─────────────────────────────────────────────────────────────────────────────

export const VALIDATION_METADATA_KEY = 'attribute_validation';

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION METADATA
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationMetadata {
  /** Phase for validation */
  phase: ValidationPhase;

  /** Path to vertical type in request body */
  verticalTypePath?: string;

  /** Path to attributes in request body */
  attributesPath?: string;

  /** Whether to throw on warnings */
  strictMode?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DECORATORS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a controller method to validate attributes for draft
 * @example
 * @Post()
 * @ValidateForDraft()
 * async create(@Body() dto: CreateListingDto) { ... }
 */
export function ValidateForDraft(options?: Omit<ValidationMetadata, 'phase'>) {
  return SetMetadata(VALIDATION_METADATA_KEY, {
    phase: 'draft' as ValidationPhase,
    verticalTypePath: options?.verticalTypePath ?? 'verticalType',
    attributesPath: options?.attributesPath ?? 'attributes',
    strictMode: options?.strictMode ?? false,
  });
}

/**
 * Mark a controller method to validate attributes for publish
 * @example
 * @Post(':id/publish')
 * @ValidateForPublish()
 * async publish(@Param('id') id: string, @Body() dto: PublishListingDto) { ... }
 */
export function ValidateForPublish(options?: Omit<ValidationMetadata, 'phase'>) {
  return SetMetadata(VALIDATION_METADATA_KEY, {
    phase: 'publish' as ValidationPhase,
    verticalTypePath: options?.verticalTypePath ?? 'verticalType',
    attributesPath: options?.attributesPath ?? 'attributes',
    strictMode: options?.strictMode ?? false,
  });
}

/**
 * Mark a controller method to validate attributes with custom phase
 * @example
 * @Put(':id')
 * @ValidateAttributes({ phase: 'both' })
 * async update(@Param('id') id: string, @Body() dto: UpdateListingDto) { ... }
 */
export function ValidateAttributes(options: ValidationMetadata) {
  return SetMetadata(VALIDATION_METADATA_KEY, {
    phase: options.phase,
    verticalTypePath: options.verticalTypePath ?? 'verticalType',
    attributesPath: options.attributesPath ?? 'attributes',
    strictMode: options.strictMode ?? false,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION PIPE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validation pipe that can be used in place of decorators
 * @example
 * @Post()
 * async create(@Body(new AttributeValidationPipe('draft')) dto: CreateListingDto) { ... }
 */
@Injectable()
export class AttributeValidationPipe implements PipeTransform {
  constructor(
    private readonly validationService: ValidationService,
    private readonly phase: ValidationPhase = 'draft',
    private readonly options?: {
      verticalTypePath?: string;
      attributesPath?: string;
      strictMode?: boolean;
    },
  ) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const body = value as Record<string, unknown>;
    const verticalTypePath = this.options?.verticalTypePath ?? 'verticalType';
    const attributesPath = this.options?.attributesPath ?? 'attributes';

    const verticalType = this.getNestedValue(body, verticalTypePath) as string;
    const attributes = this.getNestedValue(body, attributesPath) as Record<string, unknown>;

    if (!verticalType || !attributes) {
      return value;
    }

    const result = this.validationService.validate(verticalType, attributes, this.phase);

    if (!result.valid) {
      throw new ValidationException(result);
    }

    if (this.options?.strictMode && result.warnings.length > 0) {
      throw new ValidationException(result);
    }

    return value;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object'
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj as unknown);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION EXCEPTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exception thrown when attribute validation fails
 */
export class ValidationException extends BadRequestException {
  constructor(public readonly result: ValidationResult) {
    const message =
      result.errors.length > 0
        ? `Validation failed: ${result.errors.map((e) => e.message).join('; ')}`
        : `Validation warnings: ${result.warnings.map((w) => w.message).join('; ')}`;

    super({
      statusCode: 400,
      error: 'Validation Error',
      message,
      code: 'VAL_ATTRIBUTE_VALIDATION_FAILED',
      details: {
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings,
        verticalType: result.verticalType,
        schemaVersion: result.schemaVersion,
        phase: result.phase,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RESULT HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper to format validation result for API response
 */
export function formatValidationResult(result: ValidationResult): {
  valid: boolean;
  errors: Array<{ field: string; message: string; code: string }>;
  warnings: Array<{ field: string; message: string; code: string }>;
} {
  return {
    valid: result.valid,
    errors: result.errors.map((e) => ({
      field: e.field,
      message: e.message,
      code: e.ruleId,
    })),
    warnings: result.warnings.map((w) => ({
      field: w.field,
      message: w.message,
      code: w.ruleId,
    })),
  };
}
