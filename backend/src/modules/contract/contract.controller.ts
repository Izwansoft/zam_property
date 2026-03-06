import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@core/rbac';
import { Role } from '@prisma/client';

import { ContractService, ContractView } from './contract.service';
import { ContractTemplateService } from './contract-template.service';
import { SignatureService } from './signature.service';
import {
  CreateContractDto,
  UpdateContractDto,
  UpdateContractStatusDto,
  ContractQueryDto,
  GenerateContractPdfDto,
  CreateContractTemplateDto,
  UpdateContractTemplateDto,
  TemplateQueryDto,
  RequestSignaturesDto,
  RecordSignatureDto,
  VoidSignatureRequestDto,
  ResendSignatureDto,
  SignatureRequestResponseDto,
  SignatureStatusResponseDto,
  WebhookResponseDto,
} from './dto';

/**
 * Controller for managing contracts and contract templates.
 */
@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly templateService: ContractTemplateService,
    private readonly signatureService: SignatureService,
  ) {}

  // ==================== CONTRACT ENDPOINTS ====================

  @Post()
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Create contract',
    description: 'Create a new contract for a tenancy. Tenancy must be in DEPOSIT_PAID or CONTRACT_PENDING status.',
  })
  @ApiResponse({ status: 201, description: 'Contract created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid tenancy status or data' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  @ApiResponse({ status: 409, description: 'Contract already exists for this tenancy' })
  async create(@Body() dto: CreateContractDto): Promise<ContractView> {
    return this.contractService.create(dto);
  }

  @Get()
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({
    summary: 'List contracts',
    description: 'List all contracts with optional filters and pagination',
  })
  @ApiResponse({ status: 200, description: 'Contracts retrieved successfully' })
  async findAll(@Query() query: ContractQueryDto) {
    return this.contractService.findAll(query);
  }

  // ==================== WEBHOOK ENDPOINT ====================

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Signature webhook',
    description: 'Webhook endpoint for signature provider callbacks. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed',
    type: WebhookResponseDto,
  })
  async handleWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ): Promise<WebhookResponseDto> {
    return this.signatureService.handleWebhook(headers, body);
  }

  // ==================== TEMPLATE ENDPOINTS ====================

  @Get('templates/variables')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Get available template variables',
    description: 'Get list of available variables for contract templates',
  })
  @ApiResponse({ status: 200, description: 'Variables retrieved successfully' })
  getTemplateVariables() {
    return {
      variables: this.templateService.getAvailableVariables(),
    };
  }

  @Post('templates')
  @Roles(Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Create contract template',
    description: 'Create a new contract template for the partner',
  })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid template data' })
  async createTemplate(@Body() dto: CreateContractTemplateDto) {
    return this.templateService.create(dto);
  }

  @Get('templates')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'List contract templates',
    description: 'List all contract templates with optional filters',
  })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async findAllTemplates(@Query() query: TemplateQueryDto) {
    return this.templateService.findAll(query);
  }

  @Get('templates/:id')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Get template by ID',
    description: 'Get a specific contract template',
  })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findTemplateById(@Param('id', ParseUUIDPipe) id: string) {
    return this.templateService.findById(id);
  }

  @Patch('templates/:id')
  @Roles(Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Update contract template',
    description: 'Update an existing contract template',
  })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractTemplateDto,
  ) {
    return this.templateService.update(id, dto);
  }

  @Delete('templates/:id')
  @Roles(Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete contract template',
    description: 'Soft delete a contract template (deactivate). Cannot delete default template.',
  })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete default template' })
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.templateService.delete(id);
  }

  // ==================== CONTRACT DETAIL ENDPOINTS ====================

  @Get(':id')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({
    summary: 'Get contract by ID',
    description: 'Get a specific contract with all details',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Contract retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<ContractView> {
    return this.contractService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Update contract',
    description: 'Update contract terms. Only DRAFT contracts can be updated.',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Contract updated successfully' })
  @ApiResponse({ status: 400, description: 'Contract is not in DRAFT status' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractDto,
  ): Promise<ContractView> {
    return this.contractService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Update contract status',
    description: 'Update the status of a contract. Validates allowed transitions.',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Contract status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractStatusDto,
  ): Promise<ContractView> {
    return this.contractService.updateStatus(id, dto.status, dto.reason);
  }

  @Post(':id/generate-pdf')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Generate contract PDF',
    description: 'Generate PDF document for the contract and upload to S3',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to the generated PDF' },
        documentHash: { type: 'string', description: 'SHA256 hash of the document' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async generatePdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateContractPdfDto,
  ): Promise<{ url: string; documentHash: string }> {
    return this.contractService.generatePdf(id, dto.forceRegenerate);
  }

  @Get(':id/download')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({
    summary: 'Get download URL',
    description: 'Get a presigned URL for downloading the contract PDF',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Presigned download URL (expires in 1 hour)' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Contract PDF not yet generated' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getDownloadUrl(@Param('id', ParseUUIDPipe) id: string): Promise<{ url: string }> {
    const url = await this.contractService.getDownloadUrl(id);
    return { url };
  }

  @Get('tenancy/:tenancyId')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({
    summary: 'Get contract by tenancy',
    description: 'Get the contract associated with a specific tenancy',
  })
  @ApiParam({ name: 'tenancyId', description: 'Tenancy ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Contract retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found for this tenancy' })
  async findByTenancy(@Param('tenancyId', ParseUUIDPipe) tenancyId: string): Promise<ContractView | null> {
    return this.contractService.findByTenancyId(tenancyId);
  }

  // ==================== SIGNATURE ENDPOINTS ====================

  @Post(':id/request-signatures')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Request signatures',
    description: 'Send contract to owner and tenant for e-signature. Contract PDF must be generated first.',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Signature request sent successfully',
    type: SignatureRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Contract not ready for signatures (no PDF or wrong status)' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async requestSignatures(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestSignaturesDto,
  ): Promise<SignatureRequestResponseDto> {
    return this.signatureService.requestSignatures(id, dto.callbackUrl) as Promise<SignatureRequestResponseDto>;
  }

  @Get(':id/signature-status')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({
    summary: 'Get signature status',
    description: 'Get the current status of signatures for a contract',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Signature status retrieved successfully',
    type: SignatureStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getSignatureStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SignatureStatusResponseDto> {
    return this.signatureService.getSignatureStatus(id) as Promise<SignatureStatusResponseDto>;
  }

  @Post(':id/record-signature')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Record manual signature',
    description: 'Manually record a signature for testing or when using external signing methods',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Signature recorded successfully' })
  @ApiResponse({ status: 400, description: 'Contract not in signing status' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async recordSignature(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordSignatureDto,
  ) {
    return this.signatureService.recordSignature(
      id,
      dto.signerRole,
      dto.signatureUrl,
      dto.signedBy,
    );
  }

  @Post(':id/void-signatures')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Void signature request',
    description: 'Cancel an active signature request and reset contract to DRAFT status',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Signature request voided successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async voidSignatureRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidSignatureRequestDto,
  ): Promise<void> {
    return this.signatureService.voidSignatureRequest(id, dto.reason);
  }

  @Post(':id/resend-signature')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Resend signature request',
    description: 'Resend the signature request to a specific signer',
  })
  @ApiParam({ name: 'id', description: 'Contract ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Signature request resent successfully' })
  @ApiResponse({ status: 400, description: 'No active signature request' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async resendSignature(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResendSignatureDto,
  ): Promise<void> {
    return this.signatureService.resendToSigner(id, dto.signerRole);
  }

}
