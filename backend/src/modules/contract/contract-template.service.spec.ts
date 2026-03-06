/**
 * ContractTemplateService Unit Tests
 * Session 5.8 - Phase 5 Testing & Integration
 *
 * Tests variable substitution, extraction, and validation logic.
 */

import { NotFoundException, ConflictException } from '@nestjs/common';

import {
  ContractTemplateService,
  STANDARD_TEMPLATE_VARIABLES,
} from './contract-template.service';

describe('ContractTemplateService', () => {
  let service: ContractTemplateService;
  let mockPrisma: any;
  let mockPartnerContext: any;

  beforeEach(() => {
    mockPrisma = {
      contractTemplate: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
    };

    mockPartnerContext = {
      partnerId: 'partner-001',
    };

    service = new ContractTemplateService(mockPrisma, mockPartnerContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // substituteVariables
  // ─────────────────────────────────────────────────────────

  describe('substituteVariables', () => {
    it('should replace single variable', () => {
      const content = 'Hello {{ownerName}}, welcome!';
      const result = service.substituteVariables(content, {
        ownerName: 'John Doe',
      });
      expect(result).toBe('Hello John Doe, welcome!');
    });

    it('should replace multiple variables', () => {
      const content =
        'Partner: {{tenantName}} renting at {{propertyAddress}} for RM{{rentAmount}}';
      const result = service.substituteVariables(content, {
        tenantName: 'Jane Smith',
        propertyAddress: '123 Main St',
        rentAmount: 1500,
      });
      expect(result).toBe(
        'Partner: Jane Smith renting at 123 Main St for RM1500',
      );
    });

    it('should handle whitespace in braces', () => {
      const content = 'Name: {{ ownerName }} IC: {{  ownerIc  }}';
      const result = service.substituteVariables(content, {
        ownerName: 'John',
        ownerIc: '900101-01-1234',
      });
      expect(result).toBe('Name: John IC: 900101-01-1234');
    });

    it('should replace all occurrences of the same variable', () => {
      const content =
        '{{ownerName}} agrees. Signed by {{ownerName}}.';
      const result = service.substituteVariables(content, {
        ownerName: 'John',
      });
      expect(result).toBe('John agrees. Signed by John.');
    });

    it('should leave unmatched variables untouched', () => {
      const content = 'Hello {{ownerName}}, your ID is {{unknownVar}}';
      const result = service.substituteVariables(content, {
        ownerName: 'John',
      });
      expect(result).toBe('Hello John, your ID is {{unknownVar}}');
    });

    it('should handle empty values', () => {
      const content = 'Phone: {{ownerPhone}}';
      const result = service.substituteVariables(content, {
        ownerPhone: '',
      });
      expect(result).toBe('Phone: ');
    });

    it('should handle numeric values', () => {
      const content = 'Rent: RM{{rentAmount}} due on day {{paymentDueDay}}';
      const result = service.substituteVariables(content, {
        rentAmount: 2500,
        paymentDueDay: 1,
      });
      expect(result).toBe('Rent: RM2500 due on day 1');
    });

    it('should handle content with no variables', () => {
      const content = 'This is plain text with no vars';
      const result = service.substituteVariables(content, { ownerName: 'Test' });
      expect(result).toBe('This is plain text with no vars');
    });

    it('should handle empty content', () => {
      const result = service.substituteVariables('', { ownerName: 'Test' });
      expect(result).toBe('');
    });

    it('should handle empty variables object', () => {
      const content = 'Hello {{ownerName}}';
      const result = service.substituteVariables(content, {});
      expect(result).toBe('Hello {{ownerName}}');
    });
  });

  // ─────────────────────────────────────────────────────────
  // extractVariables
  // ─────────────────────────────────────────────────────────

  describe('extractVariables', () => {
    it('should extract single variable', () => {
      const content = 'Hello {{ownerName}}!';
      const vars = service.extractVariables(content);
      expect(vars).toEqual(['ownerName']);
    });

    it('should extract multiple variables', () => {
      const content =
        '{{ownerName}} at {{propertyAddress}} pays {{rentAmount}}';
      const vars = service.extractVariables(content);
      expect(vars).toContain('ownerName');
      expect(vars).toContain('propertyAddress');
      expect(vars).toContain('rentAmount');
      expect(vars).toHaveLength(3);
    });

    it('should deduplicate repeated variables', () => {
      const content = '{{ownerName}} and {{ownerName}} again';
      const vars = service.extractVariables(content);
      expect(vars).toEqual(['ownerName']);
    });

    it('should handle variables with whitespace', () => {
      const content = '{{ ownerName }} and {{  propertyTitle  }}';
      const vars = service.extractVariables(content);
      expect(vars).toContain('ownerName');
      expect(vars).toContain('propertyTitle');
    });

    it('should return empty array for no variables', () => {
      const content = 'Plain text content';
      const vars = service.extractVariables(content);
      expect(vars).toEqual([]);
    });

    it('should handle underscored variable names', () => {
      const content = '{{my_variable}} and {{another_var}}';
      const vars = service.extractVariables(content);
      expect(vars).toContain('my_variable');
      expect(vars).toContain('another_var');
    });

    it('should handle empty content', () => {
      const vars = service.extractVariables('');
      expect(vars).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────
  // validateVariables
  // ─────────────────────────────────────────────────────────

  describe('validateVariables', () => {
    it('should validate when all required variables are provided', () => {
      const templateVars = [
        'ownerName',
        'ownerIc',
        'tenantName',
        'tenantIc',
        'propertyAddress',
        'propertyTitle',
        'rentAmount',
        'depositAmount',
        'startDate',
        'endDate',
        'contractNumber',
        'contractDate',
      ];

      const provided: Record<string, string> = {
        ownerName: 'John',
        ownerIc: '900101-01-1234',
        tenantName: 'Jane',
        tenantIc: '950505-05-5678',
        propertyAddress: '123 Main St',
        propertyTitle: 'Unit 101',
        rentAmount: '1500',
        depositAmount: '3000',
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        contractNumber: 'C-001',
        contractDate: '2025-01-01',
      };

      const result = service.validateVariables(templateVars, provided);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should report missing required variables', () => {
      const templateVars = [
        'ownerName',
        'ownerIc',
        'tenantName',
        'tenantIc',
        'propertyAddress',
        'propertyTitle',
        'rentAmount',
        'depositAmount',
        'startDate',
        'endDate',
        'contractNumber',
        'contractDate',
      ];

      const provided: Record<string, string> = {
        ownerName: 'John',
        // ownerIc missing
        tenantName: 'Jane',
        // tenantIc missing
        propertyAddress: '123 Main',
        propertyTitle: 'Unit 101',
        rentAmount: '1500',
        depositAmount: '3000',
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        contractNumber: 'C-001',
        contractDate: '2025-01-01',
      };

      const result = service.validateVariables(templateVars, provided);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('ownerIc');
      expect(result.missing).toContain('tenantIc');
      expect(result.missing).toHaveLength(2);
    });

    it('should not require optional variables', () => {
      const templateVars = [
        'ownerName',
        'ownerIc',
        'ownerAddress', // optional
        'ownerPhone', // optional
        'tenantName',
        'tenantIc',
        'propertyAddress',
        'propertyTitle',
        'rentAmount',
        'depositAmount',
        'startDate',
        'endDate',
        'contractNumber',
        'contractDate',
      ];

      const provided: Record<string, string> = {
        ownerName: 'John',
        ownerIc: '900101-01-1234',
        tenantName: 'Jane',
        tenantIc: '950505-05-5678',
        propertyAddress: '123 Main St',
        propertyTitle: 'Unit 101',
        rentAmount: '1500',
        depositAmount: '3000',
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        contractNumber: 'C-001',
        contractDate: '2025-01-01',
        // ownerAddress and ownerPhone NOT provided (optional)
      };

      const result = service.validateVariables(templateVars, provided);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should only validate required vars that are in the template', () => {
      // Template only uses ownerName and rentAmount
      const templateVars = ['ownerName', 'rentAmount'];

      const provided: Record<string, string> = {
        ownerName: 'John',
        rentAmount: '1500',
      };

      const result = service.validateVariables(templateVars, provided);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should handle empty template variables', () => {
      const result = service.validateVariables([], { ownerName: 'John' });
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should handle empty provided variables', () => {
      const templateVars = ['ownerName', 'ownerIc'];
      const result = service.validateVariables(templateVars, {});
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('ownerName');
      expect(result.missing).toContain('ownerIc');
    });
  });

  // ─────────────────────────────────────────────────────────
  // STANDARD_TEMPLATE_VARIABLES
  // ─────────────────────────────────────────────────────────

  describe('STANDARD_TEMPLATE_VARIABLES', () => {
    it('should have 25 variables defined', () => {
      expect(STANDARD_TEMPLATE_VARIABLES).toHaveLength(25);
    });

    it('should have required variables', () => {
      const required = STANDARD_TEMPLATE_VARIABLES.filter((v) => v.required);
      const requiredNames = required.map((v) => v.name);

      expect(requiredNames).toContain('ownerName');
      expect(requiredNames).toContain('ownerIc');
      expect(requiredNames).toContain('tenantName');
      expect(requiredNames).toContain('tenantIc');
      expect(requiredNames).toContain('propertyAddress');
      expect(requiredNames).toContain('propertyTitle');
      expect(requiredNames).toContain('rentAmount');
      expect(requiredNames).toContain('depositAmount');
      expect(requiredNames).toContain('startDate');
      expect(requiredNames).toContain('endDate');
      expect(requiredNames).toContain('contractNumber');
      expect(requiredNames).toContain('contractDate');
    });

    it('should have default values for some optional variables', () => {
      const paymentDueDay = STANDARD_TEMPLATE_VARIABLES.find(
        (v) => v.name === 'paymentDueDay',
      );
      expect(paymentDueDay?.defaultValue).toBe('1');

      const lateFee = STANDARD_TEMPLATE_VARIABLES.find(
        (v) => v.name === 'lateFeePercentage',
      );
      expect(lateFee?.defaultValue).toBe('10');

      const notice = STANDARD_TEMPLATE_VARIABLES.find(
        (v) => v.name === 'noticePeriod',
      );
      expect(notice?.defaultValue).toBe('30');
    });

    it('should have descriptions for all variables', () => {
      for (const v of STANDARD_TEMPLATE_VARIABLES) {
        expect(v.description).toBeDefined();
        expect(v.description!.length).toBeGreaterThan(0);
      }
    });
  });

  // ─────────────────────────────────────────────────────────
  // getAvailableVariables
  // ─────────────────────────────────────────────────────────

  describe('getAvailableVariables', () => {
    it('should return the standard template variables', () => {
      const vars = service.getAvailableVariables();
      expect(vars).toBe(STANDARD_TEMPLATE_VARIABLES);
    });
  });

  // ─────────────────────────────────────────────────────────
  // CRUD Operations (with mocked Prisma)
  // ─────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a template when found', async () => {
      const mockTemplate = {
        id: 'tpl-001',
        partnerId: 'partner-001',
        name: 'Standard Agreement',
        content: '{{ownerName}} agrees...',
        isDefault: true,
        isActive: true,
      };

      mockPrisma.contractTemplate.findFirst.mockResolvedValue(mockTemplate);

      const result = await service.findById('tpl-001');
      expect(result).toBe(mockTemplate);
      expect(mockPrisma.contractTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: 'tpl-001', partnerId: 'partner-001' },
      });
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrisma.contractTemplate.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should deactivate a non-default template', async () => {
      const mockTemplate = {
        id: 'tpl-002',
        partnerId: 'partner-001',
        isDefault: false,
        isActive: true,
      };

      mockPrisma.contractTemplate.findFirst.mockResolvedValue(mockTemplate);
      mockPrisma.contractTemplate.update.mockResolvedValue({
        ...mockTemplate,
        isActive: false,
      });

      await service.delete('tpl-002');

      expect(mockPrisma.contractTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tpl-002' },
        data: { isActive: false },
      });
    });

    it('should throw ConflictException when deleting default template', async () => {
      const mockTemplate = {
        id: 'tpl-001',
        partnerId: 'partner-001',
        isDefault: true,
        isActive: true,
      };

      mockPrisma.contractTemplate.findFirst.mockResolvedValue(mockTemplate);

      await expect(service.delete('tpl-001')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
