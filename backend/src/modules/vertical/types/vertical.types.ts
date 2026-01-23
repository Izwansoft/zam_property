/**
 * Vertical Registry Types
 * Part 8 - Vertical Module Contract
 */

// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL TYPE CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const VERTICAL_TYPES = {
  REAL_ESTATE: 'real_estate',
  AUTOMOTIVE: 'automotive',
  JOBS: 'jobs',
  SERVICES: 'services',
  MARKETPLACE: 'marketplace',
  RENTALS: 'rentals',
} as const;

export type VerticalTypeKey = keyof typeof VERTICAL_TYPES;
export type VerticalType = (typeof VERTICAL_TYPES)[VerticalTypeKey];

// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTE SCHEMA TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AttributeFieldType =
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

export interface AttributeFieldDefinition {
  name: string;
  type: AttributeFieldType;
  label: string;
  description?: string;
  required?: boolean;
  requiredOnPublish?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  hint?: string;

  // Validation
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
    icon?: string;
  }>;

  // Display
  unit?: string;
  prefix?: string;
  suffix?: string;
  displayOrder?: number;
  group?: string;
  hidden?: boolean;
  readonly?: boolean;

  // Search
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  facetable?: boolean;

  // Conditional display
  showIf?: {
    field: string;
    operator: 'eq' | 'neq' | 'in' | 'nin' | 'exists';
    value: unknown;
  };

  // Nested fields (for object type)
  fields?: AttributeFieldDefinition[];
}

export interface AttributeSchema {
  version: string;
  fields: AttributeFieldDefinition[];
  groups?: Array<{
    id: string;
    label: string;
    description?: string;
    displayOrder?: number;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RULE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationRuleType =
  | 'required'
  | 'requiredOnPublish'
  | 'min'
  | 'max'
  | 'range'
  | 'pattern'
  | 'enum'
  | 'custom'
  | 'crossField'
  | 'conditional';

export interface ValidationRule {
  id: string;
  type: ValidationRuleType;
  field?: string;
  fields?: string[];
  message: string;
  params?: Record<string, unknown>;
  severity?: 'error' | 'warning';
  applyOn?: 'draft' | 'publish' | 'both';
}

export interface ValidationRulesConfig {
  version: string;
  rules: ValidationRule[];
  crossFieldRules?: Array<{
    id: string;
    name: string;
    description?: string;
    fields: string[];
    validate: string; // Expression or function reference
    message: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH MAPPING TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SearchFieldType =
  | 'keyword'
  | 'text'
  | 'integer'
  | 'long'
  | 'float'
  | 'double'
  | 'boolean'
  | 'date'
  | 'geo_point'
  | 'nested'
  | 'object';

export interface SearchFieldMapping {
  name: string;
  type: SearchFieldType;
  analyzer?: string;
  searchAnalyzer?: string;
  fields?: Record<string, { type: string; analyzer?: string }>;
  properties?: Record<string, SearchFieldMapping>;

  // Aggregation config
  aggregatable?: boolean;
  aggregationType?: 'terms' | 'range' | 'histogram' | 'date_histogram';
  aggregationConfig?: {
    ranges?: Array<{ from?: number; to?: number; key?: string }>;
    interval?: number | string;
    size?: number;
  };
}

export interface SearchMappingConfig {
  version: string;
  properties: Record<string, SearchFieldMapping>;
  settings?: {
    analysis?: Record<string, unknown>;
  };

  // Facet definitions
  facets?: Array<{
    name: string;
    field: string;
    label: string;
    type: 'terms' | 'range' | 'boolean';
    config?: Record<string, unknown>;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY METADATA TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface DisplayMetadata {
  version: string;

  // List view
  listView?: {
    primaryField: string;
    secondaryFields?: string[];
    badgeField?: string;
    thumbnailField?: string;
  };

  // Detail view
  detailView?: {
    sections?: Array<{
      id: string;
      label: string;
      fields: string[];
      layout?: 'grid' | 'list' | 'inline';
    }>;
  };

  // Card view
  cardView?: {
    titleField: string;
    subtitleField?: string;
    descriptionField?: string;
    priceField?: string;
    locationField?: string;
    imageField?: string;
    badges?: string[];
  };

  // Form configuration
  form?: {
    steps?: Array<{
      id: string;
      label: string;
      fields: string[];
    }>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL DEFINITION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface VerticalDefinitionData {
  type: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  attributeSchema: AttributeSchema;
  validationRules: ValidationRulesConfig;
  searchMapping: SearchMappingConfig;
  supportedStatuses?: string[];
  displayMetadata?: DisplayMetadata;
  schemaVersion?: string;
  isActive?: boolean;
  isCore?: boolean;
}

export interface TenantVerticalConfig {
  configOverrides?: Record<string, unknown>;
  customFields?: AttributeFieldDefinition[];
  listingLimit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL REGISTRY INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

export interface IVerticalRegistry {
  register(definition: VerticalDefinitionData): void;
  get(type: string): VerticalDefinitionData | undefined;
  getAll(): VerticalDefinitionData[];
  isRegistered(type: string): boolean;
  getAttributeSchema(type: string): AttributeSchema | undefined;
  getValidationRules(type: string): ValidationRulesConfig | undefined;
  getSearchMapping(type: string): SearchMappingConfig | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface VerticalEvent {
  verticalType: string;
  tenantId?: string;
  timestamp: Date;
}

export interface VerticalEnabledEvent extends VerticalEvent {
  configOverrides?: Record<string, unknown>;
}

export interface VerticalDisabledEvent extends VerticalEvent {
  reason?: string;
}
