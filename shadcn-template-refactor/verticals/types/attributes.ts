// verticals/types/attributes.ts — Attribute schema type definitions

/**
 * Supported attribute data types for vertical fields.
 */
export type AttributeType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "array"
  | "date"
  | "range"
  | "geo";

/**
 * A single attribute definition within a vertical schema.
 * Describes one field that can appear in listing attributes.
 */
export interface AttributeDefinition {
  /** Unique key for this attribute (e.g. "bedrooms", "propertyType") */
  key: string;
  /** Human-readable label */
  label: string;
  /** Data type */
  type: AttributeType;
  /** Whether this field is required globally (regardless of status) */
  required: boolean;
  /** Whether required for publish action */
  requiredForPublish: boolean;
  /** Constraints on the value */
  constraints: AttributeConstraints;
  /** UI rendering hints */
  ui: AttributeUIHints;
  /** Default value (if any) */
  defaultValue?: unknown;
}

/**
 * Value constraints for an attribute.
 */
export interface AttributeConstraints {
  /** Minimum value (number) or min length (string) */
  min?: number;
  /** Maximum value (number) or max length (string) */
  max?: number;
  /** Step increment for number fields */
  step?: number;
  /** Regex pattern for string validation */
  pattern?: string;
  /** Pattern error message */
  patternMessage?: string;
  /** Allowed enum values for enum/array types */
  options?: AttributeOption[];
  /** For range type: min/max bounds */
  rangeBounds?: { min: number; max: number };
}

/**
 * An option in an enum/select/multiselect field.
 */
export interface AttributeOption {
  /** Machine-readable value */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon name */
  icon?: string;
  /** Optional description */
  description?: string;
  /** Whether this option is deprecated */
  deprecated?: boolean;
}

/**
 * UI rendering hints for an attribute.
 * Controls how the AttributeRenderer displays the field.
 */
export interface AttributeUIHints {
  /** Group this attribute belongs to (e.g. "Basic Info", "Features") */
  group: string;
  /** Display order within group (lower = first) */
  order: number;
  /** Placeholder text */
  placeholder?: string;
  /** Unit label (e.g. "sq ft", "RM") */
  unit?: string;
  /** Unit position */
  unitPosition?: "prefix" | "suffix";
  /** Help text / description */
  helpText?: string;
  /** Number of columns this field spans in a grid (1-4) */
  colSpan?: 1 | 2 | 3 | 4;
  /** Whether the field should be collapsible (for advanced fields) */
  collapsible?: boolean;
  /** Custom component hint (override default type-based selection) */
  component?: string;
  /** Whether to show this field in card/list views */
  showInCard?: boolean;
  /** Whether to show this field in detail views */
  showInDetail?: boolean;
}

/**
 * The full attribute schema for a vertical.
 * This is the `attributeSchema` field of VerticalDefinition.
 */
export interface AttributeSchema {
  /** Schema version */
  version: string;
  /** Ordered list of attribute definitions */
  attributes: AttributeDefinition[];
  /** Attribute groups with display metadata */
  groups: AttributeGroup[];
}

/**
 * A named group of attributes for UI sectioning.
 */
export interface AttributeGroup {
  /** Group key (referenced by AttributeUIHints.group) */
  key: string;
  /** Display label */
  label: string;
  /** Display order */
  order: number;
  /** Optional description */
  description?: string;
  /** Whether this group is collapsible */
  collapsible?: boolean;
  /** Whether this group starts collapsed */
  defaultCollapsed?: boolean;
  /** Optional icon */
  icon?: string;
}
