import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AccountRepository, SavedListingView, UserSettingsView } from './account.repository';

@Injectable({ scope: Scope.REQUEST })
export class AccountService {
  constructor(private readonly repo: AccountRepository) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Change password
  // ─────────────────────────────────────────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    if (newPassword === currentPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const user = await this.repo.findUserWithPasswordHash(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await this.repo.updatePasswordHash(userId, hash);

    return { message: 'Password changed successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Delete account (soft)
  // ─────────────────────────────────────────────────────────────────────────

  async deleteAccount(
    userId: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.repo.findUserWithPasswordHash(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    await this.repo.softDeleteUser(userId);

    return { message: 'Account deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Saved Listings
  // ─────────────────────────────────────────────────────────────────────────

  async listSavedListings(
    userId: string,
    params: { page: number; pageSize: number; search?: string },
  ): Promise<{
    data: SavedListingView[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const skip = (params.page - 1) * params.pageSize;
    const [data, total] = await Promise.all([
      this.repo.listSavedListings(userId, {
        skip,
        take: params.pageSize,
        search: params.search,
      }),
      this.repo.countSavedListings(userId, params.search),
    ]);

    return {
      data,
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  }

  async saveListing(userId: string, listingId: string) {
    const existing = await this.repo.findSavedListing(userId, listingId);
    if (existing) {
      throw new ConflictException('Listing already saved');
    }

    return this.repo.saveListing(userId, listingId);
  }

  async unsaveListing(userId: string, listingId: string) {
    const result = await this.repo.unsaveListing(userId, listingId);
    if (!result) {
      throw new NotFoundException('Saved listing not found');
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────────────────────────────────

  async getSettings(userId: string): Promise<UserSettingsView> {
    return this.repo.getSettings(userId);
  }

  async updateSettings(
    userId: string,
    data: {
      language?: string;
      timezone?: string;
      privacy?: {
        showProfile?: boolean;
        showEmail?: boolean;
        showPhone?: boolean;
      };
    },
  ): Promise<UserSettingsView> {
    return this.repo.upsertSettings(userId, {
      language: data.language,
      timezone: data.timezone,
      showProfile: data.privacy?.showProfile,
      showEmail: data.privacy?.showEmail,
      showPhone: data.privacy?.showPhone,
    });
  }
}
