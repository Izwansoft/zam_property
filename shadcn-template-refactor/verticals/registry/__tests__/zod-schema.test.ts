/**
 * Unit Tests — Zod Schema Generation
 *
 * Validates generateZodSchema() produces correct Zod schemas from
 * AttributeSchema definitions. Tests each attribute type and the
 * draft vs publish mode behaviour.
 *
 * @see verticals/registry/zod.ts
 * @see docs/ai-prompt/part-18.md §18.3
 */

import { describe, it, expect } from 'vitest';
import { generateZodSchema } from '@/verticals/registry/zod';
import type { AttributeDefinition, AttributeSchema } from '@/verticals/types';

// ---------------------------------------------------------------------------
// Helpers — build minimal attribute definitions
// ---------------------------------------------------------------------------

function attr(
  overrides: Partial<AttributeDefinition> & Pick<AttributeDefinition, 'key' | 'type'>
): AttributeDefinition {
  return {
    label: overrides.key.charAt(0).toUpperCase() + overrides.key.slice(1),
    required: false,
    requiredForPublish: false,
    constraints: {},
    ui: { group: 'General', order: 0 },
    ...overrides,
  };
}

function schema(...attributes: AttributeDefinition[]): AttributeSchema {
  return { version: '1', attributes, groups: [] };
}

// ---------------------------------------------------------------------------
// String type
// ---------------------------------------------------------------------------

