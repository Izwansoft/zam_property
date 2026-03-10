// verticals/types/index.ts — Barrel exports for vertical type definitions

export type {
  VerticalType,
  VerticalDefinition,
  PartnerVertical,
  VerticalDisplayMetadata,
  ValidationRules,
  StatusValidation,
  ConditionalRequirement,
} from "./vertical";

export type {
  AttributeType,
  AttributeDefinition,
  AttributeConstraints,
  AttributeOption,
  AttributeUIHints,
  AttributeSchema,
  AttributeGroup,
} from "./attributes";

export type {
  VerticalSearchMapping,
  FilterableField,
  SortableField,
  RangeField,
  RangePreset,
  FacetField,
} from "./search";
