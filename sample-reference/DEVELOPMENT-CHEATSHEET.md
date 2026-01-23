# TERRA IMS Development Cheatsheet

> **Copy-paste these prompts in order. Each prompt = one session.**
> After each session, check the box [x] to track progress.

---

## 🧠 How AI Context Works

| File | Auto-Loaded? | When to Explicitly Read |
|------|--------------|-------------------------|
| `.github/copilot-instructions.md` | ✅ **YES** - Every chat | Never (automatic) |
| `docs/part-0.md` | ❌ No | Session 1.1 only (foundation) |
| `docs/part-1.md` | ❌ No | Session 1.1 only (foundation) |
| `docs/part-X.md` (specific) | ❌ No | Each session reads its own part |

**Session 1.1** = Read full foundation (part-0, part-1, part-2)  
**Session 1.2+** = Just say "Continuing TERRA IMS development" + read specific part-X

The AI will automatically get the quick reference from `copilot-instructions.md` for every new chat.

---

## 📚 Documentation Files (MANDATORY Updates)

After **EVERY session**, ensure the AI updates these files:

| File | Purpose | When to Update |
|------|---------|----------------|
| `PROGRESS.md` | Track session completion | After each session ✅ |
| `docs/API-REGISTRY.md` | Document all endpoints | After implementing endpoints |
| `docs/NAV-STRUCTURE.md` | Define frontend structure | After implementing domains |

### Post-Session Command (Run at END of each session)
```
Session 1.2 completed.

Please update the following documentation:
1. PROGRESS.md - Mark session 1.2 as completed
2. docs/API-REGISTRY.md - Add any new endpoints with full parameter details
3. docs/NAV-STRUCTURE.md - Add navigation items for new features

Follow the exact conventions in these files.
```

---

## 🔧 PHASE 1 — FOUNDATION

### Session 1.1: Initialize NestJS Project
```
I'm starting TERRA IMS development.

FIRST, read these foundation documents to understand the project:
1. docs/part-0.md - Global Rules & AI Constitution
2. docs/part-1.md - Master Project Brief
3. docs/part-2.md - System Architecture & Folder Structure

Task: Initialize the NestJS project with:
1. Create NestJS project structure
2. Install all dependencies (Prisma, class-validator, passport-jwt, BullMQ, etc.)
3. Create folder structure per Part 2 (src/spine, src/infrastructure, src/modules, src/shared, src/config)
4. Setup tsconfig paths (@/, @spine/, @infrastructure/, @modules/, @shared/)
5. Create .env.example file with all required variables

Do NOT create business logic yet. Just the skeleton.
```
- [x] Completed

---

### Session 1.2: Prisma & Database Setup
```
Continuing TERRA IMS development.

Read docs/part-3.md (Multi-Tenancy & Authentication section)

Task: Setup Prisma with PostgreSQL:
1. Initialize Prisma with PostgreSQL provider
2. Create initial schema.prisma with pgvector extension
3. Create database config module
4. Create PrismaService with connection handling
5. Add prisma scripts to package.json

The schema should be empty for now (just datasource and generator).
```
- [x] Completed

---

### Session 1.3: Tenant & Company Entities
```
Continuing TERRA IMS development.

Read docs/part-3.md and docs/part-3a.md

Task: Implement Tenant & Company foundation:
1. Create Tenant (Account) entity in Prisma schema
2. Create TenantBranding entity
3. Create TenantSettings entity for configurable settings
4. Create Company entity with relationship to Tenant
5. Run prisma migrate dev
6. Create seed file for one test tenant + company

Tables needed: tenants, tenant_branding, tenant_settings, companies
```
- [x] Completed

---

### Session 1.4: TenantContext Middleware
```
Continuing TERRA IMS development.

Read docs/part-3.md (TenantContext section)

Task: Implement TenantContext:
1. Create TenantContext interface
2. Create TenantContextService (request-scoped)
3. Create TenantMiddleware to extract tenant_id/company_id from JWT
4. Create BaseRepository with tenant enforcement
5. Register middleware globally

Every request must have tenant_id resolved from JWT.
```
- [x] Completed

---

