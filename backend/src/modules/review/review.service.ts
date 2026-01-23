import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReviewStatus } from '@prisma/client';
import { ReviewRepository } from './review.repository';
import {
  CreateReviewParams,
  UpdateReviewStatusParams,
  AddVendorResponseParams,
  FindManyReviewsParams,
  RatingAggregation,
  ReviewRecord,
} from './types/review.types';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new review (default status: PENDING)
   */
  async create(params: CreateReviewParams): Promise<ReviewRecord> {
    this.logger.log(`Creating review for ${params.targetType}:${params.targetId}`);

    // Validate rating range
    if (params.rating < 1 || params.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const review = await this.reviewRepository.create(params);

    // Emit event for downstream processing
    this.eventEmitter.emit('review.created', {
      reviewId: review.id,
      targetType: review.targetType,
      targetId: review.targetId,
      rating: review.rating,
      status: review.status,
    });

    return review;
  }

  /**
   * Find all reviews with filters and pagination
   */
  async findAll(params: FindManyReviewsParams): Promise<{ data: ReviewRecord[]; total: number }> {
    return this.reviewRepository.findMany(params);
  }

  /**
   * Find review by ID
   */
  async findById(id: string): Promise<ReviewRecord> {
    const review = await this.reviewRepository.findById(id);

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  /**
   * Moderate review (approve/reject/flag)
   */
  async moderateReview(id: string, params: UpdateReviewStatusParams): Promise<ReviewRecord> {
    this.logger.log(`Moderating review ${id} to status ${params.status}`);

    // Verify review exists
    const existingReview = await this.findById(id);

    // Validate status transition
    this.validateModerationTransition(existingReview.status, params.status);

    const review = await this.reviewRepository.updateStatus(id, params);

    // Emit event for downstream processing (e.g., notifications, rating updates)
    this.eventEmitter.emit('review.moderated', {
      reviewId: review.id,
      targetType: review.targetType,
      targetId: review.targetId,
      oldStatus: existingReview.status,
      newStatus: review.status,
      moderatedBy: params.moderatedBy,
    });

    return review;
  }

  /**
   * Add vendor response to a review
   */
  async addVendorResponse(id: string, params: AddVendorResponseParams): Promise<ReviewRecord> {
    this.logger.log(`Adding vendor response to review ${id}`);

    // Verify review exists
    const existingReview = await this.findById(id);

    // Ensure review is approved before allowing response
    if (existingReview.status !== ReviewStatus.APPROVED) {
      throw new BadRequestException('Can only respond to approved reviews');
    }

    // Ensure review is for this vendor
    if (existingReview.targetType !== 'vendor' || existingReview.targetId !== params.vendorId) {
      throw new BadRequestException('Vendor can only respond to their own reviews');
    }

    const review = await this.reviewRepository.addVendorResponse(
      id,
      params.vendorId,
      params.responseText,
    );

    // Emit event
    this.eventEmitter.emit('review.vendor_responded', {
      reviewId: review.id,
      vendorId: params.vendorId,
    });

    return review;
  }

  /**
   * Get rating aggregation for a target (vendor or listing)
   */
  async getRatingAggregation(
    targetType: 'vendor' | 'listing',
    targetId: string,
  ): Promise<RatingAggregation> {
    return this.reviewRepository.calculateAverageRating(targetType, targetId);
  }

  /**
   * Get reviews by target
   */
  async getReviewsByTarget(
    targetType: 'vendor' | 'listing',
    targetId: string,
    status?: ReviewStatus,
  ): Promise<ReviewRecord[]> {
    return this.reviewRepository.findByTarget(targetType, targetId, status);
  }

  /**
   * Validate moderation status transition
   * - PENDING can go to APPROVED, REJECTED, or FLAGGED
   * - FLAGGED can go to APPROVED or REJECTED
   * - APPROVED and REJECTED are terminal states (cannot be changed)
   */
  private validateModerationTransition(currentStatus: ReviewStatus, newStatus: ReviewStatus): void {
    const allowedTransitions: Record<ReviewStatus, ReviewStatus[]> = {
      [ReviewStatus.PENDING]: [ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.FLAGGED],
      [ReviewStatus.FLAGGED]: [ReviewStatus.APPROVED, ReviewStatus.REJECTED],
      [ReviewStatus.APPROVED]: [], // Terminal state
      [ReviewStatus.REJECTED]: [], // Terminal state
    };

    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
