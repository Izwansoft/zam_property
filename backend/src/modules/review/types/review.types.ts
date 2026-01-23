import { Review, ReviewStatus } from '@prisma/client';

// Type alias for Review entity
export type ReviewRecord = Review;

// Create review parameters
export interface CreateReviewParams {
  targetType: 'vendor' | 'listing';
  targetId: string;
  verticalType: string;
  reviewerRef: string;
  rating: number;
  title?: string;
  content?: string;
}

// Update review status parameters
export interface UpdateReviewStatusParams {
  status: ReviewStatus;
  moderatedBy?: string;
  moderationNote?: string;
}

// Vendor response parameters
export interface AddVendorResponseParams {
  vendorId: string;
  responseText: string;
}

// Find many reviews parameters
export interface FindManyReviewsParams {
  targetType?: 'vendor' | 'listing';
  targetId?: string;
  status?: ReviewStatus;
  rating?: number;
  page?: number;
  pageSize?: number;
}

// Rating aggregation result
export interface RatingAggregation {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
