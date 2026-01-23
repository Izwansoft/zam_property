# TERRA IMS Navigation Structure & Component Brief

> **Purpose**: Define the navigation structure and component architecture for each portal.
> This document serves as a blueprint for frontend/web app implementation.

---

## 🎯 Portal Overview

TERRA IMS has role-based portals, each with its own navigation structure and components.

| Portal | Primary Users | Scope | Priority |
|--------|---------------|-------|----------|
| Platform Admin | Super admins | Cross-tenant | P1 |
| Partner Admin | Reseller/partner admins | Partner tenants | P2 |
| Account Admin | Business group HQ | Account-wide | P1 |
| Company Admin | Company managers | Company | P1 |
| Operations | Project managers, staff | Company | P1 |
| Employee | General employees | Self | P2 |
| Client Portal | External clients | Client data | P3 |

---

## 🏗️ Common Layout Structure

All portals share a common layout:

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                   │
│ ┌─────────┬───────────────────────────────┬───────────┐ │
│ │ Logo    │ Global Search                 │ User Menu │ │
│ └─────────┴───────────────────────────────┴───────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┬─────────────────────────────────────────────┤
│ │         │                                             │
│ │ Sidebar │ Main Content Area                           │
│ │ (Nav)   │                                             │
│ │         │ ┌─────────────────────────────────────────┐ │
│ │         │ │ Breadcrumb                              │ │
│ │         │ ├─────────────────────────────────────────┤ │
│ │         │ │ Page Header + Actions                   │ │
│ │         │ ├─────────────────────────────────────────┤ │
│ │         │ │ Page Content                            │ │
│ │         │ │                                         │ │
│ │         │ │                                         │ │
│ │         │ └─────────────────────────────────────────┘ │
│ └─────────┴─────────────────────────────────────────────┤
│ AI Copilot Floating Button                        [💬]  │
└─────────────────────────────────────────────────────────┘
```

### Common Components

| Component | File | Description |
|-----------|------|-------------|
| AppLayout | `layouts/app-layout.tsx` | Main layout wrapper |
| Header | `components/layout/header.tsx` | Top header with search, notifications |
| Sidebar | `components/layout/sidebar.tsx` | Navigation sidebar |
| Breadcrumb | `components/layout/breadcrumb.tsx` | Page breadcrumb |
| UserMenu | `components/layout/user-menu.tsx` | Profile, settings, logout |
| NotificationBell | `components/layout/notification-bell.tsx` | Real-time notifications |
| GlobalSearch | `components/layout/global-search.tsx` | OpenSearch-powered search |
| AICopilot | `components/ai/copilot-panel.tsx` | AI assistant panel |

---

## 👑 Platform Admin Portal

**Access**: `PLATFORM_ADMIN` role only
**Scope**: Cross-tenant management

### Navigation Structure

```
📊 Dashboard
│
├─ 🏢 Tenants (Accounts)
│   ├─ All Accounts
│   ├─ Create Account
│   └─ Account Settings
│
├─ 🤝 Partners
│   ├─ All Partners
│   ├─ Partner Tiers
│   └─ Commission Settings
│
├─ 📦 Modules
│   ├─ Module Registry
│   ├─ Feature Flags
│   └─ Vertical Management
│
├─ 💰 Platform Billing
│   ├─ Subscription Plans
│   ├─ Usage Metering
│   └─ Revenue Reports
│
├─ 🔒 Security
│   ├─ API Keys
│   ├─ Rate Limits
│   └─ Security Logs
│
├─ 🤖 AI Governance
│   ├─ Model Registry
│   ├─ Prompt Templates
│   └─ AI Usage & Costs
│
├─ 📊 Analytics
│   ├─ Platform Metrics
│   ├─ Tenant Usage
│   └─ System Health
│
├─ 🛡️ Compliance
│   ├─ GRC Dashboard
│   ├─ Controls
│   └─ Risks
│
└─ 📋 Audit Logs
    └─ All Logs
