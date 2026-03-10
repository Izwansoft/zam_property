// verticals/registry/zod.ts — Zod schema generator from attribute definitions

import { z, type ZodTypeAny } from "zod";
import type { AttributeDefinition, AttributeSchema } from "../types";

/**
 * Generate a Zod schema from an attribute schema.
 *
 * @param schema - The attribute schema from the registry
 * @param mode - "draft" uses minimal required, "publish" enforces publish requirements
 * @returns A Zod object schema that validates the attributes object
 */
export function generateZodSchema(
  schema: AttributeSchema,
  mode: "draft" | "publish" = "draft"
): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const attr of schema.attributes) {
    const isRequired =
      mode === "publish" ? attr.requiredForPublish : attr.required;
    let fieldSchema = buildFieldSchema(attr);

    if (!isRequired) {
      fieldSchema = fieldSchema.optional();
    }

    shape[attr.key] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Build a Zod schema for a single attribute based on its type and constraints.
 */
function buildFieldSchema(attr: AttributeDefinition): ZodTypeAny {
  const { type, constraints, label } = attr;

  switch (type) {
    case "string":
      return buildStringSchema(attr);

    case "number":
      return buildNumberSchema(attr);

    case "boolean":
      return z.boolean({ required_error: `${label} is required` });

    case "enum":
      return buildEnumSchema(attr);

    case "array":
      return buildArraySchema(attr);

    case "date":
      return z.string({ required_error: `${label} is required` }).refine(
        (val) => !val || !isNaN(Date.parse(val)),
        { message: `${label} must be a valid date` }
      );

    case "range":
      return buildRangeSchema(attr);

    case "geo":
      return z.object(
        {
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        },
        { required_error: `${label} is required` }
      );

    default:
      // Fallback: accept any value
      return z.unknown();
  }
}

function buildStringSchema(attr: AttributeDefinition): ZodTypeAny {
  const { constraints, label } = attr;
  let schema = z.string({ required_error: `${label} is required` });

  if (constraints.min !== undefined) {
    schema = schema.min(constraints.min, {
      message: `${label} must be at least ${constraints.min} characters`,
    });
  }
  if (constraints.max !== undefined) {
    schema = schema.max(constraints.max, {
      message: `${label} must be at most ${constraints.max} characters`,
    });
  }
  if (constraints.pattern) {
    schema = schema.regex(new RegExp(constraints.pattern), {
      message: constraints.patternMessage || `${label} format is invalid`,
    });
  }

  return schema;
}

function buildNumberSchema(attr: AttributeDefinition): ZodTypeAny {
  const { constraints, label } = attr;
  let schema = z.coerce.number({ required_error: `${label} is required` });

  if (constraints.min !== undefined) {
    schema = schema.min(constraints.min, {
      message: `${label} must be at least ${constraints.min}`,
    });
  }
  if (constraints.max !== undefined) {
    schema = schema.max(constraints.max, {
      message: `${label} must be at most ${constraints.max}`,
    });
  }

  return schema;
}

function buildEnumSchema(attr: AttributeDefinition): ZodTypeAny {
  const { constraints, label } = attr;

  if (!constraints.options?.length) {
    return z.string({ required_error: `${label} is required` });
  }

  const values = constraints.options.map((o) => o.value);
  // z.enum requires at least one value
  return z.enum(values as [string, ...string[]], {
    required_error: `${label} is required`,
    invalid_type_error: `${label} must be one of: ${values.join(", ")}`,
  });
}

function buildArraySchema(attr: AttributeDefinition): ZodTypeAny {
  const { constraints, label } = attr;

  let itemSchema: ZodTypeAny;
  if (constraints.options?.length) {
    const values = constraints.options.map((o) => o.value);
    itemSchema = z.enum(values as [string, ...string[]]);
  } else {
    itemSchema = z.string();
  }

  let schema = z.array(itemSchema, {
    required_error: `${label} is required`,
  });

  if (constraints.min !== undefined) {
    schema = schema.min(constraints.min, {
      message: `${label} must have at least ${constraints.min} items`,
    });
  }
  if (constraints.max !== undefined) {
    schema = schema.max(constraints.max, {
      message: `${label} must have at most ${constraints.max} items`,
    });
  }

  return schema;
}

function buildRangeSchema(attr: AttributeDefinition): ZodTypeAny {
  const { constraints, label } = attr;

  return z
    .object(
      {
        min: z.coerce.number().optional(),
        max: z.coerce.number().optional(),
      },
      { required_error: `${label} is required` }
    )
    .refine(
      (val) => {
        if (val.min !== undefined && val.max !== undefined) {
          return val.min <= val.max;
        }
        return true;
      },
      { message: `${label} min must be less than or equal to max` }
    )
    .refine(
      (val) => {
        if (constraints.rangeBounds) {
          const { min: boundMin, max: boundMax } = constraints.rangeBounds;
          if (val.min !== undefined && val.min < boundMin) return false;
          if (val.max !== undefined && val.max > boundMax) return false;
        }
        return true;
      },
      {
        message: `${label} values must be within allowed range`,
      }
    );
}
