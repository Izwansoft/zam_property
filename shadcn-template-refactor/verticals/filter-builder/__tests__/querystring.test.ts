/**
 * Unit Tests — Filter Querystring Serialization
 *
 * Validates serializeFilters / deserializeFilters roundtrip, buildApiParams,
 * and countActiveFilters.
 *
 * @see verticals/filter-builder/querystring.ts
 * @see docs/ai-prompt/part-18.md §18.3
 */

import { describe, it, expect } from 'vitest';
import {
  serializeFilters,
  deserializeFilters,
  buildApiParams,
  countActiveFilters,
  type FilterValues,
} from '@/verticals/filter-builder/querystring';
import type { VerticalSearchMapping } from '@/verticals/types';

// ---------------------------------------------------------------------------
// Fixture — a realistic search mapping
// ---------------------------------------------------------------------------

const mapping: VerticalSearchMapping = {
  filterableFields: [
    {
      key: 'propertyType',
      label: 'Property Type',
      type: 'enum',
      paramName: 'type',
      order: 1,
      options: [
        { value: 'CONDO', label: 'Condo' },
        { value: 'LANDED', label: 'Landed' },
      ],
    },
    {
      key: 'state',
      label: 'State',
      type: 'string',
      order: 2,
    },
    {
      key: 'bedrooms',
      label: 'Bedrooms',
      type: 'number',
      order: 3,
    },
    {
      key: 'furnished',
      label: 'Furnished',
      type: 'boolean',
      order: 4,
    },
    {
      key: 'amenities',
      label: 'Amenities',
      type: 'array',
      multiSelect: true,
      order: 5,
    },
  ],
  sortableFields: [
    { key: 'createdAt', label: 'Date', defaultDirection: 'desc' },
    { key: 'price', label: 'Price', defaultDirection: 'asc' },
  ],
  rangeFields: [
    {
      key: 'price',
      label: 'Price',
      min: 0,
      max: 10_000_000,
      step: 10_000,
      unit: 'RM',
      unitPosition: 'prefix',
      order: 1,
    },
    {
      key: 'sqft',
      label: 'Size',
      min: 0,
      max: 50_000,
      step: 100,
      unit: 'sq ft',
      unitPosition: 'suffix',
      order: 2,
      minParamName: 'size_min',
      maxParamName: 'size_max',
    },
  ],
  facetFields: [],
};

// ---------------------------------------------------------------------------
// serializeFilters
// ---------------------------------------------------------------------------