```

### Key Pages & Components

| Page | Route | Components |
|------|-------|------------|
| Dashboard | `/platform` | PlatformStatsWidget, TenantListWidget, SystemHealthWidget |
| System Health | `/platform/analytics/system-health` | SystemHealthWidget |
| Tenant List | `/platform/accounts` | AccountTable, AccountFilters, CreateAccountModal |
| Tenant Detail | `/platform/accounts/{id}` | AccountOverview, CompanyList, AccountSettings |
| Partner List | `/platform/partners` | PartnerTable, PartnerFilters, PartnerTierBadge |
| Module Registry | `/platform/modules` | ModuleGrid, ModuleCard, FeatureToggle |
| Feature Flags | `/platform/modules/feature-flags` | FeatureFlagTable, FeatureToggle |
| Vertical Management | `/platform/modules/verticals` | VerticalRegistryTable, VerticalDependencyGraph, VerticalValidationForm, VerticalImpactPanel |
| AI Governance | `/platform/ai` | ModelRegistryTable, PromptVersionList, AICostChart |
| Audit Logs | `/platform/audit-logs` | AuditLogTable, AuditLogFilters, AuditLogDetail |

---

## 🤝 Partner Admin Portal

**Access**: `PARTNER_ADMIN` role
**Scope**: Partner-managed tenants

### Navigation Structure

```
📊 Dashboard
│
├─ 🏢 Managed Accounts
│   ├─ All Accounts
│   ├─ Provision New
│   └─ Account Health
│
├─ 💰 Commissions
│   ├─ Earnings
│   ├─ Payouts
│   └─ Commission Rules
│
├─ 📈 Analytics
│   ├─ Revenue Trends
│   ├─ Account Metrics
│   └─ Growth Analysis
│
├─ 🎨 White-Label
│   ├─ Branding
│   ├─ Custom Domain
│   └─ Email Templates
│
└─ ⚙️ Settings
    └─ Partner Profile
```

### Key Pages & Components

| Page | Route | Components |
|------|-------|------------|
| Dashboard | `/partner` | PartnerDashboard, CommissionWidget, AccountHealthGrid |
| Assigned Tenants | `/partner/tenants` | AssignedTenantTable, TenantStatusBadge |
| Commissions | `/partner/commissions` | CommissionSummary, PayoutHistory, EarningsChart |
| Branding | `/partner/branding` | BrandingEditor, LogoUpload, ColorPicker, ApprovalStatusBadge, VersionHistoryPanel, RollbackButton |
| Custom Domain | `/partner/branding/domains` | DomainMappingTable, DomainVerificationPanel |
| Email Templates | `/partner/branding/email-templates` | EmailTemplateList, EmailTemplateEditor |

---

## 🏢 Account Admin Portal

**Access**: `ACCOUNT_OWNER`, `ACCOUNT_ADMIN`, `ACCOUNT_VIEWER` roles
**Scope**: Account-wide (all companies)

### Navigation Structure

```
📊 Dashboard
│
├─ 🏢 Companies
│   ├─ All Companies
│   ├─ Create Company
│   └─ Company Comparison
│
├─ 👥 User Management
│   ├─ All Users
│   ├─ Roles & Permissions
│   └─ User Invitations
│
├─ 📦 Modules & Features
│   ├─ Enabled Modules
│   ├─ Feature Configuration
│   └─ Vertical Selection
│
├─ 💰 Subscription
│   ├─ Current Plan
│   ├─ Usage & Limits
│   └─ Billing History
│
├─ ⚙️ Account Settings
│   ├─ General Settings
│   ├─ Branding
│   ├─ Localization
│   ├─ Industry Templates
│   ├─ Portals
│   │   ├─ Portal Configs
│   │   ├─ Widget Registry
│   │   └─ Dashboard Layouts
│   ├─ Integrations Marketplace
│   ├─ Webhooks
│   ├─ API Docs
│   ├─ API Keys
│   ├─ OAuth Clients
│   └─ API Usage
│
├─ 📈 Analytics
│   ├─ Overview
│   ├─ Trends
│   ├─ HR (if enabled)
│   ├─ Projects (if enabled)
│   ├─ Billing (if enabled)
│   └─ Agency (if enabled)
│
├─ 📊 Reports
│   ├─ Report Runs
│   ├─ Report Definitions
│   └─ Dashboard Widgets
│
├─ 🤖 AI
│   ├─ AI Copilot
│   ├─ Provider Configuration
│   ├─ Model Registry
│   ├─ Prompt Templates
│   ├─ AI Usage & Costs
│   └─ Knowledge Base

