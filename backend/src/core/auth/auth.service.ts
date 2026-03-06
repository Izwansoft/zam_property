import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, UserStatus } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { PartnerContextService } from '@core/partner-context';
import { UserRepository } from '@core/user';

import type { JwtPayload } from './types/jwt-payload.type';

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function parseDurationToSeconds(duration: string): number {
  const match = /^([0-9]+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly PartnerContext: PartnerContextService,
    private readonly userRepository: UserRepository,
  ) {}

  async login(dto: { email: string; password: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: { id: string; email: string; fullName: string; role: string };
  }> {
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessTtl = getEnvOrThrow('JWT_ACCESS_TOKEN_TTL');
    const refreshTtl = getEnvOrThrow('JWT_REFRESH_TOKEN_TTL');

    const payload: JwtPayload = {
      sub: user.id,
      partnerId: this.PartnerContext.partnerId,
      role: user.role,
      tokenType: 'access',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: getEnvOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: accessTtl,
    });

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, tokenType: 'refresh' },
      {
        secret: getEnvOrThrow('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: refreshTtl,
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: parseDurationToSeconds(accessTtl),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async refresh(dto: {
    refreshToken: string;
  }): Promise<{ accessToken: string; expiresIn: number }> {
    const accessTtl = getEnvOrThrow('JWT_ACCESS_TOKEN_TTL');

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: getEnvOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.partnerId !== this.PartnerContext.partnerId) {
      throw new ForbiddenException('Cross-partner token is forbidden');
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: payload.sub, partnerId: payload.partnerId, role: payload.role, tokenType: 'access' },
      {
        secret: getEnvOrThrow('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: accessTtl,
      },
    );

    return {
      accessToken,
      expiresIn: parseDurationToSeconds(accessTtl),
    };
  }

  async register(dto: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
  }> {
    const email = dto.email.toLowerCase();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.create({
      email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };
  }

  async getProfile(userId: string): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    partnerId: string;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      partnerId: this.PartnerContext.partnerId,
    };
  }
}