### Session 1.5: User Entity & Auth Module
```
Continuing TERRA IMS development.

Read docs/part-3.md (Authentication section)

Task: Implement Authentication:
1. Create User entity in Prisma schema
2. Create auth.module.ts, auth.controller.ts, auth.service.ts
3. Implement JWT strategy (passport-jwt)
4. Create login endpoint POST /api/v1/auth/login
5. Create JwtAuthGuard
6. Hash passwords with bcrypt

User fields: id, tenant_id, company_id, email, password_hash, full_name, role_code, status
```
- [x] Completed

---

### Session 1.6: RBAC Permission Engine
```
Continuing TERRA IMS development.

Read docs/part-3.md (RBAC section)

Task: Implement RBAC:
1. Create Role, Permission, RolePermission entities
2. Create PermissionGuard
3. Create @RequirePermission() decorator
4. Seed the core system roles with permissions
5. Integrate with JWT payload

Role scopes: PLATFORM, ACCOUNT, COMPANY, SELF
```
- [x] Completed

---

### Session 1.7: User Management APIs
```
Continuing TERRA IMS development.

Read docs/part-3.md (User Management section)

Task: Implement User CRUD:
1. Create user.module.ts, user.controller.ts, user.service.ts
2. Create UserRepository extending BaseRepository
3. Implement CRUD endpoints (list, get, create, update, deactivate)
4. Implement role assignment endpoint
5. Create DTOs with validation

All endpoints must enforce RBAC and tenant isolation.
```
- [x] Completed

---

### Session 1.8: Swagger Setup
```
Continuing TERRA IMS development.

Read docs/part-2.md (API Documentation section)

Task: Setup Swagger/OpenAPI:
1. Install @nestjs/swagger
2. Configure SwaggerModule in main.ts
3. Add @ApiTags, @ApiBearerAuth to existing controllers
4. Add @ApiProperty to all DTOs
5. Document permission requirements in descriptions

Swagger should be accessible at /api/docs
```
- [x] Completed

---

### Session 1.9: Module Registry
```
Continuing TERRA IMS development.

Read docs/part-4.md

Task: Implement Module Registry:
1. Create Module entity in Prisma schema
2. Create TenantModule subscription entity
3. Create feature flag system
4. Implement module enablement endpoints
5. Create ModuleGuard to check if module is enabled for tenant

Modules: HR, Projects, Billing, Agency, Construction, etc.
```
- [x] Completed

---

### Session 1.10: Event System & Async Processing
```
Continuing TERRA IMS development.

Read docs/part-7.md

Task: Implement Event System:
1. Setup EventEmitter2 for domain events
2. Configure BullMQ with Redis for background jobs
3. Create base domain event classes
4. Create EventBus service
5. Create background job processor template

Focus on infrastructure, not business events yet.
```
- [x] Completed

---

### Session 1.11: Audit Logging
```
Continuing TERRA IMS development.

Read docs/part-8.md

Task: Implement Audit Logging:
1. Create AuditLog entity in Prisma schema
2. Create AuditService for recording actions
3. Create AuditInterceptor for automatic logging
4. Create audit query endpoints
5. Implement sensitive data masking

Log: action, resource, resource_id, old_value, new_value, user_id, tenant_id, ip_address
```
- [x] Completed

---

### Session 1.12: Notification System
```
Continuing TERRA IMS development.

Read docs/part-9.md

Task: Implement Notification System:
1. Create Notification entity in Prisma schema
2. Create NotificationTemplate entity
3. Create NotificationService
4. Implement email provider integration (SMTP)
5. Create in-app notification endpoints

Support: email, in-app, push (later)
```
- [x] Completed

---

## ✅ PHASE 1 CHECKPOINT
```
Before continuing to Phase 2, verify:

1. Run: npm run build (should compile without errors)
2. Run: npm run start:dev (should start without errors) 
3. Test: POST /api/v1/auth/login with seeded user
4. Test: GET /api/v1/users with JWT token
5. Check: Swagger UI at /api/docs
6. Check: Module registry returning enabled modules
7. Check: Audit logs being created
8. Perform end-to-end smoke test
9. Perform CRUD Health Check (If Applicable)

If all pass, continue to Phase 2.
```
- [x] All checks passed

---

## 🎓 PHASE 2 — CORE BUSINESS

### Session 2.1: HR Domain - Employees
```
Continuing TERRA IMS development.

Read docs/part-13.md (Employee section)

Task: Implement Employee Entity:
1. Create Employee entity in Prisma schema
2. Create Department entity
3. Create Position entity
4. Create hr.module.ts, employee.controller.ts, employee.service.ts
5. Implement employee CRUD endpoints
6. Create org chart structure

Fields: id, tenant_id, company_id, user_id, full_name, employee_no, department_id, position_id, status
```
- [x] Completed