describe('serializeFilters', () => {
  it('should serialize string filter with custom paramName', () => {
    const params = serializeFilters({ propertyType: 'CONDO' }, mapping);
    expect(params.get('type')).toBe('CONDO');
  });

  it('should serialize string filter using key as param when no paramName', () => {
    const params = serializeFilters({ state: 'Selangor' }, mapping);
    expect(params.get('state')).toBe('Selangor');
  });

  it('should serialize number filter', () => {
    const params = serializeFilters({ bedrooms: 3 }, mapping);
    expect(params.get('bedrooms')).toBe('3');
  });

  it('should serialize boolean filter', () => {
    const params = serializeFilters({ furnished: true }, mapping);
    expect(params.get('furnished')).toBe('true');
  });

  it('should serialize array filter as comma-separated', () => {
    const params = serializeFilters({ amenities: ['POOL', 'GYM'] }, mapping);
    expect(params.get('amenities')).toBe('POOL,GYM');
  });

  it('should skip empty array', () => {
    const params = serializeFilters({ amenities: [] }, mapping);
    expect(params.has('amenities')).toBe(false);
  });

  it('should skip undefined/null/empty string values', () => {
    const params = serializeFilters({ state: '', bedrooms: undefined }, mapping);
    expect(params.toString()).toBe('');
  });

  it('should serialize range fields into separate min/max params', () => {
    const params = serializeFilters(
      { price: { min: 100000, max: 500000 } },
      mapping
    );
    expect(params.get('price_min')).toBe('100000');
    expect(params.get('price_max')).toBe('500000');
  });

  it('should use custom range param names', () => {
    const params = serializeFilters(
      { sqft: { min: 500, max: 2000 } },
      mapping
    );
    expect(params.get('size_min')).toBe('500');
    expect(params.get('size_max')).toBe('2000');
  });

  it('should handle partial range (only min)', () => {
    const params = serializeFilters(
      { price: { min: 100000 } },
      mapping
    );
    expect(params.get('price_min')).toBe('100000');
    expect(params.has('price_max')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// deserializeFilters
// ---------------------------------------------------------------------------

describe('deserializeFilters', () => {
  it('should deserialize string filter with custom paramName', () => {
    const params = new URLSearchParams('type=CONDO');
    const result = deserializeFilters(params, mapping);
    expect(result.propertyType).toBe('CONDO');
  });

  it('should deserialize number field to number', () => {
    const params = new URLSearchParams('bedrooms=3');
    const result = deserializeFilters(params, mapping);
    expect(result.bedrooms).toBe(3);
  });

  it('should deserialize boolean field', () => {
    const params = new URLSearchParams('furnished=true');
    const result = deserializeFilters(params, mapping);
    expect(result.furnished).toBe(true);
  });

  it('should deserialize false boolean', () => {
    const params = new URLSearchParams('furnished=false');
    const result = deserializeFilters(params, mapping);
    expect(result.furnished).toBe(false);
  });

  it('should deserialize multiSelect as array', () => {
    const params = new URLSearchParams('amenities=POOL,GYM,PARKING');
    const result = deserializeFilters(params, mapping);
    expect(result.amenities).toEqual(['POOL', 'GYM', 'PARKING']);
  });

  it('should deserialize range fields', () => {
    const params = new URLSearchParams('price_min=100000&price_max=500000');
    const result = deserializeFilters(params, mapping);
    expect(result.price).toEqual({ min: 100000, max: 500000 });
  });

  it('should deserialize custom range param names', () => {
    const params = new URLSearchParams('size_min=500&size_max=2000');
    const result = deserializeFilters(params, mapping);
    expect(result.sqft).toEqual({ min: 500, max: 2000 });
  });

  it('should handle partial range deserialization', () => {
    const params = new URLSearchParams('price_min=100000');
    const result = deserializeFilters(params, mapping);
    expect(result.price).toEqual({ min: 100000, max: undefined });
  });

  it('should skip missing params', () => {
    const params = new URLSearchParams('');
    const result = deserializeFilters(params, mapping);
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// serializeFilters ↔ deserializeFilters roundtrip
// ---------------------------------------------------------------------------

describe('serialize/deserialize roundtrip', () => {
  it('should roundtrip complex filter values', () => {
    const original: FilterValues = {
      propertyType: 'LANDED',
      state: 'Johor',
      bedrooms: 4,
      furnished: true,
      amenities: ['POOL', 'GYM'],
      price: { min: 200000, max: 800000 },
      sqft: { min: 1000, max: 3000 },
    };

    const serialized = serializeFilters(original, mapping);
    const deserialized = deserializeFilters(serialized, mapping);

    expect(deserialized.propertyType).toBe('LANDED');
    expect(deserialized.state).toBe('Johor');
    expect(deserialized.bedrooms).toBe(4);
    expect(deserialized.furnished).toBe(true);
    expect(deserialized.amenities).toEqual(['POOL', 'GYM']);
    expect(deserialized.price).toEqual({ min: 200000, max: 800000 });
    expect(deserialized.sqft).toEqual({ min: 1000, max: 3000 });
  });
});

// ---------------------------------------------------------------------------
// buildApiParams
// ---------------------------------------------------------------------------

describe('buildApiParams', () => {
  it('should build flat params from filters', () => {
    const filters: FilterValues = {
      propertyType: 'CONDO',
      bedrooms: 3,
      price: { min: 100000, max: 500000 },
    };

    const result = buildApiParams(filters, mapping);

    expect(result.type).toBe('CONDO');
    expect(result.bedrooms).toBe(3);
    expect(result.price_min).toBe(100000);
    expect(result.price_max).toBe(500000);
  });

  it('should preserve array values', () => {
    const filters: FilterValues = { amenities: ['POOL', 'GYM'] };
    const result = buildApiParams(filters, mapping);
    expect(result.amenities).toEqual(['POOL', 'GYM']);
  });

  it('should skip empty values', () => {
    const result = buildApiParams({ state: '', amenities: [] }, mapping);
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// countActiveFilters
// ---------------------------------------------------------------------------

describe('countActiveFilters', () => {
  it('should count non-empty filter values', () => {
    expect(
      countActiveFilters({
        propertyType: 'CONDO',
        bedrooms: 3,
        amenities: ['POOL'],
        price: { min: 100000, max: 500000 },
      })
    ).toBe(4);
  });

  it('should ignore empty/null/undefined values', () => {
    expect(
      countActiveFilters({
        propertyType: undefined,
        state: null,
        bedrooms: '',
        amenities: [],
      })
    ).toBe(0);
  });

  it('should ignore range with no min/max', () => {
    expect(
      countActiveFilters({
        price: { min: undefined, max: undefined },
      })
    ).toBe(0);
  });

  it('should count partial range', () => {
    expect(
      countActiveFilters({
        price: { min: 100000 },
      })
    ).toBe(1);
  });

  it('should return 0 for empty object', () => {
    expect(countActiveFilters({})).toBe(0);
  });
});
