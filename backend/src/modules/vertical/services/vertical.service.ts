/**
 * Vertical Service
 * Part 8 - Vertical Module Contract
 *
 * Manages vertical definitions and partner-vertical enablement.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';

import { PartnerContextService } from '@core/partner-context';
import { VerticalDefinitionRepository } from '../repositories/vertical-definition.repository';
import { PartnerVerticalRepository } from '../repositories/partner-vertical.repository';
import {
  CreateVerticalDefinitionDto,
  UpdateVerticalDefinitionDto,
  EnableVerticalDto,
  UpdatePartnerVerticalDto,
  VerticalQueryDto,
  PartnerVerticalQueryDto,
} from '../dto/vertical.dto';

@Injectable()
export class VerticalService {
  private readonly logger = new Logger(VerticalService.name);

  constructor(
    private readonly verticalDefinitionRepo: VerticalDefinitionRepository,
    private readonly PartnerVerticalRepo: PartnerVerticalRepository,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // VERTICAL DEFINITION MANAGEMENT (Platform-level, SUPER_ADMIN only)
  // ─────────────────────────────────────────────────────────────────────────────

  async createVerticalDefinition(dto: CreateVerticalDefinitionDto) {
    // Check if type already exists
    const existing = await this.verticalDefinitionRepo.findByType(dto.type);
    if (existing) {
      throw new ConflictException(`Vertical type '${dto.type}' already exists`);
    }

    // Validate schemas
    this.validateAttributeSchema(dto.attributeSchema);
    this.validateValidationRules(dto.validationRules);
    this.validateSearchMapping(dto.searchMapping);

    const vertical = await this.verticalDefinitionRepo.create({
      type: dto.type,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      attributeSchema: dto.attributeSchema as Prisma.InputJsonValue,
      validationRules: dto.validationRules as Prisma.InputJsonValue,
      searchMapping: dto.searchMapping as Prisma.InputJsonValue,
      supportedStatuses: dto.supportedStatuses,
      displayMetadata: dto.displayMetadata as Prisma.InputJsonValue | undefined,
      schemaVersion: dto.schemaVersion,
      isActive: dto.isActive ?? true,
      isCore: dto.isCore ?? false,
    });

    this.logger.log(`Created vertical definition: ${vertical.type}`);

    this.eventEmitter.emit('vertical.created', {
      verticalId: vertical.id,
      verticalType: vertical.type,
      timestamp: new Date(),
    });

    return vertical;
  }

  async getAllVerticalDefinitions(query?: VerticalQueryDto) {
    return this.verticalDefinitionRepo.findMany({
      isActive: query?.isActive,
      isCore: query?.isCore,
    });
  }

  async getActiveVerticalDefinitions() {
    return this.verticalDefinitionRepo.findActive();
  }

  async getVerticalDefinitionById(id: string) {
    const vertical = await this.verticalDefinitionRepo.findById(id);
    if (!vertical) {
      throw new NotFoundException(`Vertical definition with ID '${id}' not found`);
    }
    return vertical;
  }

  async getVerticalDefinitionByType(type: string) {
    const vertical = await this.verticalDefinitionRepo.findByType(type);
    if (!vertical) {
      throw new NotFoundException(`Vertical type '${type}' not found`);
    }
    return vertical;
  }

  async updateVerticalDefinition(id: string, dto: UpdateVerticalDefinitionDto) {
    const vertical = await this.getVerticalDefinitionById(id);

    // Validate schemas if provided
    if (dto.attributeSchema) {
      this.validateAttributeSchema(dto.attributeSchema);
    }
    if (dto.validationRules) {
      this.validateValidationRules(dto.validationRules);
    }
    if (dto.searchMapping) {
      this.validateSearchMapping(dto.searchMapping);
    }

    const updated = await this.verticalDefinitionRepo.update(id, {
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      attributeSchema: dto.attributeSchema as Prisma.InputJsonValue | undefined,
      validationRules: dto.validationRules as Prisma.InputJsonValue | undefined,
      searchMapping: dto.searchMapping as Prisma.InputJsonValue | undefined,
      supportedStatuses: dto.supportedStatuses,
      displayMetadata: dto.displayMetadata as Prisma.InputJsonValue | undefined,
      schemaVersion: dto.schemaVersion,
      isActive: dto.isActive,
      isCore: dto.isCore,
    });

    this.logger.log(`Updated vertical definition: ${vertical.type}`);

    this.eventEmitter.emit('vertical.updated', {
      verticalId: updated.id,
      verticalType: updated.type,
      timestamp: new Date(),
    });

    return updated;
  }

  async activateVerticalDefinition(id: string) {
    const vertical = await this.getVerticalDefinitionById(id);

    const updated = await this.verticalDefinitionRepo.activate(id);

    this.logger.log(`Activated vertical definition: ${vertical.type}`);

    this.eventEmitter.emit('vertical.activated', {
      verticalId: updated.id,
      verticalType: updated.type,
      timestamp: new Date(),
    });

    return updated;
  }

  async deactivateVerticalDefinition(id: string) {
    const vertical = await this.getVerticalDefinitionById(id);

    if (vertical.isCore) {
      throw new BadRequestException(`Cannot deactivate core vertical: ${vertical.type}`);
    }

    const updated = await this.verticalDefinitionRepo.deactivate(id);

    this.logger.log(`Deactivated vertical definition: ${vertical.type}`);

    this.eventEmitter.emit('vertical.deactivated', {
      verticalId: updated.id,
      verticalType: updated.type,
      timestamp: new Date(),
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAINTENANCE MODE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Set maintenance mode for a vertical.
   * When enabled, all partner portals and public pages for this vertical
   * will show a maintenance message. Super Admin portal is NOT affected.
   */
  async setMaintenanceMode(
    id: string,
    enabled: boolean,
    userId: string,
    options?: {
      startAt?: Date;
      endAt?: Date;
      message?: string;
    },
  ) {
    const vertical = await this.getVerticalDefinitionById(id);

    const updated = await this.verticalDefinitionRepo.update(id, {
      maintenanceMode: enabled,
      maintenanceStartAt: enabled ? options?.startAt ?? new Date() : null,
      maintenanceEndAt: enabled ? options?.endAt ?? null : null,
      maintenanceMessage: enabled ? options?.message ?? null : null,
      maintenanceScheduledBy: enabled ? userId : null,
    });

    this.logger.log(
      `${enabled ? 'Enabled' : 'Disabled'} maintenance mode for vertical: ${vertical.type}`,
    );

    this.eventEmitter.emit('vertical.maintenance', {
      verticalId: updated.id,
      verticalType: updated.type,
      maintenanceMode: enabled,
      startAt: updated.maintenanceStartAt,
      endAt: updated.maintenanceEndAt,
      message: updated.maintenanceMessage,
      scheduledBy: userId,
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Get maintenance status for a vertical (public endpoint).
   * Used by all portals and public pages to check if they should show maintenance page.
   */
  async getMaintenanceStatus(verticalType: string) {
    const vertical = await this.verticalDefinitionRepo.findByType(verticalType);
    if (!vertical) {
      throw new NotFoundException(`Vertical type '${verticalType}' not found`);
    }

    const now = new Date();
    
    // Check if maintenance is active:
    // 1. maintenanceMode must be enabled
    // 2. startAt must be in the past (or not set)
    // 3. endAt must be in the future (or not set - indefinite maintenance)
    const isUnderMaintenance =
      vertical.maintenanceMode &&
      (!vertical.maintenanceStartAt || new Date(vertical.maintenanceStartAt) <= now) &&
      (!vertical.maintenanceEndAt || new Date(vertical.maintenanceEndAt) > now);

    let estimatedRemainingMs: number | null = null;
    if (isUnderMaintenance && vertical.maintenanceEndAt) {
      const endTime = new Date(vertical.maintenanceEndAt).getTime();
      const remaining = endTime - now.getTime();
      estimatedRemainingMs = remaining > 0 ? remaining : null;
    }

    return {
      type: vertical.type,
      name: vertical.name,
      isUnderMaintenance,
      message: isUnderMaintenance ? vertical.maintenanceMessage : null,
      startAt: vertical.maintenanceStartAt,
      endAt: vertical.maintenanceEndAt,
      estimatedRemainingMs,
    };
  }

  /**
   * Get maintenance status for all verticals (used by frontend to check multiple).
   */
  async getAllMaintenanceStatuses() {
    const verticals = await this.verticalDefinitionRepo.findMany({});
    const now = new Date();

    return verticals.map((vertical) => {
      // Check if maintenance is active:
      // 1. maintenanceMode must be enabled
      // 2. startAt must be in the past (or not set)
      // 3. endAt must be in the future (or not set - indefinite maintenance)
      const isUnderMaintenance =
        vertical.maintenanceMode &&
        (!vertical.maintenanceStartAt || new Date(vertical.maintenanceStartAt) <= now) &&
        (!vertical.maintenanceEndAt || new Date(vertical.maintenanceEndAt) > now);

      let estimatedRemainingMs: number | null = null;
      if (isUnderMaintenance && vertical.maintenanceEndAt) {
        const endTime = new Date(vertical.maintenanceEndAt).getTime();
        const remaining = endTime - now.getTime();
        estimatedRemainingMs = remaining > 0 ? remaining : null;
      }

      return {
        type: vertical.type,
        name: vertical.name,
        isUnderMaintenance,
        message: isUnderMaintenance ? vertical.maintenanceMessage : null,
        startAt: vertical.maintenanceStartAt,
        endAt: vertical.maintenanceEndAt,
        estimatedRemainingMs,
      };
    });
  }

  async deleteVerticalDefinition(id: string) {
    const vertical = await this.getVerticalDefinitionById(id);

    if (vertical.isCore) {
      throw new BadRequestException(`Cannot delete core vertical: ${vertical.type}`);
    }

    // Check if any tenants are using this vertical
    const usageCount = await this.verticalDefinitionRepo.countTenantUsage(id);
    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete vertical: ${usageCount} partner(s) are using it. Deactivate first.`,
      );
    }

    await this.verticalDefinitionRepo.delete(id);

    this.logger.log(`Deleted vertical definition: ${vertical.type}`);

    this.eventEmitter.emit('vertical.deleted', {
      verticalId: id,
      verticalType: vertical.type,
      timestamp: new Date(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TENANT VERTICAL MANAGEMENT (Partner-level)
  // ─────────────────────────────────────────────────────────────────────────────

  async enableVerticalForTenant(dto: EnableVerticalDto) {
    const partnerId = this.PartnerContext.partnerId;

    if (!partnerId) {
      throw new BadRequestException('Partner context required');
    }

    // Get vertical definition
    const vertical = await this.verticalDefinitionRepo.findByType(dto.verticalType);
    if (!vertical) {
      throw new NotFoundException(`Vertical type '${dto.verticalType}' not found`);
    }

    if (!vertical.isActive) {
      throw new BadRequestException(`Vertical '${dto.verticalType}' is not active`);
    }

    // Check if already enabled
    const existing = await this.PartnerVerticalRepo.findByTenantAndVertical(partnerId, vertical.id);
    if (existing) {
      if (existing.isEnabled) {
        throw new ConflictException(
          `Vertical '${dto.verticalType}' is already enabled for this partner`,
        );
      }
      // Re-enable existing record
      const updated = await this.PartnerVerticalRepo.enable(existing.id);

      await this.PartnerVerticalRepo.syncTenantEnabledVerticals(partnerId);

      this.logger.log(`Re-enabled vertical '${dto.verticalType}' for partner ${partnerId}`);

      this.eventEmitter.emit('vertical.enabled', {
        partnerId,
        verticalType: dto.verticalType,
        verticalId: vertical.id,
        timestamp: new Date(),
      });

      return updated;
    }

    // Create new partner vertical
    const PartnerVertical = await this.PartnerVerticalRepo.create({
      partnerId,
      verticalId: vertical.id,
      configOverrides: dto.configOverrides as Prisma.InputJsonValue | undefined,
      customFields: dto.customFields as Prisma.InputJsonValue | undefined,
      listingLimit: dto.listingLimit,
      isEnabled: true,
    });

    await this.PartnerVerticalRepo.syncTenantEnabledVerticals(partnerId);

    this.logger.log(`Enabled vertical '${dto.verticalType}' for partner ${partnerId}`);

    this.eventEmitter.emit('vertical.enabled', {
      partnerId,
      verticalType: dto.verticalType,
      verticalId: vertical.id,
      timestamp: new Date(),
    });

    return PartnerVertical;
  }

  async getPartnerVerticals(query?: PartnerVerticalQueryDto) {
    const partnerId = this.PartnerContext.partnerId;

    if (!partnerId) {
      throw new BadRequestException('Partner context required');
    }

    return this.PartnerVerticalRepo.findByTenant(partnerId, {
      isEnabled: query?.isEnabled,
      verticalType: query?.verticalType,
    });
  }

  async getEnabledVerticalsForTenant() {
    const partnerId = this.PartnerContext.partnerId;
    if (!partnerId) {
      throw new BadRequestException('Partner context required');
    }
    return this.PartnerVerticalRepo.findEnabledByTenant(partnerId);
  }

  async getPartnerVerticalById(id: string) {
    const partnerId = this.PartnerContext.partnerId;

    if (!partnerId) {
      throw new BadRequestException('Partner context required');
    }

    const PartnerVertical = await this.PartnerVerticalRepo.findById(id);
    if (!PartnerVertical || PartnerVertical.partnerId !== partnerId) {
      throw new NotFoundException(`Partner vertical with ID '${id}' not found`);
    }

    return PartnerVertical;
  }

  async updatePartnerVertical(id: string, dto: UpdatePartnerVerticalDto) {
    const PartnerVertical = await this.getPartnerVerticalById(id);

    const updated = await this.PartnerVerticalRepo.update(id, {
      configOverrides: dto.configOverrides as Prisma.InputJsonValue | undefined,
      customFields: dto.customFields as Prisma.InputJsonValue | undefined,
      listingLimit: dto.listingLimit,
      isEnabled: dto.isEnabled,
      disabledAt: dto.isEnabled === false ? new Date() : undefined,
    });

    if (dto.isEnabled !== undefined) {
      await this.PartnerVerticalRepo.syncTenantEnabledVerticals(PartnerVertical.partnerId);
    }

    this.logger.log(`Updated partner vertical: ${PartnerVertical.id}`);

    this.eventEmitter.emit('vertical.partner_updated', {
      partnerId: PartnerVertical.partnerId,
      verticalType: PartnerVertical.vertical.type,
      timestamp: new Date(),
    });

    return updated;
  }

  async disableVerticalForTenant(verticalType: string) {
    const partnerId = this.PartnerContext.partnerId;

    if (!partnerId) {
      throw new BadRequestException('Partner context required');
    }

    const PartnerVertical = await this.PartnerVerticalRepo.findByTenantAndVerticalType(
      partnerId,
      verticalType,
    );

    if (!PartnerVertical) {
      throw new NotFoundException(`Vertical '${verticalType}' not found for this partner`);
    }

    if (!PartnerVertical.isEnabled) {
      throw new BadRequestException(`Vertical '${verticalType}' is already disabled`);
    }

    const updated = await this.PartnerVerticalRepo.disable(PartnerVertical.id);

    await this.PartnerVerticalRepo.syncTenantEnabledVerticals(partnerId);

    this.logger.log(`Disabled vertical '${verticalType}' for partner ${partnerId}`);

    this.eventEmitter.emit('vertical.disabled', {
      partnerId,
      verticalType,
      timestamp: new Date(),
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VERTICAL CHECKS (Used by guards and services)
  // ─────────────────────────────────────────────────────────────────────────────

  async isVerticalEnabledForTenant(partnerId: string, verticalType: string): Promise<boolean> {
    return this.PartnerVerticalRepo.isVerticalEnabledForTenant(partnerId, verticalType);
  }

  async getEnabledVerticalTypes(partnerId: string): Promise<string[]> {
    return this.PartnerVerticalRepo.getEnabledVerticalTypes(partnerId);
  }

  async getListingLimitForVertical(partnerId: string, verticalType: string): Promise<number | null> {
    return this.PartnerVerticalRepo.getListingLimit(partnerId, verticalType);
  }

  async getAttributeSchemaForVertical(verticalType: string) {
    const vertical = await this.verticalDefinitionRepo.findByType(verticalType);
    return vertical?.attributeSchema;
  }

  async getValidationRulesForVertical(verticalType: string) {
    const vertical = await this.verticalDefinitionRepo.findByType(verticalType);
    return vertical?.validationRules;
  }

  async getSearchMappingForVertical(verticalType: string) {
    const vertical = await this.verticalDefinitionRepo.findByType(verticalType);
    return vertical?.searchMapping;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VALIDATION HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private validateAttributeSchema(schema: Record<string, unknown>): void {
    if (!schema.version) {
      throw new BadRequestException('Attribute schema must have a version');
    }
    if (!schema.fields || !Array.isArray(schema.fields)) {
      throw new BadRequestException('Attribute schema must have a fields array');
    }
    // Additional validation can be added here
  }

  private validateValidationRules(rules: Record<string, unknown>): void {
    if (!rules.version) {
      throw new BadRequestException('Validation rules must have a version');
    }
    if (!rules.rules || !Array.isArray(rules.rules)) {
      throw new BadRequestException('Validation rules must have a rules array');
    }
    // Additional validation can be added here
  }

  private validateSearchMapping(mapping: Record<string, unknown>): void {
    if (!mapping.version) {
      throw new BadRequestException('Search mapping must have a version');
    }
    if (!mapping.properties || typeof mapping.properties !== 'object') {
      throw new BadRequestException('Search mapping must have a properties object');
    }
    // Additional validation can be added here
  }
}
