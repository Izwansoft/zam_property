import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';
import { S3Service } from '@infrastructure/storage';
import { Contract, ContractStatus, TenancyStatus, Prisma } from '@prisma/client';
import * as PDFDocument from 'pdfkit';
import * as crypto from 'crypto';

import { ContractTemplateService } from './contract-template.service';
import {
  CreateContractDto,
  UpdateContractDto,
  ContractQueryDto,
} from './dto';

/**
 * View type for contract with relations.
 */
export interface ContractView extends Contract {
  tenancy?: {
    id: string;
    listing: {
      id: string;
      title: string;
      location: Record<string, unknown> | null;
    };
    owner: {
      id: string;
      name: string;
      email: string | null;
    };
    tenant: {
      id: string;
      user: {
        fullName: string;
        email: string;
      };
    };
    monthlyRent: unknown;
    securityDeposit: unknown;
  };
}

/**
 * Event emitted when contract status changes.
 */
export class ContractStatusChangedEvent {
  constructor(
    public readonly contractId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly fromStatus: ContractStatus,
    public readonly toStatus: ContractStatus,
    public readonly reason?: string,
    public readonly changedBy?: string,
  ) {}
}

/**
 * Event emitted when contract is created.
 */
export class ContractCreatedEvent {
  constructor(
    public readonly contractId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly contractNumber: string,
  ) {}
}

/**
 * Service for managing contracts, including generation, PDF creation, and S3 storage.
 */
