import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { InteractionService } from './interaction.service';
import {
  CreateInteractionDto,
  UpdateInteractionStatusDto,
  AddMessageDto,
  InteractionQueryDto,
} from './dto/interaction.dto';

@ApiTags('Interactions')
@ApiBearerAuth()
@Controller('interactions')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new interaction (lead/enquiry/booking)' })
  async create(@Body() dto: CreateInteractionDto) {
    const requestId = randomUUID();
    const data = await this.interactionService.create(dto);

    return {
      data,
      meta: {
        requestId,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List interactions with pagination and filters' })
  async findAll(@Query() query: InteractionQueryDto) {
    const requestId = randomUUID();
    const { data, total } = await this.interactionService.findAll(query);

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      meta: {
        requestId,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interaction by ID' })
  async findOne(@Param('id') id: string) {
    const requestId = randomUUID();
    const data = await this.interactionService.findById(id);

    return {
      data,
      meta: {
        requestId,
      },
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update interaction status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateInteractionStatusDto) {
    const requestId = randomUUID();
    const data = await this.interactionService.updateStatus(id, dto);

    return {
      data,
      meta: {
        requestId,
      },
    };
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a message to an interaction' })
  async addMessage(@Param('id') id: string, @Body() dto: AddMessageDto) {
    const requestId = randomUUID();
    const data = await this.interactionService.addMessage(id, dto);

    return {
      data,
      meta: {
        requestId,
      },
    };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for an interaction' })
  async getMessages(@Param('id') id: string) {
    const requestId = randomUUID();
    const data = await this.interactionService.getMessages(id);

    return {
      data,
      meta: {
        requestId,
      },
    };
  }
}
