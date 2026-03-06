import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

import {
  ISignatureProvider,
  SignatureRequest,
  SignatureRequestResponse,
  SignatureStatus,
  SignatureEnvelopeStatus,
  SignerStatus,
  SignatureWebhookEvent,
  SignatureWebhookEventType,
} from './signature-provider.interface';

/**
 * Mock envelope storage (in-memory for MVP)
 * In production, this would be stored in database or the real provider
 */
interface MockEnvelope {
  id: string;
  contractId: string;
  contractNumber: string;
  documentUrl: string;
  status: SignatureEnvelopeStatus;
  signers: MockSigner[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedDocumentUrl?: string;
}

interface MockSigner {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'tenant';
  status: 'pending' | 'sent' | 'delivered' | 'signed' | 'declined';
  signedAt?: Date;
  signatureUrl?: string;
  signingUrl?: string;
}

/**
 * Mock Signature Provider
 *
 * Simulates e-signature workflow for MVP/testing.
 * Can be replaced with DocuSign, SignNow, or other providers.
 */
@Injectable()
export class MockSignatureProvider implements ISignatureProvider {
  private readonly logger = new Logger(MockSignatureProvider.name);

  readonly providerId = 'mock';

  /**
   * In-memory storage for mock envelopes
   * In a real implementation, this would be stored in database
   */
  private envelopes: Map<string, MockEnvelope> = new Map();

  /**
   * Create a mock signature request
   */
  async createSignatureRequest(request: SignatureRequest): Promise<SignatureRequestResponse> {
    const envelopeId = `mock_env_${crypto.randomUUID()}`;

    // Create mock signers with signing URLs
    const signers: MockSigner[] = request.signers.map((signer) => ({
      id: signer.id,
      email: signer.email,
      name: signer.name,
      role: signer.role,
      status: 'sent' as const,
      signingUrl: `https://mock-esign.local/sign/${envelopeId}/${signer.id}`,
    }));

    // Create envelope
    const envelope: MockEnvelope = {
      id: envelopeId,
      contractId: request.contractId,
      contractNumber: request.contractNumber,
      documentUrl: request.document.documentUrl,
      status: SignatureEnvelopeStatus.SENT,
      signers,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.envelopes.set(envelopeId, envelope);

    this.logger.log(`[MOCK] Created signature envelope ${envelopeId} for contract ${request.contractId}`);
    this.logger.debug(`[MOCK] Signers: ${signers.map((s) => `${s.name} <${s.email}>`).join(', ')}`);

    // Build signing URLs map
    const signingUrls: Record<string, string> = {};
    for (const signer of signers) {
      signingUrls[signer.role] = signer.signingUrl!;
    }

    return {
      envelopeId,
      status: SignatureEnvelopeStatus.SENT,
      signingUrls,
      createdAt: envelope.createdAt,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  /**
   * Get mock signature status
   */
  async getSignatureStatus(envelopeId: string): Promise<SignatureStatus> {
    const envelope = this.envelopes.get(envelopeId);

    if (!envelope) {
      // Return a default "not found" status for unknown envelopes
      return {
        envelopeId,
        status: SignatureEnvelopeStatus.EXPIRED,
        signers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const signerStatuses: SignerStatus[] = envelope.signers.map((signer) => ({
      signerId: signer.id,
      email: signer.email,
      role: signer.role,
      status: signer.status,
      signedAt: signer.signedAt,
      signatureUrl: signer.signatureUrl,
    }));

    return {
      envelopeId: envelope.id,
      status: envelope.status,
      signers: signerStatuses,
      completedDocumentUrl: envelope.completedDocumentUrl,
      createdAt: envelope.createdAt,
      updatedAt: envelope.updatedAt,
      completedAt: envelope.completedAt,
    };
  }

  /**
   * Void mock envelope
   */
  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    const envelope = this.envelopes.get(envelopeId);

    if (envelope) {
      envelope.status = SignatureEnvelopeStatus.VOIDED;
      envelope.updatedAt = new Date();
      this.logger.log(`[MOCK] Voided envelope ${envelopeId}: ${reason}`);
    }
  }

  /**
   * Resend to signer (mock - just logs)
   */
  async resendToSigner(envelopeId: string, signerEmail: string): Promise<void> {
    this.logger.log(`[MOCK] Resent envelope ${envelopeId} to ${signerEmail}`);
  }

  /**
   * Get signed document (returns original document for mock)
   */
  async getSignedDocument(envelopeId: string): Promise<Buffer> {
    const envelope = this.envelopes.get(envelopeId);

    if (!envelope) {
      throw new Error(`Envelope not found: ${envelopeId}`);
    }

    // For mock, just return a placeholder
    // In production, this would download the signed document from the provider
    return Buffer.from(`[MOCK] Signed document for ${envelope.contractNumber}`);
  }

  /**
   * Parse webhook event (mock implementation)
   */
  async parseWebhookEvent(
    headers: Record<string, string>,
    body: unknown,
  ): Promise<SignatureWebhookEvent> {
    const data = body as Record<string, unknown>;

    return {
      eventType: data.eventType as SignatureWebhookEventType,
      envelopeId: data.envelopeId as string,
      externalId: data.contractId as string,
      signer: data.signer as SignatureWebhookEvent['signer'],
      timestamp: new Date(data.timestamp as string),
      rawData: data,
    };
  }

  /**
   * Verify webhook signature (mock always returns true)
   */
  async verifyWebhookSignature(
    _headers: Record<string, string>,
    _body: unknown,
    _signature: string,
  ): Promise<boolean> {
    // Mock provider accepts all webhooks
    // Real providers would verify HMAC signature
    return true;
  }

  // ==================== MOCK TESTING METHODS ====================

  /**
   * Simulate a signer signing the document (for testing)
   * @param envelopeId Envelope ID
   * @param signerRole Role of the signer (owner or tenant)
   * @returns Updated signer status
   */
  async simulateSign(envelopeId: string, signerRole: 'owner' | 'tenant'): Promise<SignerStatus | null> {
    const envelope = this.envelopes.get(envelopeId);

    if (!envelope) {
      return null;
    }

    const signer = envelope.signers.find((s) => s.role === signerRole);
    if (!signer) {
      return null;
    }

    // Mark as signed
    signer.status = 'signed';
    signer.signedAt = new Date();
    signer.signatureUrl = `https://mock-esign.local/signatures/${envelopeId}/${signer.id}.png`;

    envelope.updatedAt = new Date();

    // Check if all signers have signed
    const allSigned = envelope.signers.every((s) => s.status === 'signed');
    if (allSigned) {
      envelope.status = SignatureEnvelopeStatus.COMPLETED;
      envelope.completedAt = new Date();
      envelope.completedDocumentUrl = `${envelope.documentUrl}?signed=true`;
    } else {
      envelope.status = SignatureEnvelopeStatus.PARTIALLY_SIGNED;
    }

    this.logger.log(`[MOCK] ${signerRole} signed envelope ${envelopeId}. Status: ${envelope.status}`);

    return {
      signerId: signer.id,
      email: signer.email,
      role: signer.role,
      status: signer.status,
      signedAt: signer.signedAt,
      signatureUrl: signer.signatureUrl,
    };
  }

  /**
   * Get envelope by contract ID (for testing)
   */
  getEnvelopeByContractId(contractId: string): MockEnvelope | undefined {
    for (const envelope of this.envelopes.values()) {
      if (envelope.contractId === contractId) {
        return envelope;
      }
    }
    return undefined;
  }

  /**
   * Clear all envelopes (for testing)
   */
  clearEnvelopes(): void {
    this.envelopes.clear();
  }
}