@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly templateService: ContractTemplateService,
    private readonly s3Service: S3Service,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate a contract number.
   */
  private async generateContractNumber(): Promise<string> {
    const partnerId = this.PartnerContext.partnerId;
    const year = new Date().getFullYear();
    
    // Get count of contracts for this partner this year
    const count = await this.prisma.contract.count({
      where: {
        tenancy: { partnerId },
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    return `CON-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Create a contract for a tenancy.
   */
  async create(dto: CreateContractDto): Promise<ContractView> {
    const partnerId = this.PartnerContext.partnerId;

    // Check if contract already exists for this tenancy
    const existingContract = await this.prisma.contract.findFirst({
      where: { tenancyId: dto.tenancyId },
    });

    if (existingContract) {
      throw new ConflictException(`Contract already exists for tenancy: ${dto.tenancyId}`);
    }

    // Get tenancy with relations
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: dto.tenancyId, partnerId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy not found: ${dto.tenancyId}`);
    }

    // Validate tenancy status
    const validStatuses: TenancyStatus[] = [TenancyStatus.DEPOSIT_PAID, TenancyStatus.CONTRACT_PENDING];
    if (!validStatuses.includes(tenancy.status)) {
      throw new BadRequestException(
        `Cannot create contract for tenancy in ${tenancy.status} status. Must be DEPOSIT_PAID or CONTRACT_PENDING.`,
      );
    }

    // Generate contract number
    const contractNumber = await this.generateContractNumber();

    // Create contract
    const contract = await this.prisma.contract.create({
      data: {
        tenancyId: dto.tenancyId,
        contractNumber,
        templateId: dto.templateId,
        status: ContractStatus.DRAFT,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        terms: (dto.terms || {}) as Prisma.InputJsonValue,
      },
      include: {
        tenancy: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                location: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tenant: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Emit event
    this.eventEmitter.emit(
      'contract.created',
      new ContractCreatedEvent(contract.id, dto.tenancyId, partnerId, contractNumber),
    );

    this.logger.log(`Created contract ${contractNumber} for tenancy ${dto.tenancyId}`);

    return contract as ContractView;
  }

  /**
   * Get contract by ID.
   */
  async findById(id: string): Promise<ContractView> {
    const partnerId = this.PartnerContext.partnerId;

    const contract = await this.prisma.contract.findFirst({
      where: {
        id,
        tenancy: { partnerId },
      },
      include: {
        tenancy: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                location: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tenant: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract not found: ${id}`);
    }

    return contract as ContractView;
  }

  /**
   * Get contract by tenancy ID.
   */
  async findByTenancyId(tenancyId: string): Promise<ContractView | null> {
    const partnerId = this.PartnerContext.partnerId;

    const contract = await this.prisma.contract.findFirst({
      where: {
        tenancyId,
        tenancy: { partnerId },
      },
      include: {
        tenancy: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                location: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tenant: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return contract as ContractView | null;
  }

  /**
   * List contracts with filters and pagination.
   */
  async findAll(query: ContractQueryDto): Promise<{
    items: ContractView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const partnerId = this.PartnerContext.partnerId;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {
      tenancy: { partnerId },
      ...(query.tenancyId && { tenancyId: query.tenancyId }),
      ...(query.status && { status: query.status }),
      ...(query.contractNumber && {
        contractNumber: { contains: query.contractNumber, mode: 'insensitive' },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
        include: {
          tenancy: {
            include: {
              listing: {
                select: {
                  id: true,
                  title: true,
                  location: true,
                },
              },
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              tenant: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      items: items as ContractView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update contract terms.
   */
  async update(id: string, dto: UpdateContractDto): Promise<ContractView> {
    const contract = await this.findById(id);

    // Only allow updates to DRAFT contracts
    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot update contract in ${contract.status} status. Only DRAFT contracts can be updated.`,
      );
    }

    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.terms && { terms: dto.terms as Prisma.InputJsonValue }),
      },
      include: {
        tenancy: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                location: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tenant: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    this.logger.log(`Updated contract: ${id}`);

    return updated as ContractView;
  }

  /**
   * Update contract status.
   */
  async updateStatus(
    id: string,
    status: ContractStatus,
    reason?: string,
    changedBy?: string,
  ): Promise<ContractView> {
    const partnerId = this.PartnerContext.partnerId;
    const contract = await this.findById(id);
    const fromStatus = contract.status;

    // Validate status transition
    this.validateStatusTransition(fromStatus, status);

    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status },
      include: {
        tenancy: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                location: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tenant: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Emit event
    this.eventEmitter.emit(
      'contract.status.changed',
      new ContractStatusChangedEvent(
        id,
        contract.tenancyId,
        partnerId,
        fromStatus,
        status,
        reason,
        changedBy,
      ),
    );

    this.logger.log(`Contract ${id} status changed from ${fromStatus} to ${status}`);

    return updated as ContractView;
  }

  /**
   * Validate contract status transition.
   */
  private validateStatusTransition(from: ContractStatus, to: ContractStatus): void {
    const allowedTransitions: Record<ContractStatus, ContractStatus[]> = {
      [ContractStatus.DRAFT]: [ContractStatus.PENDING_SIGNATURE, ContractStatus.TERMINATED],
      [ContractStatus.PENDING_SIGNATURE]: [
        ContractStatus.PARTIALLY_SIGNED,
        ContractStatus.ACTIVE,
        ContractStatus.TERMINATED,
      ],
      [ContractStatus.PARTIALLY_SIGNED]: [ContractStatus.ACTIVE, ContractStatus.TERMINATED],
      [ContractStatus.ACTIVE]: [ContractStatus.EXPIRED, ContractStatus.TERMINATED, ContractStatus.RENEWED],
      [ContractStatus.EXPIRED]: [ContractStatus.RENEWED],
      [ContractStatus.TERMINATED]: [],
      [ContractStatus.RENEWED]: [],
    };

    if (!allowedTransitions[from]?.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`,
      );
    }
  }

  /**
   * Generate contract PDF and upload to S3.
   */
  async generatePdf(id: string, forceRegenerate = false): Promise<{
    url: string;
    documentHash: string;
  }> {
    const partnerId = this.PartnerContext.partnerId;
    const contract = await this.findById(id);

    // Check if PDF already exists and force regenerate is false
    if (contract.documentUrl && !forceRegenerate) {
      return {
        url: contract.documentUrl,
        documentHash: contract.documentHash || '',
      };
    }

    // Get template
    let templateContent: string;
    if (contract.templateId) {
      const template = await this.templateService.findById(contract.templateId);
      templateContent = template.content;
    } else {
      // Use default template or get partner's default
      const defaultTemplate = await this.templateService.findDefault();
      if (defaultTemplate) {
        templateContent = defaultTemplate.content;
      } else {
        templateContent = this.getDefaultTemplateContent();
      }
    }

    // Build variables
    const variables = this.buildContractVariables(contract);

    // Substitute variables
    const content = this.templateService.substituteVariables(templateContent, variables);

    // Generate PDF
    const pdfBuffer = await this.generatePdfFromContent(content, contract);

    // Calculate hash
    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // Upload to S3
    const key = `contracts/${partnerId}/${contract.id}/${contract.contractNumber}.pdf`;
    await this.s3Service.uploadObject(key, pdfBuffer, 'application/pdf');

    // Get URL
    const documentUrl = this.s3Service.getPublicUrl(key);

    // Update contract
    await this.prisma.contract.update({
      where: { id },
      data: { documentUrl, documentHash },
    });

    this.logger.log(`Generated PDF for contract ${id}, uploaded to ${key}`);

    return { url: documentUrl, documentHash };
  }

  /**
   * Build contract variables from contract data.
   */
  private buildContractVariables(contract: ContractView): Record<string, string | number> {
    const tenancy = contract.tenancy;
    const listing = tenancy?.listing;
    const owner = tenancy?.owner;
    const tenant = tenancy?.tenant;
    const location = (listing?.location || {}) as Record<string, string>;

    // Format address
    const propertyAddress = [
      location.addressLine1,
      location.addressLine2,
      location.city,
      location.state,
      location.postcode,
    ]
      .filter(Boolean)
      .join(', ');

    // Format dates
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    // Number to words (simplified)
    const numberToWords = (num: number): string => {
      return `Ringgit Malaysia ${num.toLocaleString('en-MY', { minimumFractionDigits: 2 })} only`;
    };

    const rentAmount = Number(tenancy?.monthlyRent || 0);
    const depositAmount = Number(tenancy?.securityDeposit || 0);

    return {
      contractNumber: contract.contractNumber,
      contractDate: formatDate(contract.createdAt),
      propertyTitle: listing?.title || '',
      propertyAddress: propertyAddress,
      propertyType: (location.propertyType as string) || 'Property',
      ownerName: owner?.name || '',
      ownerEmail: owner?.email || '',
      ownerIc: '', // Would need to fetch from VendorProfile
      ownerAddress: '',
      ownerPhone: '',
      tenantName: tenant?.user?.fullName || '',
      tenantEmail: tenant?.user?.email || '',
      tenantIc: '', // Would need to fetch from Tenant
      tenantAddress: '',
      tenantPhone: '',
      rentAmount: `RM ${rentAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
      rentAmountWords: numberToWords(rentAmount),
      depositAmount: `RM ${depositAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
      depositAmountWords: numberToWords(depositAmount),
      startDate: formatDate(contract.startDate),
      endDate: formatDate(contract.endDate),
      tenancyDuration: this.calculateDuration(contract.startDate, contract.endDate),
      paymentDueDay: '1',
      lateFeePercentage: '10',
      noticePeriod: '30',
    };
  }

  /**
   * Calculate duration between two dates.
   */
  private calculateDuration(startDate: Date, endDate: Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  /**
   * Generate PDF from HTML/text content using PDFKit.
   */
  private async generatePdfFromContent(
    content: string,
    contract: ContractView,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add header
        doc.fontSize(18).text('TENANCY AGREEMENT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Contract No: ${contract.contractNumber}`, { align: 'center' });
        doc.moveDown(2);

        // Parse and render content
        // Simple HTML-like tag parsing for bold and line breaks
        const lines = content
          .replace(/<h1[^>]*>/gi, '\n###HEADING1###')
          .replace(/<\/h1>/gi, '###/HEADING1###\n')
          .replace(/<h2[^>]*>/gi, '\n###HEADING2###')
          .replace(/<\/h2>/gi, '###/HEADING2###\n')
          .replace(/<p[^>]*>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<strong[^>]*>/gi, '###BOLD###')
          .replace(/<\/strong>/gi, '###/BOLD###')
          .replace(/<b[^>]*>/gi, '###BOLD###')
          .replace(/<\/b>/gi, '###/BOLD###')
          .replace(/<[^>]+>/g, '') // Remove all other HTML tags
          .split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            doc.moveDown(0.5);
            continue;
          }

          // Handle headings
          if (trimmedLine.includes('###HEADING1###')) {
            doc.fontSize(16).font('Helvetica-Bold');
            doc.text(trimmedLine.replace(/###\/?HEADING1###/g, '').trim());
            doc.fontSize(11).font('Helvetica');
            doc.moveDown();
            continue;
          }

          if (trimmedLine.includes('###HEADING2###')) {
            doc.fontSize(14).font('Helvetica-Bold');
            doc.text(trimmedLine.replace(/###\/?HEADING2###/g, '').trim());
            doc.fontSize(11).font('Helvetica');
            doc.moveDown();
            continue;
          }

          // Handle bold text (simplified - entire line)
          if (trimmedLine.includes('###BOLD###')) {
            doc.font('Helvetica-Bold');
            doc.text(trimmedLine.replace(/###\/?BOLD###/g, ''));
            doc.font('Helvetica');
          } else {
            doc.fontSize(11).text(trimmedLine);
          }
        }

        // Add signature section
        doc.moveDown(3);
        doc.fontSize(12).text('SIGNATURES', { underline: true });
        doc.moveDown();

        // Owner signature
        doc.text('LANDLORD/OWNER:', { continued: false });
        doc.moveDown(2);
        doc.text('_______________________________', { continued: false });
        doc.fontSize(9).text('Signature');
        doc.fontSize(12).moveDown();
        doc.text('Name: ________________________');
        doc.text('IC No: ________________________');
        doc.text('Date: ________________________');
        doc.moveDown(2);

        // Partner signature
        doc.text('TENANT/TENANT:', { continued: false });
        doc.moveDown(2);
        doc.text('_______________________________', { continued: false });
        doc.fontSize(9).text('Signature');
        doc.fontSize(12).moveDown();
        doc.text('Name: ________________________');
        doc.text('IC No: ________________________');
        doc.text('Date: ________________________');

        // Add footer with page numbers
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(9).text(
            `Page ${i + 1} of ${range.count}`,
            50,
            doc.page.height - 50,
            { align: 'center' },
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get default template content.
   */
  private getDefaultTemplateContent(): string {
    return `
<h1>TENANCY AGREEMENT</h1>

<p>This Tenancy Agreement is made on {{contractDate}}</p>

<h2>BETWEEN</h2>

<p><strong>LANDLORD:</strong> {{ownerName}}</p>
<p>(hereinafter referred to as "the Landlord")</p>

<p><strong>AND</strong></p>

<p><strong>TENANT:</strong> {{tenantName}}</p>
<p>(hereinafter referred to as "the Partner")</p>

<h2>PROPERTY</h2>

<p>The Landlord agrees to let and the Partner agrees to take the property located at:</p>
<p><strong>{{propertyAddress}}</strong></p>
<p>(hereinafter referred to as "the Property")</p>

<h2>TERM</h2>

<p>The tenancy shall be for a period of {{tenancyDuration}}, commencing from {{startDate}} and expiring on {{endDate}}.</p>

<h2>RENT</h2>

<p>The monthly rent shall be {{rentAmount}} ({{rentAmountWords}}), payable on the {{paymentDueDay}}st day of each month.</p>

<h2>SECURITY DEPOSIT</h2>

<p>The Partner shall pay a security deposit of {{depositAmount}} ({{depositAmountWords}}) upon signing this agreement.</p>

<h2>COVENANTS AND CONDITIONS</h2>

<p>1. The Partner shall pay the rent promptly on the due date.</p>
<p>2. The Partner shall keep the Property clean and in good condition.</p>
<p>3. The Partner shall not sublet or assign this tenancy without written consent from the Landlord.</p>
<p>4. The Partner shall not make any alterations to the Property without written consent from the Landlord.</p>
<p>5. The Partner shall allow the Landlord or their agent to inspect the Property with reasonable notice.</p>

<h2>TERMINATION</h2>

<p>Either party may terminate this agreement by giving {{noticePeriod}} days written notice to the other party.</p>

<h2>LATE PAYMENT</h2>

<p>A late payment fee of {{lateFeePercentage}}% of the monthly rent will be charged for payments received more than 7 days after the due date.</p>
    `;
  }

  /**
   * Get presigned download URL for contract PDF.
   */
  async getDownloadUrl(id: string): Promise<string> {
    const contract = await this.findById(id);

    if (!contract.documentUrl) {
      throw new BadRequestException('Contract PDF has not been generated yet');
    }

    // Extract key from URL
    const partnerId = this.PartnerContext.partnerId;
    const key = `contracts/${partnerId}/${contract.id}/${contract.contractNumber}.pdf`;

    return this.s3Service.getPresignedDownloadUrl(key, 3600); // 1 hour expiry
  }
}