describe('generateZodSchema — string', () => {
  it('should validate a simple string', () => {
    const zod = generateZodSchema(schema(attr({ key: 'title', type: 'string' })));

    expect(zod.safeParse({ title: 'Hello' }).success).toBe(true);
    expect(zod.safeParse({ title: 123 }).success).toBe(false);
  });

  it('should enforce min length constraint', () => {
    const zod = generateZodSchema(
      schema(attr({ key: 'title', type: 'string', constraints: { min: 3 } }))
    );

    expect(zod.safeParse({ title: 'ab' }).success).toBe(false);
    expect(zod.safeParse({ title: 'abc' }).success).toBe(true);
  });

  it('should enforce max length constraint', () => {
    const zod = generateZodSchema(
      schema(attr({ key: 'title', type: 'string', constraints: { max: 5 } }))
    );

    expect(zod.safeParse({ title: 'toolong' }).success).toBe(false);
    expect(zod.safeParse({ title: 'ok' }).success).toBe(true);
  });

  it('should enforce pattern constraint', () => {
    const zod = generateZodSchema(
      schema(
        attr({
          key: 'code',
          type: 'string',
          constraints: { pattern: '^[A-Z]{3}$' },
        })
      )
    );

    expect(zod.safeParse({ code: 'ABC' }).success).toBe(true);
    expect(zod.safeParse({ code: 'abc' }).success).toBe(false);
    expect(zod.safeParse({ code: 'ABCD' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Number type
// ---------------------------------------------------------------------------

describe('generateZodSchema — number', () => {
  it('should coerce string to number', () => {
    const zod = generateZodSchema(schema(attr({ key: 'price', type: 'number' })));

    const result = zod.safeParse({ price: '100' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(100);
  });

  it('should enforce min/max constraints', () => {
    const zod = generateZodSchema(
      schema(
        attr({ key: 'bedrooms', type: 'number', constraints: { min: 1, max: 20 } })
      )
    );

    expect(zod.safeParse({ bedrooms: 0 }).success).toBe(false);
    expect(zod.safeParse({ bedrooms: 1 }).success).toBe(true);
    expect(zod.safeParse({ bedrooms: 21 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Boolean type
// ---------------------------------------------------------------------------

describe('generateZodSchema — boolean', () => {
  it('should accept true/false', () => {
    const zod = generateZodSchema(schema(attr({ key: 'furnished', type: 'boolean' })));

    expect(zod.safeParse({ furnished: true }).success).toBe(true);
    expect(zod.safeParse({ furnished: false }).success).toBe(true);
  });

  it('should reject non-boolean values', () => {
    const zod = generateZodSchema(schema(attr({ key: 'furnished', type: 'boolean' })));

    expect(zod.safeParse({ furnished: 'yes' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Enum type
// ---------------------------------------------------------------------------

describe('generateZodSchema — enum', () => {
  it('should accept valid enum values', () => {
    const zod = generateZodSchema(
      schema(
        attr({
          key: 'propertyType',
          type: 'enum',
          constraints: {
            options: [
              { value: 'CONDO', label: 'Condo' },
              { value: 'LANDED', label: 'Landed' },
              { value: 'COMMERCIAL', label: 'Commercial' },
            ],
          },
        })
      )
    );

    expect(zod.safeParse({ propertyType: 'CONDO' }).success).toBe(true);
    expect(zod.safeParse({ propertyType: 'LANDED' }).success).toBe(true);
    expect(zod.safeParse({ propertyType: 'VILLA' }).success).toBe(false);
  });

  it('should fallback to string when no options provided', () => {
    const zod = generateZodSchema(
      schema(attr({ key: 'type', type: 'enum', constraints: {} }))
    );

    expect(zod.safeParse({ type: 'anything' }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Array type
// ---------------------------------------------------------------------------

describe('generateZodSchema — array', () => {
  it('should accept array of strings', () => {
    const zod = generateZodSchema(
      schema(attr({ key: 'tags', type: 'array', constraints: {} }))
    );

    expect(zod.safeParse({ tags: ['a', 'b'] }).success).toBe(true);
    expect(zod.safeParse({ tags: 'notArray' }).success).toBe(false);
  });

  it('should enforce min/max items', () => {
    const zod = generateZodSchema(
      schema(
        attr({ key: 'amenities', type: 'array', constraints: { min: 1, max: 3 } })
      )
    );

    expect(zod.safeParse({ amenities: [] }).success).toBe(false);
    expect(zod.safeParse({ amenities: ['pool'] }).success).toBe(true);
    expect(zod.safeParse({ amenities: ['a', 'b', 'c', 'd'] }).success).toBe(false);
  });

  it('should validate items against options when provided', () => {
    const zod = generateZodSchema(
      schema(
        attr({
          key: 'features',
          type: 'array',
          constraints: {
            options: [
              { value: 'POOL', label: 'Pool' },
              { value: 'GYM', label: 'Gym' },
            ],
          },
        })
      )
    );

    expect(zod.safeParse({ features: ['POOL'] }).success).toBe(true);
    expect(zod.safeParse({ features: ['UNKNOWN'] }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Date type
// ---------------------------------------------------------------------------

describe('generateZodSchema — date', () => {
  it('should accept valid ISO date strings', () => {
    const zod = generateZodSchema(schema(attr({ key: 'availableFrom', type: 'date' })));

    expect(zod.safeParse({ availableFrom: '2025-06-15' }).success).toBe(true);
    expect(zod.safeParse({ availableFrom: '2025-06-15T10:30:00Z' }).success).toBe(true);
  });

  it('should reject invalid date strings', () => {
    const zod = generateZodSchema(schema(attr({ key: 'availableFrom', type: 'date' })));

    expect(zod.safeParse({ availableFrom: 'not-a-date' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Range type
// ---------------------------------------------------------------------------

describe('generateZodSchema — range', () => {
  it('should accept valid range object', () => {
    const zod = generateZodSchema(
      schema(attr({ key: 'priceRange', type: 'range', constraints: {} }))
    );

    expect(zod.safeParse({ priceRange: { min: 100, max: 500 } }).success).toBe(true);
  });

  it('should reject min > max', () => {
    const zod = generateZodSchema(
      schema(attr({ key: 'priceRange', type: 'range', constraints: {} }))
    );

    expect(zod.safeParse({ priceRange: { min: 500, max: 100 } }).success).toBe(false);
  });

  it('should enforce rangeBounds', () => {
    const zod = generateZodSchema(
      schema(
        attr({
          key: 'sqft',
          type: 'range',
          constraints: { rangeBounds: { min: 0, max: 10000 } },
        })
      )
    );

    expect(zod.safeParse({ sqft: { min: 0, max: 10000 } }).success).toBe(true);
    expect(zod.safeParse({ sqft: { min: -1, max: 500 } }).success).toBe(false);
    expect(zod.safeParse({ sqft: { min: 0, max: 10001 } }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Geo type
// ---------------------------------------------------------------------------

describe('generateZodSchema — geo', () => {
  it('should accept valid lat/lng', () => {
    const zod = generateZodSchema(schema(attr({ key: 'location', type: 'geo' })));

    expect(zod.safeParse({ location: { lat: 3.139, lng: 101.6869 } }).success).toBe(true);
  });

  it('should reject out-of-bounds lat/lng', () => {
    const zod = generateZodSchema(schema(attr({ key: 'location', type: 'geo' })));

    expect(zod.safeParse({ location: { lat: 91, lng: 0 } }).success).toBe(false);
    expect(zod.safeParse({ location: { lat: 0, lng: 181 } }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Draft vs Publish mode
// ---------------------------------------------------------------------------

describe('generateZodSchema — draft vs publish mode', () => {
  const attributeDef = attr({
    key: 'title',
    type: 'string',
    required: false,
    requiredForPublish: true,
  });

  it('draft mode should make requiredForPublish fields optional', () => {
    const zod = generateZodSchema(schema(attributeDef), 'draft');

    // Should accept missing field in draft mode
    expect(zod.safeParse({}).success).toBe(true);
    // Should also accept provided field
    expect(zod.safeParse({ title: 'hello' }).success).toBe(true);
  });

  it('publish mode should require requiredForPublish fields', () => {
    const zod = generateZodSchema(schema(attributeDef), 'publish');

    // Should reject missing field in publish mode
    expect(zod.safeParse({}).success).toBe(false);
    // Should accept provided field
    expect(zod.safeParse({ title: 'hello' }).success).toBe(true);
  });

  it('required field should be required in both modes', () => {
    const requiredAttr = attr({
      key: 'name',
      type: 'string',
      required: true,
      requiredForPublish: true,
    });

    const draftSchema = generateZodSchema(schema(requiredAttr), 'draft');
    const publishSchema = generateZodSchema(schema(requiredAttr), 'publish');

    expect(draftSchema.safeParse({}).success).toBe(false);
    expect(publishSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Multiple attributes
// ---------------------------------------------------------------------------

describe('generateZodSchema — multiple attributes', () => {
  it('should validate a complex schema with mixed types', () => {
    const complexSchema = schema(
      attr({ key: 'title', type: 'string', required: true, constraints: { min: 1, max: 200 } }),
      attr({ key: 'price', type: 'number', required: true, constraints: { min: 0 } }),
      attr({
        key: 'propertyType',
        type: 'enum',
        required: true,
        constraints: {
          options: [
            { value: 'CONDO', label: 'Condo' },
            { value: 'LANDED', label: 'Landed' },
          ],
        },
      }),
      attr({ key: 'furnished', type: 'boolean' }),
      attr({ key: 'tags', type: 'array', constraints: {} }),
    );

    const zod = generateZodSchema(complexSchema, 'draft');

    const valid = {
      title: 'Luxury Condo',
      price: 500000,
      propertyType: 'CONDO',
      furnished: true,
      tags: ['luxury'],
    };

    expect(zod.safeParse(valid).success).toBe(true);

    // Missing required fields
    expect(zod.safeParse({}).success).toBe(false);

    // Invalid enum
    expect(zod.safeParse({ ...valid, propertyType: 'VILLA' }).success).toBe(false);
  });
});
