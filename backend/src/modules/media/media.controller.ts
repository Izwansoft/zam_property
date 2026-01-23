import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import {
  RequestPresignedUrlDto,
  ConfirmUploadDto,
  UpdateMediaDto,
  MediaQueryDto,
} from './dto/media.dto';
import { randomUUID } from 'crypto';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('request-upload')
  @ApiOperation({ summary: 'Request presigned URL for file upload' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async requestPresignedUrl(@Body() dto: RequestPresignedUrlDto) {
    const result = await this.mediaService.requestPresignedUrl(dto);

    return {
      data: result,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Post(':id/confirm-upload')
  @ApiOperation({ summary: 'Confirm upload completion' })
  @ApiResponse({ status: 200, description: 'Upload confirmed successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiResponse({ status: 400, description: 'Upload verification failed' })
  async confirmUpload(@Param('id') id: string, @Body() dto: ConfirmUploadDto) {
    const result = await this.mediaService.confirmUpload(id, dto);

    return {
      data: result,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List media (paginated)' })
  @ApiResponse({ status: 200, description: 'Media list retrieved successfully' })
  async findAll(@Query() query: MediaQueryDto) {
    const { data, total, page, pageSize } = await this.mediaService.findAll(query);

    return {
      data,
      meta: {
        requestId: randomUUID(),
        pagination: {
          page,
          pageSize,
          totalItems: total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async findById(@Param('id') id: string) {
    const result = await this.mediaService.findById(id);

    return {
      data: result,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media metadata' })
  @ApiResponse({ status: 200, description: 'Media updated successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    const result = await this.mediaService.update(id, dto);

    return {
      data: result,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete media (soft delete)' })
  @ApiResponse({ status: 204, description: 'Media deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async delete(@Param('id') id: string) {
    await this.mediaService.delete(id);
  }
}
