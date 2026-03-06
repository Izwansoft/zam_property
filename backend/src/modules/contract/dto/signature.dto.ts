import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  IsIn,
  IsNotEmpty,
} from 'class-validator';

/**
 * DTO for requesting signatures on a contract
 */
export class RequestSignaturesDto {
  @ApiPropertyOptional({
    description: 'Callback URL for webhook notifications',
    example: 'https://api.example.com/webhooks/signatures',
  })
  @IsOptional()
  @IsUrl()
  callbackUrl?: string;
}

/**
 * DTO for manually recording a signature
 */
export class RecordSignatureDto {
  @ApiProperty({
    description: 'Role of the signer',
    enum: ['owner', 'tenant'],
    example: 'owner',
  })
  @IsIn(['owner', 'tenant'])
  signerRole!: 'owner' | 'tenant';

  @ApiPropertyOptional({
    description: 'URL to the signature image',
    example: 'https://s3.example.com/signatures/sig123.png',
  })
  @IsOptional()
  @IsUrl()
  signatureUrl?: string;

  @ApiPropertyOptional({
    description: 'ID of the user who signed',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  signedBy?: string;
}

/**
 * DTO for voiding a signature request
 */
export class VoidSignatureRequestDto {
  @ApiProperty({
    description: 'Reason for voiding the signature request',
    example: 'Contract terms changed - new version required',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

/**
 * DTO for resending signature request to a signer
 */
export class ResendSignatureDto {
  @ApiProperty({
    description: 'Role of the signer to resend to',
    enum: ['owner', 'tenant'],
    example: 'tenant',
  })
  @IsIn(['owner', 'tenant'])
  signerRole!: 'owner' | 'tenant';
}

/**
 * Response DTO for signature request
 */
export class SignatureRequestResponseDto {
  @ApiProperty({
    description: 'Contract ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  contractId!: string;

  @ApiProperty({
    description: 'Envelope ID from signature provider',
    example: 'env_abc123',
  })
  envelopeId!: string;

  @ApiProperty({
    description: 'Status of the signature request',
    example: 'SENT',
  })
  status!: string;

  @ApiPropertyOptional({
    description: 'Signing URLs for embedded signing',
    example: { owner: 'https://sign.example.com/owner', tenant: 'https://sign.example.com/tenant' },
  })
  signingUrls?: Record<string, string>;

  @ApiProperty({
    description: 'When the request was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'When the request expires',
    example: '2024-02-14T10:30:00Z',
  })
  expiresAt?: Date;
}

/**
 * Response DTO for signature status
 */
export class SignatureStatusResponseDto {
  @ApiProperty({
    description: 'Contract ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  contractId!: string;

  @ApiProperty({
    description: 'Envelope ID from signature provider',
    example: 'env_abc123',
  })
  envelopeId!: string;

  @ApiProperty({
    description: 'Overall status of the signature request',
    enum: ['CREATED', 'SENT', 'DELIVERED', 'PENDING', 'PARTIALLY_SIGNED', 'COMPLETED', 'DECLINED', 'VOIDED', 'EXPIRED'],
    example: 'PARTIALLY_SIGNED',
  })
  status!: string;

  @ApiProperty({
    description: 'Status of each signer',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        signerId: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string', enum: ['owner', 'tenant'] },
        status: { type: 'string', enum: ['pending', 'sent', 'delivered', 'signed', 'declined'] },
        signedAt: { type: 'string', format: 'date-time' },
        signatureUrl: { type: 'string' },
      },
    },
  })
  signers!: Array<{
    signerId: string;
    email: string;
    role: 'owner' | 'tenant';
    status: 'pending' | 'sent' | 'delivered' | 'signed' | 'declined';
    signedAt?: Date;
    signatureUrl?: string;
  }>;

  @ApiPropertyOptional({
    description: 'URL to the completed signed document',
    example: 'https://s3.example.com/signed/contract123.pdf',
  })
  completedDocumentUrl?: string;

  @ApiProperty({
    description: 'When the request was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'When the status was last updated',
    example: '2024-01-16T14:20:00Z',
  })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'When all signatures were completed',
    example: '2024-01-17T09:00:00Z',
  })
  completedAt?: Date;
}

/**
 * Response DTO for webhook processing
 */
export class WebhookResponseDto {
  @ApiProperty({
    description: 'Whether the webhook was processed successfully',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Processing message',
    example: 'Processed signer.signed',
  })
  message!: string;
}
