import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for verifying a maintenance ticket (OPEN → VERIFIED)
 */
export class VerifyMaintenanceDto {
  @ApiPropertyOptional({
    description: 'Verification notes from admin/vendor',
    example: 'Issue confirmed via photo evidence. Plumbing leak in kitchen.',
  })
  @IsOptional()
  @IsString()
  verificationNotes?: string;
}

/**
 * DTO for assigning a maintenance ticket (VERIFIED → ASSIGNED)
 * Supports both vendor staff and external contractor assignment
 */
export class AssignMaintenanceDto {
  @ApiProperty({
    description: 'Assigned to (vendor staff name/ID or contractor name)',
    example: 'Ahmad Plumbing Services',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  assignedTo!: string;

  @ApiPropertyOptional({
    description: 'External contractor name (if assigning to external contractor)',
    example: 'Ahmad Plumbing Services',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contractorName?: string;

  @ApiPropertyOptional({
    description: 'External contractor phone number',
    example: '+60123456789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contractorPhone?: string;

  @ApiPropertyOptional({
    description: 'Estimated cost for the repair',
    example: 350.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedCost?: number;
}

/**
 * DTO for resolving a maintenance ticket (IN_PROGRESS → PENDING_APPROVAL)
 */
export class ResolveMaintenanceDto {
  @ApiProperty({
    description: 'Description of the resolution/work completed',
    example: 'Replaced kitchen faucet cartridge and tested for leaks. No further issues.',
  })
  @IsString()
  @IsNotEmpty()
  resolution!: string;

  @ApiPropertyOptional({
    description: 'Actual cost of the repair',
    example: 280.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  actualCost?: number;

  @ApiPropertyOptional({
    description: 'Who pays for the maintenance',
    enum: ['OWNER', 'TENANT', 'SHARED'],
    example: 'OWNER',
  })
  @IsOptional()
  @IsString()
  paidBy?: string;
}

/**
 * DTO for closing a maintenance ticket (PENDING_APPROVAL | CLAIM_APPROVED → CLOSED)
 */
export class CloseMaintenanceDto {
  @ApiPropertyOptional({
    description: 'Optional closing notes',
    example: 'Verified repair quality. Issue fully resolved.',
  })
  @IsOptional()
  @IsString()
  closingNotes?: string;
}

/**
 * DTO for cancelling a maintenance ticket
 */
export class CancelMaintenanceDto {
  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Duplicate ticket. Already addressed in MNT-20260221-0001.',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
