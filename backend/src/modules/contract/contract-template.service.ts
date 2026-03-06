import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';
import { ContractTemplate, Prisma } from '@prisma/client';

import {
  CreateContractTemplateDto,
  UpdateContractTemplateDto,
  TemplateQueryDto,
} from './dto';

/**
 * Contract template variable definition.
 */
export interface TemplateVariable {
  name: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
}

/**
 * Standard template variables available for contract generation.
 */
export const STANDARD_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: 'ownerName', description: 'Property owner full name', required: true },
  { name: 'ownerIc', description: 'Property owner IC number', required: true },
  { name: 'ownerAddress', description: 'Property owner address', required: false },
  { name: 'ownerPhone', description: 'Property owner phone', required: false },
  { name: 'ownerEmail', description: 'Property owner email', required: false },
  { name: 'tenantName', description: 'Tenant/partner full name', required: true },
  { name: 'tenantIc', description: 'Tenant IC number', required: true },
  { name: 'tenantAddress', description: 'Tenant address', required: false },
  { name: 'tenantPhone', description: 'Tenant phone', required: false },
  { name: 'tenantEmail', description: 'Tenant email', required: false },
  { name: 'propertyAddress', description: 'Full property address', required: true },
  { name: 'propertyTitle', description: 'Property title/name', required: true },
  { name: 'propertyType', description: 'Type of property (apartment, house, etc.)', required: false },
  { name: 'rentAmount', description: 'Monthly rent amount', required: true },
  { name: 'rentAmountWords', description: 'Rent amount in words', required: false },
  { name: 'depositAmount', description: 'Security deposit amount', required: true },
  { name: 'depositAmountWords', description: 'Deposit amount in words', required: false },
  { name: 'startDate', description: 'Tenancy start date', required: true },
  { name: 'endDate', description: 'Tenancy end date', required: true },
  { name: 'tenancyDuration', description: 'Duration (e.g., "12 months")', required: false },
  { name: 'contractNumber', description: 'Contract reference number', required: true },
  { name: 'contractDate', description: 'Contract creation date', required: true },
  { name: 'paymentDueDay', description: 'Day of month rent is due', required: false, defaultValue: '1' },
  { name: 'lateFeePercentage', description: 'Late payment fee percentage', required: false, defaultValue: '10' },
  { name: 'noticePeriod', description: 'Termination notice period (days)', required: false, defaultValue: '30' },
];

/**
 * Service for managing contract templates with CRUD and variable substitution.
 */
@Injectable()
export class ContractTemplateService {
  private readonly logger = new Logger(ContractTemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
  ) {}

  /**
   * Create a new contract template.
   */
  async create(dto: CreateContractTemplateDto): Promise<ContractTemplate> {
    const partnerId = this.PartnerContext.partnerId;

    // If setting as default, unset other defaults first
    if (dto.isDefault) {
      await this.prisma.contractTemplate.updateMany({
        where: { partnerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await this.prisma.contractTemplate.create({
      data: {
        partnerId,
        name: dto.name,
        description: dto.description,
        content: dto.content,
        variables: dto.variables || STANDARD_TEMPLATE_VARIABLES.map((v) => v.name),
        isDefault: dto.isDefault || false,
        isActive: true,
      },
    });

    this.logger.log(`Created contract template: ${template.id} for partner: ${partnerId}`);
    return template;
  }

  /**
   * Get template by ID.
   */
  async findById(id: string): Promise<ContractTemplate> {
    const partnerId = this.PartnerContext.partnerId;

    const template = await this.prisma.contractTemplate.findFirst({
      where: { id, partnerId },
    });

    if (!template) {
      throw new NotFoundException(`Contract template not found: ${id}`);
    }

    return template;
  }

  /**
   * Get the default template for the partner.
   */
  async findDefault(): Promise<ContractTemplate | null> {
    const partnerId = this.PartnerContext.partnerId;

    return this.prisma.contractTemplate.findFirst({
      where: { partnerId, isDefault: true, isActive: true },
    });
  }

  /**
   * List templates with filters and pagination.
   */
  async findAll(query: TemplateQueryDto): Promise<{
    items: ContractTemplate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const partnerId = this.PartnerContext.partnerId;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContractTemplateWhereInput = {
      partnerId,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.isDefault !== undefined && { isDefault: query.isDefault }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.contractTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
      }),
      this.prisma.contractTemplate.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a template.
   */
  async update(id: string, dto: UpdateContractTemplateDto): Promise<ContractTemplate> {
    const partnerId = this.PartnerContext.partnerId;

    // Verify template exists
    const existing = await this.findById(id);

    // If setting as default, unset other defaults first
    if (dto.isDefault && !existing.isDefault) {
      await this.prisma.contractTemplate.updateMany({
        where: { partnerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await this.prisma.contractTemplate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.content && { content: dto.content }),
        ...(dto.variables && { variables: dto.variables }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Updated contract template: ${id}`);
    return template;
  }

  /**
   * Delete a template (soft delete by setting isActive = false).
   */
  async delete(id: string): Promise<void> {
    const template = await this.findById(id);

    if (template.isDefault) {
      throw new ConflictException('Cannot delete the default template. Set another template as default first.');
    }

    await this.prisma.contractTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Deactivated contract template: ${id}`);
  }

  /**
   * Substitute variables in template content.
   * Variables are in the format {{variableName}}.
   */
  substituteVariables(content: string, variables: Record<string, string | number>): string {
    let result = content;

    for (const [key, value] of Object.entries(variables)) {
      // Replace {{variableName}} with the value
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Extract variable names from template content.
   */
  extractVariables(content: string): string[] {
    const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
    const variables = new Set<string>();

    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Validate that all required variables are provided.
   */
  validateVariables(
    templateVariables: string[],
    providedVariables: Record<string, string | number>,
  ): { valid: boolean; missing: string[] } {
    const requiredVars = STANDARD_TEMPLATE_VARIABLES
      .filter((v) => v.required && templateVariables.includes(v.name))
      .map((v) => v.name);

    const missing = requiredVars.filter((name) => !providedVariables[name]);

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Get available template variables with their descriptions.
   */
  getAvailableVariables(): TemplateVariable[] {
    return STANDARD_TEMPLATE_VARIABLES;
  }
}