---

### Session 2.2: HR Domain - Leave Management
```
Continuing TERRA IMS development.

Read docs/part-13.md (Leave Management section)

Task: Implement Leave Management:
1. Create Leave entity in Prisma schema
2. Create LeaveType entity
3. Create LeaveBalance entity
4. Implement leave request workflow (apply → approve/reject)
5. Implement leave balance calculation

Workflow: PENDING → APPROVED/REJECTED
```
- [x] Completed

---

### Session 2.3: Projects Domain - Core
```
Continuing TERRA IMS development.

Read docs/part-14.md (Project section)

Task: Implement Project Entity:
1. Create Project entity in Prisma schema
2. Create ProjectPhase entity
3. Create ProjectMember entity (junction)
4. Create projects.module.ts with controllers
5. Implement project CRUD endpoints
6. Implement project status workflow

Status: DRAFT → ACTIVE → ON_HOLD → COMPLETED → ARCHIVED
```
- [x] Completed

---

### Session 2.4: Projects Domain - Tasks & Time
```
Continuing TERRA IMS development.

Read docs/part-14.md (Task & Time section)

Task: Implement Tasks & Time Tracking:
1. Create Task entity in Prisma schema
2. Create TaskAssignment entity
3. Create TimeEntry entity
4. Implement task CRUD endpoints
5. Implement time tracking endpoints

Tasks belong to projects. Time entries belong to tasks.
```
- [x] Completed

---

### Session 2.5: Billing Domain - Invoices
```
Continuing TERRA IMS development.

Read docs/part-15.md (Invoice section)

Task: Implement Invoice Entity:
1. Create Invoice entity in Prisma schema
2. Create InvoiceItem entity
3. Create PaymentTerm entity
4. Implement invoice CRUD endpoints
5. Implement invoice status workflow

Status: DRAFT → ISSUED → PAID → OVERDUE → CANCELLED
```
- [x] Completed

---

### Session 2.6: Billing Domain - Payments
```
Continuing TERRA IMS development.

Read docs/part-15.md (Payment section)

Task: Implement Payments:
1. Create Payment entity in Prisma schema
2. Create Receipt entity
3. Implement payment recording endpoints
4. Implement receipt generation
5. Implement client balance calculation

Link payments to invoices. Generate receipts.
```
- [x] Completed

---

### Session 2.7: Agency Domain - Clients
```
Continuing TERRA IMS development.

Read docs/part-16.md (Client section)

Task: Implement Agency Client Management:
1. Create Client entity in Prisma schema
2. Create Engagement entity
3. Create Retainer entity
4. Implement client CRUD endpoints
5. Implement engagement tracking

Clients have engagements. Retainers are recurring agreements.
```
- [x] Completed

---

### Session 2.8: Agency Domain - Creatives
```
Continuing TERRA IMS development.

Read docs/part-16.md (Creative section)

Task: Implement Creative Management:
1. Create Creative entity in Prisma schema
2. Create CreativeVersion entity
3. Create CreativeApproval entity
4. Implement creative CRUD endpoints
5. Implement approval workflow

Workflow: DRAFT → INTERNAL_REVIEW → CLIENT_REVIEW → APPROVED/REVISION
```
- [x] Completed

---

## ✅ PHASE 2 CHECKPOINT
```
Before continuing to Phase 3, verify:

1. HR module: Employee CRUD, leave requests working
2. Projects module: Project CRUD, tasks, time entries working
3. Billing module: Invoice CRUD, payments, receipts working
4. Agency module: Client CRUD, creatives, approvals working
5. All tenant isolation enforced
6. All audit logs created for actions
7. Implement project CRUD endpoints
8. Implement project status workflow

If all pass, continue to Phase 3.
```
- [x] All checks passed

---

## 🤖 PHASE 3 — INTELLIGENCE & AUTOMATION

### Session 3.1: Reporting & Analytics - Foundation
```
Continuing TERRA IMS development.

Read docs/part-17.md

Task: Implement Reporting Foundation:
1. Create Report entity in Prisma schema
2. Create ReportDefinition entity
3. Create DashboardWidget entity
4. Implement report generation service
5. Create analytics read models (materialized views)

Reports are tenant-scoped. Widgets are configurable.
```
- [x] Completed

