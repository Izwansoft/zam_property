import { Injectable, Scope } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import type { Role } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';
import { BasePartnerRepository, PartnerContextService } from '@core/partner-context';

@Injectable({ scope: Scope.REQUEST })
export class UserRepository extends BasePartnerRepository {
  constructor(prisma: PrismaService, PartnerContext: PartnerContextService) {
    super(prisma, PartnerContext);
  }

  async findByEmail(email: string): Promise<{
    id: string;
    partnerId: string;
    email: string;
    passwordHash: string;
    fullName: string;
    phone: string | null;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return this.prisma.user.findFirst({
      where: this.scopeWhere({ email, deletedAt: null }),
      select: {
        id: true,
        partnerId: true,
        email: true,
        passwordHash: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string): Promise<{
    id: string;
    partnerId: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return this.prisma.user.findFirst({
      where: this.scopeWhere({ id, deletedAt: null }),
      select: {
        id: true,
        partnerId: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async list(params: { skip: number; take: number }): Promise<
    Array<{
      id: string;
      partnerId: string;
      email: string;
      fullName: string;
      phone: string | null;
      role: Role;
      status: UserStatus;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    return this.prisma.user.findMany({
      where: this.scopeWhere({ deletedAt: null }),
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        partnerId: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async count(): Promise<number> {
    return this.prisma.user.count({
      where: this.scopeWhere({ deletedAt: null }),
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    role: Role;
    status: UserStatus;
  }): Promise<{
    id: string;
    partnerId: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return this.prisma.user.create({
      data: this.scopeCreateData({
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        status: data.status,
      }),
      select: {
        id: true,
        partnerId: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: { fullName?: string; phone?: string; role?: Role; status?: UserStatus },
  ): Promise<{
    id: string;
    partnerId: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    const exists = await this.prisma.user.findFirst({
      where: this.scopeWhere({ id, deletedAt: null }),
      select: { id: true },
    });
    if (!exists) {
      return null;
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      select: {
        id: true,
        partnerId: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deactivate(id: string): Promise<{
    id: string;
    partnerId: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    const exists = await this.prisma.user.findFirst({
      where: this.scopeWhere({ id, deletedAt: null }),
      select: { id: true },
    });
    if (!exists) {
      return null;
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DEACTIVATED },
      select: {
        id: true,
        partnerId: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