├─ ⚙️ Automation
│   ├─ Proposals
│   └─ History

├─ 🛡️ Compliance
│   ├─ Data Residency
│   ├─ Retention Policies
│   ├─ Compliance Rules
│   └─ Data Classifications
│
└─ 📋 Audit Logs
    └─ Account Logs
```

### Key Pages & Components

| Page | Route | Components |
|------|-------|------------|
| Dashboard | `/account` | ExecutiveDashboard, CompanyCards, KPIWidgets |
| Company List | `/account/companies` | CompanyGrid, CompanyStats, CreateCompanyModal |
| Users | `/account/users` | UserTable, UserFilters, UserForm, RoleAssignment |
| Modules | `/account/modules` | ModuleGrid, ModuleToggle, FeatureConfig |
| Portal Configs | `/account/settings/portals` | PortalConfigList, PortalConfigEditor |
| Widget Registry | `/account/settings/portals/widgets` | WidgetRegistryTable, WidgetEditor |
| Dashboard Layouts | `/account/settings/portals/layouts` | DashboardLayoutTable, DashboardLayoutEditor |
| Subscription | `/account/subscription` | PlanCard, UsageChart, BillingTable |
| Settings | `/account/settings` | AccountSettingsForm, BrandingUpload, IntegrationList |
| Industry Templates | `/account/settings/templates` | TemplatesMarketplacePage, TemplateDetailPanel, TemplatePreviewPanel, TemplateApplyButton, TemplateHistoryTable, TemplateRollbackButton |
| Branding | `/account/settings/branding` | BrandingEditor, LogoUpload, ColorPicker, ApprovalStatusBadge, VersionHistoryPanel, RollbackButton |
| Localization | `/account/settings/localization` | LocalizationSettingsPage, LocalePicker, TimezoneSelect, CurrencySelect |
| Custom Domains | `/account/settings/branding/domains` | DomainMappingTable, DomainVerificationPanel |
| Email Templates | `/account/settings/branding/email-templates` | EmailTemplateList, EmailTemplateEditor |
| Integrations Marketplace | `/account/settings/integrations` | IntegrationsMarketplacePage, IntegrationCatalogTable, InstalledIntegrationsTable |
| Webhooks | `/account/settings/webhooks` | WebhooksPage, WebhookSubscriptionsTable, WebhookSubscriptionForm |
| API Docs | `/account/settings/api-docs` | ApiDocsPage, SwaggerDocsViewer |
| API Keys | `/account/settings/api-keys` | ApiKeysPage, ApiKeyTable, ApiKeyCreateForm |
| OAuth Clients | `/account/settings/oauth-clients` | OAuthClientsPage, OAuthClientTable, OAuthClientCreateForm |
| API Usage | `/account/settings/api-usage` | ApiUsagePage, ApiUsageEventsTable, ApiUsageFilters |
| Analytics Overview | `/account/analytics` | AnalyticsOverviewPage, AnalyticsKpiCards |
| Analytics Trends | `/account/analytics/trends` | AnalyticsTrendsChart |
| Analytics - HR | `/account/analytics/hr` | AnalyticsHrChart |
| Analytics - Projects | `/account/analytics/projects` | AnalyticsProjectsChart |
| Analytics - Billing | `/account/analytics/billing` | AnalyticsBillingChart |
| Analytics - Agency | `/account/analytics/agency` | AnalyticsAgencyChart |
| Report Runs | `/account/reports` | ReportRunsPage, ReportRunDetail, ReportExportButtons |
| Report Definitions | `/account/report-definitions` | ReportDefinitionsPage, ReportDefinitionForm |
| Dashboard Widgets | `/account/dashboard-widgets` | DashboardWidgetsPage, DashboardWidgetForm |
| AI Copilot | `/account/ai/copilot` | AiCopilotPage, AiCopilotChatPanel, AiCopilotHistoryTable |
| AI Provider Configuration | `/account/ai/provider-config` | AiProviderConfigForm, SecretField |
| AI Model Registry | `/account/ai/models` | AiModelRegistryTable, AiModelRegistryForm |
| AI Prompt Templates | `/account/ai/prompt-templates` | AiPromptTemplateTable, AiPromptTemplateEditor |
| AI Usage & Costs | `/account/ai/usage` | AiUsageTable, AiCostSummary |
| AI Knowledge Base | `/account/ai/knowledge-base` | KnowledgeBaseDocumentsTable, KnowledgeBaseDocumentForm |
| Automation Proposals | `/account/automation/proposals` | AutomationProposalsPage, AutomationProposalTable |
| Automation History | `/account/automation/history` | AutomationHistoryPage, AutomationHistoryTable |
| Data Residency | `/account/compliance/data-residency` | DataResidencySettingsPage, DataResidencyForm |
| Retention Policies | `/account/compliance/retention` | RetentionPoliciesPage, RetentionPolicyTable, RetentionPolicyForm |
| Compliance Rules | `/account/compliance/rules` | ComplianceRulesPage, ComplianceRulesTable, ComplianceRuleForm |
| Data Classifications | `/account/compliance/data-classifications` | DataClassificationsPage, DataClassificationsTable, DataClassificationForm |
| Audit Logs | `/account/audit-logs` | AuditLogTable, AuditLogFilters, AuditLogDetail |

---

## 🏫 Company Admin Portal

**Access**: `COMPANY_ADMIN` role
**Scope**: Single company

### Navigation Structure

```
📊 Dashboard
│
├─ 👥 HR Management
│   ├─ Employees
│   ├─ Departments
│   ├─ Positions
│   ├─ Leave Management
│   │   ├─ Leave Requests
│   │   ├─ Leave Types
│   │   └─ Leave Balances
│   └─ Org Chart
│
├─ 📁 Projects
│   ├─ All Projects
│   ├─ Create Project
│   ├─ Project Tasks
│   ├─ Project Templates
│   └─ Resource Allocation
│
├─ 👤 Clients
│   ├─ All Clients
│   ├─ Create Client
│   └─ Client Portal Settings
│
├─ 💰 Billing
│   ├─ Invoices
│   ├─ Payments
│   ├─ Receipts
│   └─ Financial Reports
│
├─ 🎨 Agency (if enabled)
│   ├─ Clients
│   ├─ Engagements
│   ├─ Retainers
│   ├─ Creatives
│   └─ Approval Workflows
│
├─ 🏗️ Construction (if enabled)
│   ├─ Projects
│   ├─ Contractors
│   ├─ Work Orders
│   ├─ Safety Incidents
│   ├─ Project Phases
│   └─ Site Logs
│
├─ 📊 Reports
│   ├─ Report Runs
│   ├─ Report Definitions
│   └─ Dashboard Widgets
│
├─ 📈 Analytics
│   ├─ Overview
│   ├─ Trends
│   ├─ HR (if enabled)
│   ├─ Projects (if enabled)
│   ├─ Billing (if enabled)
│   └─ Agency (if enabled)
│
├─ 🔔 Notifications
│   ├─ Templates
│   └─ History
│
└─ ⚙️ Settings
    ├─ Company Profile
  ├─ Localization
    ├─ Workflows
    ├─ Compliance
    │   ├─ Retention Policies
    │   ├─ Compliance Rules
    │   └─ Data Classifications
  ├─ AI Settings
  │   ├─ AI Copilot
  │   ├─ Provider Configuration
  │   ├─ Model Registry
  │   ├─ Prompt Templates
  │   ├─ AI Usage & Costs
  │   └─ Knowledge Base
    └─ Automation
        ├─ Proposals
        └─ History
