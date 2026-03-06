import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';
import { Contract, ContractStatus, TenancyStatus } from '@prisma/client';

import {
  ISignatureProvider,
  SIGNATURE_PROVIDER,
  SignatureRequest,
  SignatureRequestResponse,
  SignatureStatus,
  SignatureWebhookEvent,
  SignatureWebhookEventType,
  SignatureEnvelopeStatus,
} from './providers';

/**
 * Event emitted when signature is requested
 */
export class SignatureRequestedEvent {
  constructor(
    public readonly contractId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly envelopeId: string,
    public readonly signerEmails: string[],
  ) {}
}

/**
 * Event emitted when a signer signs
 */
export class SignerSignedEvent {
  constructor(
    public readonly contractId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly signerRole: 'owner' | 'tenant',
    public readonly signerEmail: string,
    public readonly signedAt: Date,
  ) {}
}

/**
 * Event emitted when contract is fully signed
 */
export class ContractFullySignedEvent {
  constructor(
    public readonly contractId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly completedAt: Date,
  ) {}
}

/**
 * Stored envelope reference
 */
interface StoredEnvelope {
  envelopeId: string;
  contractId: string;
  tenancyId: string;
  partnerId: string;
  createdAt: Date;
}

/**
 * Service for managing e-signature workflow
 */
