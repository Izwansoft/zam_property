/**
 * AffiliateController
 * Session 8.4 - Affiliate Module
 *
 * REST endpoints for affiliate/referral management.
 * Endpoints:
 *   POST   /affiliates                     - Register new affiliate
 *   GET    /affiliates                     - List affiliates
 *   GET    /affiliates/:id                 - Get affiliate details
 *   PATCH  /affiliates/:id                 - Update affiliate
 *   POST   /affiliates/:id/deactivate      - Deactivate affiliate
 *   POST   /affiliates/:id/referrals       - Track a referral
 *   GET    /affiliates/:id/referrals       - List referrals
 *   POST   /affiliates/:id/referrals/:refId/confirm - Confirm a referral
 *   GET    /affiliates/:id/earnings        - Get earnings summary
 *   POST   /affiliates/:id/payout          - Process payout
 *   GET    /affiliates/:id/payouts         - List payouts
 *   POST   /affiliates/payouts/:id/complete - Complete a payout
 *   GET    /affiliates/code/:code          - Lookup affiliate by code
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/rbac/guards/roles.guard';
import { Roles } from '@core/rbac/decorators/roles.decorator';
import {
  AffiliateService,
  AffiliateView,
  AffiliateListResult,
  ReferralView,
  ReferralListResult,
  EarningsSummary,
  PayoutView,
} from './affiliate.service';
import {
  CreateAffiliateDto,
  UpdateAffiliateDto,
  TrackReferralDto,
  AffiliateQueryDto,
  ReferralQueryDto,
  ProcessPayoutDto,
} from './dto';

interface SuccessResponse<T> {
  data: T;
}

@ApiTags('Affiliates')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  // ============================================
  // POST /affiliates - Register new affiliate
  // ============================================

  @Post('affiliates')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new affiliate' })
  @ApiResponse({ status: 201, description: 'Affiliate registered with unique code' })
  async createAffiliate(
    @Body() dto: CreateAffiliateDto,
  ): Promise<SuccessResponse<AffiliateView>> {
    const data = await this.affiliateService.createAffiliate(dto);
    return { data };
  }

  // ============================================
  // GET /affiliates - List affiliates
  // ============================================

  @Get('affiliates')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List all affiliates (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of affiliates' })
  async listAffiliates(
    @Query() query: AffiliateQueryDto,
  ): Promise<SuccessResponse<AffiliateListResult>> {
    const data = await this.affiliateService.listAffiliates(query);
    return { data };
  }

  // ============================================
  // GET /affiliates/code/:code - Lookup by code
  // ============================================

  @Get('affiliates/code/:code')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: 'Look up affiliate by referral code' })
  @ApiParam({ name: 'code', description: 'Affiliate referral code' })
  @ApiResponse({ status: 200, description: 'Affiliate details' })
  async getAffiliateByCode(
    @Param('code') code: string,
  ): Promise<SuccessResponse<AffiliateView>> {
    const data = await this.affiliateService.getAffiliateByCode(code);
    return { data };
  }

  // ============================================
  // GET /affiliates/:id - Get affiliate details
  // ============================================

  @Get('affiliates/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: 'Get affiliate details' })
  @ApiParam({ name: 'id', description: 'Affiliate ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Affiliate details' })
  async getAffiliate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<AffiliateView>> {
    const data = await this.affiliateService.getAffiliate(id);
    return { data };
  }

  // ============================================
  // PATCH /affiliates/:id - Update affiliate
  // ============================================

  @Patch('affiliates/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update affiliate details (bank, type, notes)' })
  @ApiParam({ name: 'id', description: 'Affiliate ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Affiliate updated' })
  async updateAffiliate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAffiliateDto,
  ): Promise<SuccessResponse<AffiliateView>> {
    const data = await this.affiliateService.updateAffiliate(id, dto);
    return { data };
  }

  // ============================================
  // POST /affiliates/:id/deactivate - Deactivate
  // ============================================

  @Post('affiliates/:id/deactivate')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an affiliate' })
  @ApiParam({ name: 'id', description: 'Affiliate ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Affiliate deactivated' })
  async deactivateAffiliate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<AffiliateView>> {
    const data = await this.affiliateService.deactivateAffiliate(id);
    return { data };
  }

  // ============================================
  // POST /affiliates/:id/referrals - Track referral
  // ============================================

  @Post('affiliates/:id/referrals')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Track a new referral for affiliate' })
  @ApiParam({ name: 'id', description: 'Affiliate ID', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Referral tracked' })
  async trackReferral(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TrackReferralDto,
  ): Promise<SuccessResponse<ReferralView>> {
    // Ensure DTO affiliateId matches path param
    dto.affiliateId = id;
    const data = await this.affiliateService.trackReferral(dto);
    return { data };
  }

  // ============================================
  // GET /affiliates/:id/referrals - List referrals
  // ============================================

  @Get('affiliates/:id/referrals')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: "List affiliate's referrals" })
  @ApiParam({ name: 'id', description: 'Affiliate ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Paginated list of referrals' })
  async listReferrals(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReferralQueryDto,
  ): Promise<SuccessResponse<ReferralListResult>> {
    const data = await this.affiliateService.listReferrals(id, query);
    return { data };
  }

  // ============================================
  // POST /affiliates/:id/referrals/:refId/confirm - Confirm referral
  // ============================================

  @Post('affiliates/:id/referrals/:refId/confirm')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a pending referral' })
  @ApiParam({ name: 'id', description: 'Affiliate ID', format: 'uuid' })
  @ApiParam({ name: 'refId', description: 'Referral ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Referral confirmed' })
  async confirmReferral(
    @Param('refId', ParseUUIDPipe) refId: string,
  ): Promise<SuccessResponse<ReferralView>> {
    const data = await this.affiliateService.confirmReferral(refId);
    return { data };
  }

  // ============================================
  // GET /affiliates/:id/earnings - Earnings summary
  // ============================================

  @Get('affiliates/:id/earnings')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: "Get affiliate's earnings summary" })
  @ApiParam({ name: 'id', description: 'Affiliate ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Earnings summary' })
  async calculateEarnings(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<EarningsSummary>> {
    const data = await this.affiliateService.calculateEarnings(id);
    return { data };
  }

  // ============================================
  // POST /affiliates/:id/payout - Process payout
  // ============================================

  @Post('affiliates/:id/payout')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process payout for unpaid affiliate earnings' })
  @ApiParam({ name: 'id', description: 'Affiliate ID', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Payout created' })
  async processPayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessPayoutDto,
  ): Promise<SuccessResponse<PayoutView>> {
    const data = await this.affiliateService.processPayout(id, dto);
    return { data };
  }

  // ============================================
  // GET /affiliates/:id/payouts - List payouts
  // ============================================

  @Get('affiliates/:id/payouts')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: "List affiliate's payout history" })
  @ApiParam({ name: 'id', description: 'Affiliate ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of payouts' })
  async listPayouts(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<PayoutView[]>> {
    const data = await this.affiliateService.listPayouts(id);
    return { data };
  }

  // ============================================
  // POST /affiliates/payouts/:id/complete - Complete payout
  // ============================================

  @Post('affiliates/payouts/:id/complete')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a processing payout as completed' })
  @ApiParam({ name: 'id', description: 'Payout ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Payout completed' })
  async completePayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessPayoutDto,
  ): Promise<SuccessResponse<PayoutView>> {
    const data = await this.affiliateService.completePayout(id, dto);
    return { data };
  }
}