```

### Key Pages & Components

| Page | Route | Components |
|------|-------|------------|
| Dashboard | `/company` | CompanyDashboard, ProjectsWidget, RevenueChart, TasksWidget |
| Employees | `/company/hr/employees` | EmployeeTable, EmployeeForm |
| Departments | `/company/hr/departments` | DepartmentTable, DepartmentForm |
| Positions | `/company/hr/positions` | PositionTable, PositionForm |
| Leave Requests | `/company/hr/leave-requests` | LeaveRequestTable, LeaveRequestDetail |
| Leave Types | `/company/hr/leave-types` | LeaveTypeTable, LeaveTypeForm |
| Leave Balances | `/company/hr/leave-balances` | LeaveBalanceTable |
| Org Chart | `/company/hr/org-chart` | OrgChartView |
| All Projects | `/company/projects` | ProjectTable, ProjectCard |
| Create Project | `/company/projects/create` | ProjectForm |
| Project Tasks | `/company/projects/{id}/tasks` | TaskTable, TaskForm |
| Clients | `/company/clients` | ClientTable, ClientForm, ClientDetail, EngagementList |
| Invoices | `/company/billing/invoices` | InvoiceTable, InvoiceForm, InvoicePreview |
| Invoice Payments | `/company/billing/invoices/{id}/payments` | PaymentForm, PaymentHistory |
| Receipts | `/company/billing/receipts` | ReceiptTable, ReceiptPreview |
| Agency Clients | `/company/agency/clients` | AgencyClientTable, AgencyClientForm, AgencyClientDetail |
| Agency Engagements | `/company/agency/clients/{id}/engagements` | EngagementList, EngagementForm |
| Agency Retainers | `/company/agency/clients/{id}/retainers` | RetainerList, RetainerForm |
| Creatives | `/company/agency/creatives` | CreativeGrid, CreativeVersions, ApprovalWorkflow |
| Construction Projects | `/company/construction/projects` | ConstructionProjectTable, ConstructionProjectForm, ConstructionProjectDetail |
| Construction Contractors | `/company/construction/contractors` | ConstructionContractorTable, ConstructionContractorForm, ConstructionContractorDetail |
| Construction Phases | `/company/construction/projects/{id}/phases` | ConstructionPhaseTable, ConstructionPhaseForm |
| Construction Site Logs | `/company/construction/projects/{id}/site-logs` | SiteLogTable, SiteLogForm |
| Construction Work Orders | `/company/construction/projects/{id}/work-orders` | WorkOrderTable, WorkOrderForm, WorkOrderDetail |
| Construction Safety Incidents | `/company/construction/projects/{id}/safety-incidents` | SafetyIncidentTable, SafetyIncidentForm, SafetyIncidentDetail |
| Analytics Overview | `/company/analytics` | AnalyticsOverviewPage, AnalyticsKpiCards |
| Analytics Trends | `/company/analytics/trends` | AnalyticsTrendsChart |
| Analytics - HR | `/company/analytics/hr` | AnalyticsHrChart |
| Analytics - Projects | `/company/analytics/projects` | AnalyticsProjectsChart |
| Analytics - Billing | `/company/analytics/billing` | AnalyticsBillingChart |
| Analytics - Agency | `/company/analytics/agency` | AnalyticsAgencyChart |
| Report Runs | `/company/reports` | ReportRunsPage, ReportRunDetail, ReportExportButtons |
| Report Definitions | `/company/report-definitions` | ReportDefinitionsPage, ReportDefinitionForm |
| Dashboard Widgets | `/company/dashboard-widgets` | DashboardWidgetsPage, DashboardWidgetForm |
| Notifications | `/company/notifications` | NotificationTable, NotificationFilters, NotificationSettingsForm |
| Localization | `/company/settings/localization` | LocalizationSettingsPage, LocalePicker, TimezoneSelect, CurrencySelect |
| AI Copilot | `/company/settings/ai/copilot` | AiCopilotPage, AiCopilotChatPanel, AiCopilotHistoryTable |
| AI Provider Configuration | `/company/settings/ai/provider-config` | AiProviderConfigForm, SecretField |
| AI Model Registry | `/company/settings/ai/models` | AiModelRegistryTable, AiModelRegistryForm |
| AI Prompt Templates | `/company/settings/ai/prompt-templates` | AiPromptTemplateTable, AiPromptTemplateEditor |
| AI Usage & Costs | `/company/settings/ai/usage` | AiUsageTable, AiCostSummary |
| AI Knowledge Base | `/company/settings/ai/knowledge-base` | KnowledgeBaseDocumentsTable, KnowledgeBaseDocumentForm |
| Automation Proposals | `/company/settings/automation/proposals` | AutomationProposalsPage, AutomationProposalTable |
| Automation History | `/company/settings/automation/history` | AutomationHistoryPage, AutomationHistoryTable |
| Retention Policies | `/company/settings/compliance/retention` | RetentionPoliciesPage, RetentionPolicyTable, RetentionPolicyForm |
| Compliance Rules | `/company/settings/compliance/rules` | ComplianceRulesPage, ComplianceRulesTable, ComplianceRuleForm |
| Data Classifications | `/company/settings/compliance/data-classifications` | DataClassificationsPage, DataClassificationsTable, DataClassificationForm |

---

## 🔧 Operations Portal

**Access**: `PROJECT_MANAGER`, `OPERATIONS_MANAGER`, `SALES_MANAGER` roles
**Scope**: Assigned projects/clients within company

### Navigation Structure

```
📊 My Dashboard
│
├─ 📁 My Projects
│   ├─ Active Projects
│   ├─ My Tasks
│   └─ Time Tracking
│
├─ 👥 My Team
│   ├─ Team Members
│   ├─ Workload View
│   └─ Leave Calendar
│
├─ 👤 My Clients
│   ├─ Assigned Clients
│   ├─ Opportunities
│   └─ Activity Log
│
├─ 📄 Documents
│   ├─ Project Files
│   └─ Templates
│
├─ 📊 Reports
│   ├─ Project Status
│   ├─ Time Reports
│   └─ Client Reports
│
└─ 🔔 Notifications
    └─ My Alerts
