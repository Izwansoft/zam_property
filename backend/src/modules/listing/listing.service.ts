import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { ListingStatus, Prisma, Role } from '@prisma/client';

import { PartnerContextService } from '@core/partner-context';
import { ListingStateMachine } from '@core/workflows';
import {
  EventBusService,
  ListingPublishedEvent,
  ListingUnpublishedEvent,
  ListingExpiredEvent,
  ListingCreatedEvent,
  ListingUpdatedEvent,
  ListingArchivedEvent,
  ListingFeaturedEvent,
  ListingViewedEvent,
} from '@infrastructure/events';

import {
  ListingRepository,
  ListingView,
  ListingDetailView,
  ListingListParams,
} from './listing.repository';
import { ListingValidationHelper } from './helpers';
import { PrismaService } from '@infrastructure/database';

export interface ListingListResult {
  items: ListingView[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable({ scope: Scope.REQUEST })
export class ListingService {
  private readonly logger = new Logger(ListingService.name);

  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventBus: EventBusService,
    private readonly listingStateMachine: ListingStateMachine,
    private readonly validationHelper: ListingValidationHelper,
    private readonly prisma: PrismaService,
  ) {}

  async listListings(params: {
    page?: number;
    pageSize?: number;
    status?: ListingStatus;
    verticalType?: string;
    vendorId?: string;
    search?: string;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    state?: string;
    sortBy?: ListingListParams['sortBy'];
    sortOrder?: ListingListParams['sortOrder'];
  }): Promise<ListingListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [items, totalItems] = await Promise.all([
      this.listingRepository.list({
        skip: (page - 1) * pageSize,
        take: pageSize,
        status: params.status,
        verticalType: params.verticalType,
        vendorId: params.vendorId,
        search: params.search,
        isFeatured: params.isFeatured,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        city: params.city,
        state: params.state,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      }),
      this.listingRepository.count({
        status: params.status,
        verticalType: params.verticalType,
        vendorId: params.vendorId,
        search: params.search,
        isFeatured: params.isFeatured,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        city: params.city,
        state: params.state,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items,
      pagination: { page, pageSize, totalItems, totalPages },
    };
  }

  async getListingById(id: string): Promise<ListingView> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async getListingByIdWithDetails(id: string): Promise<ListingDetailView> {
    const listing = await this.listingRepository.findByIdWithDetails(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Emit analytics-friendly domain event (fire-and-forget)
    const viewedEvent = new ListingViewedEvent({
      payload: {
        listingId: listing.id,
        vendorId: listing.vendorId,
        verticalType: listing.verticalType,
      },
      partnerId: this.PartnerContext.partnerId,
      correlationId: this.PartnerContext.correlationId,
      actorType: 'user',
      actorId: this.PartnerContext.userId ?? undefined,
    });

    void this.eventBus.publish(viewedEvent).catch((err: unknown) => {
      const error = err as Error;
      this.logger.warn(`Failed to publish ListingViewedEvent: ${error.message}`);
    });

    return listing;
  }

  async getListingBySlug(slug: string): Promise<ListingView> {
    const listing = await this.listingRepository.findBySlug(slug);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async createListing(data: {
    vendorId: string;
    verticalType: string;
    title: string;
    description?: string;
    price?: number;
    currency?: string;
    priceType?: string;
    location?: Prisma.InputJsonValue;
    attributes?: Prisma.InputJsonValue;
    actor: {
      userId: string;
      role: Role;
    };
  }): Promise<ListingView> {
    await this.assertCreatePermission(data.actor.userId, data.actor.role, data.vendorId);

    // Validate attributes for draft (if vertical is registered and attributes provided)
    if (data.attributes && this.validationHelper.isVerticalRegistered(data.verticalType)) {
      this.validationHelper.validateOrThrow(
        data.verticalType,
        data.attributes as Record<string, unknown>,
        {
          partnerId: this.PartnerContext.partnerId,
          vendorId: data.vendorId,
          currentStatus: 'DRAFT',
        },
        'create',
      );
    }

    const slug = this.generateSlug(data.title);

    // Ensure unique slug
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.listingRepository.slugExists(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
      if (counter > 100) {
        throw new ConflictException('Unable to generate unique slug');
      }
    }

    try {
      const listing = await this.listingRepository.create({
        vendorId: data.vendorId,
        verticalType: data.verticalType,
        title: data.title,
        slug: uniqueSlug,
        description: data.description,
        price: data.price,
        currency: data.currency ?? 'MYR',
        priceType: data.priceType ?? 'FIXED',
        location: data.location,
        attributes: data.attributes,
      });

      // Emit domain event
      const event = new ListingCreatedEvent({
        payload: {
          listingId: listing.id,
          vendorId: listing.vendorId,
          verticalType: listing.verticalType,
          schemaVersion: '1.0',
          title: listing.title,
          status: 'DRAFT',
        },
        partnerId: this.PartnerContext.partnerId,
        correlationId: this.PartnerContext.correlationId,
        actorType: 'user',
        actorId: this.PartnerContext.userId ?? undefined,
      });

      await this.eventBus.publish(event);

      return listing;
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Listing already exists');
      }
      throw err;
    }
  }

  async updateListing(
    id: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      currency?: string;
      priceType?: string;
      location?: Prisma.InputJsonValue;
      attributes?: Prisma.InputJsonValue;
      isFeatured?: boolean;
      featuredUntil?: Date | null;
      expiresAt?: Date | null;
    },
  ): Promise<ListingView> {
    const existing = await this.listingRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Listing not found');
    }

    const updated = await this.listingRepository.update(id, data);
    if (!updated) {
      throw new NotFoundException('Listing not found');
    }

    // Emit domain event
    const event = new ListingUpdatedEvent({
      payload: {
        listingId: updated.id,
        vendorId: updated.vendorId,
        verticalType: updated.verticalType,
        changes: data as Record<string, unknown>,
        previousValues: {
          title: existing.title,
          price: existing.price,
          currency: existing.currency,
        } as Record<string, unknown>,
      },
      partnerId: this.PartnerContext.partnerId,
      correlationId: this.PartnerContext.correlationId,
      actorType: 'user',
      actorId: this.PartnerContext.userId ?? undefined,
    });

    await this.eventBus.publish(event);

    return updated;
  }

  async deleteListing(id: string): Promise<void> {
    const listing = await this.listingRepository.softDelete(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // TODO: Emit ListingDeletedEvent
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS WORKFLOW ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Publish a listing (DRAFT → PUBLISHED)
   */
  async publishListing(id: string, expiresAt?: Date): Promise<ListingView> {
    const listing = await this.listingRepository.findByIdWithDetails(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Validate attributes for publish (if vertical is registered)
    if (listing.attributes && this.validationHelper.isVerticalRegistered(listing.verticalType)) {
      this.validationHelper.validateOrThrow(
        listing.verticalType,
        listing.attributes as Record<string, unknown>,
        {
          partnerId: this.PartnerContext.partnerId,
          vendorId: listing.vendorId,
          currentStatus: listing.status,
        },
        'publish',
      );
    }

    // Use state machine to validate and execute transition
    const result = await this.listingStateMachine.transition(listing.status, 'publish');

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const publishedAt = new Date();
    // Default expiry: 30 days from now if not specified
    const defaultExpiresAt =
      expiresAt ?? new Date(publishedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updated = await this.listingRepository.updateStatus(id, {
      status: result.toState,
      publishedAt,
      expiresAt: defaultExpiresAt,
    });

    if (!updated) {
      throw new NotFoundException('Listing not found');
    }

    // Emit domain event
    const event = new ListingPublishedEvent({
      payload: {
        listingId: updated.id,
        vendorId: updated.vendorId,
        verticalType: updated.verticalType,
        title: updated.title,
        price: updated.price ? Number(updated.price) : undefined,
        currency: updated.currency ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        location: updated.location
          ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              country: (updated.location as any)?.country ?? '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              city: (updated.location as any)?.city ?? undefined,
            }
          : undefined,
      },
      partnerId: this.PartnerContext.partnerId,
      correlationId: this.PartnerContext.correlationId,
      actorType: 'user',
      actorId: this.PartnerContext.userId ?? undefined,
    });

    await this.eventBus.publish(event);

    return updated;
  }

  /**
   * Unpublish a listing (PUBLISHED → DRAFT)
   */
  async unpublishListing(id: string, reason: string): Promise<ListingView> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Use state machine to validate and execute transition
    const result = await this.listingStateMachine.transition(listing.status, 'unpublish');

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.listingRepository.updateStatus(id, {
      status: result.toState,
      publishedAt: null,
    });

    if (!updated) {
      throw new NotFoundException('Listing not found');
    }

    // Emit domain event
    const event = new ListingUnpublishedEvent({
      payload: {
        listingId: updated.id,
        vendorId: updated.vendorId,
        reason,
      },
      partnerId: this.PartnerContext.partnerId,
      correlationId: this.PartnerContext.correlationId,
      actorType: 'user',
      actorId: this.PartnerContext.userId ?? undefined,
    });

    await this.eventBus.publish(event);

    return updated;
  }

  /**
   * Expire a listing (PUBLISHED → EXPIRED)
   * @param id - Listing ID
   * @param reason - Optional reason for expiration
   */
  async expireListing(id: string, reason?: string): Promise<ListingView> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Use state machine to validate and execute transition
    const result = await this.listingStateMachine.transition(listing.status, 'expire');

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.listingRepository.updateStatus(id, {
      status: result.toState,
    });

    if (!updated) {
      throw new NotFoundException('Listing not found');
    }

    // Emit domain event
    const event = new ListingExpiredEvent({
      payload: {
        listingId: updated.id,
        vendorId: updated.vendorId,
        expiryDate: updated.expiresAt ?? new Date(),
        reason,
      },
      partnerId: this.PartnerContext.partnerId,
      correlationId: this.PartnerContext.correlationId,
      actorType: 'system',
    });

    await this.eventBus.publish(event);

    return updated;
  }

  /**
   * Archive a listing (DRAFT | PUBLISHED | EXPIRED → ARCHIVED)
   */
  async archiveListing(id: string, reason?: string): Promise<ListingView> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Use state machine to validate and execute transition
    const result = await this.listingStateMachine.transition(listing.status, 'archive');

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.listingRepository.updateStatus(id, {
      status: result.toState,
    });

    if (!updated) {
      throw new NotFoundException('Listing not found');
    }

    // Emit domain event
    const event = new ListingArchivedEvent({
      payload: {
        listingId: updated.id,
        vendorId: updated.vendorId,
        reason: reason ?? 'Archived by user',
      },
      partnerId: this.PartnerContext.partnerId,
      correlationId: this.PartnerContext.correlationId,
      actorType: 'user',
      actorId: this.PartnerContext.userId ?? undefined,
    });

    await this.eventBus.publish(event);

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FEATURED LISTING ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Feature a listing
   */
  async featureListing(id: string, featuredUntil: Date): Promise<ListingView> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (featuredUntil <= new Date()) {
      throw new BadRequestException('Featured until date must be in the future');
    }

    const updated = await this.listingRepository.update(id, {
      isFeatured: true,
      featuredUntil,
    });

    if (!updated) {
      throw new NotFoundException('Listing not found');
    }

    // Emit domain event
    const event = new ListingFeaturedEvent({
      payload: {
        listingId: updated.id,
        vendorId: updated.vendorId,
        featuredUntil: updated.featuredUntil ?? new Date(),
        placement: undefined,
      },
      partnerId: this.PartnerContext.partnerId,
      correlationId: this.PartnerContext.correlationId,
      actorType: 'user',
      actorId: this.PartnerContext.userId ?? undefined,
    });

    await this.eventBus.publish(event);

    return updated;
  }

  /**
   * Remove featured status from a listing
   */
  async unfeatureListing(id: string): Promise<ListingView> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const updated = await this.listingRepository.update(id, {
      isFeatured: false,
      featuredUntil: null,
    });

    if (!updated) {
      throw new NotFoundException('Listing not found');
    }

    // TODO: Emit ListingUnfeaturedEvent

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW COUNT
  // ─────────────────────────────────────────────────────────────────────────

  async incrementViewCount(id: string): Promise<void> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    await this.listingRepository.incrementViewCount(id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR LISTINGS
  // ─────────────────────────────────────────────────────────────────────────

  async getVendorListings(
    vendorId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<ListingListResult> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    const [items, totalItems] = await Promise.all([
      this.listingRepository.findByVendorId(vendorId, {
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.listingRepository.countByVendorId(vendorId),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items,
      pagination: { page, pageSize, totalItems, totalPages },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private async assertCreatePermission(userId: string, role: Role, vendorId: string): Promise<void> {
    if (role === Role.SUPER_ADMIN || role === Role.PARTNER_ADMIN) {
      return;
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id: vendorId,
        partnerId: this.PartnerContext.partnerId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const vendorMembership = await this.prisma.userVendor.findUnique({
      where: {
        userId_vendorId: { userId, vendorId },
      },
      select: { userId: true },
    });

    if (role === Role.VENDOR_ADMIN) {
      if (!vendorMembership) {
        throw new ForbiddenException('Vendor admin can only submit listings for assigned vendors');
      }
      return;
    }

    if (role === Role.COMPANY_ADMIN) {
      const companyAdmin = await this.prisma.companyAdmin.findFirst({
        where: {
          userId,
          company: {
            partnerId: this.PartnerContext.partnerId,
            deletedAt: null,
          },
        },
        select: { id: true },
      });

      if (!companyAdmin) {
        throw new ForbiddenException('Company admin profile not found for this partner');
      }

      if (!vendorMembership) {
        throw new ForbiddenException('Company admin can only submit listings for assigned vendors');
      }

      return;
    }

    if (role === Role.AGENT) {
      const agentProfile = await this.prisma.agent.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          company: {
            partnerId: this.PartnerContext.partnerId,
            deletedAt: null,
          },
        },
        select: { id: true },
      });

      if (!agentProfile) {
        throw new ForbiddenException('Agent profile not found or inactive for this partner');
      }

      if (!vendorMembership) {
        throw new ForbiddenException('Agent can only submit listings for assigned vendors');
      }

      return;
    }

    throw new ForbiddenException('You are not allowed to submit listings');
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