---

### Session 3.2: Reporting & Analytics - Export
```
Continuing TERRA IMS development.

Read docs/part-17.md (Export section)

Task: Implement Report Export:
1. Implement chart data endpoints
2. Create PDF export service
3. Create Excel export service
4. Implement scheduled reports (BullMQ)
5. Create dashboard endpoints

Use event-driven aggregation for analytics.
```
- [x] Completed

---

### Session 3.3: AI Services - Core
```
Continuing TERRA IMS development.

Read docs/part-18.md

Task: Implement AI Services Core:
1. Create AI provider abstraction (interface)
2. Create ModelRegistry entity
3. Create PromptTemplate entity
4. Implement AI cost tracking
5. Create provider configuration

Support: OpenAI, Claude, Azure OpenAI, Ollama (local)
```
- [x] Completed

---

### Session 3.4: AI Services - RAG
```
Continuing TERRA IMS development.

Read docs/part-18.md (RAG section)

Task: Implement RAG Pipeline:
1. Setup pgvector for embeddings
2. Create DocumentChunk entity
3. Create document embedding service
4. Implement RAG pipeline (retrieve → augment → generate)
5. Create knowledge base endpoints

Embeddings are tenant-scoped for isolation.
```
- [x] Completed

---

### Session 3.5: AI Copilot
```
Continuing TERRA IMS development.

Read docs/part-19.md

Task: Implement AI Copilot:
1. Create Copilot service
2. Create context builder (tenant context, user context)
3. Implement SSE streaming endpoint
4. Create copilot chat endpoints
5. Implement decision logging

AI is ADVISORY only. Log all decisions for audit.
```
- [x] Completed

---

### Session 3.6: Compliance & Governance
```
Continuing TERRA IMS development.

Read docs/part-20.md

Task: Implement Compliance:
1. Create DataResidencyConfig entity
2. Create RetentionPolicy entity
3. Create ComplianceRule entity
4. Implement data classification
5. Create policy management endpoints

Support data residency requirements per region.
```
- [x] Completed

---

### Session 3.7: Real-time Infrastructure
```
Continuing TERRA IMS development.

Read docs/part-21.md

Task: Implement Real-time:
1. Setup Socket.io with @nestjs/websockets
2. Configure Redis adapter for scaling
3. Create room management (tenant-scoped)
4. Implement real-time event broadcasting
5. Create presence tracking service

Rooms are tenant-isolated. Support user presence.
```
- [x] Completed

---

### Session 3.8: Automation Framework
```
Continuing TERRA IMS development.

Read docs/part-22.md

Task: Implement Automation:
1. Create AutomationRule entity
2. Create trigger condition parser
3. Create action executor service
4. Implement approval workflow for automations
5. Create execution logging

All automations require approval before activation.
```
- [x] Completed

---

## ✅ PHASE 3 CHECKPOINT
```
Before continuing to Phase 4, verify:

1. Analytics dashboard showing data
2. AI copilot responding to queries
3. RAG search returning relevant results
4. Real-time updates working via WebSocket
5. Automation rules executing with approval
6. Implement project CRUD endpoints
7. Implement project status workflow

If all pass, continue to Phase 4.
```
- [x] All checks passed

---

## 🔐 PHASE 4 — PLATFORM CAPABILITIES

### Session 4.1: QA & Security Review
```
Continuing TERRA IMS development.

Read docs/part-23.md

Task: Implement Security Testing:
1. Create security test suite
2. Implement RBAC boundary tests
3. Implement tenant isolation tests
4. Implement input validation tests
5. Setup CI/CD security gates

All endpoints must have permission boundary tests.
```
- [x] Completed

---

### Session 4.2: Portal Configuration
```
Continuing TERRA IMS development.

Read docs/part-24.md

Task: Implement Portal Configuration:
1. Create PortalConfig entity
2. Create WidgetRegistry entity
3. Implement theme configuration
4. Create navigation builder service
5. Create portal management endpoints

Portals are role-filtered and tenant-customizable.
```
- [x] Completed

---

### Session 4.3: Deployment & SRE
```
Continuing TERRA IMS development.

Read docs/part-25.md

Task: Implement Deployment Infrastructure:
1. Create Dockerfile for production
2. Create docker-compose.yml for local dev
3. Setup GitHub Actions CI/CD pipeline
4. Create health check endpoints
5. Setup Prometheus metrics

Include database migration in CI/CD.
```
- [x] Completed