```

### Key Pages & Components

| Page | Route | Components |
|------|-------|------------|
| Dashboard | `/ops` | MyProjectsWidget, TaskList, TimeEntryWidget, CalendarWidget |
| My Projects | `/ops/projects` | ProjectList, TaskBoard, TimeTracker, MilestoneView |
| My Tasks | `/ops/tasks` | TaskTable, TaskKanban, TaskDetail, TaskTimer |
| My Clients | `/ops/clients` | AssignedClientList, ActivityTimeline, OpportunityPipeline |

---

## 👤 Employee Portal

**Access**: `EMPLOYEE` role
**Scope**: Own data only

### Navigation Structure

```
📊 My Dashboard
│
├─ ⏰ Time & Attendance
│   ├─ Clock In/Out
│   ├─ My Timesheet
│   └─ Attendance History
│
├─ 📅 Leave
│   ├─ Request Leave
│   ├─ My Requests
│   └─ Leave Balance
│
├─ ✅ My Tasks
│   ├─ Assigned Tasks
│   └─ Task History
│
├─ 📄 My Documents
│   └─ Personal Files
│
├─ 👤 Profile
│   ├─ My Info
│   └─ Change Password
│
└─ 🔔 Notifications
    └─ My Alerts
```

### Key Pages & Components

| Page | Route | Components |
|------|-------|------------|
| Dashboard | `/employee` | ClockWidget, TaskSummary, LeaveBalance, AnnouncementList |
| Timesheet | `/employee/timesheet` | TimesheetGrid, WeeklyTimeEntry, TimeSubmit |
| Leave | `/employee/leave` | LeaveRequestForm, LeaveHistory, BalanceCard |
| My Tasks | `/employee/tasks` | AssignedTaskList, TaskDetail, TaskSubmit |

---

## 🌐 Client Portal

**Access**: `CLIENT_PORTAL` role
**Scope**: Own client data only

### Navigation Structure

```
📊 Overview
│
├─ 📁 My Projects
│   ├─ Active Projects
│   ├─ Project Updates
│   └─ Deliverables
│
├─ 💰 Invoices
│   ├─ Outstanding
│   ├─ Paid
│   └─ Make Payment
│
├─ 🎨 Creatives (if Agency)
│   ├─ Pending Approval
│   └─ Approved
│
├─ 📄 Documents
│   └─ Shared Files
│
├─ 💬 Messages
│   └─ Communication
│
└─ 👤 Profile
    └─ Company Info
