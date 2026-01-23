import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { InteractionMessageRecord, CreateMessageParams } from './types/interaction.types';

@Injectable()
export class InteractionMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new message
   */
  async create(params: CreateMessageParams): Promise<InteractionMessageRecord> {
    return this.prisma.interactionMessage.create({
      data: {
        interactionId: params.interactionId,
        senderType: params.senderType,
        senderId: params.senderId,
        senderName: params.senderName,
        message: params.message,
        isInternal: params.isInternal || false,
      },
    });
  }

  /**
   * Find messages by interaction ID
   */
  async findByInteractionId(interactionId: string): Promise<InteractionMessageRecord[]> {
    return this.prisma.interactionMessage.findMany({
      where: {
        interactionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Find messages with pagination
   */
  async findMany(
    interactionId: string,
    page = 1,
    pageSize = 20,
  ): Promise<{
    data: InteractionMessageRecord[];
    total: number;
  }> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.interactionMessage.findMany({
        where: {
          interactionId,
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.interactionMessage.count({
        where: {
          interactionId,
        },
      }),
    ]);

    return { data, total };
  }
}
