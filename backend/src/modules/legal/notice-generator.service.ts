/**
 * NoticeGeneratorService
 * Session 8.6 - Legal Integration & Finalization
 *
 * Generates legal notice documents from templates with variable substitution.
 * Extracted from LegalService for clean separation of concerns.
 *
 * Notice types:
 *   - FIRST_REMINDER: Initial payment reminder (7-day deadline)
 *   - SECOND_REMINDER: Follow-up payment reminder (3-day deadline)
 *   - LEGAL_NOTICE: Formal legal notice (14-day deadline)
 *   - TERMINATION_NOTICE: Tenancy termination notice (30-day)
 *
 * Template variables:
 *   {{tenantName}}, {{propertyAddress}}, {{amountOwed}}, {{tenancyId}},
 *   {{caseNumber}}, {{dueDate}}, {{leaseStartDate}}, {{reason}},
 *   {{terminationDate}}, {{lawyerName}}, {{lawyerFirm}}, {{partnerName}}
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LegalCaseStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import { GenerateNoticeDto, NoticeType } from './dto';

// ============================================
// VIEW INTERFACE
// ============================================

export interface GeneratedNoticeView {
  id: string;
  caseId: string;
  type: string;
  title: string;
  fileName: string;
  fileUrl: string;
  generatedBy: string | null;
  notes: string | null;
  createdAt: Date;
}

// ============================================
// NOTICE TEMPLATES
// ============================================

const NOTICE_TEMPLATES: Record<NoticeType, { title: string; template: string }> = {
  [NoticeType.FIRST_REMINDER]: {
    title: 'First Payment Reminder',
    template: `Dear {{tenantName}},

This is a reminder that your rent payment of RM {{amountOwed}} for the property at {{propertyAddress}} is overdue.

Please make the payment within 7 days from the date of this notice to avoid further action.

Tenancy Reference: {{tenancyId}}
Amount Due: RM {{amountOwed}}
Due Date: {{dueDate}}

Thank you for your prompt attention to this matter.

Regards,
{{partnerName}} Property Management`,
  },
  [NoticeType.SECOND_REMINDER]: {
    title: 'Second Payment Reminder - Urgent',
    template: `Dear {{tenantName}},

SECOND AND FINAL REMINDER

We refer to our earlier reminder regarding your outstanding rent payment of RM {{amountOwed}} for the property at {{propertyAddress}}.

Despite our previous reminder, payment has not been received. Please settle this amount within 3 days from the date of this notice.

Failure to do so may result in legal proceedings being initiated against you.

Tenancy Reference: {{tenancyId}}
Amount Due: RM {{amountOwed}}
Case Reference: {{caseNumber}}

Regards,
{{partnerName}} Property Management`,
  },
  [NoticeType.LEGAL_NOTICE]: {
    title: 'Formal Legal Notice',
    template: `LEGAL NOTICE

To: {{tenantName}}
Property: {{propertyAddress}}

TAKE NOTICE that you are in breach of your tenancy agreement dated {{leaseStartDate}} for the property at {{propertyAddress}}.

The outstanding amount of RM {{amountOwed}} remains unpaid despite previous reminders.

You are hereby given 14 days from the date of this notice to:
1. Pay the full outstanding amount of RM {{amountOwed}}
2. Contact us to arrange a payment plan

Failure to comply within the stipulated period will result in:
- Commencement of legal proceedings
- Recovery of all outstanding amounts plus legal costs
- Possible termination of your tenancy

Case Reference: {{caseNumber}}

This notice is issued without prejudice to our rights under the tenancy agreement and applicable law.

{{lawyerName}}
{{lawyerFirm}}
On behalf of {{partnerName}}`,
  },
  [NoticeType.TERMINATION_NOTICE]: {
    title: 'Tenancy Termination Notice',
    template: `NOTICE OF TERMINATION

To: {{tenantName}}
Property: {{propertyAddress}}

TAKE NOTICE that your tenancy for the above-mentioned property is hereby terminated effective {{terminationDate}} due to:

Reason: {{reason}}
Outstanding Amount: RM {{amountOwed}}

You are required to:
1. Vacate the premises by {{terminationDate}}
2. Return all keys to the management office
3. Settle all outstanding amounts including RM {{amountOwed}}
4. Ensure the premises are left in good condition

Case Reference: {{caseNumber}}

This termination is issued in accordance with the terms of your tenancy agreement and applicable tenancy laws.

{{lawyerName}}
{{lawyerFirm}}
On behalf of {{partnerName}}`,
  },
};

// ============================================
// SERVICE
// ============================================

@Injectable()
export class NoticeGeneratorService {
  private readonly logger = new Logger(NoticeGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate a notice document for a legal case.
   * Loads case with tenancy/tenant/listing data, substitutes template variables,
   * creates a LegalDocument record, and emits an event with the generated content.
   */
  async generateNotice(caseId: string, dto: GenerateNoticeDto): Promise<GeneratedNoticeView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const legalCase = await this.prisma.legalCase.findFirst({
      where: { id: caseId, partnerId },
      include: {
        lawyer: true,
        tenancy: {
          include: {
            tenant: { include: { user: true } },
            listing: true,
          },
        },
      },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${caseId} not found`);
    }

    if (legalCase.status === LegalCaseStatus.CLOSED) {
      throw new BadRequestException('Cannot generate notice for a closed case');
    }

    // Get template
    const templateDef = NOTICE_TEMPLATES[dto.type];

    // Get partner info for template
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
    });

    // Build variables for substitution
    const variables = this.buildTemplateVariables(legalCase, partner);

    // Substitute variables in template
    let content = templateDef.template;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Create legal document record
    const fileName = `${dto.type.toLowerCase()}_${legalCase.caseNumber}_${Date.now()}.txt`;
    const fileUrl = `/legal-documents/${partnerId}/${fileName}`;

    const document = await this.prisma.legalDocument.create({
      data: {
        caseId,
        type: dto.type,
        title: templateDef.title,
        fileName,
        fileUrl,
        generatedBy: 'system',
        notes: dto.notes,
      },
    });

    this.logger.log(`Notice ${dto.type} generated for case ${legalCase.caseNumber}`);
    this.eventEmitter.emit('legal.notice.generated', {
      caseId: legalCase.id,
      caseNumber: legalCase.caseNumber,
      documentId: document.id,
      noticeType: dto.type,
      content,
    });

    return this.mapToView(document);
  }

  /**
   * Get available notice types and their templates
   */
  getNoticeTypes(): Array<{ type: NoticeType; title: string }> {
    return Object.entries(NOTICE_TEMPLATES).map(([type, def]) => ({
      type: type as NoticeType,
      title: def.title,
    }));
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private buildTemplateVariables(
    legalCase: any,
    partner: any,
  ): Record<string, string> {
    return {
      tenantName: legalCase.tenancy?.tenant?.user?.fullName ?? 'Tenant',
      propertyAddress: legalCase.tenancy?.listing?.title ?? 'Property',
      amountOwed: legalCase.amountOwed.toString(),
      tenancyId: legalCase.tenancyId,
      caseNumber: legalCase.caseNumber,
      dueDate: legalCase.noticeDeadline?.toISOString().split('T')[0] ?? 'N/A',
      leaseStartDate: legalCase.tenancy?.leaseStartDate?.toISOString().split('T')[0] ?? 'N/A',
      reason: legalCase.reason,
      terminationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lawyerName: legalCase.lawyer?.name ?? 'Legal Department',
      lawyerFirm: legalCase.lawyer?.firm ?? '',
      partnerName: partner?.name ?? 'Property Management',
    };
  }

  private mapToView(doc: any): GeneratedNoticeView {
    return {
      id: doc.id,
      caseId: doc.caseId,
      type: doc.type,
      title: doc.title,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      generatedBy: doc.generatedBy,
      notes: doc.notes,
      createdAt: doc.createdAt,
    };
  }
}
