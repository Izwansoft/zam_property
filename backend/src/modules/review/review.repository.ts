import { Injectable } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import {
  CreateReviewParams,
  UpdateReviewStatusParams,
  FindManyReviewsParams,
  RatingAggregation,
  ReviewRecord,
} from './types/review.types';

@Injectable()
export class ReviewRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
  ) {}

  /**
   * Create a new review (defaults to PENDING status)
   */
  async create(params: CreateReviewParams): Promise<ReviewRecord> {
    const partnerId = this.PartnerContext.partnerId;

    // Determine vendorId and listingId based on targetType
    const vendorId = params.targetType === 'vendor' ? params.targetId : undefined;
    const listingId = params.targetType === 'listing' ? params.targetId : undefined;

    return this.prisma.review.create({
      data: {
        partnerId,
        targetType: params.targetType,
        targetId: params.targetId,
        verticalType: params.verticalType,
        reviewerRef: params.reviewerRef,
        rating: params.rating,
        title: params.title,
        content: params.content,
        status: ReviewStatus.PENDING,
        vendorId,
        listingId,
      },
    });
  }

  /**
   * Find review by ID (partner-scoped)
   */
  async findById(id: string): Promise<ReviewRecord | null> {
    const partnerId = this.PartnerContext.partnerId;

    return this.prisma.review.findFirst({
      where: {
        id,
        partnerId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Find many reviews with pagination and filters (partner-scoped)
   */
  async findMany(params: FindManyReviewsParams): Promise<{ data: ReviewRecord[]; total: number }> {
    const partnerId = this.PartnerContext.partnerId;
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: {
      partnerId: string;
      targetType?: string;
      targetId?: string;
      status?: ReviewStatus;
      rating?: number;
    } = {
      partnerId,
    };

    if (params.targetType) {
      where.targetType = params.targetType;
    }

    if (params.targetId) {
      where.targetId = params.targetId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.rating) {
      where.rating = params.rating;
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find reviews by target (vendor or listing)
   */
  async findByTarget(
    targetType: 'vendor' | 'listing',
    targetId: string,
    status?: ReviewStatus,
  ): Promise<ReviewRecord[]> {
    const partnerId = this.PartnerContext.partnerId;

    const where: {
      partnerId: string;
      targetType: string;
      targetId: string;
      status?: ReviewStatus;
    } = {
      partnerId,
      targetType,
      targetId,
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.review.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update review status (moderation)
   */
  async updateStatus(id: string, params: UpdateReviewStatusParams): Promise<ReviewRecord> {
    const partnerId = this.PartnerContext.partnerId;

    return this.prisma.review.update({
      where: {
        id,
        partnerId,
      },
      data: {
        status: params.status,
        moderatedAt: new Date(),
        moderatedBy: params.moderatedBy,
        moderationNote: params.moderationNote,
      },
    });
  }

  /**
   * Add vendor response to a review
   */
  async addVendorResponse(
    id: string,
    vendorId: string,
    responseText: string,
  ): Promise<ReviewRecord> {
    const partnerId = this.PartnerContext.partnerId;

    return this.prisma.review.update({
      where: {
        id,
        partnerId,
        vendorId, // Ensure only the target vendor can respond
      },
      data: {
        responseText,
        respondedAt: new Date(),
      },
    });
  }

  /**
   * Calculate average rating for a target
   */
  async calculateAverageRating(
    targetType: 'vendor' | 'listing',
    targetId: string,
  ): Promise<RatingAggregation> {
    const partnerId = this.PartnerContext.partnerId;

    // Get all approved reviews for this target
    const reviews = await this.prisma.review.findMany({
      where: {
        partnerId,
        targetType,
        targetId,
        status: ReviewStatus.APPROVED,
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      };
    }

    // Calculate average
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = Math.round((sum / totalReviews) * 10) / 10; // Round to 1 decimal

    // Calculate distribution
    const ratingDistribution = {
      1: reviews.filter((r) => r.rating === 1).length,
      2: reviews.filter((r) => r.rating === 2).length,
      3: reviews.filter((r) => r.rating === 3).length,
      4: reviews.filter((r) => r.rating === 4).length,
      5: reviews.filter((r) => r.rating === 5).length,
    };

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  }

  /**
   * Count reviews by status (for analytics)
   */
  async countByStatus(targetId?: string): Promise<Record<ReviewStatus, number>> {
    const partnerId = this.PartnerContext.partnerId;

    const where: {
      partnerId: string;
      targetId?: string;
    } = {
      partnerId,
    };

    if (targetId) {
      where.targetId = targetId;
    }

    const results = await this.prisma.review.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    });

    // Initialize all statuses to 0
    const counts: Record<ReviewStatus, number> = {
      [ReviewStatus.PENDING]: 0,
      [ReviewStatus.APPROVED]: 0,
      [ReviewStatus.REJECTED]: 0,
      [ReviewStatus.FLAGGED]: 0,
    };

    // Populate with actual counts
    results.forEach((result) => {
      counts[result.status] = result._count.status;
    });

    return counts;
  }
}