---

### Session 4.4: Public API - Keys & Auth
```
Continuing TERRA IMS development.

Read docs/part-26.md

Task: Implement Public API Foundation:
1. Create APIKey entity
2. Implement API key generation
3. Create rate limiting per API key
4. Implement API versioning strategy
5. Create developer portal foundation

API keys are tenant-scoped with custom permissions.
```

- [x] Completed

---

### Session 4.5: Public API - OAuth
```
Continuing TERRA IMS development.

Read docs/part-26.md (OAuth section)

Task: Implement OAuth Provider:
1. Create OAuth2 authorization server
2. Create OAuthClient entity
3. Implement scoped permissions
4. Create API usage tracking
5. Create API documentation endpoint

Support: authorization_code, client_credentials flows.
```
- [x] Completed

---

### Session 4.6: Marketplace
```
Continuing TERRA IMS development.

Read docs/part-27.md

Task: Implement Integration Marketplace:
1. Create IntegrationCatalog entity
2. Create IntegrationInstallation entity
3. Implement app installation flow
4. Create credential storage (encrypted)
5. Create marketplace endpoints

Only certified integrations can be listed.
```
- [x] Completed

---

### Session 4.7: Webhooks - Core
```
Continuing TERRA IMS development.

Read docs/part-28.md

Task: Implement Webhooks Core:
1. Create WebhookEndpoint entity
2. Create WebhookDelivery entity
3. Implement event subscription
4. Implement payload signing (HMAC-SHA256)
5. Create webhook management endpoints

Sign all payloads. Verify signature on receipt.
```
- [x] Completed

---

### Session 4.8: Webhooks - Delivery
```
Continuing TERRA IMS development.

Read docs/part-28.md (Delivery section)

Task: Implement Webhook Delivery:
1. Create delivery queue (BullMQ)
2. Implement retry with exponential backoff
3. Create delivery logs
4. Create webhook testing endpoint
5. Implement circuit breaker

Max retries: 5. Backoff: 1m, 5m, 30m, 2h, 24h.
```
- [x] Completed

---

## ✅ PHASE 4 CHECKPOINT
```
Before continuing to Phase 5, verify:

1. Security tests passing in CI
2. Portal configuration working
3. CI/CD pipeline deploying successfully
4. Public API accessible with API keys
5. Webhooks delivering to test endpoints

If all pass, continue to Phase 5.
```
- [x] All checks passed

**Notes (verification):**
- CI coverage is defined in the GitHub Actions workflow at `.github/workflows/ci.yml` (lint, typecheck, unit tests, e2e tests, Docker build).
- Deployment is not defined in this workflow; confirm your deployment pipeline separately if required.

---

## 🏗️ PHASE 5 — VERTICALS & ECOSYSTEM

### Session 5.1: Construction Vertical - Core
```
Continuing TERRA IMS development.

Read docs/part-29.md

Task: Implement Construction Core:
1. Create ConstructionProject entity (extends Project)
2. Create SiteLog entity
3. Create ProjectPhase entity (construction-specific)
4. Implement construction project endpoints
5. Add construction-specific fields

Fields: site_address, permit_no, contract_value, start_date, end_date
```
 - [x] Completed

---

### Session 5.2: Construction Vertical - Operations
```
Continuing TERRA IMS development.

Read docs/part-29.md (Operations section)

Task: Implement Construction Operations:
1. Create Contractor entity
2. Create WorkOrder entity
3. Create SafetyIncident entity
4. Implement contractor management
5. Implement work order workflow

Track contractor certifications and safety compliance.
```
- [x] Completed

---

### Session 5.3: Partner System - Registration
```
Continuing TERRA IMS development.

Read docs/part-30.md

Task: Implement Partner System:
1. Create Partner entity
2. Create PartnerTier entity
3. Create PartnerTenant junction entity
4. Implement partner registration
5. Create partner portal access

Partners can manage multiple tenants.
```
- [x] Completed

---

### Session 5.4: Partner System - Commissions
```
Continuing TERRA IMS development.

Read docs/part-30.md (Commission section)

Task: Implement Partner Commissions:
1. Create PartnerCommission entity
2. Create PartnerPayout entity
3. Implement commission calculation
4. Create payout tracking
5. Create partner analytics

Commission rates vary by tier and product.
```
- [x] Completed

