/**
 * Audit Controller
 * Session 4.4 - Audit Logging
 *
 * Endpoints for querying audit logs.
 */

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/rbac/guards/roles.guard';
import { Roles } from '@core/rbac/decorators/roles.decorator';
import { TenantContextService } from '@core/tenant-context/tenant-context.service';

import { AuditService } from './audit.service';
import {
  AuditLogQueryDto,
  AuditLogResponseDto,
  AuditLogListResponseDto,
  AuditActionTypesResponseDto,
  AuditTargetTypesResponseDto,
} from './dto/audit.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('api/v1/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('logs')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get audit logs',
    description:
      'Query audit logs with filtering by action, actor, target, and date range. Only accessible by tenant admins.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of audit logs',
    type: AuditLogListResponseDto,
  })
  async getAuditLogs(@Query() query: AuditLogQueryDto): Promise<AuditLogListResponseDto> {
    const tenantId = this.tenantContext.tenantId;

    const result = await this.auditService.findAll(
      {
        tenantId,
        actorId: query.actorId,
        actorType: query.actorType,
        actionType: query.actionType,
        targetType: query.targetType,
        targetId: query.targetId,
        requestId: query.requestId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      },
      query.page || 1,
      query.pageSize || 20,
    );

    return result;
  }

  @Get('logs/:id')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get audit log by ID',
    description: 'Get a single audit log entry by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log entry',
    type: AuditLogResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLogById(@Param('id') id: string): Promise<{ data: AuditLogResponseDto | null }> {
    const tenantId = this.tenantContext.tenantId;
    const log = await this.auditService.findById(id, tenantId);
    return { data: log };
  }

  @Get('target/:targetType/:targetId')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get audit logs for a specific entity',
    description: 'Get all audit logs related to a specific entity (e.g., user, listing, vendor).',
  })
  @ApiParam({
    name: 'targetType',
    description: 'Target type (e.g., user, listing, vendor)',
  })
  @ApiParam({ name: 'targetId', description: 'Target ID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of audit logs',
    type: AuditLogListResponseDto,
  })
  async getAuditLogsByTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<AuditLogListResponseDto> {
    const tenantId = this.tenantContext.tenantId;
    return this.auditService.findByTarget(
      targetType,
      targetId,
      tenantId,
      page || 1,
      pageSize || 20,
    );
  }

  @Get('actor/:actorId')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get audit logs for a specific actor',
    description: 'Get all audit logs for actions performed by a specific user.',
  })
  @ApiParam({ name: 'actorId', description: 'Actor (user) ID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of audit logs',
    type: AuditLogListResponseDto,
  })
  async getAuditLogsByActor(
    @Param('actorId') actorId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<AuditLogListResponseDto> {
    const tenantId = this.tenantContext.tenantId;
    return this.auditService.findByActor(actorId, tenantId, page || 1, pageSize || 20);
  }

  @Get('action-types')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get distinct action types',
    description: 'Get a list of all distinct action types in the audit logs (for filtering UI).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of action types',
    type: AuditActionTypesResponseDto,
  })
  async getActionTypes(): Promise<AuditActionTypesResponseDto> {
    const tenantId = this.tenantContext.tenantId;
    const actionTypes = await this.auditService.getActionTypes(tenantId);
    return { actionTypes };
  }

  @Get('target-types')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get distinct target types',
    description: 'Get a list of all distinct target types in the audit logs (for filtering UI).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of target types',
    type: AuditTargetTypesResponseDto,
  })
  async getTargetTypes(): Promise<AuditTargetTypesResponseDto> {
    const tenantId = this.tenantContext.tenantId;
    const targetTypes = await this.auditService.getTargetTypes(tenantId);
    return { targetTypes };
  }
}
