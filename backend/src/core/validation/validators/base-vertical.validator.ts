/**
 * Vertical Validator Interface
 * Part 7 - Attribute Engine & Validation System
 *
 * Base class for vertical-specific validators.
 */

import { Logger } from '@nestjs/common';

import {
  IVerticalValidator,
  ValidationContext,
  ValidationResult,
  VerticalValidationConfig,
  ValidationIssue,
  ValidationPhase,
} from '../types';

/**
 * Abstract base class for vertical validators
 * Provides common utilities and enforces the validation contract
 */
export abstract class BaseVerticalValidator implements IVerticalValidator {
  protected readonly logger: Logger;

  constructor(public readonly verticalType: string) {
    this.logger = new Logger(`${verticalType}Validator`);
  }

  /**
   * Get the validation configuration for this vertical
   * Must be implemented by each vertical
   */
  abstract getValidationConfig(): VerticalValidationConfig;

  /**
   * Validate attributes for draft status
   * Can be overridden for custom validation logic
   */
  validateForDraft(
    attributes: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationResult {
    return this.validate(attributes, 'draft', context);
  }

  /**
   * Validate attributes for publish status
   * Can be overridden for custom validation logic
   */
  validateForPublish(
    attributes: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationResult {
    return this.validate(attributes, 'publish', context);
  }

  /**
   * Internal validation logic
   * Can be overridden for custom validation flow
   */
  protected validate(
    attributes: Record<string, unknown>,
    phase: ValidationPhase,
    context: ValidationContext,
  ): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];

    const config = this.getValidationConfig();

    // Run rules
    for (const rule of config.rules) {
      // Skip rules that don't apply to this phase
      if (rule.applyOn && rule.applyOn !== 'both' && rule.applyOn !== phase) {
        continue;
      }

      const issue = this.evaluateRule(rule, attributes, context);
      if (issue) {
        switch (issue.severity) {
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

    // Run cross-field rules
    if (config.crossFieldRules) {
      for (const rule of config.crossFieldRules) {
        if (rule.applyOn && rule.applyOn !== 'both' && rule.applyOn !== phase) {
          continue;
        }

        const issue = this.evaluateCrossFieldRule(rule, attributes);
        if (issue) {
          if (rule.severity === 'error') {
            errors.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      verticalType: this.verticalType,
      schemaVersion: context.schemaVersion,
      phase,
      validatedAt: new Date(),
    };
  }

  /**
   * Evaluate a single validation rule
   * Can be overridden for custom rule types
   */
  protected evaluateRule(
    rule: VerticalValidationConfig['rules'][0],
    attributes: Record<string, unknown>,
    _context: ValidationContext,
  ): ValidationIssue | null {
    const value = rule.field ? attributes[rule.field] : undefined;

    switch (rule.type) {
      case 'required':
        if (this.isEmpty(value)) {
          return this.createIssue(rule, value);
        }
        break;

      case 'requiredOnPublish':
        if (this.isEmpty(value)) {
          return this.createIssue(rule, value);
        }
        break;

      case 'min':
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (!isNaN(numValue) && rule.params?.min !== undefined && numValue < rule.params.min) {
            return this.createIssue(rule, value);
          }
        }
        break;

      case 'max':
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (!isNaN(numValue) && rule.params?.max !== undefined && numValue > rule.params.max) {
            return this.createIssue(rule, value);
          }
        }
        break;

      case 'range':
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            if (rule.params?.min !== undefined && numValue < rule.params.min) {
              return this.createIssue(rule, value);
            }
            if (rule.params?.max !== undefined && numValue > rule.params.max) {
              return this.createIssue(rule, value);
            }
          }
        }
        break;

      case 'enum':
        if (value !== undefined && value !== null && rule.params?.values) {
          if (!rule.params.values.includes(value as string | number | boolean)) {
            return this.createIssue(rule, value);
          }
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && rule.params?.pattern) {
          const regex = new RegExp(rule.params.pattern as string);
          if (!regex.test(value)) {
            return this.createIssue(rule, value);
          }
        }
        break;
    }

    return null;
  }

  /**
   * Evaluate a cross-field validation rule
   */
  protected evaluateCrossFieldRule(
    rule: NonNullable<VerticalValidationConfig['crossFieldRules']>[0],
    attributes: Record<string, unknown>,
  ): ValidationIssue | null {
    // Check if all required fields are present
    const allFieldsPresent = rule.fields.every((field) => !this.isEmpty(attributes[field]));
    if (!allFieldsPresent) return null;

    // Evaluate the expression
    const isValid = this.evaluateExpression(rule.validate, attributes, rule.fields);

    if (!isValid) {
      return {
        ruleId: rule.id,
        field: rule.fields[0],
        message: rule.message,
        severity: rule.severity ?? 'warning',
        context: {
          fields: rule.fields,
        },
      };
    }

    return null;
  }

  /**
   * Simple expression evaluator
   */
  protected evaluateExpression(
    expression: string,
    attributes: Record<string, unknown>,
    fields: string[],
  ): boolean {
    try {
      let result = expression;

      for (const field of fields) {
        const value = attributes[field] ?? null;
        const valueStr =
          value === null ? 'null' : typeof value === 'string' ? `"${value}"` : String(value);
        result = result.replace(new RegExp(`\\b${field}\\b`, 'g'), valueStr);
      }

      // eslint-disable-next-line no-new-func
      const fn = new Function(`return ${result};`);
      return Boolean(fn());
    } catch {
      this.logger.warn(`Failed to evaluate expression: ${expression}`);
      return true;
    }
  }

  /**
   * Check if a value is empty
   */
  protected isEmpty(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }

  /**
   * Create a validation issue from a rule
   */
  protected createIssue(
    rule: VerticalValidationConfig['rules'][0],
    actual?: unknown,
  ): ValidationIssue {
    return {
      ruleId: rule.id,
      field: rule.field ?? 'unknown',
      message: rule.message,
      severity: rule.severity ?? 'error',
      actual,
    };
  }
}
