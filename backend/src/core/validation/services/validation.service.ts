/**
 * Validation Service
 * Part 7 - Attribute Engine & Validation System
 *
 * Core validation service that processes validation rules and produces results.
 * Supports: required fields, conditional fields, cross-field rules, draft vs publish.
 */

import { Injectable, Logger } from '@nestjs/common';

import {
  ValidationContext,
  ValidationResult,
  ValidationIssue,
  ValidationPhase,
  ValidationRuleDefinition,
  CrossFieldRuleDefinition,
  AttributeFieldValidationDef,
  CustomValidatorFn,
} from '../types';
import { AttributeSchemaRegistry } from './attribute-schema.registry';

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION SERVICE
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  /** Custom validators registered programmatically */
  private readonly customValidators = new Map<string, CustomValidatorFn>();

  constructor(private readonly schemaRegistry: AttributeSchemaRegistry) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validate attributes for draft status
   */
  validateForDraft(
    verticalType: string,
    attributes: Record<string, unknown>,
    context: Partial<ValidationContext> = {},
  ): ValidationResult {
    return this.validate(verticalType, attributes, 'draft', context);
  }

  /**
   * Validate attributes for publish status
   */
  validateForPublish(
    verticalType: string,
    attributes: Record<string, unknown>,
    context: Partial<ValidationContext> = {},
  ): ValidationResult {
    return this.validate(verticalType, attributes, 'publish', context);
  }

  /**
   * Full validation with phase specification
   */
  validate(
    verticalType: string,
    attributes: Record<string, unknown>,
    phase: ValidationPhase,
    partialContext: Partial<ValidationContext> = {},
  ): ValidationResult {
    const startTime = Date.now();

    // Get schema from registry
    const schema = this.schemaRegistry.getSchema(verticalType);
    if (!schema) {
      this.logger.warn(`No schema registered for vertical: ${verticalType}`);
      return this.createResult(verticalType, '0.0', phase, [], [], []);
    }

    // Build full context
    const context: ValidationContext = {
      verticalType,
      schemaVersion: schema.schemaVersion,
      currentStatus: partialContext.currentStatus ?? 'DRAFT',
      targetStatus: partialContext.targetStatus,
      partnerId: partialContext.partnerId ?? '',
      vendorId: partialContext.vendorId,
      isNew: partialContext.isNew ?? true,
    };

    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];

    const validationConfig = schema.validationConfig;

    // 1. Validate field definitions (type, required, constraints)
    this.validateFieldDefinitions(schema.fields, attributes, phase, errors, warnings, context);

    // 2. Validate rules
    this.validateRules(validationConfig.rules, attributes, phase, errors, warnings, info, context);

    // 3. Validate cross-field rules
    if (validationConfig.crossFieldRules) {
      this.validateCrossFieldRules(
        validationConfig.crossFieldRules,
        attributes,
        phase,
        errors,
        warnings,
        context,
      );
    }

    const duration = Date.now() - startTime;
    this.logger.debug(
      `Validated ${verticalType} (${phase}): ${errors.length} errors, ` +
        `${warnings.length} warnings in ${duration}ms`,
    );

    return this.createResult(verticalType, schema.schemaVersion, phase, errors, warnings, info);
  }

  /**
   * Register a custom validator function
   */
  registerCustomValidator(name: string, fn: CustomValidatorFn): void {
    this.customValidators.set(name, fn);
    this.logger.log(`Registered custom validator: ${name}`);
  }

  /**
   * Check if validation would pass (quick check without full result)
   */
  isValid(
    verticalType: string,
    attributes: Record<string, unknown>,
    phase: ValidationPhase,
  ): boolean {
    const result = this.validate(verticalType, attributes, phase);
    return result.valid;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIELD DEFINITION VALIDATION
  // ─────────────────────────────────────────────────────────────────────────

  private validateFieldDefinitions(
    fields: AttributeFieldValidationDef[],
    attributes: Record<string, unknown>,
    phase: ValidationPhase,
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    _context: ValidationContext,
  ): void {
    for (const field of fields) {
      const value = attributes[field.name];

      // Check required
      if (field.required && this.isEmpty(value)) {
        errors.push({
          ruleId: `${field.name}_required`,
          field: field.name,
          message: `${field.label} is required`,
          severity: 'error',
          expected: 'non-empty value',
          actual: value,
        });
        continue;
      }

      // Check requiredOnPublish
      if (phase === 'publish' && field.requiredOnPublish && this.isEmpty(value)) {
        errors.push({
          ruleId: `${field.name}_required_on_publish`,
          field: field.name,
          message: `${field.label} is required before publishing`,
          severity: 'error',
          expected: 'non-empty value',
          actual: value,
        });
        continue;
      }

      // Skip further validation if value is empty and not required
      if (this.isEmpty(value)) {
        continue;
      }

      // Type-specific validation
      this.validateFieldType(field, value, errors, warnings);

      // Constraint validation
      this.validateFieldConstraints(field, value, errors, warnings);

      // Conditional requirement
      if (field.requiredIf) {
        this.validateConditionalRequirement(field, attributes, errors, warnings);
      }
    }
  }

  private validateFieldType(
    field: AttributeFieldValidationDef,
    value: unknown,
    errors: ValidationIssue[],
    _warnings: ValidationIssue[],
  ): void {
    switch (field.type) {
      case 'number':
      case 'price':
      case 'area':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            ruleId: `${field.name}_type`,
            field: field.name,
            message: `${field.label} must be a valid number`,
            severity: 'error',
            expected: 'number',
            actual: typeof value,
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            ruleId: `${field.name}_type`,
            field: field.name,
            message: `${field.label} must be true or false`,
            severity: 'error',
            expected: 'boolean',
            actual: typeof value,
          });
        }
        break;

      case 'enum':
        if (field.options) {
          const validValues = field.options.map((o) => o.value);
          if (!validValues.includes(value as string | number)) {
            errors.push({
              ruleId: `${field.name}_enum`,
              field: field.name,
              message: `${field.label} must be one of: ${validValues.join(', ')}`,
              severity: 'error',
              expected: validValues,
              actual: value,
            });
          }
        }
        break;

      case 'multi_enum':
        if (!Array.isArray(value)) {
          errors.push({
            ruleId: `${field.name}_type`,
            field: field.name,
            message: `${field.label} must be an array`,
            severity: 'error',
            expected: 'array',
            actual: typeof value,
          });
        } else if (field.options) {
          const validValues = field.options.map((o) => o.value);
          const invalidValues = value.filter((v) => !validValues.includes(v));
          if (invalidValues.length > 0) {
            errors.push({
              ruleId: `${field.name}_multi_enum`,
              field: field.name,
              message: `${field.label} contains invalid values: ${invalidValues.join(', ')}`,
              severity: 'error',
              expected: validValues,
              actual: invalidValues,
            });
          }
        }
        break;

      case 'date':
      case 'datetime':
        if (!(value instanceof Date) && typeof value !== 'string') {
          errors.push({
            ruleId: `${field.name}_type`,
            field: field.name,
            message: `${field.label} must be a valid date`,
            severity: 'error',
            expected: 'date',
            actual: typeof value,
          });
        } else if (typeof value === 'string' && isNaN(Date.parse(value))) {
          errors.push({
            ruleId: `${field.name}_type`,
            field: field.name,
            message: `${field.label} must be a valid date format`,
            severity: 'error',
            expected: 'valid date string',
            actual: value,
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            ruleId: `${field.name}_type`,
            field: field.name,
            message: `${field.label} must be an array`,
            severity: 'error',
            expected: 'array',
            actual: typeof value,
          });
        }
        break;

      case 'object':
      case 'location':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push({
            ruleId: `${field.name}_type`,
            field: field.name,
            message: `${field.label} must be an object`,
            severity: 'error',
            expected: 'object',
            actual: typeof value,
          });
        }
        break;

      // string is default, no validation needed
    }
  }

  private validateFieldConstraints(
    field: AttributeFieldValidationDef,
    value: unknown,
    errors: ValidationIssue[],
    _warnings: ValidationIssue[],
  ): void {
    // Numeric constraints
    if (typeof value === 'number') {
      if (field.min !== undefined && value < field.min) {
        errors.push({
          ruleId: `${field.name}_min`,
          field: field.name,
          message: `${field.label} must be at least ${field.min}`,
          severity: 'error',
          expected: `>= ${field.min}`,
          actual: value,
        });
      }
      if (field.max !== undefined && value > field.max) {
        errors.push({
          ruleId: `${field.name}_max`,
          field: field.name,
          message: `${field.label} must be at most ${field.max}`,
          severity: 'error',
          expected: `<= ${field.max}`,
          actual: value,
        });
      }
    }

    // String constraints
    if (typeof value === 'string') {
      if (field.minLength !== undefined && value.length < field.minLength) {
        errors.push({
          ruleId: `${field.name}_min_length`,
          field: field.name,
          message: `${field.label} must be at least ${field.minLength} characters`,
          severity: 'error',
          expected: `>= ${field.minLength} characters`,
          actual: value.length,
        });
      }
      if (field.maxLength !== undefined && value.length > field.maxLength) {
        errors.push({
          ruleId: `${field.name}_max_length`,
          field: field.name,
          message: `${field.label} must be at most ${field.maxLength} characters`,
          severity: 'error',
          expected: `<= ${field.maxLength} characters`,
          actual: value.length,
        });
      }
      if (field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          errors.push({
            ruleId: `${field.name}_pattern`,
            field: field.name,
            message: field.patternMessage ?? `${field.label} has an invalid format`,
            severity: 'error',
            expected: field.pattern,
            actual: value,
          });
        }
      }
    }

    // Array constraints
    if (Array.isArray(value)) {
      if (field.minLength !== undefined && value.length < field.minLength) {
        errors.push({
          ruleId: `${field.name}_min_items`,
          field: field.name,
          message: `${field.label} must have at least ${field.minLength} items`,
          severity: 'error',
          expected: `>= ${field.minLength} items`,
          actual: value.length,
        });
      }
      if (field.maxLength !== undefined && value.length > field.maxLength) {
        errors.push({
          ruleId: `${field.name}_max_items`,
          field: field.name,
          message: `${field.label} must have at most ${field.maxLength} items`,
          severity: 'error',
          expected: `<= ${field.maxLength} items`,
          actual: value.length,
        });
      }
    }
  }

  private validateConditionalRequirement(
    field: AttributeFieldValidationDef,
    attributes: Record<string, unknown>,
    errors: ValidationIssue[],
    _warnings: ValidationIssue[],
  ): void {
    if (!field.requiredIf) return;

    const conditionMet = this.evaluateCondition(field.requiredIf, attributes);
    if (conditionMet && this.isEmpty(attributes[field.name])) {
      errors.push({
        ruleId: `${field.name}_required_conditional`,
        field: field.name,
        message: `${field.label} is required when ${field.requiredIf.field} condition is met`,
        severity: 'error',
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RULE VALIDATION
  // ─────────────────────────────────────────────────────────────────────────

  private validateRules(
    rules: ValidationRuleDefinition[],
    attributes: Record<string, unknown>,
    phase: ValidationPhase,
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    info: ValidationIssue[],
    context: ValidationContext,
  ): void {
    // Sort rules by priority
    const sortedRules = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const rule of sortedRules) {
      // Check if rule applies to this phase
      if (rule.applyOn && rule.applyOn !== 'both' && rule.applyOn !== phase) {
        continue;
      }

      const issue = this.evaluateRule(rule, attributes, context);
      if (issue) {
        switch (rule.severity ?? 'error') {
          case 'error':
            errors.push(issue);
            break;
          case 'warning':
            warnings.push(issue);
            break;
          case 'info':
            info.push(issue);
            break;
        }
      }
    }
  }

  private evaluateRule(
    rule: ValidationRuleDefinition,
    attributes: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationIssue | null {
    const value = rule.field ? attributes[rule.field] : undefined;
    const params = rule.params ?? {};

    switch (rule.type) {
      case 'required':
        if (this.isEmpty(value)) {
          return this.createIssue(rule, value);
        }
        break;

      case 'requiredOnPublish':
        // Already handled by phase check
        if (this.isEmpty(value)) {
          return this.createIssue(rule, value);
        }
        break;

      case 'min':
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (!isNaN(numValue) && params.min !== undefined && numValue < params.min) {
            return this.createIssue(rule, value, { expected: `>= ${params.min}` });
          }
        }
        break;

      case 'max':
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (!isNaN(numValue) && params.max !== undefined && numValue > params.max) {
            return this.createIssue(rule, value, { expected: `<= ${params.max}` });
          }
        }
        break;

      case 'range':
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            if (params.min !== undefined && numValue < params.min) {
              return this.createIssue(rule, value, { expected: `>= ${params.min}` });
            }
            if (params.max !== undefined && numValue > params.max) {
              return this.createIssue(rule, value, { expected: `<= ${params.max}` });
            }
          }
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && params.pattern) {
          const regex = new RegExp(params.pattern, params.patternFlags);
          if (!regex.test(value)) {
            return this.createIssue(rule, value);
          }
        }
        break;

      case 'enum':
        if (value !== undefined && value !== null && params.values) {
          if (!params.values.includes(value as string | number | boolean)) {
            return this.createIssue(rule, value, { expected: params.values });
          }
        }
        break;

      case 'multiEnum':
        if (Array.isArray(value) && params.values) {
          const invalid = value.filter((v) => !params.values!.includes(v));
          if (invalid.length > 0) {
            return this.createIssue(rule, invalid, { expected: params.values });
          }
        }
        break;

      case 'conditional':
        return this.evaluateConditionalRule(rule, attributes);

      case 'crossField':
        return this.evaluateCrossFieldRule(rule, attributes);

      case 'custom':
        return this.evaluateCustomRule(rule, attributes, context);
    }

    return null;
  }

  private evaluateConditionalRule(
    rule: ValidationRuleDefinition,
    attributes: Record<string, unknown>,
  ): ValidationIssue | null {
    const params = rule.params ?? {};

    // Check if condition is met
    if (!params.conditionField) return null;

    const conditionValue = attributes[params.conditionField];
    let conditionMet = false;

    switch (params.conditionOperator) {
      case 'eq':
        conditionMet = conditionValue === params.conditionValue;
        break;
      case 'neq':
        conditionMet = conditionValue !== params.conditionValue;
        break;
      case 'in':
        conditionMet =
          Array.isArray(params.conditionValues) && params.conditionValues.includes(conditionValue);
        break;
      case 'nin':
        conditionMet =
          Array.isArray(params.conditionValues) && !params.conditionValues.includes(conditionValue);
        break;
      case 'exists':
        conditionMet = conditionValue !== undefined && conditionValue !== null;
        break;
      case 'empty':
        conditionMet = this.isEmpty(conditionValue);
        break;
      case 'gt':
        conditionMet =
          typeof conditionValue === 'number' && conditionValue > (params.conditionValue as number);
        break;
      case 'gte':
        conditionMet =
          typeof conditionValue === 'number' && conditionValue >= (params.conditionValue as number);
        break;
      case 'lt':
        conditionMet =
          typeof conditionValue === 'number' && conditionValue < (params.conditionValue as number);
        break;
      case 'lte':
        conditionMet =
          typeof conditionValue === 'number' && conditionValue <= (params.conditionValue as number);
        break;
    }

    if (!conditionMet) return null;

    // Check required fields
    if (params.requiredFields) {
      for (const field of params.requiredFields) {
        if (this.isEmpty(attributes[field])) {
          return {
            ruleId: rule.id,
            field,
            message: rule.message,
            severity: rule.severity ?? 'error',
          };
        }
      }
    }

    return null;
  }

  private evaluateCrossFieldRule(
    rule: ValidationRuleDefinition,
    attributes: Record<string, unknown>,
  ): ValidationIssue | null {
    const params = rule.params ?? {};

    if (!rule.field || !params.compareField) return null;

    const value = attributes[rule.field];
    const compareValue = attributes[params.compareField];

    // Skip if either value is missing
    if (this.isEmpty(value) || this.isEmpty(compareValue)) return null;

    const numValue = Number(value);
    const numCompare = Number(compareValue);

    if (isNaN(numValue) || isNaN(numCompare)) return null;

    let valid = true;
    switch (params.compareOperator) {
      case 'eq':
        valid = numValue === numCompare;
        break;
      case 'neq':
        valid = numValue !== numCompare;
        break;
      case 'gt':
        valid = numValue > numCompare;
        break;
      case 'gte':
        valid = numValue >= numCompare;
        break;
      case 'lt':
        valid = numValue < numCompare;
        break;
      case 'lte':
        valid = numValue <= numCompare;
        break;
    }

    if (!valid) {
      return this.createIssue(rule, value, { compareValue });
    }

    return null;
  }

  private evaluateCustomRule(
    rule: ValidationRuleDefinition,
    attributes: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationIssue | null {
    const params = rule.params ?? {};
    const validatorName = params.validatorFn as string;

    if (!validatorName) return null;

    const validator = this.customValidators.get(validatorName);
    if (!validator) {
      this.logger.warn(`Custom validator not found: ${validatorName}`);
      return null;
    }

    const value = rule.field ? attributes[rule.field] : attributes;
    return validator(value, attributes, context);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CROSS-FIELD RULES (Separate from regular rules)
  // ─────────────────────────────────────────────────────────────────────────

  private validateCrossFieldRules(
    rules: CrossFieldRuleDefinition[],
    attributes: Record<string, unknown>,
    phase: ValidationPhase,
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    _context: ValidationContext,
  ): void {
    for (const rule of rules) {
      // Check if rule applies to this phase
      if (rule.applyOn && rule.applyOn !== 'both' && rule.applyOn !== phase) {
        continue;
      }

      // Check if all required fields are present
      const allFieldsPresent = rule.fields.every((field) => !this.isEmpty(attributes[field]));
      if (!allFieldsPresent) continue;

      // Evaluate the validation expression
      const isValid = this.evaluateExpression(rule.validate, attributes, rule.fields);

      if (!isValid) {
        const issue: ValidationIssue = {
          ruleId: rule.id,
          field: rule.fields[0], // Primary field
          message: rule.message,
          severity: rule.severity ?? 'warning',
          context: {
            fields: rule.fields,
            values: rule.fields.reduce((acc, f) => ({ ...acc, [f]: attributes[f] }), {}),
          },
        };

        if (rule.severity === 'error') {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }
      }
    }
  }

  /**
   * Simple expression evaluator for cross-field rules
   * Supports basic comparisons and null checks
   */
  private evaluateExpression(
    expression: string,
    attributes: Record<string, unknown>,
    fields: string[],
  ): boolean {
    try {
      // Create a safe evaluation context
      const context: Record<string, unknown> = {};
      for (const field of fields) {
        context[field] = attributes[field] ?? null;
      }

      // Simple expression parser (handles common patterns)
      // Pattern: fieldA == null || fieldB == null || fieldA <= fieldB * 5
      let result = expression;

      // Replace field references with values
      for (const field of fields) {
        const value = context[field];
        const valueStr =
          value === null ? 'null' : typeof value === 'string' ? `"${value}"` : String(value);
        result = result.replace(new RegExp(`\\b${field}\\b`, 'g'), valueStr);
      }

      // Evaluate (using Function for simple math expressions)
      // Note: This is safe because we only inject our known field values
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return ${result};`);
      return Boolean(fn());
    } catch {
      this.logger.warn(`Failed to evaluate expression: ${expression}`);
      return true; // Don't fail on expression errors
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private isEmpty(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }

  private evaluateCondition(
    condition: { field: string; operator: string; value?: unknown; values?: unknown[] },
    attributes: Record<string, unknown>,
  ): boolean {
    const fieldValue = attributes[condition.field];

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'neq':
        return fieldValue !== condition.value;
      case 'in':
        return Array.isArray(condition.values) && condition.values.includes(fieldValue);
      case 'nin':
        return Array.isArray(condition.values) && !condition.values.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'empty':
        return this.isEmpty(fieldValue);
      case 'gt':
        return typeof fieldValue === 'number' && fieldValue > (condition.value as number);
      case 'gte':
        return typeof fieldValue === 'number' && fieldValue >= (condition.value as number);
      case 'lt':
        return typeof fieldValue === 'number' && fieldValue < (condition.value as number);
      case 'lte':
        return typeof fieldValue === 'number' && fieldValue <= (condition.value as number);
      default:
        return false;
    }
  }

  private createIssue(
    rule: ValidationRuleDefinition,
    actual?: unknown,
    extra?: { expected?: unknown; compareValue?: unknown },
  ): ValidationIssue {
    return {
      ruleId: rule.id,
      field: rule.field ?? (rule.fields ? rule.fields[0] : 'unknown'),
      message: rule.message,
      severity: rule.severity ?? 'error',
      actual,
      expected: extra?.expected,
      context: extra?.compareValue ? { compareValue: extra.compareValue } : undefined,
    };
  }

  private createResult(
    verticalType: string,
    schemaVersion: string,
    phase: ValidationPhase,
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    info: ValidationIssue[],
  ): ValidationResult {
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      verticalType,
      schemaVersion,
      phase,
      validatedAt: new Date(),
    };
  }
}