---

### Session 5.5: White-Label & Branding
```
Continuing TERRA IMS development.

Read docs/part-31.md

Task: Implement White-Label:
1. Create BrandingConfig entity
2. Implement theme customization
3. Implement logo/asset management
4. Create custom domain support
5. Implement email branding

Branding resolution: Subdomain → Partner → Tenant → Platform default
```
- [ ] Completed

---

### Session 5.6: Industry Templates
```
Continuing TERRA IMS development.

Read docs/part-32.md

Task: Implement Industry Templates:
1. Create IndustryTemplate entity
2. Create TemplateConfig entity
3. Implement template application flow
4. Create pre-configured workflows
5. Create template marketplace listing

Templates include modules, settings, sample data.
```
- [ ] Completed

---

### Session 5.7: Multi-Vertical Governance
```
Continuing TERRA IMS development.

Read docs/part-33.md

Task: Implement Vertical Governance:
1. Create VerticalRegistry entity
2. Implement cross-vertical rules
3. Create dependency validation
4. Implement module compatibility checks
5. Create governance endpoints

Verticals must not create circular dependencies.
```
- [ ] Completed

---

### Session 5.8: Localization - Core
```
Continuing TERRA IMS development.

Read docs/part-34.md

Task: Implement Localization Core:
1. Create Locale entity
2. Create Translation entity
3. Implement multi-currency support
4. Create timezone handling service
5. Create localization endpoints

Default: en-US, USD, UTC. Tenant can override.
```
- [ ] Completed

---

### Session 5.9: Localization - Regional
```
Continuing TERRA IMS development.

Read docs/part-34.md (Regional section)

Task: Implement Regional Features:
1. Implement regional pricing
2. Create tax configuration
3. Implement date/number formatting
4. Create RTL support preparation
5. Implement regional compliance

Support multiple tax rates per region.
```
- [ ] Completed

---

### Session 5.10: Cost Optimization & FinOps
```
Continuing TERRA IMS development.

Read docs/part-35.md

Task: Implement FinOps:
1. Create CostRecord entity
2. Create Budget entity
3. Implement resource cost tracking
4. Create AI cost metering
5. Implement budget alerts

Track costs per tenant, module, and resource type.
```
- [ ] Completed

---

## ✅ PHASE 5 CHECKPOINT
```
Before continuing to Phase 6, verify:

1. Construction vertical functional
2. Partner system working with commissions
3. White-label branding applying correctly
4. Templates can be applied to new tenants
5. Multi-currency working

If all pass, continue to Phase 6.
```
- [ ] All checks passed

---

## 🛡️ PHASE 6 — ENTERPRISE & GOVERNANCE

### Session 6.1: Data Archival
```
Continuing TERRA IMS development.

Read docs/part-36.md

Task: Implement Data Archival:
1. Create ArchivedRecord entity
2. Create RetentionPolicy entity
3. Create LegalHold entity
4. Implement archival job processor
5. Create rehydration workflow

States: ACTIVE → WARM → ARCHIVED → DELETED (if allowed)
```
- [ ] Completed

---

### Session 6.2: Disaster Recovery
```
Continuing TERRA IMS development.

Read docs/part-37.md

Task: Implement DR Infrastructure:
1. Create BackupRecord entity
2. Create RecoveryObjective entity (RTO/RPO)
3. Create DRDrill entity
4. Implement backup scheduling
5. Document recovery procedures

Test backups regularly. DR drills are mandatory.
```
- [ ] Completed

---

### Session 6.3: AI Model Governance - Registry
```
Continuing TERRA IMS development.

Read docs/part-38.md

Task: Implement AI Governance:
1. Create ModelRegistryEntry entity
2. Implement prompt versioning
3. Create AIUseCase entity
4. Implement model approval workflow
5. Create registry endpoints

Models: DRAFT → APPROVED → ACTIVE → DEPRECATED → RETIRED
```
- [ ] Completed

---

### Session 6.4: AI Model Governance - Audit
```
Continuing TERRA IMS development.

Read docs/part-38.md (Audit section)

Task: Implement AI Decision Audit:
1. Create AIDecisionLog entity
2. Create explainability service
3. Enforce decision boundaries
4. Implement model deprecation workflow
5. Integrate with audit system

AI MUST NOT approve, modify records, or perform irreversible actions.
```
- [ ] Completed

---

