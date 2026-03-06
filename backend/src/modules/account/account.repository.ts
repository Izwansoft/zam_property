import { Injectable, Scope } from '@nestjs/common';

import { PrismaService } from '@infrastructure/database';
import { BasePartnerRepository, PartnerContextService } from '@core/partner-context';

// ---------------------------------------------------------------------------
// View types
// ---------------------------------------------------------------------------

export interface SavedListingView {
  id: string;
  listingId: string;
  title: string;
  price: number | null;
  currency: string;
  location: string | null;
  primaryImage: string | null;
  status: string;
  savedAt: Date;
}

export interface UserSettingsView {
  language: string;
  timezone: string;
  privacy: {
    showProfile: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

@Injectable({ scope: Scope.REQUEST })
export class AccountRepository extends BasePartnerRepository {
  constructor(prisma: PrismaService, PartnerContext: PartnerContextService) {
    super(prisma, PartnerContext);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Password management
  // ─────────────────────────────────────────────────────────────────────────

  async findUserWithPasswordHash(userId: string) {
    return this.prisma.user.findFirst({
      where: this.scopeWhere({ id: userId, deletedAt: null }),
      select: {
        id: true,
        email: true,
        passwordHash: true,
        status: true,
      },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account deletion (soft delete)
  // ─────────────────────────────────────────────────────────────────────────

  async softDeleteUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'DEACTIVATED',
        deletedAt: new Date(),
      },
      select: { id: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Saved Listings
  // ─────────────────────────────────────────────────────────────────────────

  async listSavedListings(
    userId: string,
    params: { skip: number; take: number; search?: string },
  ): Promise<SavedListingView[]> {
    const results = await this.prisma.savedListing.findMany({
      where: {
        ...this.scopeWhere({}),
        userId,
        ...(params.search
          ? { listing: { title: { contains: params.search, mode: 'insensitive' as const } } }
          : {}),
      },
      select: {
        id: true,
        listingId: true,
        createdAt: true,
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            location: true,
            status: true,
            media: {
              where: { isPrimary: true },
              select: { cdnUrl: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });

    return results.map((r) => ({
      id: r.id,
      listingId: r.listing.id,
      title: r.listing.title,
      price: r.listing.price ? Number(r.listing.price) : null,
      currency: r.listing.currency,
      location: r.listing.location ? JSON.stringify(r.listing.location) : null,
      primaryImage: r.listing.media[0]?.cdnUrl ?? null,
      status: r.listing.status,
      savedAt: r.createdAt,
    }));
  }

  async countSavedListings(userId: string, search?: string): Promise<number> {
    return this.prisma.savedListing.count({
      where: {
        ...this.scopeWhere({}),
        userId,
        ...(search
          ? { listing: { title: { contains: search, mode: 'insensitive' as const } } }
          : {}),
      },
    });
  }

  async saveListing(userId: string, listingId: string) {
    return this.prisma.savedListing.create({
      data: this.scopeCreateData({
        userId,
        listingId,
      }),
      select: { id: true, listingId: true, createdAt: true },
    });
  }

  async findSavedListing(userId: string, listingId: string) {
    return this.prisma.savedListing.findFirst({
      where: {
        ...this.scopeWhere({}),
        userId,
        listingId,
      },
      select: { id: true },
    });
  }

  async unsaveListing(userId: string, listingId: string) {
    const saved = await this.findSavedListing(userId, listingId);
    if (!saved) return null;

    return this.prisma.savedListing.delete({
      where: { id: saved.id },
      select: { id: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // User Settings
  // ─────────────────────────────────────────────────────────────────────────

  async getSettings(userId: string): Promise<UserSettingsView> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: {
        language: true,
        timezone: true,
        showProfile: true,
        showEmail: true,
        showPhone: true,
      },
    });

    if (!settings) {
      // Return defaults
      return {
        language: 'en',
        timezone: 'Asia/Kuala_Lumpur',
        privacy: {
          showProfile: true,
          showEmail: false,
          showPhone: false,
        },
      };
    }

    return {
      language: settings.language,
      timezone: settings.timezone,
      privacy: {
        showProfile: settings.showProfile,
        showEmail: settings.showEmail,
        showPhone: settings.showPhone,
      },
    };
  }

  async upsertSettings(
    userId: string,
    data: {
      language?: string;
      timezone?: string;
      showProfile?: boolean;
      showEmail?: boolean;
      showPhone?: boolean;
    },
  ): Promise<UserSettingsView> {
    const result = await this.prisma.userSettings.upsert({
      where: { userId },
      create: this.scopeCreateData({
        userId,
        language: data.language ?? 'en',
        timezone: data.timezone ?? 'Asia/Kuala_Lumpur',
        showProfile: data.showProfile ?? true,
        showEmail: data.showEmail ?? false,
        showPhone: data.showPhone ?? false,
      }),
      update: {
        ...(data.language !== undefined ? { language: data.language } : {}),
        ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
        ...(data.showProfile !== undefined ? { showProfile: data.showProfile } : {}),
        ...(data.showEmail !== undefined ? { showEmail: data.showEmail } : {}),
        ...(data.showPhone !== undefined ? { showPhone: data.showPhone } : {}),
      },
      select: {
        language: true,
        timezone: true,
        showProfile: true,
        showEmail: true,
        showPhone: true,
      },
    });

    return {
      language: result.language,
      timezone: result.timezone,
      privacy: {
        showProfile: result.showProfile,
        showEmail: result.showEmail,
        showPhone: result.showPhone,
      },
    };
  }
}
