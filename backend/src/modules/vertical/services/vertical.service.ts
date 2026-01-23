/**
 * Vertical Service
 * Part 8 - Vertical Module Contract
 *
 * Manages vertical definitions and tenant-vertical enablement.
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

import { TenantContextService } from '@core/tenant-context';
import { VerticalDefinitionRepository } from '../repositories/vertical-definition.repository';
import { TenantVerticalRepository } from '../repositories/tenant-vertical.repository';
import {
  CreateVerticalDefinitionDto,
  UpdateVerticalDefinitionDto,
  EnableVerticalDto,
  UpdateTenantVerticalDto,
  VerticalQueryDto,
  TenantVerticalQueryDto,
} from '../dto/vertical.dto';

@Injectable()
export class VerticalService {
  private readonly logger = new Logger(VerticalService.name);

  constructor(
    private readonly verticalDefinitionRepo: VerticalDefinitionRepository,
    private readonly tenantVerticalRepo: TenantVerticalRepository,
    private readonly tenantContext: TenantContextService,
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

  async deleteVerticalDefinition(id: string) {
    const vertical = await this.getVerticalDefinitionById(id);

    if (vertical.isCore) {
      throw new BadRequestException(`Cannot delete core vertical: ${vertical.type}`);
    }

    // Check if any tenants are using this vertical
    const usageCount = await this.verticalDefinitionRepo.countTenantUsage(id);
    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete vertical: ${usageCount} tenant(s) are using it. Deactivate first.`,
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
  // TENANT VERTICAL MANAGEMENT (Tenant-level)
  // ─────────────────────────────────────────────────────────────────────────────

  async enableVerticalForTenant(dto: EnableVerticalDto) {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant context required');
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
    const existing = await this.tenantVerticalRepo.findByTenantAndVertical(tenantId, vertical.id);
    if (existing) {
      if (existing.isEnabled) {
        throw new ConflictException(
          `Vertical '${dto.verticalType}' is already enabled for this tenant`,
        );
      }
      // Re-enable existing record
      const updated = await this.tenantVerticalRepo.enable(existing.id);

      await this.tenantVerticalRepo.syncTenantEnabledVerticals(tenantId);

      this.logger.log(`Re-enabled vertical '${dto.verticalType}' for tenant ${tenantId}`);

      this.eventEmitter.emit('vertical.enabled', {
        tenantId,
        verticalType: dto.verticalType,
        verticalId: vertical.id,
        timestamp: new Date(),
      });

      return updated;
    }

    // Create new tenant vertical
    const tenantVertical = await this.tenantVerticalRepo.create({
      tenantId,
      verticalId: vertical.id,
      configOverrides: dto.configOverrides as Prisma.InputJsonValue | undefined,
      customFields: dto.customFields as Prisma.InputJsonValue | undefined,
      listingLimit: dto.listingLimit,
      isEnabled: true,
    });

    await this.tenantVerticalRepo.syncTenantEnabledVerticals(tenantId);

    this.logger.log(`Enabled vertical '${dto.verticalType}' for tenant ${tenantId}`);

    this.eventEmitter.emit('vertical.enabled', {
      tenantId,
      verticalType: dto.verticalType,
      verticalId: vertical.id,
      timestamp: new Date(),
    });

    return tenantVertical;
  }

  async getTenantVerticals(query?: TenantVerticalQueryDto) {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant context required');
    }

    return this.tenantVerticalRepo.findByTenant(tenantId, {
      isEnabled: query?.isEnabled,
      verticalType: query?.verticalType,
    });
  }

  async getEnabledVerticalsForTenant() {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context required');
    }
    return this.tenantVerticalRepo.findEnabledByTenant(tenantId);
  }

  async getTenantVerticalById(id: string) {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant context required');
    }

    const tenantVertical = await this.tenantVerticalRepo.findById(id);
    if (!tenantVertical || tenantVertical.tenantId !== tenantId) {
      throw new NotFoundException(`Tenant vertical with ID '${id}' not found`);
    }

    return tenantVertical;
  }

  async updateTenantVertical(id: string, dto: UpdateTenantVerticalDto) {
    const tenantVertical = await this.getTenantVerticalById(id);

    const updated = await this.tenantVerticalRepo.update(id, {
      configOverrides: dto.configOverrides as Prisma.InputJsonValue | undefined,
      customFields: dto.customFields as Prisma.InputJsonValue | undefined,
      listingLimit: dto.listingLimit,
      isEnabled: dto.isEnabled,
      disabledAt: dto.isEnabled === false ? new Date() : undefined,
    });

    if (dto.isEnabled !== undefined) {
      await this.tenantVerticalRepo.syncTenantEnabledVerticals(tenantVertical.tenantId);
    }

    this.logger.log(`Updated tenant vertical: ${tenantVertical.id}`);

    this.eventEmitter.emit('vertical.tenant_updated', {
      tenantId: tenantVertical.tenantId,
      verticalType: tenantVertical.vertical.type,
      timestamp: new Date(),
    });

    return updated;
  }

  async disableVerticalForTenant(verticalType: string) {
    const tenantId = this.tenantContext.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant context required');
    }

    const tenantVertical = await this.tenantVerticalRepo.findByTenantAndVerticalType(
      tenantId,
      verticalType,
    );

    if (!tenantVertical) {
      throw new NotFoundException(`Vertical '${verticalType}' not found for this tenant`);
    }

    if (!tenantVertical.isEnabled) {
      throw new BadRequestException(`Vertical '${verticalType}' is already disabled`);
    }

    const updated = await this.tenantVerticalRepo.disable(tenantVertical.id);

    await this.tenantVerticalRepo.syncTenantEnabledVerticals(tenantId);

    this.logger.log(`Disabled vertical '${verticalType}' for tenant ${tenantId}`);

    this.eventEmitter.emit('vertical.disabled', {
      tenantId,
      verticalType,
      timestamp: new Date(),
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VERTICAL CHECKS (Used by guards and services)
  // ─────────────────────────────────────────────────────────────────────────────

  async isVerticalEnabledForTenant(tenantId: string, verticalType: string): Promise<boolean> {
    return this.tenantVerticalRepo.isVerticalEnabledForTenant(tenantId, verticalType);
  }

  async getEnabledVerticalTypes(tenantId: string): Promise<string[]> {
    return this.tenantVerticalRepo.getEnabledVerticalTypes(tenantId);
  }

  async getListingLimitForVertical(tenantId: string, verticalType: string): Promise<number | null> {
    return this.tenantVerticalRepo.getListingLimit(tenantId, verticalType);
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
