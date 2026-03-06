import { randomUUID } from 'crypto';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@core/rbac';
import type { JwtPayload } from '@core/auth/types/jwt-payload.type';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Partner-ID',
  required: true,
  description: 'Partner identifier (required unless using host/subdomain-based partner resolution).',
})
@ApiHeader({
  name: 'X-Request-ID',
  required: false,
  description: 'Optional request correlation ID echoed back as meta.requestId.',
})
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'List users (paginated)',
    description: 'Permission: SUPER_ADMIN, PARTNER_ADMIN.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-indexed).',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (max: 100).',
  })
  async list(@Req() req: Request, @Query() query: UserListQueryDto): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const result = await this.userService.listUsers({
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data: result.items,
      meta: {
        requestId,
        pagination: result.pagination,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Permission: Authenticated.',
  })
  async me(@Req() req: Request): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user?: JwtPayload }).user;
    const data = await this.userService.getUserById(user!.sub);
    return { data, meta: { requestId } };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update current user profile (self-service)',
    description: 'Permission: Authenticated. Only fullName and phone allowed.',
  })
  async updateMe(
    @Req() req: Request,
    @Body() dto: UpdateProfileDto,
  ): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user?: JwtPayload }).user;
    const data = await this.userService.updateUser(user!.sub, {
      fullName: dto.fullName,
      phone: dto.phone,
    });
    return { data, meta: { requestId } };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Get user by id',
    description: 'Permission: SUPER_ADMIN, PARTNER_ADMIN.',
  })
  @ApiParam({ name: 'id', type: String, description: 'User ID (uuid).' })
  async getById(@Req() req: Request, @Param('id') id: string): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const data = await this.userService.getUserById(id);
    return { data, meta: { requestId } };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Create user',
    description: 'Permission: SUPER_ADMIN, PARTNER_ADMIN.',
  })
  async create(@Req() req: Request, @Body() dto: CreateUserDto): Promise<unknown> {
    const requestId = this.getRequestId(req);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const data = await this.userService.createUser({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
      role: dto.role ?? Role.CUSTOMER,
      status: dto.status ?? UserStatus.ACTIVE,
    });

    return { data, meta: { requestId } };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Update user',
    description: 'Permission: SUPER_ADMIN, PARTNER_ADMIN.',
  })
  @ApiParam({ name: 'id', type: String, description: 'User ID (uuid).' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const data = await this.userService.updateUser(id, dto);
    return { data, meta: { requestId } };
  }

  @Post(':id/actions/deactivate')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Deactivate user',
    description: 'Permission: SUPER_ADMIN, PARTNER_ADMIN.',
  })
  @ApiParam({ name: 'id', type: String, description: 'User ID (uuid).' })
  async deactivate(@Req() req: Request, @Param('id') id: string): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const data = await this.userService.deactivateUser(id);
    return { data, meta: { requestId } };
  }

  private getRequestId(req: Request): string {
    const raw = req.headers['x-request-id'];
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }

    return randomUUID();
  }
}
