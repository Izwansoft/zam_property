import { useQuery } from '@tanstack/react-query';

import { getRealEstateListings } from '../api/listing-api';
import { type ListingFilters } from '../types/listing';

export function useRealEstateListings(filters: ListingFilters = {}) {
  return useQuery({
    queryKey: ['real-estate', 'listings', filters],
    queryFn: () => getRealEstateListings(filters),
  });
}
