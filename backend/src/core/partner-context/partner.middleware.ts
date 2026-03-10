import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

import { PrismaService } from '@infrastructure/database';

import type { PartnerContext } from './partner-context.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class PartnerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PartnerMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const headerpartnerId = this.getHeaderValue(req, 'X-Partner-ID');

    const hostHeader =
      this.getHeaderValue(req, 'x-forwarded-host') ??
      (typeof req.headers.host === 'string' ? req.headers.host : undefined);

    const domain = this.normalizeHost(hostHeader);

    const { identifier, source } = this.pickpartnerIdentifier(headerpartnerId, domain);

    const partner = await this.resolveTenant(identifier, source, domain);

    if (partner.status !== 'ACTIVE') {
      throw new ForbiddenException('Partner is not active');
    }

    // Generate correlation ID for request tracing (or use existing from header)
    const correlationId =
      this.getHeaderValue(req, 'x-correlation-id') ??
      this.getHeaderValue(req, 'x-request-id') ??
      randomUUID();

    // Extract user ID from request (set by auth middleware if authenticated)
    const userId = (req as { user?: { sub?: string } }).user?.sub;

    req.PartnerContext = {
      partnerId: partner.id,
      partnerSlug: partner.slug,
      domain,
      source,
      correlationId,
      userId,
    } satisfies PartnerContext;

    next();
  }

  private pickpartnerIdentifier(
    headerpartnerId: string | undefined,
    domain: string | undefined,
  ): { identifier: string; source: 'header' | 'host' } {
    if (headerpartnerId) {
      return { identifier: headerpartnerId, source: 'header' };
    }

    if (domain && domain !== 'localhost') {
      return { identifier: domain, source: 'host' };
    }

    throw new BadRequestException(
      'Partner identifier missing. Provide X-Partner-ID header or use a partner subdomain.',
    );
  }

  private async resolveTenant(
    identifier: string,
    source: 'header' | 'host',
    domain: string | undefined,
  ): Promise<{ id: string; slug: string; status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' }> {
    if (source === 'header') {
      const byId = UUID_REGEX.test(identifier)
        ? await this.prisma.partner.findFirst({
            where: { id: identifier, deletedAt: null },
            select: { id: true, slug: true, status: true },
          })
        : null;

      if (byId) {
        return byId;
      }

      const bySlug = await this.prisma.partner.findFirst({
        where: { slug: identifier, deletedAt: null },
        select: { id: true, slug: true, status: true },
      });

      if (!bySlug) {
        throw new NotFoundException('Partner not found');
      }

      return bySlug;
    }

    const byDomain = await this.prisma.partner.findFirst({
      where: {
        deletedAt: null,
        domains: {
          some: {
            domain: identifier,
            verified: true,
          },
        },
      },
      select: { id: true, slug: true, status: true },
    });

    if (byDomain) {
      return byDomain;
    }

    const subdomainSlug = this.extractSubdomainSlug(domain);
    if (subdomainSlug) {
      const bySlug = await this.prisma.partner.findFirst({
        where: { slug: subdomainSlug, deletedAt: null },
        select: { id: true, slug: true, status: true },
      });

      if (bySlug) {
        return bySlug;
      }
    }

    throw new NotFoundException('Partner not found');
  }

  private extractSubdomainSlug(domain: string | undefined): string | undefined {
    if (!domain) {
      return undefined;
    }

    if (domain === 'localhost') {
      return undefined;
    }

    const parts = domain.split('.').filter(Boolean);
    if (parts.length < 2) {
      return undefined;
    }

    return parts[0];
  }

  private normalizeHost(hostHeader: string | undefined): string | undefined {
    if (!hostHeader) {
      return undefined;
    }

    const first = hostHeader.split(',')[0]?.trim();
    if (!first) {
      return undefined;
    }

    return first.split(':')[0]?.trim();
  }

  private getHeaderValue(req: Request, headerName: string): string | undefined {
    const raw = req.headers[headerName.toLowerCase()];
    if (typeof raw === 'string') {
      return raw.trim() || undefined;
    }

    if (Array.isArray(raw)) {
      const first = raw[0]?.trim();
      return first || undefined;
    }

    return undefined;
  }
}
