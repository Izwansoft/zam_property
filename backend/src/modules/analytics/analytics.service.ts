import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

import { PartnerContextService } from '@core/partner-context';
import { PrismaService } from '@infrastructure/database';

export type AuthUser = {
  sub: string;
  partnerId: string;
  role: Role;
};

function parseDateOnlyOrThrow(value: string): Date {
  // Interpret YYYY-MM-DD as UTC midnight.
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (!match) {
    throw new BadRequestException(`Invalid date format: ${value}. Expected YYYY-MM-DD.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Date(Date.UTC(year, month - 1, day));
}

function defaultDateRange(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    start: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())),
    end: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())),
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
  ) {}

  private async resolveVendorIdOrThrow(
    user: AuthUser,
    requestedVendorId?: string,
  ): Promise<string> {
    if (user.role === Role.SUPER_ADMIN || user.role === Role.PARTNER_ADMIN) {
      if (!requestedVendorId) {
        throw new BadRequestException('vendorId is required');
      }
      return requestedVendorId;
    }

    // Vendor roles: resolve primary vendor from UserVendor junction table
    const primaryVendor = await this.prisma.userVendor.findFirst({
      where: { userId: user.sub, isPrimary: true },
      select: { vendorId: true },
    });

    if (!primaryVendor) {
      throw new ForbiddenException('Vendor context missing for this user');
    }

    if (requestedVendorId && requestedVendorId !== primaryVendor.vendorId) {
      // Check if user has membership in the requested vendor
      const membership = await this.prisma.userVendor.findUnique({
        where: { userId_vendorId: { userId: user.sub, vendorId: requestedVendorId } },
      });
      if (!membership) {
        throw new ForbiddenException('Cannot access other vendor analytics');
      }
      return requestedVendorId;
    }

    return primaryVendor.vendorId;
  }

  private parseRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    const fallback = defaultDateRange();

    const start = startDate ? parseDateOnlyOrThrow(startDate) : fallback.start;
    const end = endDate ? parseDateOnlyOrThrow(endDate) : fallback.end;

    if (start > end) {
      throw new BadRequestException('startDate must be <= endDate');
    }

    return { start, end };
  }

  async getTenantOverview(
    user: AuthUser,
    query: { startDate?: string; endDate?: string },
  ): Promise<{
    startDate: string;
    endDate: string;
    totals: {
      viewsCount: number;
      leadsCount: number;
      enquiriesCount: number;
      bookingsCount: number;
    };
  }> {
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.PARTNER_ADMIN) {
      throw new ForbiddenException('Insufficient role');
    }

    const { start, end } = this.parseRange(query.startDate, query.endDate);

    const aggregated = await this.prisma.listingStats.aggregate({
      where: {
        partnerId: this.PartnerContext.partnerId,
        date: { gte: start, lte: end },
      },
      _sum: {
        viewsCount: true,
        leadsCount: true,
        enquiriesCount: true,
        bookingsCount: true,
      },
    });

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      totals: {
        viewsCount: aggregated._sum.viewsCount ?? 0,
        leadsCount: aggregated._sum.leadsCount ?? 0,
        enquiriesCount: aggregated._sum.enquiriesCount ?? 0,
        bookingsCount: aggregated._sum.bookingsCount ?? 0,
      },
    };
  }

  async getVendorOverview(
    user: AuthUser,
    query: { vendorId?: string; startDate?: string; endDate?: string },
  ): Promise<{
    vendorId: string;
    startDate: string;
    endDate: string;
    totals: {
      viewsCount: number;
      leadsCount: number;
      enquiriesCount: number;
      bookingsCount: number;
    };
  }> {
    const vendorId = await this.resolveVendorIdOrThrow(user, query.vendorId);
    const { start, end } = this.parseRange(query.startDate, query.endDate);

    const aggregated = await this.prisma.vendorStats.aggregate({
      where: {
        partnerId: this.PartnerContext.partnerId,
        vendorId,
        date: { gte: start, lte: end },
      },
      _sum: {
        viewsCount: true,
        leadsCount: true,
        enquiriesCount: true,
        bookingsCount: true,
      },
    });

    return {
      vendorId,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      totals: {
        viewsCount: aggregated._sum.viewsCount ?? 0,
        leadsCount: aggregated._sum.leadsCount ?? 0,
        enquiriesCount: aggregated._sum.enquiriesCount ?? 0,
        bookingsCount: aggregated._sum.bookingsCount ?? 0,
      },
    };
  }

  async getVendorListings(
    user: AuthUser,
    query: { vendorId?: string; startDate?: string; endDate?: string },
  ): Promise<{
    vendorId: string;
    startDate: string;
    endDate: string;
    items: Array<{
      listingId: string;
      verticalType: string;
      viewsCount: number;
      leadsCount: number;
      enquiriesCount: number;
      bookingsCount: number;
    }>;
  }> {
    const vendorId = await this.resolveVendorIdOrThrow(user, query.vendorId);
    const { start, end } = this.parseRange(query.startDate, query.endDate);

    const rows = await this.prisma.listingStats.groupBy({
      by: ['listingId', 'verticalType'],
      where: {
        partnerId: this.PartnerContext.partnerId,
        vendorId,
        date: { gte: start, lte: end },
      },
      _sum: {
        viewsCount: true,
        leadsCount: true,
        enquiriesCount: true,
        bookingsCount: true,
      },
      orderBy: { _sum: { viewsCount: 'desc' } },
    });

    return {
      vendorId,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      items: rows.map((r) => ({
        listingId: r.listingId,
        verticalType: r.verticalType,
        viewsCount: r._sum.viewsCount ?? 0,
        leadsCount: r._sum.leadsCount ?? 0,
        enquiriesCount: r._sum.enquiriesCount ?? 0,
        bookingsCount: r._sum.bookingsCount ?? 0,
      })),
    };
  }
}