@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  /**
   * In-memory envelope mapping (contractId -> envelope info)
   * In production, this should be stored in database
   */
  private envelopeMap: Map<string, StoredEnvelope> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    @Inject(SIGNATURE_PROVIDER)
    private readonly signatureProvider: ISignatureProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Request signatures for a contract
   * @param contractId Contract ID
   * @param callbackUrl Optional webhook callback URL
   * @returns Signature request response with signing URLs
   */
  async requestSignatures(
    contractId: string,
    callbackUrl?: string,
  ): Promise<SignatureRequestResponse & { contractId: string }> {
    const partnerId = this.PartnerContext.partnerId;

    // Get contract with relations
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
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
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract not found: ${contractId}`);
    }

    // Validate contract status
    if (contract.status !== ContractStatus.DRAFT && contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException(
        `Cannot request signatures for contract in ${contract.status} status. Must be DRAFT or PENDING_SIGNATURE.`,
      );
    }

    // Check if document URL exists
    if (!contract.documentUrl) {
      throw new BadRequestException(
        'Contract document must be generated before requesting signatures. Please generate the PDF first.',
      );
    }

    // Build signer list
    const owner = contract.tenancy.owner;
    const tenant = contract.tenancy.tenant;

    if (!owner?.email) {
      throw new BadRequestException('Owner email is required for signature request');
    }

    if (!tenant?.user?.email) {
      throw new BadRequestException('Tenant email is required for signature request');
    }

    // Create signature request
    const request: SignatureRequest = {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      document: {
        id: contract.id,
        name: `${contract.contractNumber} - Tenancy Agreement`,
        documentUrl: contract.documentUrl,
        mimeType: 'application/pdf',
      },
      signers: [
        {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          role: 'owner',
        },
        {
          id: tenant.user.id,
          name: tenant.user.fullName,
          email: tenant.user.email,
          role: 'tenant',
          phone: tenant.user.phone || undefined,
        },
      ],
      emailSubject: `Signature Required: Tenancy Agreement ${contract.contractNumber}`,
      emailMessage: `Please review and sign the tenancy agreement for ${contract.tenancy.listing.title}.`,
      callbackUrl,
      metadata: {
        partnerId,
        tenancyId: contract.tenancyId,
      },
    };

    // Call signature provider
    const response = await this.signatureProvider.createSignatureRequest(request);

    // Store envelope mapping
    this.envelopeMap.set(contractId, {
      envelopeId: response.envelopeId,
      contractId,
      tenancyId: contract.tenancyId,
      partnerId,
      createdAt: new Date(),
    });

    // Also map by envelope ID for webhook lookups
    this.envelopeMap.set(response.envelopeId, {
      envelopeId: response.envelopeId,
      contractId,
      tenancyId: contract.tenancyId,
      partnerId,
      createdAt: new Date(),
    });

    // Update contract status to PENDING_SIGNATURE if it was DRAFT
    if (contract.status === ContractStatus.DRAFT) {
      await this.prisma.contract.update({
        where: { id: contractId },
        data: { status: ContractStatus.PENDING_SIGNATURE },
      });
    }

    // Emit event
    this.eventEmitter.emit(
      'contract.signature.requested',
      new SignatureRequestedEvent(
        contractId,
        contract.tenancyId,
        partnerId,
        response.envelopeId,
        [owner.email, tenant.user.email],
      ),
    );

    this.logger.log(
      `Requested signatures for contract ${contractId}. Envelope: ${response.envelopeId}`,
    );

    return {
      ...response,
      contractId,
    };
  }

  /**
   * Get signature status for a contract
   * @param contractId Contract ID
   * @returns Current signature status
   */
  async getSignatureStatus(contractId: string): Promise<SignatureStatus & { contractId: string }> {
    const partnerId = this.PartnerContext.partnerId;

    // Get contract to verify access
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        tenancy: { partnerId },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract not found: ${contractId}`);
    }

    // Get stored envelope
    const stored = this.envelopeMap.get(contractId);

    if (!stored) {
      // No envelope exists - return status based on contract
      return {
        contractId,
        envelopeId: '',
        status: this.mapContractStatusToEnvelopeStatus(contract.status),
        signers: this.buildSignerStatusFromContract(contract),
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        completedAt: contract.signedDate || undefined,
      };
    }

    // Get status from provider
    const status = await this.signatureProvider.getSignatureStatus(stored.envelopeId);

    return {
      ...status,
      contractId,
    };
  }

  /**
   * Handle webhook event from signature provider
   * @param headers Request headers
   * @param body Raw request body
   * @returns Processing result
   */
  async handleWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parse webhook event
      const event = await this.signatureProvider.parseWebhookEvent(headers, body);

      this.logger.log(
        `Received signature webhook: ${event.eventType} for envelope ${event.envelopeId}`,
      );

      // Get stored envelope info
      const stored = this.envelopeMap.get(event.envelopeId);

      if (!stored) {
        this.logger.warn(`Unknown envelope ID in webhook: ${event.envelopeId}`);
        // Still return success to prevent retries
        return { success: true, message: 'Unknown envelope - ignored' };
      }

      // Process based on event type
      switch (event.eventType) {
        case SignatureWebhookEventType.SIGNER_SIGNED:
          await this.handleSignerSigned(stored, event);
          break;

        case SignatureWebhookEventType.ENVELOPE_COMPLETED:
          await this.handleEnvelopeCompleted(stored, event);
          break;

        case SignatureWebhookEventType.SIGNER_DECLINED:
          await this.handleSignerDeclined(stored, event);
          break;

        case SignatureWebhookEventType.ENVELOPE_VOIDED:
        case SignatureWebhookEventType.ENVELOPE_EXPIRED:
          await this.handleEnvelopeVoided(stored, event);
          break;

        default:
          this.logger.debug(`Unhandled webhook event type: ${event.eventType}`);
      }

      return { success: true, message: `Processed ${event.eventType}` };
    } catch (error) {
      this.logger.error(`Error processing signature webhook: ${error}`);
      return { success: false, message: `Error: ${error}` };
    }
  }

  /**
   * Handle signer signed event
   */
  private async handleSignerSigned(
    stored: StoredEnvelope,
    event: SignatureWebhookEvent,
  ): Promise<void> {
    const signer = event.signer;
    if (!signer) {
      this.logger.warn('Signer signed event missing signer info');
      return;
    }

    const signerRole = signer.role as 'owner' | 'tenant';

    // Update contract with signature info
    const updateData =
      signerRole === 'owner'
        ? {
            ownerSignedAt: signer.signedAt || new Date(),
            ownerSignedBy: signer.id,
            ownerSignatureUrl: signer.signatureUrl,
            status: ContractStatus.PARTIALLY_SIGNED,
          }
        : {
            tenantSignedAt: signer.signedAt || new Date(),
            tenantSignedBy: signer.id,
            tenantSignatureUrl: signer.signatureUrl,
            status: ContractStatus.PARTIALLY_SIGNED,
          };

    await this.prisma.contract.update({
      where: { id: stored.contractId },
      data: updateData,
    });

    // Emit event
    this.eventEmitter.emit(
      'contract.signer.signed',
      new SignerSignedEvent(
        stored.contractId,
        stored.tenancyId,
        stored.partnerId,
        signerRole,
        signer.email,
        signer.signedAt || new Date(),
      ),
    );

    this.logger.log(`${signerRole} signed contract ${stored.contractId}`);
  }

  /**
   * Handle envelope completed event (all signers signed)
   */
  private async handleEnvelopeCompleted(
    stored: StoredEnvelope,
    event: SignatureWebhookEvent,
  ): Promise<void> {
    // Update contract status to ACTIVE
    await this.prisma.contract.update({
      where: { id: stored.contractId },
      data: {
        status: ContractStatus.ACTIVE,
        signedDate: new Date(),
      },
    });

    // Emit event
    this.eventEmitter.emit(
      'contract.fully.signed',
      new ContractFullySignedEvent(
        stored.contractId,
        stored.tenancyId,
        stored.partnerId,
        new Date(),
      ),
    );

    this.logger.log(`Contract ${stored.contractId} fully signed - activating tenancy`);

    // Auto-activate tenancy
    await this.activateTenancy(stored.tenancyId);
  }

  /**
   * Handle signer declined event
   */
  private async handleSignerDeclined(
    stored: StoredEnvelope,
    event: SignatureWebhookEvent,
  ): Promise<void> {
    // Log but don't terminate - might want to resend
    this.logger.warn(
      `Signer declined contract ${stored.contractId}: ${event.signer?.email}`,
    );
  }

  /**
   * Handle envelope voided/expired
   */
  private async handleEnvelopeVoided(
    stored: StoredEnvelope,
    event: SignatureWebhookEvent,
  ): Promise<void> {
    // Update contract status back to DRAFT or keep as is
    this.logger.warn(`Envelope voided/expired for contract ${stored.contractId}`);
  }

  /**
   * Activate tenancy when contract is fully signed
   */
  private async activateTenancy(tenancyId: string): Promise<void> {
    try {
      // Get tenancy
      const tenancy = await this.prisma.tenancy.findUnique({
        where: { id: tenancyId },
      });

      if (!tenancy) {
        this.logger.warn(`Tenancy not found for activation: ${tenancyId}`);
        return;
      }

      // Only activate if in CONTRACT_PENDING status
      if (tenancy.status !== TenancyStatus.CONTRACT_PENDING) {
        this.logger.debug(
          `Tenancy ${tenancyId} not in CONTRACT_PENDING status (${tenancy.status}), skipping activation`,
        );
        return;
      }

      // Update tenancy status to ACTIVE
      await this.prisma.tenancy.update({
        where: { id: tenancyId },
        data: { status: TenancyStatus.ACTIVE },
      });

      // Record status history
      await this.prisma.tenancyStatusHistory.create({
        data: {
          tenancyId,
          fromStatus: TenancyStatus.CONTRACT_PENDING,
          toStatus: TenancyStatus.ACTIVE,
          reason: 'Contract fully signed',
          changedBy: 'system',
        },
      });

      this.logger.log(`Tenancy ${tenancyId} activated after contract signing`);

      // Emit event for other modules (notifications, etc.)
      this.eventEmitter.emit('tenancy.activated', {
        tenancyId,
        reason: 'Contract fully signed',
      });
    } catch (error) {
      this.logger.error(`Failed to activate tenancy ${tenancyId}: ${error}`);
    }
  }

  /**
   * Manually record a signature (for testing or manual override)
   */
  async recordSignature(
    contractId: string,
    signerRole: 'owner' | 'tenant',
    signatureUrl?: string,
    signedBy?: string,
  ): Promise<Contract> {
    const partnerId = this.PartnerContext.partnerId;

    // Get contract to verify access and check status
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        tenancy: { partnerId },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract not found: ${contractId}`);
    }

    // Validate status
    const validStatuses: ContractStatus[] = [
      ContractStatus.PENDING_SIGNATURE,
      ContractStatus.PARTIALLY_SIGNED,
    ];
    if (!validStatuses.includes(contract.status)) {
      throw new BadRequestException(
        `Cannot record signature for contract in ${contract.status} status`,
      );
    }

    // Update signature fields
    const updateData =
      signerRole === 'owner'
        ? {
            ownerSignedAt: new Date(),
            ownerSignedBy: signedBy,
            ownerSignatureUrl: signatureUrl,
          }
        : {
            tenantSignedAt: new Date(),
            tenantSignedBy: signedBy,
            tenantSignatureUrl: signatureUrl,
          };

    // Check if this completes all signatures
    const otherSignedAt =
      signerRole === 'owner' ? contract.tenantSignedAt : contract.ownerSignedAt;

    if (otherSignedAt) {
      // Both parties now signed - activate
      Object.assign(updateData, {
        status: ContractStatus.ACTIVE,
        signedDate: new Date(),
      });
    } else {
      // Only one party signed
      Object.assign(updateData, {
        status: ContractStatus.PARTIALLY_SIGNED,
      });
    }

    const updated = await this.prisma.contract.update({
      where: { id: contractId },
      data: updateData,
    });

    // If fully signed, activate tenancy
    if (updated.status === ContractStatus.ACTIVE) {
      this.logger.log(`Contract ${contractId} manually completed - activating tenancy`);

      this.eventEmitter.emit(
        'contract.fully.signed',
        new ContractFullySignedEvent(
          contractId,
          contract.tenancyId,
          partnerId,
          new Date(),
        ),
      );

      await this.activateTenancy(contract.tenancyId);
    } else {
      this.eventEmitter.emit(
        'contract.signer.signed',
        new SignerSignedEvent(
          contractId,
          contract.tenancyId,
          partnerId,
          signerRole,
          '',
          new Date(),
        ),
      );
    }

    this.logger.log(`Recorded ${signerRole} signature for contract ${contractId}`);

    return updated;
  }

  /**
   * Void/cancel signature request
   */
  async voidSignatureRequest(contractId: string, reason: string): Promise<void> {
    const partnerId = this.PartnerContext.partnerId;

    // Get contract to verify access
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        tenancy: { partnerId },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract not found: ${contractId}`);
    }

    // Get stored envelope
    const stored = this.envelopeMap.get(contractId);

    if (stored) {
      // Void in provider
      await this.signatureProvider.voidEnvelope(stored.envelopeId, reason);

      // Remove from map
      this.envelopeMap.delete(contractId);
      this.envelopeMap.delete(stored.envelopeId);
    }

    // Reset contract status to DRAFT
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.DRAFT,
        ownerSignedAt: null,
        ownerSignedBy: null,
        ownerSignatureUrl: null,
        tenantSignedAt: null,
        tenantSignedBy: null,
        tenantSignatureUrl: null,
      },
    });

    this.logger.log(`Voided signature request for contract ${contractId}: ${reason}`);
  }

  /**
   * Resend signature request to a signer
   */
  async resendToSigner(contractId: string, signerRole: 'owner' | 'tenant'): Promise<void> {
    const stored = this.envelopeMap.get(contractId);

    if (!stored) {
      throw new BadRequestException(
        'No active signature request found for this contract',
      );
    }

    // Get signer email from contract
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId },
      include: {
        tenancy: {
          include: {
            owner: { select: { email: true } },
            tenant: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract not found: ${contractId}`);
    }

    const email =
      signerRole === 'owner'
        ? contract.tenancy.owner.email
        : contract.tenancy.tenant.user.email;

    if (!email) {
      throw new BadRequestException(`No email found for ${signerRole}`);
    }

    await this.signatureProvider.resendToSigner(stored.envelopeId, email);

    this.logger.log(`Resent signature request to ${signerRole} (${email}) for contract ${contractId}`);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Map contract status to envelope status
   */
  private mapContractStatusToEnvelopeStatus(status: ContractStatus): SignatureEnvelopeStatus {
    switch (status) {
      case ContractStatus.DRAFT:
        return SignatureEnvelopeStatus.CREATED;
      case ContractStatus.PENDING_SIGNATURE:
        return SignatureEnvelopeStatus.SENT;
      case ContractStatus.PARTIALLY_SIGNED:
        return SignatureEnvelopeStatus.PARTIALLY_SIGNED;
      case ContractStatus.ACTIVE:
        return SignatureEnvelopeStatus.COMPLETED;
      case ContractStatus.TERMINATED:
        return SignatureEnvelopeStatus.VOIDED;
      case ContractStatus.EXPIRED:
        return SignatureEnvelopeStatus.EXPIRED;
      default:
        return SignatureEnvelopeStatus.CREATED;
    }
  }

  /**
   * Build signer status from contract data
   */
  private buildSignerStatusFromContract(contract: Contract): Array<{
    signerId: string;
    email: string;
    role: 'owner' | 'tenant';
    status: 'pending' | 'sent' | 'delivered' | 'signed' | 'declined';
    signedAt?: Date;
    signatureUrl?: string;
  }> {
    return [
      {
        signerId: contract.ownerSignedBy || 'owner',
        email: '',
        role: 'owner' as const,
        status: contract.ownerSignedAt ? 'signed' : 'pending',
        signedAt: contract.ownerSignedAt || undefined,
        signatureUrl: contract.ownerSignatureUrl || undefined,
      },
      {
        signerId: contract.tenantSignedBy || 'tenant',
        email: '',
        role: 'tenant' as const,
        status: contract.tenantSignedAt ? 'signed' : 'pending',
        signedAt: contract.tenantSignedAt || undefined,
        signatureUrl: contract.tenantSignatureUrl || undefined,
      },
    ];
  }
}
