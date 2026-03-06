import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  IsInt,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Notification DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel!: NotificationChannel;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resourceType?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  resourceId?: string;
}

export class ListNotificationsDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationStatus })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiPropertyOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  @ApiPropertyOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ enum: ['createdAt'] })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number = 20;
}

export class MarkNotificationReadDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  notificationId!: string;
}

export class MarkAllReadDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateTemplateDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel!: NotificationChannel;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bodyTemplate!: string;

  @ApiPropertyOptional({ default: 'en' })
  @IsString()
  @IsOptional()
  locale?: string = 'en';

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  variables?: Record<string, unknown>;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bodyTemplate?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  variables?: Record<string, unknown>;
}

export class ListTemplatesDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  pageSize?: number = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
// Preference DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class UpdatePreferenceDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  notificationType!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel!: NotificationChannel;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  enabled!: boolean;
}

export class GetPreferencesDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Send Notification DTOs (for event handlers)
// ─────────────────────────────────────────────────────────────────────────────

export class SendNotificationDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel, isArray: true })
  @IsEnum(NotificationChannel, { each: true })
  @IsNotEmpty()
  channels!: NotificationChannel[];

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  variables!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resourceType?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  resourceId?: string;
}

export class SendBatchNotificationDto {
  @ApiProperty({ type: [String] })
  @IsUUID(undefined, { each: true })
  @IsNotEmpty()
  userIds!: string[];

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel, isArray: true })
  @IsEnum(NotificationChannel, { each: true })
  @IsNotEmpty()
  channels!: NotificationChannel[];

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  variables!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resourceType?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  resourceId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty({ enum: NotificationStatus })
  status!: NotificationStatus;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional()
  resourceType?: string;

  @ApiPropertyOptional()
  resourceId?: string;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiProperty()
  createdAt!: Date;
}

export class TemplateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  subject?: string;

  @ApiProperty()
  bodyTemplate!: string;

  @ApiProperty()
  locale!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional()
  variables?: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PreferenceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationType })
  notificationType!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
