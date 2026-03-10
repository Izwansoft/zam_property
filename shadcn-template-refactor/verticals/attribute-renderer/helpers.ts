// verticals/attribute-renderer/helpers.ts — Attribute rendering utilities

import type {
  AttributeDefinition,
  AttributeSchema,
  AttributeOption,
} from "../types";

/**
 * Format an attribute value for display (read-only views).
 */
export function formatAttributeValue(
  attribute: AttributeDefinition,
  value: unknown
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  switch (attribute.type) {
    case "string":
      return String(value);

    case "number": {
      const num = Number(value);
      if (isNaN(num)) return String(value);

      const formatted = num.toLocaleString("en-MY");
      if (attribute.ui.unit) {
        return attribute.ui.unitPosition === "prefix"
          ? `${attribute.ui.unit} ${formatted}`
          : `${formatted} ${attribute.ui.unit}`;
      }
      return formatted;
    }

    case "boolean":
      return value ? "Yes" : "No";

    case "enum": {
      const option = attribute.constraints.options?.find(
        (o) => o.value === value
      );
      return option?.label ?? String(value);
    }

    case "array": {
      if (!Array.isArray(value)) return String(value);
      return value
        .map((v) => {
          const option = attribute.constraints.options?.find(
            (o) => o.value === v
          );
          return option?.label ?? v;
        })
        .join(", ");
    }

    case "date": {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString("en-MY");
    }

    case "range": {
      const range = value as { min?: number; max?: number };
      const unit = attribute.ui.unit || "";
      const prefix = attribute.ui.unitPosition === "prefix" ? unit + " " : "";
      const suffix = attribute.ui.unitPosition !== "prefix" ? " " + unit : "";

      if (range.min !== undefined && range.max !== undefined) {
        return `${prefix}${range.min.toLocaleString("en-MY")}${suffix} – ${prefix}${range.max.toLocaleString("en-MY")}${suffix}`;
      }
      if (range.min !== undefined)
        return `From ${prefix}${range.min.toLocaleString("en-MY")}${suffix}`;
      if (range.max !== undefined)
        return `Up to ${prefix}${range.max.toLocaleString("en-MY")}${suffix}`;
      return "—";
    }

    case "geo": {
      const geo = value as { lat?: number; lng?: number };
      if (geo.lat !== undefined && geo.lng !== undefined) {
        return `${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}`;
      }
      return "—";
    }

    default:
      return String(value);
  }
}

/**
 * Get a formatted display map of attributes and their values.
 * Useful for detail views and cards.
 */
export function formatAttributesForDisplay(
  schema: AttributeSchema,
  values: Record<string, unknown>
): Array<{ key: string; label: string; value: string; group: string }> {
  return schema.attributes
    .filter(
      (attr) => values[attr.key] !== undefined && values[attr.key] !== null
    )
    .map((attr) => ({
      key: attr.key,
      label: attr.label,
      value: formatAttributeValue(attr, values[attr.key]),
      group: attr.ui.group,
    }));
}

/**
 * Get options for a select/multiselect attribute.
 */
export function getAttributeOptions(
  attribute: AttributeDefinition
): AttributeOption[] {
  return (attribute.constraints.options ?? []).filter(
    (opt) => !opt.deprecated
  );
}
