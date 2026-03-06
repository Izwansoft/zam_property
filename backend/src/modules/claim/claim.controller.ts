import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
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
import { ClaimService } from './claim.service';
import {
  CreateClaimDto,
  UploadEvidenceDto,
  ReviewClaimDto,
  DisputeClaimDto,
  ClaimQueryDto,
} from './dto';

interface AuthenticatedRequest {
  user: {
    sub: string;
    partnerId: string;
    role: string;
    vendorId?: string;
  };
}

interface SuccessResponse<T> {
  data: T;
}

@ApiTags('Claims')
@ApiBearerAuth()
@Controller('claims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  // ============================================
  // POST /claims - Submit a new claim
  // ============================================

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new claim (damage, cleaning, etc.)' })
  @ApiResponse({ status: 201, description: 'Claim submitted successfully' })
  @ApiResponse({ status: 404, description: 'Tenancy or maintenance ticket not found' })
  async submitClaim(
    @Body() dto: CreateClaimDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.claimService.submitClaim(dto, req.user.sub);
    return { data };
  }

  // ============================================
  // GET /claims - List claims
  // ============================================

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'List claims with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of claims' })
  async listClaims(
    @Query() query: ClaimQueryDto,
  ): Promise<SuccessResponse<any>> {
    const data = await this.claimService.listClaims(query);
    return { data };
  }

  // ============================================
  // GET /claims/:id - Get claim detail
  // ============================================

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Get claim details by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Claim details' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async getClaim(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<any>> {
    const data = await this.claimService.getClaim(id);
    return { data };
  }

  // ============================================
  // POST /claims/:id/evidence - Upload evidence
  // ============================================

  @Post(':id/evidence')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload evidence for a claim (returns presigned upload URL)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Presigned upload URL and evidence record' })
  @ApiResponse({ status: 400, description: 'Cannot add evidence to settled/rejected claim' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async uploadEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadEvidenceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.claimService.uploadEvidence(id, dto, req.user.sub);
    return { data };
  }

  // ============================================
  // POST /claims/:id/review - Review claim
  // ============================================

  @Post(':id/review')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review a claim (approve, partially approve, or reject)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Claim reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status for review or missing approved amount' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async reviewClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewClaimDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.claimService.reviewClaim(id, dto, req.user.sub);
    return { data };
  }

  // ============================================
  // POST /claims/:id/dispute - Dispute claim decision
  // ============================================

  @Post(':id/dispute')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispute a claim decision' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Claim disputed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot dispute claim in current status' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async disputeClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisputeClaimDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.claimService.disputeClaim(id, dto, req.user.sub);
    return { data };
  }
}
