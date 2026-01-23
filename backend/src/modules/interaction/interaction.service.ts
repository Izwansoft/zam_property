import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InteractionStatus } from '@prisma/client';
import { InteractionRepository } from './interaction.repository';
import { InteractionMessageRepository } from './interaction-message.repository';
import {
  CreateInteractionDto,
  UpdateInteractionStatusDto,
  AddMessageDto,
  InteractionQueryDto,
} from './dto/interaction.dto';
import { InteractionRecord, InteractionMessageRecord } from './types/interaction.types';

@Injectable()
export class InteractionService {
  private readonly logger = new Logger(InteractionService.name);

  constructor(
    private readonly interactionRepository: InteractionRepository,
    private readonly messageRepository: InteractionMessageRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new interaction
   */
  async create(dto: CreateInteractionDto): Promise<InteractionRecord> {
    this.logger.log(`Creating ${dto.interactionType} for listing ${dto.listingId}`);

    const interaction = await this.interactionRepository.create({
      vendorId: dto.vendorId,
      listingId: dto.listingId,
      verticalType: dto.verticalType,
      interactionType: dto.interactionType,
      contactName: dto.contactName,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      message: dto.message,
      bookingData: dto.bookingData,
      source: dto.source,
      referrer: dto.referrer,
    });

    // Emit domain event
    this.eventEmitter.emit('interaction.created', {
      interactionId: interaction.id,
      tenantId: interaction.tenantId,
      vendorId: interaction.vendorId,
      listingId: interaction.listingId,
      verticalType: interaction.verticalType,
      interactionType: interaction.interactionType,
    });

    return interaction;
  }

  /**
   * Find all interactions with pagination and filtering
   */
  async findAll(query: InteractionQueryDto): Promise<{ data: InteractionRecord[]; total: number }> {
    return this.interactionRepository.findMany({
      vendorId: query.vendorId,
      listingId: query.listingId,
      interactionType: query.interactionType,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  /**
   * Find interaction by ID
   */
  async findById(id: string): Promise<InteractionRecord> {
    const interaction = await this.interactionRepository.findById(id);

    if (!interaction) {
      throw new NotFoundException(`Interaction with ID ${id} not found`);
    }

    return interaction;
  }

  /**
   * Update interaction status with state machine transitions
   */
  async updateStatus(id: string, dto: UpdateInteractionStatusDto): Promise<InteractionRecord> {
    const interaction = await this.findById(id);

    // Validate state transition
    this.validateStatusTransition(interaction.status, dto.status);

    this.logger.log(
      `Updating interaction ${id} status from ${interaction.status} to ${dto.status}`,
    );

    const updated = await this.interactionRepository.updateStatus(id, {
      status: dto.status,
    });

    // Emit domain event
    this.eventEmitter.emit('interaction.status.updated', {
      interactionId: updated.id,
      tenantId: updated.tenantId,
      vendorId: updated.vendorId,
      listingId: updated.listingId,
      oldStatus: interaction.status,
      newStatus: dto.status,
    });

    return updated;
  }

  /**
   * Add a message to an interaction
   */
  async addMessage(interactionId: string, dto: AddMessageDto): Promise<InteractionMessageRecord> {
    // Verify interaction exists
    await this.findById(interactionId);

    this.logger.log(`Adding message to interaction ${interactionId} from ${dto.senderType}`);

    const message = await this.messageRepository.create({
      interactionId,
      senderType: dto.senderType,
      senderId: dto.senderId,
      senderName: dto.senderName,
      message: dto.message,
      isInternal: dto.isInternal,
    });

    // Emit domain event
    this.eventEmitter.emit('interaction.message.added', {
      interactionId,
      messageId: message.id,
      senderType: dto.senderType,
    });

    return message;
  }

  /**
   * Get messages for an interaction
   */
  async getMessages(interactionId: string): Promise<InteractionMessageRecord[]> {
    // Verify interaction exists
    await this.findById(interactionId);

    return this.messageRepository.findByInteractionId(interactionId);
  }

  /**
   * Validate status transitions
   * Allowed transitions:
   * - NEW → CONTACTED
   * - NEW → INVALID
   * - CONTACTED → CONFIRMED (for bookings)
   * - CONTACTED → CLOSED
   */
  private validateStatusTransition(
    currentStatus: InteractionStatus,
    newStatus: InteractionStatus,
  ): void {
    const validTransitions: Record<InteractionStatus, InteractionStatus[]> = {
      [InteractionStatus.NEW]: [InteractionStatus.CONTACTED, InteractionStatus.INVALID],
      [InteractionStatus.CONTACTED]: [InteractionStatus.CONFIRMED, InteractionStatus.CLOSED],
      [InteractionStatus.CONFIRMED]: [InteractionStatus.CLOSED],
      [InteractionStatus.CLOSED]: [],
      [InteractionStatus.INVALID]: [],
    };

    const allowedStatuses = validTransitions[currentStatus] || [];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