### Session 6.5: GRC Operations - Controls
```
Continuing TERRA IMS development.

Read docs/part-39.md

Task: Implement GRC Controls:
1. Create Control entity
2. Create Risk entity
3. Create ComplianceEvidence entity
4. Implement control registry
5. Implement risk assessment

Map controls to frameworks: ISO27001, SOC2, GDPR, PDPA.
```
- [ ] Completed

---

### Session 6.6: GRC Operations - Policies
```
Continuing TERRA IMS development.

Read docs/part-39.md (Policy section)

Task: Implement Policy Management:
1. Create Policy entity
2. Create PolicyAcknowledgment entity
3. Create AccessReview entity
4. Implement framework mapping
5. Create compliance dashboard

Policies require user acknowledgment.
```
- [ ] Completed

---

### Session 6.7: Customer Success
```
Continuing TERRA IMS development.

Read docs/part-40.md

Task: Implement Customer Success:
1. Create CustomerLifecycle entity
2. Create HealthScore entity
3. Create ChurnAlert entity
4. Implement onboarding tracking
5. Create success metrics

Stages: PROSPECT → ONBOARDING → ACTIVATION → ADOPTION → EXPANSION → RENEWAL
```
- [ ] Completed

---

### Session 6.8: Ecosystem Trust
```
Continuing TERRA IMS development.

Read docs/part-41.md

Task: Implement Trust & Certification:
1. Create CertifiableEntity entity
2. Create CertificationAssessment entity
3. Create TrustBadge entity
4. Implement certification workflow
5. Create trust profile endpoints

Levels: REGISTERED → VERIFIED → CERTIFIED → ADVANCED
```
- [ ] Completed

---

### Session 6.9: Organizational Model
```
Continuing TERRA IMS development.

Read docs/part-42.md

Task: Implement Organizational Model:
1. Create OrganizationalRole entity
2. Create OwnershipRecord entity
3. Create DecisionAuthority entity
4. Implement RACI matrix
5. Create escalation path management

Every resource must have an owner.
```
- [ ] Completed

---

### Session 6.10: Platform Exit Strategy
```
Continuing TERRA IMS development.

Read docs/part-43.md

Task: Implement Exit Strategy:
1. Create ExitRequest entity
2. Create DataExportJob entity
3. Create ModuleSunset entity
4. Implement exit workflow
5. Implement data portability

Guarantees: data export, no lock-in, reasonable notice.
```
- [ ] Completed

---

## ✅ PHASE 6 CHECKPOINT
```
Final production checklist:

1. [ ] All 56 sessions completed
2. [ ] Security tests passing
3. [ ] Tenant isolation verified
4. [ ] AI governance enforced
5. [ ] GRC dashboard functional
6. [ ] DR procedures documented and tested
7. [ ] Exit strategy implemented
8. [ ] Documentation complete

🎉 TERRA IMS is production-ready!
```
- [ ] All checks passed

---

## 🧪 Smoke Test Commands

### Login & Get Token
```powershell
$baseUrl = "http://localhost:3000"
$loginBody = '{"email":"admin@terra.io","password":"ChangeMe123!"}'
$token = (Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/auth/login" -Body $loginBody -ContentType "application/json").accessToken
```

### Test Authenticated Endpoint
```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Get -Uri "$baseUrl/api/v1/users" -Headers $headers
```

### Test Tenant Isolation
```powershell
# Should only return data for current tenant
Invoke-RestMethod -Method Get -Uri "$baseUrl/api/v1/projects" -Headers $headers
```

---

## 📝 Troubleshooting

### Common Issues

1. **Prisma migration fails**
   ```bash
   npx prisma migrate reset
   npx prisma migrate dev
   ```

2. **Redis connection fails**
   ```bash
   # Check Redis is running
   docker-compose up -d redis
   ```

3. **TypeScript errors**
   ```bash
   npm run typecheck
   npm run build
   ```

4. **Permission denied**
   - Check JWT has correct role_code
   - Check permission is seeded in database
   - Check @RequirePermission() decorator

5. **Tenant isolation leak**
   - Check BaseRepository is being used
   - Check tenant_id is in WHERE clause
   - Check TenantContext is populated

---

## 🔗 Quick Links

| Resource | Location |
|----------|----------|
| API Docs | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/health |
| Metrics | http://localhost:3000/metrics |
| BullMQ Dashboard | http://localhost:3000/admin/queues |
