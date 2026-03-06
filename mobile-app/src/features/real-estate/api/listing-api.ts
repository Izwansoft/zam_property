import { apiClient } from '../../../lib/api/client';

import {
  type ListingFilters,
  type PaginationMeta,
  type RealEstateListing,
  type RealEstateListingsResult,
} from '../types/listing';

type ListingsEnvelopeA = {
  data?: {
    items?: RealEstateListing[];
    pagination?: PaginationMeta;
  };
  meta?: {
    pagination?: PaginationMeta;
  };
};

type ListingsEnvelopeB = {
  data?: RealEstateListing[];
  meta?: {
    pagination?: PaginationMeta;
  };
};

function normalizeListingsResponse(
  response: ListingsEnvelopeA | ListingsEnvelopeB,
  fallbackPage: number,
  fallbackPageSize: number,
): RealEstateListingsResult {
  const rootData = response.data;

  if (Array.isArray(rootData)) {
    return {
      items: rootData,
      pagination: response.meta?.pagination ?? {
        page: fallbackPage,
        pageSize: fallbackPageSize,
        totalItems: rootData.length,
        totalPages: 1,
      },
    };
  }

  const items = rootData?.items ?? [];

  return {
    items,
    pagination: rootData?.pagination ?? response.meta?.pagination ?? {
      page: fallbackPage,
      pageSize: fallbackPageSize,
      totalItems: items.length,
      totalPages: 1,
    },
  };
}

export async function getRealEstateListings(
  filters: ListingFilters = {},
): Promise<RealEstateListingsResult> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const { data } = await apiClient.get<ListingsEnvelopeA | ListingsEnvelopeB>('/listings', {
    params: {
      verticalType: 'real_estate',
      page,
      pageSize,
      search: filters.search,
      city: filters.city,
      state: filters.state,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
  });

  return normalizeListingsResponse(data, page, pageSize);
}
