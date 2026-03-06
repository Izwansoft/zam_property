export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';

export type ListingLocation = {
  city?: string;
  state?: string;
  country?: string;
};

export type RealEstateListing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: ListingStatus;
  verticalType?: string;
  location?: ListingLocation;
  isFeatured?: boolean;
  createdAt?: string;
};

export type ListingFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type RealEstateListingsResult = {
  items: RealEstateListing[];
  pagination: PaginationMeta;
};
