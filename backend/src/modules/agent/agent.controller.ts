/**
 * AgentController
 * Session 8.2 - Agent Module
 *
 * REST endpoints for agent management.
 * Base path: /agents
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/rbac/guards/roles.guard';
import { Roles } from '@core/rbac/decorators/roles.decorator';
import { AgentService, AgentView, AgentListingView, AgentListResult } from './agent.service';
import { RegisterAgentDto, UpdateAgentDto, AssignListingDto, AgentQueryDto } from './dto';

interface SuccessResponse<T> {
  data: T;
}

@ApiTags('Agents')
@ApiBearerAuth()
@Controller('agents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // ============================================
  // POST /agents - Register an agent
  // ============================================

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new agent in a company' })
  @ApiResponse({ status: 201, description: 'Agent registered successfully' })
  @ApiResponse({ status: 404, description: 'Company or user not found' })
  @ApiResponse({ status: 409, description: 'Agent already registered' })
  async registerAgent(@Body() dto: RegisterAgentDto): Promise<SuccessResponse<AgentView>> {
    const data = await this.agentService.registerAgent(dto);
    return { data };
  }

  // ============================================
  // GET /agents - List agents
  // ============================================

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: 'List agents with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Agents listed successfully' })
  async listAgents(@Query() query: AgentQueryDto): Promise<SuccessResponse<AgentListResult>> {
    const data = await this.agentService.listAgents(query);
    return { data };
  }

  // ============================================
  // GET /agents/:id - Get agent details
  // ============================================

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: 'Get agent details by ID' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Agent details retrieved' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getAgent(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponse<AgentView>> {
    const data = await this.agentService.getAgent(id);
    return { data };
  }

  // ============================================
  // PATCH /agents/:id - Update agent profile
  // ============================================

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: 'Update agent profile (REN number, etc.)' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Agent updated successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async updateAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<SuccessResponse<AgentView>> {
    const data = await this.agentService.updateAgentProfile(id, dto);
    return { data };
  }

  // ============================================
  // POST /agents/:id/assign-listing - Assign listing
  // ============================================

  @Post(':id/assign-listing')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a listing to an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 201, description: 'Listing assigned to agent' })
  @ApiResponse({ status: 404, description: 'Agent or listing not found' })
  @ApiResponse({ status: 409, description: 'Already assigned' })
  async assignListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignListingDto,
  ): Promise<SuccessResponse<AgentListingView>> {
    const data = await this.agentService.assignToListing(id, dto);
    return { data };
  }

  // ============================================
  // DELETE /agents/:id/listings/:listingId - Unassign listing
  // ============================================

  @Delete(':id/listings/:listingId')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unassign a listing from an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiParam({ name: 'listingId', description: 'Listing ID to unassign' })
  @ApiResponse({ status: 204, description: 'Listing unassigned' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async unassignListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ): Promise<void> {
    await this.agentService.unassignFromListing(id, listingId);
  }

  // ============================================
  // GET /agents/:id/listings - Get agent listings
  // ============================================

  @Get(':id/listings')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: 'Get all listings assigned to an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Agent listings retrieved' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getAgentListings(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<AgentListingView[]>> {
    const data = await this.agentService.getAgentListings(id);
    return { data };
  }

  // ============================================
  // POST /agents/:id/suspend - Suspend agent
  // ============================================

  @Post(':id/suspend')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Agent suspended' })
  @ApiResponse({ status: 400, description: 'Agent already suspended' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async suspendAgent(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponse<AgentView>> {
    const data = await this.agentService.suspendAgent(id);
    return { data };
  }

  // ============================================
  // POST /agents/:id/reactivate - Reactivate agent
  // ============================================

  @Post(':id/reactivate')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a suspended agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Agent reactivated' })
  @ApiResponse({ status: 400, description: 'Agent already active' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async reactivateAgent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<AgentView>> {
    const data = await this.agentService.reactivateAgent(id);
    return { data };
  }

  // ============================================
  // POST /agents/:id/regenerate-referral - Regenerate referral code
  // ============================================

  @Post(':id/regenerate-referral')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate the agent referral code' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Referral code regenerated' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async regenerateReferralCode(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<AgentView>> {
    const data = await this.agentService.regenerateReferralCode(id);
    return { data };
  }
}
