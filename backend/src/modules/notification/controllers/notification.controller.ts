import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotificationService } from '../services/notification.service';
import {
  ListNotificationsDto,
  MarkNotificationReadDto,
  MarkAllReadDto,
  UpdatePreferenceDto,
  GetPreferencesDto,
  NotificationResponseDto,
  PreferenceResponseDto,
} from '../dto/notification.dto';

/**
 * Express request with authenticated user
 */
interface AuthRequest extends Request {
  user: {
    sub: string; // User ID
    tenantId: string;
  };
}

/**
 * Controller for user-facing notification endpoints (in-app notifications)
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * List user's notifications (paginated)
   */
  @Get()
  @ApiOperation({ summary: 'List user notifications' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of notifications',
    type: [NotificationResponseDto],
  })
  async listNotifications(@Req() req: AuthRequest, @Query() query: ListNotificationsDto) {
    const userId = req.user.sub; // User ID from JWT
    const tenantId = req.user.tenantId; // Tenant ID from JWT

    return this.notificationService.listUserNotifications({
      tenantId,
      userId,
      ...query,
    });
  }

  /**
   * Get unread notification count
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  async getUnreadCount(@Req() req: AuthRequest) {
    const userId = req.user.sub;
    const tenantId = req.user.tenantId;

    const count = await this.notificationService.getUnreadCount(tenantId, userId);
    return { count };
  }

  /**
   * Mark single notification as read
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  async markAsRead(
    @Req() req: AuthRequest,
    @Param('id') notificationId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _dto: MarkNotificationReadDto,
  ) {
    const userId = req.user.sub;
    const tenantId = req.user.tenantId;

    return this.notificationService.markAsRead(tenantId, userId, notificationId);
  }

  /**
   * Mark all user notifications as read
   */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Number of notifications marked as read' },
      },
    },
  })
  async markAllAsRead(
    @Req() req: AuthRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _dto: MarkAllReadDto,
  ) {
    const userId = req.user.sub;
    const tenantId = req.user.tenantId;

    const count = await this.notificationService.markAllAsRead(tenantId, userId);
    return { count };
  }

  /**
   * Get user's notification preferences
   */
  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'User notification preferences',
    type: [PreferenceResponseDto],
  })
  async getPreferences(
    @Req() req: AuthRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Query() _query: GetPreferencesDto,
  ) {
    const userId = req.user.sub;
    const tenantId = req.user.tenantId;

    return this.notificationService.getUserPreferences(tenantId, userId);
  }

  /**
   * Update notification preference (opt-in/opt-out)
   */
  @Patch('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preference' })
  @ApiResponse({
    status: 200,
    description: 'Preference updated',
    type: PreferenceResponseDto,
  })
  async updatePreference(@Req() req: AuthRequest, @Body() dto: UpdatePreferenceDto) {
    const userId = req.user.sub;
    const tenantId = req.user.tenantId;

    return this.notificationService.updatePreference({
      tenantId,
      userId,
      ...dto,
    });
  }
}
