import { randomUUID } from 'crypto';

import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
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
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login',
    description: 'Permission: Public. Requires partner context (X-Partner-ID or host/subdomain).',
  })
  async login(@Req() req: Request, @Body() dto: LoginDto): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const data = await this.authService.login(dto);
    return { data, meta: { requestId } };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Permission: Public (with valid refresh token). Requires partner context (X-Partner-ID or host/subdomain).',
  })
  async refresh(@Req() req: Request, @Body() dto: RefreshDto): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const data = await this.authService.refresh(dto);
    return { data, meta: { requestId } };
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register customer account',
    description: 'Permission: Public. Creates a CUSTOMER user in the resolved partner context.',
  })
  async register(@Req() req: Request, @Body() dto: RegisterDto): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const data = await this.authService.register(dto);
    return { data, meta: { requestId } };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Permission: Authenticated. Returns the current user profile from the JWT token.',
  })
  async me(@Req() req: Request): Promise<unknown> {
    const requestId = this.getRequestId(req);
    const user = (req as Request & { user: { sub: string } }).user;
    const data = await this.authService.getProfile(user.sub);
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