```

### Key Pages & Components

| Page | Route | Components |
|------|-------|------------|
| Dashboard | `/client` | ProjectSummary, InvoiceSummary, RecentActivity |
| Projects | `/client/projects` | ClientProjectList, ProjectProgress, DeliverableList |
| Invoices | `/client/invoices` | ClientInvoiceTable, PaymentButton, PaymentHistory |
| Creatives | `/client/creatives` | ApprovalQueue, CreativeViewer, ApprovalButtons |

---

## 🧩 Reusable Components

### Data Display

| Component | File | Description |
|-----------|------|-------------|
| DataTable | `components/ui/data-table.tsx` | Sortable, filterable table with pagination |
| KanbanBoard | `components/ui/kanban-board.tsx` | Drag-and-drop kanban |
| GanttChart | `components/ui/gantt-chart.tsx` | Project timeline view |
| OrgChart | `components/ui/org-chart.tsx` | Organizational hierarchy |
| Calendar | `components/ui/calendar.tsx` | Event calendar |
| Timeline | `components/ui/timeline.tsx` | Activity timeline |

### Forms

| Component | File | Description |
|-----------|------|-------------|
| FormBuilder | `components/forms/form-builder.tsx` | Dynamic form generator |
| FileUpload | `components/forms/file-upload.tsx` | Drag-drop file upload |
| RichTextEditor | `components/forms/rich-text-editor.tsx` | WYSIWYG editor |
| DateRangePicker | `components/forms/date-range-picker.tsx` | Date range selection |
| MultiSelect | `components/forms/multi-select.tsx` | Multi-select dropdown |
| SearchSelect | `components/forms/search-select.tsx` | Searchable select |

### Widgets

| Component | File | Description |
|-----------|------|-------------|
| StatsCard | `components/widgets/stats-card.tsx` | KPI display card |
| ChartWidget | `components/widgets/chart-widget.tsx` | Chart container |
| ActivityFeed | `components/widgets/activity-feed.tsx` | Recent activity list |
| ProgressRing | `components/widgets/progress-ring.tsx` | Circular progress |
| StatusBadge | `components/widgets/status-badge.tsx` | Status indicator |

### AI Components

| Component | File | Description |
|-----------|------|-------------|
| CopilotPanel | `components/ai/copilot-panel.tsx` | AI assistant panel |
| CopilotMessage | `components/ai/copilot-message.tsx` | Chat message bubble |
| SuggestionCard | `components/ai/suggestion-card.tsx` | AI suggestion display |
| StreamingText | `components/ai/streaming-text.tsx` | SSE text streaming |

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Sidebar hidden, hamburger menu |
| Tablet | 640px - 1024px | Collapsed sidebar |
| Desktop | > 1024px | Full sidebar |

---

## 🎨 Theme Configuration

```typescript
// Theme structure
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    destructive: string;
    success: string;
    warning: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
  borderRadius: string;
  logo: {
    light: string;
    dark: string;
  };
}
```

---

## 🔄 State Management

| Concern | Solution |
|---------|----------|
| Server State | TanStack Query (React Query) |
| Client State | Zustand |
| Form State | React Hook Form |
| URL State | Next.js App Router |

---

## 📝 Implementation Notes

Session 1.1: Backend skeleton initialized (no navigation items added).
Session 1.2: Prisma/database scaffolding (no navigation items added).
Session 1.3: Tenant + Company schema + seed (no navigation items added).
Session 1.4: TenantContext middleware foundation (no navigation items added).
Session 1.5: Auth login foundation (no navigation items added).
Session 1.6: RBAC permissions foundation (no navigation items added).
Session 1.7: User management APIs foundation (no navigation items added).
Session 1.8: Swagger/OpenAPI enabled at /api/docs (no navigation items added).
Session 3.7: Real-time infrastructure (Socket.IO + presence) added (no navigation items added).
Session 4.2: Portal configuration added (portal configs, widget registry, dashboard layouts under `/account/settings/portals*`).
Session 5.4: Partner portal commission dashboard route added (`/partner/commissions`).

### Module-Based Navigation
- Navigation items are shown/hidden based on enabled modules
- Use `useModules()` hook to check module availability
- Conditionally render menu items and routes

### Permission-Based UI
- Use `usePermission('resource:action')` hook
- Hide actions user cannot perform
- Disable buttons instead of hiding when appropriate

### Real-Time Updates
- Use WebSocket connection for live updates
- Show notification badges for new items
- Auto-refresh data on relevant events
- Background processing uses BullMQ (no UI changes yet)

### AI Copilot Integration
- Floating button on all portals
- Context-aware suggestions
- SSE for streaming responses
- Decision logging for audit
