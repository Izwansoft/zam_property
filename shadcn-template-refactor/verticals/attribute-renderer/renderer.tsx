// verticals/attribute-renderer/renderer.tsx — AttributeRenderer (type-based field selection)

"use client";

import type { AttributeDefinition } from "../types";
import {
  StringField,
  NumberField,
  SelectField,
  MultiSelectField,
  BooleanField,
  DateField,
  RangeField,
} from "./fields";

interface AttributeRendererProps {
  /** The attribute definition to render */
  attribute: AttributeDefinition;
  /** Base path in the form values (e.g. "attributes") */
  basePath?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
}

/**
 * AttributeRenderer — Renders the appropriate field component
 * based on the attribute type from the vertical schema.
 *
 * This is the core component that maps attribute types to field components.
 * It is deterministic: same schema → same UI.
 */
export function AttributeRenderer({
  attribute,
  basePath = "attributes",
  disabled,
}: AttributeRendererProps) {
  const props = { attribute, basePath, disabled };

  switch (attribute.type) {
    case "string":
      return <StringField {...props} />;

    case "number":
      return <NumberField {...props} />;

    case "enum":
      return <SelectField {...props} />;

    case "array":
      return <MultiSelectField {...props} />;

    case "boolean":
      return <BooleanField {...props} />;

    case "date":
      return <DateField {...props} />;

    case "range":
      return <RangeField {...props} />;

    case "geo":
      // Geo field is optional and can be added later
      return (
        <div className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
          Geo field for &ldquo;{attribute.label}&rdquo; — coming soon
        </div>
      );

    default:
      return (
        <div className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
          Unknown attribute type: {attribute.type}
        </div>
      );
  }
}
