import { randomUUID } from 'crypto';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import type { JwtPayload } from '@core/auth/types/jwt-payload.type';

import { AccountService } from './account.service';
import {
  ChangePasswordDto,
  DeleteAccountDto,
  SaveListingDto,
  SavedListingQueryDto,
  UpdateAccountSettingsDto,
} from './dto';

/**
 * Self-service account endpoints for authenticated customers.
 *
 * Endpoints:
 *  - POST /account/change-password
 *  - POST /account/delete-account
 *  - GET  /account/saved
 *  - POST /account/saved
 *  - DELETE /account/saved/:listingId
 *  - GET  /account/settings
 *  - PATCH /account/settings
 */
@ApiTags('Account')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Partner-ID',
  required: true,
  description: 'Partner identifier.',
})
@ApiHeader({
  name: 'X-Request-ID',
  required: false,
  description: 'Optional request correlation ID.',
})
@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Security
  // ─────────────────────────────────────────────────────────────────────────

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description: 'Permission: Authenticated. Requires current password verification.',
  })
  async changePassword(
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
  ): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user?: JwtPayload }).user;
    const data = await this.accountService.changePassword(
      user!.sub,
      dto.currentPassword,
      dto.newPassword,
      dto.confirmPassword,
    );
    return { data, meta: { requestId } };
  }

  @Post('delete-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete account (soft)',
    description: 'Permission: Authenticated. Requires password confirmation.',
  })
  async deleteAccount(
    @Req() req: Request,
    @Body() dto: DeleteAccountDto,
  ): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user?: JwtPayload }).user;
    const data = await this.accountService.deleteAccount(user!.sub, dto.password);
    return { data, meta: { requestId } };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Saved Listings
  // ─────────────────────────────────────────────────────────────────────────

  @Get('saved')
  @ApiOperation({
    summary: 'List saved listings',
    description: 'Permission: Authenticated. Paginated list of saved/favourited listings.',
  })
  async listSaved(
    @Req() req: Request,
    @Query() query: SavedListingQueryDto,
  ): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user?: JwtPayload }).user;
    const result = await this.accountService.listSavedListings(user!.sub, {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      search: query.search,
    });
    return {
      data: result.data,
      meta: { requestId, pagination: result.meta },
    };
  }

  @Post('saved')
  @ApiOperation({
    summary: 'Save (favourite) a listing',
    description: 'Permission: Authenticated.',
  })
  async saveListing(
    @Req() req: Request,
    @Body() dto: SaveListingDto,
  ): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user?: JwtPayload }).user;
    const data = await this.accountService.saveListing(user!.sub, dto.listingId);
    return { data, meta: { requestId } };
  }

  @Delete('saved/:listingId')
  @ApiOperation({
    summary: 'Unsave (unfavourite) a listing',
    description: 'Permission: Authenticated.',
  })
  @ApiParam({ name: 'listingId', description: 'Listing ID to unsave' })
  async unsaveListing(
    @Req() req: Request,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user?: JwtPayload }).user;
    const data = await this.accountService.unsaveListing(user!.sub, listingId);
    return { data, meta: { requestId } };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────────────────────────────────

  @Get('settings')
  @ApiOperation({
    summary: 'Get account settings',
    description: 'Permission: Authenticated. Returns language, timezone, privacy.',
  })
  async getSettings(@Req() req: Request): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user?: JwtPayload }).user;
    const data = await this.accountService.getSettings(user!.sub);
    return { data, meta: { requestId } };
  }

  @Patch('settings')
  @ApiOperation({
    summary: 'Update account settings',
    description: 'Permission: Authenticated. Partial update of language, timezone, privacy.',
  })
  async updateSettings(
    @Req() req: Request,
    @Body() dto: UpdateAccountSettingsDto,
  ): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user?: JwtPayload }).user;
    const data = await this.accountService.updateSettings(user!.sub, {
      language: dto.language,
      timezone: dto.timezone,
      privacy: dto.privacy,
    });
    return { data, meta: { requestId } };
  }

  // ─────────────────────────────────────────────────────────────────────────

  private getRequestId(req: Request): string {
    const raw = req.headers['x-request-id'];
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
    return randomUUID();
  }
}
