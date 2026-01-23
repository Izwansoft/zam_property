import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ReviewService } from './review.service';
import {
  CreateReviewDto,
  UpdateReviewStatusDto,
  AddVendorResponseDto,
  ReviewQueryDto,
} from './dto/review.dto';
import { ReviewStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  async create(@Body() dto: CreateReviewDto) {
    const review = await this.reviewService.create({
      targetType: dto.targetType,
      targetId: dto.targetId,
      verticalType: dto.verticalType,
      reviewerRef: dto.reviewerRef,
      rating: dto.rating,
      title: dto.title,
      content: dto.content,
    });

    return {
      data: review,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews with filters' })
  async findAll(@Query() query: ReviewQueryDto) {
    const { data, total } = await this.reviewService.findAll({
      targetType: query.targetType,
      targetId: query.targetId,
      status: query.status,
      rating: query.rating,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data,
      meta: {
        requestId: randomUUID(),
        pagination: {
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          total,
          totalPages: Math.ceil(total / (query.pageSize || 20)),
        },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  async findOne(@Param('id') id: string) {
    const review = await this.reviewService.findById(id);

    return {
      data: review,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Patch(':id/moderate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Moderate review (approve/reject/flag)' })
  async moderate(@Param('id') id: string, @Body() dto: UpdateReviewStatusDto) {
    // TODO: Extract moderator ID from JWT
    const moderatedBy = 'system'; // Placeholder

    const review = await this.reviewService.moderateReview(id, {
      status: dto.status,
      moderatedBy,
      moderationNote: dto.moderationNote,
    });

    return {
      data: review,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Post(':id/response')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add vendor response to review' })
  async addResponse(@Param('id') id: string, @Body() dto: AddVendorResponseDto) {
    // TODO: Extract vendor ID from JWT
    const vendorId = 'vendor-uuid'; // Placeholder

    const review = await this.reviewService.addVendorResponse(id, {
      vendorId,
      responseText: dto.responseText,
    });

    return {
      data: review,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Get('target/:targetType/:targetId/rating')
  @ApiOperation({ summary: 'Get rating aggregation for target' })
  async getRating(
    @Param('targetType') targetType: 'vendor' | 'listing',
    @Param('targetId') targetId: string,
  ) {
    const aggregation = await this.reviewService.getRatingAggregation(targetType, targetId);

    return {
      data: aggregation,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Get('target/:targetType/:targetId')
  @ApiOperation({ summary: 'Get all reviews for a target' })
  async getByTarget(
    @Param('targetType') targetType: 'vendor' | 'listing',
    @Param('targetId') targetId: string,
    @Query('status') status?: ReviewStatus,
  ) {
    const reviews = await this.reviewService.getReviewsByTarget(targetType, targetId, status);

    return {
      data: reviews,
      meta: {
        requestId: randomUUID(),
      },
    };
  }
}
