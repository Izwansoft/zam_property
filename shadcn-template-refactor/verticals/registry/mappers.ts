// verticals/registry/mappers.ts — Utility mappers for vertical data

import type {
  AttributeDefinition,
  AttributeSchema,
  AttributeGroup,
  FilterableField,
  VerticalSearchMapping,
} from "../types";

/**
 * Group attributes by their UI group key, ordered by group.order then attr.ui.order.
 */
export function groupAttributes(
  schema: AttributeSchema
): Map<AttributeGroup, AttributeDefinition[]> {
  const groupMap = new Map<string, AttributeGroup>();
  for (const group of schema.groups) {
    groupMap.set(group.key, group);
  }

  const result = new Map<AttributeGroup, AttributeDefinition[]>();

  // Sort groups by order
  const sortedGroups = [...schema.groups].sort((a, b) => a.order - b.order);

  for (const group of sortedGroups) {
    const attrs = schema.attributes
      .filter((attr) => attr.ui.group === group.key)
      .sort((a, b) => a.ui.order - b.ui.order);

    if (attrs.length > 0) {
      result.set(group, attrs);
    }
  }

  // Catch ungrouped attributes
  const ungroupedAttrs = schema.attributes.filter(
    (attr) => !groupMap.has(attr.ui.group)
  );
  if (ungroupedAttrs.length > 0) {
    const fallbackGroup: AttributeGroup = {
      key: "__ungrouped",
      label: "Other",
      order: 999,
    };
    result.set(
      fallbackGroup,
      ungroupedAttrs.sort((a, b) => a.ui.order - b.ui.order)
    );
  }

  return result;
}

/**
 * Get attributes required for a given mode.
 */
export function getRequiredAttributes(
  schema: AttributeSchema,
  mode: "draft" | "publish"
): AttributeDefinition[] {
  return schema.attributes.filter((attr) =>
    mode === "publish" ? attr.requiredForPublish : attr.required
  );
}

/**
 * Get attributes that should show in card view.
 */
export function getCardDisplayAttributes(
  schema: AttributeSchema
): AttributeDefinition[] {
  return schema.attributes
    .filter((attr) => attr.ui.showInCard)
    .sort((a, b) => a.ui.order - b.ui.order);
}

/**
 * Get attributes that should show in detail view.
 */
export function getDetailDisplayAttributes(
  schema: AttributeSchema
): AttributeDefinition[] {
  return schema.attributes
    .filter((attr) => attr.ui.showInDetail !== false)
    .sort((a, b) => a.ui.order - b.ui.order);
}

/**
 * Build a default values object from attribute definitions.
 * Used to initialize React Hook Form.
 */
export function buildDefaultValues(
  schema: AttributeSchema
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  for (const attr of schema.attributes) {
    if (attr.defaultValue !== undefined) {
      defaults[attr.key] = attr.defaultValue;
    } else {
      // Set type-appropriate empty defaults
      switch (attr.type) {
        case "string":
        case "enum":
        case "date":
          defaults[attr.key] = "";
          break;
        case "number":
          defaults[attr.key] = undefined;
          break;
        case "boolean":
          defaults[attr.key] = false;
          break;
        case "array":
          defaults[attr.key] = [];
          break;
        case "range":
          defaults[attr.key] = { min: undefined, max: undefined };
          break;
        case "geo":
          defaults[attr.key] = { lat: undefined, lng: undefined };
          break;
      }
    }
  }

  return defaults;
}

/**
 * Extract filter groups from search mapping.
 */
export function getFilterGroups(
  mapping: VerticalSearchMapping
): Map<string, FilterableField[]> {
  const groups = new Map<string, FilterableField[]>();

  const sortedFields = [...mapping.filterableFields].sort(
    (a, b) => a.order - b.order
  );

  for (const field of sortedFields) {
    const group = field.group || "Filters";
    const existing = groups.get(group) || [];
    existing.push(field);
    groups.set(group, existing);
  }

  return groups;
}
