/**
 * E-Signature Provider Interface
 *
 * Abstract interface for e-signature providers (DocuSign, SignNow, etc.)
 * Allows switching providers without changing business logic.
 */

/**
 * Signer information for signature request
 */
export interface SignerInfo {
  /** Unique identifier for the signer */
  id: string;
  /** Full name of the signer */
  name: string;
  /** Email address of the signer */
  email: string;
  /** Role in the contract (owner, tenant) */
  role: 'owner' | 'tenant';
  /** Optional phone number for SMS verification */
  phone?: string;
}

/**
 * Document to be signed
 */
export interface SignatureDocument {
  /** Unique identifier for the document */
  id: string;
  /** Display name of the document */
  name: string;
  /** URL to the document (S3 or other storage) */
  documentUrl: string;
  /** MIME type of the document */
  mimeType?: string;
}

/**
 * Request to create a signature envelope/request
 */
export interface SignatureRequest {
  /** Contract ID (used as external reference) */
  contractId: string;
  /** Contract number for display */
  contractNumber: string;
  /** Document to be signed */
  document: SignatureDocument;
  /** List of signers */
  signers: SignerInfo[];
  /** Email subject line */
  emailSubject?: string;
  /** Email message body */
  emailMessage?: string;
  /** Callback URL for webhook notifications */
  callbackUrl?: string;
  /** Metadata to attach to the envelope */
  metadata?: Record<string, string>;
}

/**
 * Response from creating a signature request
 */
export interface SignatureRequestResponse {
  /** Provider's envelope/request ID */
  envelopeId: string;
  /** Status of the envelope */
  status: SignatureEnvelopeStatus;
  /** Signing URLs for each signer (embedded signing) */
  signingUrls?: Record<string, string>;
  /** When the envelope was created */
  createdAt: Date;
  /** When the envelope expires */
  expiresAt?: Date;
}

/**
 * Status of a signature envelope
 */
export enum SignatureEnvelopeStatus {
  /** Envelope created but not sent */
  CREATED = 'CREATED',
  /** Envelope sent to signers */
  SENT = 'SENT',
  /** Envelope delivered to signers */
  DELIVERED = 'DELIVERED',
  /** Waiting for signatures */
  PENDING = 'PENDING',
  /** Some signers have signed */
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  /** All signers have signed */
  COMPLETED = 'COMPLETED',
  /** Envelope declined by a signer */
  DECLINED = 'DECLINED',
  /** Envelope voided by sender */
  VOIDED = 'VOIDED',
  /** Envelope expired */
  EXPIRED = 'EXPIRED',
}

/**
 * Individual signer status
 */
export interface SignerStatus {
  /** Signer ID from the request */
  signerId: string;
  /** Signer email */
  email: string;
  /** Signer role */
  role: 'owner' | 'tenant';
  /** Current status */
  status: 'pending' | 'sent' | 'delivered' | 'signed' | 'declined';
  /** When the signer signed (if signed) */
  signedAt?: Date;
  /** URL to the signer's signature image */
  signatureUrl?: string;
  /** IP address when signed */
  signedFromIp?: string;
}

/**
 * Full status of a signature envelope
 */
export interface SignatureStatus {
  /** Provider's envelope ID */
  envelopeId: string;
  /** Overall envelope status */
  status: SignatureEnvelopeStatus;
  /** Status of each signer */
  signers: SignerStatus[];
  /** URL to the completed/signed document */
  completedDocumentUrl?: string;
  /** When the envelope was created */
  createdAt: Date;
  /** When the envelope was last updated */
  updatedAt: Date;
  /** When all signatures were completed */
  completedAt?: Date;
}

/**
 * Webhook event from signature provider
 */
export interface SignatureWebhookEvent {
  /** Event type */
  eventType: SignatureWebhookEventType;
  /** Provider's envelope ID */
  envelopeId: string;
  /** External reference (contract ID) */
  externalId?: string;
  /** Signer information (for signer-specific events) */
  signer?: {
    id: string;
    email: string;
    role: string;
    signedAt?: Date;
    signatureUrl?: string;
  };
  /** Event timestamp */
  timestamp: Date;
  /** Raw event data from provider */
  rawData?: Record<string, unknown>;
}

/**
 * Types of webhook events
 */
export enum SignatureWebhookEventType {
  ENVELOPE_SENT = 'envelope.sent',
  ENVELOPE_DELIVERED = 'envelope.delivered',
  SIGNER_VIEWED = 'signer.viewed',
  SIGNER_SIGNED = 'signer.signed',
  SIGNER_DECLINED = 'signer.declined',
  ENVELOPE_COMPLETED = 'envelope.completed',
  ENVELOPE_VOIDED = 'envelope.voided',
  ENVELOPE_EXPIRED = 'envelope.expired',
}

/**
 * Abstract signature provider interface
 */
export interface ISignatureProvider {
  /**
   * Provider identifier
   */
  readonly providerId: string;

  /**
   * Create a signature request/envelope
   * @param request Signature request details
   * @returns Response with envelope ID and signing URLs
   */
  createSignatureRequest(request: SignatureRequest): Promise<SignatureRequestResponse>;

  /**
   * Get the current status of a signature envelope
   * @param envelopeId Provider's envelope ID
   * @returns Current status of the envelope and all signers
   */
  getSignatureStatus(envelopeId: string): Promise<SignatureStatus>;

  /**
   * Void/cancel a signature envelope
   * @param envelopeId Provider's envelope ID
   * @param reason Reason for voiding
   */
  voidEnvelope(envelopeId: string, reason: string): Promise<void>;

  /**
   * Resend notification to a signer
   * @param envelopeId Provider's envelope ID
   * @param signerEmail Email of the signer to resend to
   */
  resendToSigner(envelopeId: string, signerEmail: string): Promise<void>;

  /**
   * Get the signed document
   * @param envelopeId Provider's envelope ID
   * @returns Buffer containing the signed PDF
   */
  getSignedDocument(envelopeId: string): Promise<Buffer>;

  /**
   * Parse and validate webhook event
   * @param headers Request headers
   * @param body Raw request body
   * @returns Parsed webhook event
   */
  parseWebhookEvent(headers: Record<string, string>, body: unknown): Promise<SignatureWebhookEvent>;

  /**
   * Verify webhook signature (security)
   * @param headers Request headers
   * @param body Raw request body
   * @param signature Signature from headers
   * @returns True if signature is valid
   */
  verifyWebhookSignature(headers: Record<string, string>, body: unknown, signature: string): Promise<boolean>;
}

/**
 * Injection token for signature provider
 */
export const SIGNATURE_PROVIDER = 'SIGNATURE_PROVIDER';
