import { IsNotEmpty, IsString, IsUUID, MaxLength, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for joining a listing room.
 */
export class JoinListingDto {
  @ApiProperty({ description: 'Listing ID to join', example: 'uuid-here' })
  @IsUUID()
  listingId!: string;
}

/**
 * DTO for leaving a listing room.
 */
export class LeaveListingDto {
  @ApiProperty({ description: 'Listing ID to leave', example: 'uuid-here' })
  @IsUUID()
  listingId!: string;
}

/**
 * DTO for joining an interaction room.
 */
export class JoinInteractionDto {
  @ApiProperty({ description: 'Interaction ID to join', example: 'uuid-here' })
  @IsUUID()
  interactionId!: string;
}

/**
 * DTO for leaving an interaction room.
 */
export class LeaveInteractionDto {
  @ApiProperty({ description: 'Interaction ID to leave', example: 'uuid-here' })
  @IsUUID()
  interactionId!: string;
}

/**
 * DTO for sending a message in an interaction.
 */
export class SendMessageDto {
  @ApiProperty({ description: 'Interaction ID', example: 'uuid-here' })
  @IsUUID()
  interactionId!: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, I am interested in this property.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}

/**
 * DTO for typing indicator.
 */
export class TypingDto {
  @ApiProperty({ description: 'Interaction ID', example: 'uuid-here' })
  @IsUUID()
  interactionId!: string;
}

/**
 * DTO for marking messages as read.
 */
export class MarkReadDto {
  @ApiProperty({ description: 'Interaction ID', example: 'uuid-here' })
  @IsUUID()
  interactionId!: string;

  @ApiProperty({
    description: 'Array of message IDs to mark as read',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  messageIds!: string[];
}

/**
 * DTO for tracking listing views.
 */
export class ListingViewDto {
  @ApiProperty({ description: 'Listing ID', example: 'uuid-here' })
  @IsUUID()
  listingId!: string;
}

/**
 * DTO for marking notification as read.
 */
export class NotificationReadDto {
  @ApiProperty({ description: 'Notification ID', example: 'uuid-here' })
  @IsUUID()
  notificationId!: string;
}

/**
 * DTO for joining a vendor room.
 */
export class JoinVendorDto {
  @ApiProperty({ description: 'Vendor ID to join', example: 'uuid-here' })
  @IsUUID()
  vendorId!: string;
}

/**
 * DTO for leaving a vendor room.
 */
export class LeaveVendorDto {
  @ApiProperty({ description: 'Vendor ID to leave', example: 'uuid-here' })
  @IsUUID()
  vendorId!: string;
}
