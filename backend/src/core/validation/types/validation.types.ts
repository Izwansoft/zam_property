/**
 * Validation Engine Types
 * Part 7 - Attribute Engine & Validation System
 */

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * When validation is triggered
 */
export type ValidationPhase = 'draft' | 'publish' | 'both';

/**
 * Context for validation operations
 */
export interface ValidationContext {
  /** The vertical type being validated */
  verticalType: string;

  /** Schema version for the attributes */
  schemaVersion: string;

  /** Current listing status */
  currentStatus: string;

  /** Target status (for publish validation) */
  targetStatus?: string;

  /** Tenant ID for tenant-specific rules */
  tenantId: string;

  /** Vendor ID for vendor-specific limits */
  vendorId?: string;

  /** Whether this is a new listing or update */
  isNew: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Severity level for validation issues
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * A single validation issue
 */
export interface ValidationIssue {
  /** Unique rule identifier */
  ruleId: string;

  /** Field path (e.g., 'attributes.bedrooms') */
  field: string;

  /** Human-readable message */
  message: string;

  /** Severity level */
  severity: ValidationSeverity;

  /** Expected value (for display purposes) */
  expected?: unknown;

  /** Actual value that failed validation */
  actual?: unknown;

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Aggregated validation result
 */
export interface ValidationResult {
  /** Whether validation passed (no errors) */
  valid: boolean;

  /** Validation errors (blocking) */
  errors: ValidationIssue[];

  /** Validation warnings (non-blocking) */
  warnings: ValidationIssue[];

  /** Informational messages */
  info: ValidationIssue[];

  /** Vertical type validated */
  verticalType: string;

  /** Schema version used */
  schemaVersion: string;

  /** Validation phase */
  phase: ValidationPhase;

  /** Timestamp of validation */
  validatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RULE TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Types of validation rules
 */
export type ValidationRuleType =
  | 'required' // Field must be present and non-empty
  | 'requiredOnPublish' // Required only when publishing
  | 'min' // Minimum value (number) or length (string/array)
  | 'max' // Maximum value (number) or length (string/array)
  | 'range' // Value must be within range
  | 'pattern' // Regex pattern match
  | 'enum' // Value must be in allowed list
  | 'multiEnum' // Array values must all be in allowed list
  | 'custom' // Custom validation function
  | 'crossField' // Cross-field validation
  | 'conditional'; // Conditional validation

/**
 * Base validation rule definition
 */
export interface ValidationRuleDefinition {
  /** Unique rule identifier */
  id: string;

  /** Rule type */
  type: ValidationRuleType;

  /** Target field path (for single-field rules) */
  field?: string;

  /** Target fields (for cross-field rules) */
  fields?: string[];

  /** Error/warning message */
  message: string;

  /** Rule parameters */
  params?: ValidationRuleParams;

  /** Severity (default: error) */
  severity?: ValidationSeverity;

  /** When to apply (default: both) */
  applyOn?: ValidationPhase;

  /** Priority for ordering (higher = earlier) */
  priority?: number;
}

/**
 * Parameters for validation rules
 */
export interface ValidationRuleParams {
  // Numeric constraints
  min?: number;
  max?: number;

  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternFlags?: string;

  // Enum constraints
  values?: (string | number | boolean)[];

  // Conditional constraints
  condition?: string;
  conditionField?: string;
  conditionOperator?:
    | 'eq'
    | 'neq'
    | 'in'
    | 'nin'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'exists'
    | 'empty';
  conditionValue?: unknown;
  conditionValues?: unknown[];
  requiredFields?: string[];
  recommendedFields?: string[];

  // Cross-field constraints
  validateExpression?: string;
  compareField?: string;
  compareOperator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

  // Custom validator reference
  validatorFn?: string;

  // Additional params
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTE SCHEMA TYPES (FOR VALIDATION)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Field data types
 */
export type AttributeFieldDataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'multi_enum'
  | 'location'
  | 'price'
  | 'area'
  | 'object'
  | 'array';

/**
 * Attribute field definition (for validation purposes)
 */
export interface AttributeFieldValidationDef {
  name: string;
  type: AttributeFieldDataType;
  label: string;
  required?: boolean;
  requiredOnPublish?: boolean;

  // Constraints
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;

  // Enum options
  options?: Array<{
    value: string | number;
    label: string;
  }>;

  // Default value
  defaultValue?: unknown;

  // Conditional visibility/requirement
  showIf?: ConditionalRule;
  requiredIf?: ConditionalRule;

  // Nested fields (for object type)
  fields?: AttributeFieldValidationDef[];
}

/**
 * Conditional rule definition
 */
export interface ConditionalRule {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'exists' | 'empty' | 'gt' | 'gte' | 'lt' | 'lte';
  value?: unknown;
  values?: unknown[];
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete validation configuration for a vertical
 */
export interface VerticalValidationConfig {
  /** Schema version */
  version: string;

  /** Validation rules */
  rules: ValidationRuleDefinition[];

  /** Cross-field validation rules */
  crossFieldRules?: CrossFieldRuleDefinition[];

  /** Custom validators (keyed by function name) */
  customValidators?: Record<string, CustomValidatorFn>;
}

/**
 * Cross-field validation rule
 */
export interface CrossFieldRuleDefinition {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description */
  description?: string;

  /** Fields involved */
  fields: string[];

  /** Validation expression (evaluated) */
  validate: string;

  /** Error message */
  message: string;

  /** Severity */
  severity?: ValidationSeverity;

  /** When to apply */
  applyOn?: ValidationPhase;
}

/**
 * Custom validator function signature
 */
export type CustomValidatorFn = (
  value: unknown,
  attributes: Record<string, unknown>,
  context: ValidationContext,
) => ValidationIssue | null;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATOR INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interface for vertical-specific validators
 */
export interface IVerticalValidator {
  /** Vertical type this validator handles */
  readonly verticalType: string;

  /** Validate attributes for draft status */
  validateForDraft(
    attributes: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationResult;

  /** Validate attributes for publish status */
  validateForPublish(
    attributes: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationResult;

  /** Get validation configuration */
  getValidationConfig(): VerticalValidationConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA REGISTRY INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registered schema data
 */
export interface RegisteredSchema {
  verticalType: string;
  schemaVersion: string;
  fields: AttributeFieldValidationDef[];
  validationConfig: VerticalValidationConfig;
  registeredAt: Date;
}

/**
 * Interface for the attribute schema registry
 */
export interface IAttributeSchemaRegistry {
  /** Register a vertical's schema */
  register(
    verticalType: string,
    schemaVersion: string,
    fields: AttributeFieldValidationDef[],
    validationConfig: VerticalValidationConfig,
  ): void;

  /** Get schema for a vertical */
  getSchema(verticalType: string, schemaVersion?: string): RegisteredSchema | undefined;

  /** Check if vertical is registered */
  isRegistered(verticalType: string): boolean;

  /** Get all registered verticals */
  getRegisteredVerticals(): string[];

  /** Get validation config for a vertical */
  getValidationConfig(verticalType: string): VerticalValidationConfig | undefined;
}
