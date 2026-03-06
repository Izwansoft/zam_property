import { ConflictException, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Role, UserStatus } from '@prisma/client';

import { UserRepository } from './user.repository';

type UserView = {
  id: string;
  partnerId: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async listUsers(params: { page?: number; pageSize?: number }): Promise<{
    items: UserView[];
    pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  }> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [items, totalItems] = await Promise.all([
      this.userRepository.list({
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.userRepository.count(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items,
      pagination: { page, pageSize, totalItems, totalPages },
    };
  }

  async getUserById(id: string): Promise<UserView> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    role: Role;
    status: UserStatus;
  }): Promise<UserView> {
    try {
      return await this.userRepository.create({
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        status: data.status,
      });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
  }

  async updateUser(
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      role?: Role;
      status?: UserStatus;
    },
  ): Promise<UserView> {
    const updated = await this.userRepository.update(id, data);
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }

  async deactivateUser(id: string): Promise<UserView> {
    const updated = await this.userRepository.deactivate(id);
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }
}
