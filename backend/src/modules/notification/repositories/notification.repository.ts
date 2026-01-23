import { Injectable, Logger } from '@nestjs/common';
import { Prisma, NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class NotificationRepository {
  private readonly logger = new Logger(NotificationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Notification CRUD
  // ───────────────────────────────────────────────────────────────────────────

  async createNotification(data: {
    tenantId: string;
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    body: string;
    data?: Prisma.InputJsonValue;
    templateId?: string;
    eventId?: string;
    resourceType?: string;
    resourceId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        type: data.type,
        channel: data.channel,
        title: data.title,
        body: data.body,
        data: data.data as Prisma.InputJsonValue,
        templateId: data.templateId,
        eventId: data.eventId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        status: NotificationStatus.PENDING,
      },
    });

    this.logger.log(`Created notification: ${notification.id} for user: ${data.userId}`);
    return notification;
  }

  async findNotifications(params: {
    tenantId: string;
    userId?: string;
    type?: NotificationType;
    channel?: NotificationChannel;
    status?: NotificationStatus;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.NotificationWhereInput = {
      tenantId: params.tenantId,
      ...(params.userId && { userId: params.userId }),
      ...(params.type && { type: params.type }),
      ...(params.channel && { channel: params.channel }),
      ...(params.status && { status: params.status }),
      ...(params.unreadOnly && { readAt: null }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findNotificationById(id: string, tenantId: string) {
    return this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async markAsRead(id: string, _tenantId: string) {
    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    this.logger.log(`Marked notification as read: ${id}`);
    return updated;
  }

  async markAllAsRead(params: { tenantId: string; userId: string; type?: NotificationType }) {
    const where: Prisma.NotificationWhereInput = {
      tenantId: params.tenantId,
      userId: params.userId,
      readAt: null,
      ...(params.type && { type: params.type }),
    };

    const result = await this.prisma.notification.updateMany({
      where,
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    this.logger.log(`Marked ${result.count} notifications as read for user: ${params.userId}`);
    return result;
  }

  async updateNotificationStatus(params: {
    id: string;
    status: NotificationStatus;
    sentAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
  }) {
    return this.prisma.notification.update({
      where: { id: params.id },
      data: {
        status: params.status,
        sentAt: params.sentAt,
        failedAt: params.failedAt,
        errorMessage: params.errorMessage,
      },
    });
  }

  async incrementRetryCount(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        retryCount: { increment: 1 },
      },
    });
  }

  async getUnreadCount(tenantId: string, userId: string) {
    return this.prisma.notification.count({
      where: {
        tenantId,
        userId,
        readAt: null,
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Template CRUD
  // ───────────────────────────────────────────────────────────────────────────

  async createTemplate(data: {
    tenantId: string;
    type: NotificationType;
    channel: NotificationChannel;
    name: string;
    description?: string;
    subject?: string;
    bodyTemplate: string;
    locale?: string;
    isActive?: boolean;
    variables?: Prisma.InputJsonValue;
  }) {
    const template = await this.prisma.notificationTemplate.create({
      data: {
        tenantId: data.tenantId,
        type: data.type,
        channel: data.channel,
        name: data.name,
        description: data.description,
        subject: data.subject,
        bodyTemplate: data.bodyTemplate,
        locale: data.locale || 'en',
        isActive: data.isActive !== undefined ? data.isActive : true,
        variables: data.variables as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Created template: ${template.id} (${template.name})`);
    return template;
  }

  async findTemplates(params: {
    tenantId: string;
    type?: NotificationType;
    channel?: NotificationChannel;
    isActive?: boolean;
    locale?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.NotificationTemplateWhereInput = {
      tenantId: params.tenantId,
      ...(params.type && { type: params.type }),
      ...(params.channel && { channel: params.channel }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.locale && { locale: params.locale }),
    };

    const [templates, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return {
      data: templates,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findTemplateById(id: string, tenantId: string) {
    return this.prisma.notificationTemplate.findFirst({
      where: { id, tenantId },
    });
  }

  async findTemplateByTypeAndChannel(params: {
    tenantId: string;
    type: NotificationType;
    channel: NotificationChannel;
    locale?: string;
  }) {
    return this.prisma.notificationTemplate.findFirst({
      where: {
        tenantId: params.tenantId,
        type: params.type,
        channel: params.channel,
        locale: params.locale || 'en',
        isActive: true,
      },
    });
  }

  async updateTemplate(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      description?: string;
      subject?: string;
      bodyTemplate?: string;
      isActive?: boolean;
      variables?: Prisma.InputJsonValue;
    },
  ) {
    const updated = await this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...data,
        variables: data.variables as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Updated template: ${id}`);
    return updated;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteTemplate(id: string, _tenantId: string) {
    await this.prisma.notificationTemplate.delete({
      where: { id },
    });

    this.logger.log(`Deleted template: ${id}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Preference CRUD
  // ───────────────────────────────────────────────────────────────────────────

  async upsertPreference(data: {
    userId: string;
    notificationType: NotificationType;
    channel: NotificationChannel;
    enabled: boolean;
  }) {
    const preference = await this.prisma.notificationPreference.upsert({
      where: {
        userId_notificationType_channel: {
          userId: data.userId,
          notificationType: data.notificationType,
          channel: data.channel,
        },
      },
      create: {
        userId: data.userId,
        notificationType: data.notificationType,
        channel: data.channel,
        enabled: data.enabled,
      },
      update: {
        enabled: data.enabled,
      },
    });

    this.logger.log(
      `Updated preference for user: ${data.userId}, type: ${data.notificationType}, channel: ${data.channel}`,
    );
    return preference;
  }

  async findPreferences(params: {
    userId: string;
    type?: NotificationType;
    channel?: NotificationChannel;
  }) {
    return this.prisma.notificationPreference.findMany({
      where: {
        userId: params.userId,
        ...(params.type && { notificationType: params.type }),
        ...(params.channel && { channel: params.channel }),
      },
    });
  }

  async isChannelEnabled(params: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
  }): Promise<boolean> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_notificationType_channel: {
          userId: params.userId,
          notificationType: params.type,
          channel: params.channel,
        },
      },
    });

    // If no preference exists, assume enabled (opt-out model)
    return preference ? preference.enabled : true;
  }
}
