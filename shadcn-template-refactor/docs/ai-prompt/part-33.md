# FRONTEND (WEB) — PART 33 — LEGAL CASES & PLATFORM ADMIN PM UI

> **Sessions:** 8.6-8.8  
> **Covers:** Legal case management, platform admin PM features, final documentation

All rules from WEB PART 0–32 apply fully.

---

## 33.1 LEGAL MODULE

### Module Structure
```
modules/legal/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-legal-cases.ts
│   ├── use-legal-case.ts
│   └── use-legal-mutations.ts
├── components/
│   ├── index.ts
│   ├── legal-case-card.tsx
│   ├── legal-case-detail.tsx
│   ├── legal-case-timeline.tsx
│   ├── legal-case-status-badge.tsx
│   ├── legal-document-viewer.tsx
│   └── legal-case-form.tsx
└── index.ts
```

### Legal Types

```typescript
// modules/legal/types/index.ts

export interface LegalCase {
  id: string;
  caseNumber: string;
  tenancyId: string;
  claimId?: string;
  type: LegalCaseType;
  status: LegalCaseStatus;
  title: string;
  description: string;
  filingDate?: Date;
  hearingDate?: Date;
  courtName?: string;
  caseReference?: string;
  lawyerName?: string;
  lawyerContact?: string;
  documents?: LegalDocument[];
  events?: LegalEvent[];
  outcome?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum LegalCaseType {
  EVICTION = 'EVICTION',
  RENT_RECOVERY = 'RENT_RECOVERY',
  PROPERTY_DAMAGE = 'PROPERTY_DAMAGE',
  CONTRACT_BREACH = 'CONTRACT_BREACH',
  TRIBUNAL = 'TRIBUNAL',
  OTHER = 'OTHER',
}

export enum LegalCaseStatus {
  DRAFT = 'DRAFT',
  FILED = 'FILED',
  PENDING_HEARING = 'PENDING_HEARING',
  IN_PROGRESS = 'IN_PROGRESS',
  JUDGMENT_ISSUED = 'JUDGMENT_ISSUED',
  APPEAL = 'APPEAL',
  SETTLED = 'SETTLED',
  CLOSED = 'CLOSED',
}

export interface LegalDocument {
  id: string;
  caseId: string;
  type: LegalDocumentType;
  name: string;
  fileUrl: string;
  uploadedAt: Date;
}

export enum LegalDocumentType {
  COURT_FILING = 'COURT_FILING',
  EVIDENCE = 'EVIDENCE',
  NOTICE = 'NOTICE',
  JUDGMENT = 'JUDGMENT',
  CORRESPONDENCE = 'CORRESPONDENCE',
  OTHER = 'OTHER',
}

export interface LegalEvent {
  id: string;
  caseId: string;
  type: string;
  description: string;
  date: Date;
  createdBy: string;
}
```

---

## 33.2 LEGAL CASE BACKEND ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/legal-cases` | List cases |
| GET | `/api/v1/legal-cases/:id` | Get case detail |
| POST | `/api/v1/legal-cases` | Create case |
| PATCH | `/api/v1/legal-cases/:id` | Update case |
| POST | `/api/v1/legal-cases/:id/documents` | Upload document |
| POST | `/api/v1/legal-cases/:id/events` | Add event |
| GET | `/api/v1/legal-cases/:id/timeline` | Get timeline |

---

## 33.3 LEGAL CASE LIST & DETAIL

### Routes
```
app/dashboard/(auth)/account/legal/
├── page.tsx            → LegalCaseListPage
└── [id]/
    └── page.tsx       → LegalCaseDetailPage
```

### List Page
```tsx
export default function LegalCaseListPage() {
  const [status, setStatus] = useState<LegalCaseStatus | 'all'>('all');
  const { data, isLoading } = useLegalCases({
    status: status === 'all' ? undefined : status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal Cases"
        description="Manage legal matters related to your properties"
        actions={
          <Button asChild>
            <Link href="/dashboard/account/legal/new">
              <Plus className="mr-2 h-4 w-4" /> New Case
            </Link>
          </Button>
        }
      />

      {/* Status Filter */}
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="FILED">Filed</TabsTrigger>
          <TabsTrigger value="PENDING_HEARING">Pending Hearing</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="CLOSED">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Case List */}
      <div className="space-y-4">
        {data?.items.map(legalCase => (
          <LegalCaseCard key={legalCase.id} legalCase={legalCase} />
        ))}
      </div>
    </div>
  );
}
```

### Detail Page
```tsx
export default function LegalCaseDetailPage({ params }: { params: { id: string } }) {
  const { data: legalCase, isLoading } = useLegalCase(params.id);

  if (isLoading) return <LegalCaseDetailSkeleton />;
  if (!legalCase) return <NotFound />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Case ${legalCase.caseNumber}`}
        description={legalCase.title}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Case Details</CardTitle>
                <LegalCaseStatusBadge status={legalCase.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Case Type" value={legalCaseTypeLabel(legalCase.type)} />
                <InfoRow label="Filing Date" value={formatDate(legalCase.filingDate)} />
                {legalCase.courtName && (
                  <InfoRow label="Court" value={legalCase.courtName} />
                )}
                {legalCase.caseReference && (
                  <InfoRow label="Court Reference" value={legalCase.caseReference} />
                )}
                {legalCase.hearingDate && (
                  <InfoRow label="Next Hearing" value={formatDateTime(legalCase.hearingDate)} />
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{legalCase.description}</p>
              </div>

              {legalCase.lawyerName && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Legal Representative</h4>
                    <p>{legalCase.lawyerName}</p>
                    {legalCase.lawyerContact && (
                      <p className="text-sm text-muted-foreground">{legalCase.lawyerContact}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <LegalCaseTimeline events={legalCase.events || []} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <LegalDocumentList documents={legalCase.documents || []} />
              <Button variant="outline" className="w-full mt-4">
                <Upload className="mr-2 h-4 w-4" /> Upload Document
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" /> Add Event
              </Button>
              <Button variant="outline" className="w-full">
                <Edit className="mr-2 h-4 w-4" /> Edit Case
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

## 33.4 PLATFORM ADMIN PM FEATURES

### Route Structure
```
app/dashboard/(auth)/platform/pm/
├── page.tsx                → PMDashboardPage (stats overview)
├── tenancies/
│   └── page.tsx           → AdminTenancyListPage
├── billing/
│   └── page.tsx           → AdminBillingPage
├── payouts/
│   └── page.tsx           → AdminPayoutsPage
├── maintenance/
│   └── page.tsx           → AdminMaintenancePage
├── claims/
│   └── page.tsx           → AdminClaimsPage
├── companies/
│   └── page.tsx           → AdminCompaniesPage
└── reconciliation/
    └── page.tsx           → ReconciliationPage
```

### Admin PM Dashboard
```tsx
export default function PMDashboardPage() {
  const { data: stats, isLoading } = useAdminPMStats();

  if (isLoading) return <PMDashboardSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Management"
        description="Platform-wide PM statistics and management"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Tenancies"
          value={stats?.tenancy?.active || 0}
          icon={Home}
          description={`${stats?.tenancy?.total || 0} total`}
        />
        <StatsCard
          title="Outstanding Bills"
          value={formatCurrency(stats?.billing?.outstanding || 0)}
          icon={Receipt}
          variant="warning"
        />
        <StatsCard
          title="Pending Payouts"
          value={formatCurrency(stats?.payout?.pendingAmount || 0)}
          icon={Wallet}
        />
        <StatsCard
          title="Open Maintenance"
          value={stats?.maintenance?.open || 0}
          icon={Wrench}
        />
      </div>

      {/* Section Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Tenancy Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Tenancies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Active</dt>
                <dd className="font-medium">{stats?.tenancy?.active}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pending</dt>
                <dd className="font-medium">{stats?.tenancy?.pending}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Expiring (30d)</dt>
                <dd className="font-medium text-orange-600">{stats?.tenancy?.expiringSoon}</dd>
              </div>
            </dl>
            <Button variant="link" asChild className="mt-4 p-0">
              <Link href="/dashboard/platform/pm/tenancies">Manage Tenancies →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Billing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Outstanding</dt>
                <dd className="font-medium">{formatCurrency(stats?.billing?.outstanding)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Overdue Bills</dt>
                <dd className="font-medium text-red-600">{stats?.billing?.overdueCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">This Month</dt>
                <dd className="font-medium">{formatCurrency(stats?.billing?.thisMonth)}</dd>
              </div>
            </dl>
            <Button variant="link" asChild className="mt-4 p-0">
              <Link href="/dashboard/platform/pm/billing">Manage Billing →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Maintenance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Open Requests</dt>
                <dd className="font-medium">{stats?.maintenance?.open}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Urgent</dt>
                <dd className="font-medium text-red-600">{stats?.maintenance?.urgent}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Avg Resolution</dt>
                <dd className="font-medium">{stats?.maintenance?.avgResolutionDays}d</dd>
              </div>
            </dl>
            <Button variant="link" asChild className="mt-4 p-0">
              <Link href="/dashboard/platform/pm/maintenance">Manage Maintenance →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Payout Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pending</dt>
                <dd className="font-medium">{formatCurrency(stats?.payout?.pendingAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Processing</dt>
                <dd className="font-medium">{stats?.payout?.processingCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">This Month</dt>
                <dd className="font-medium">{formatCurrency(stats?.payout?.thisMonth)}</dd>
              </div>
            </dl>
            <Button variant="link" asChild className="mt-4 p-0">
              <Link href="/dashboard/platform/pm/payouts">Manage Payouts →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Claims Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pending Review</dt>
                <dd className="font-medium">{stats?.claim?.pendingReview}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total Amount</dt>
                <dd className="font-medium">{formatCurrency(stats?.claim?.totalAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Escalated</dt>
                <dd className="font-medium text-red-600">{stats?.claim?.escalated}</dd>
              </div>
            </dl>
            <Button variant="link" asChild className="mt-4 p-0">
              <Link href="/dashboard/platform/pm/claims">Manage Claims →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Companies Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Companies & Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Active Companies</dt>
                <dd className="font-medium">{stats?.companyAgent?.activeCompanies}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total Agents</dt>
                <dd className="font-medium">{stats?.companyAgent?.totalAgents}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pending Verification</dt>
                <dd className="font-medium text-orange-600">{stats?.companyAgent?.pendingVerification}</dd>
              </div>
            </dl>
            <Button variant="link" asChild className="mt-4 p-0">
              <Link href="/dashboard/platform/pm/companies">Manage Companies →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 33.5 ADMIN PM STATS HOOK

```typescript
// modules/admin/hooks/use-admin-pm-stats.ts

export interface AdminPMStats {
  tenancy: {
    total: number;
    active: number;
    pending: number;
    terminated: number;
    expiringSoon: number;
  };
  billing: {
    outstanding: number;
    overdueCount: number;
    overdueAmount: number;
    thisMonth: number;
    lastMonth: number;
  };
  payout: {
    pendingAmount: number;
    pendingCount: number;
    processingCount: number;
    thisMonth: number;
  };
  maintenance: {
    open: number;
    urgent: number;
    inProgress: number;
    avgResolutionDays: number;
  };
  deposit: {
    held: number;
    totalAmount: number;
  };
  inspection: {
    scheduled: number;
    completedThisMonth: number;
  };
  claim: {
    pendingReview: number;
    totalAmount: number;
    escalated: number;
  };
  companyAgent: {
    activeCompanies: number;
    totalAgents: number;
    pendingVerification: number;
  };
  legal: {
    activeCases: number;
    pendingHearing: number;
  };
  occupant: {
    total: number;
    onboardingComplete: number;
  };
}

export function useAdminPMStats() {
  return useApiQuery<AdminPMStats>(
    queryKeys.adminPM.stats(),
    `/admin/dashboard/pm-stats`,
    { staleTime: 60_000 }
  );
}
```

---

## 33.6 NAVIGATION UPDATE

```typescript
// config/navigation.ts (extend)

export const platformNav: NavItem[] = [
  // ... existing items
  {
    title: 'Property Management',
    icon: Building,
    items: [
      { title: 'Dashboard', href: '/dashboard/platform/pm' },
      { title: 'Tenancies', href: '/dashboard/platform/pm/tenancies' },
      { title: 'Billing', href: '/dashboard/platform/pm/billing' },
      { title: 'Payouts', href: '/dashboard/platform/pm/payouts' },
      { title: 'Maintenance', href: '/dashboard/platform/pm/maintenance' },
      { title: 'Claims', href: '/dashboard/platform/pm/claims' },
      { title: 'Companies', href: '/dashboard/platform/pm/companies' },
      { title: 'Reconciliation', href: '/dashboard/platform/pm/reconciliation' },
    ],
  },
];
```

---

## 33.7 HOOKS SPECIFICATION

```typescript
// modules/legal/hooks/

export function useLegalCases(params: LegalCaseQueryParams = {}) {
  return useApiPaginatedQuery<LegalCase>(
    queryKeys.legal.list(params),
    `/legal-cases`,
    { params }
  );
}

export function useLegalCase(id: string | undefined) {
  return useApiQuery<LegalCase>(
    queryKeys.legal.detail(id!),
    `/legal-cases/${id}`,
    { enabled: !!id }
  );
}

export function useCreateLegalCase() {
  return useApiMutation<LegalCase, CreateLegalCaseDto>({
    method: 'POST',
    endpoint: '/legal-cases',
    invalidateKeys: [queryKeys.legal.all],
    successMessage: 'Legal case created',
  });
}

export function useAddLegalEvent() {
  return useApiMutation<LegalEvent, { caseId: string; event: CreateLegalEventDto }>({
    method: 'POST',
    endpoint: (vars) => `/legal-cases/${vars.caseId}/events`,
    invalidateKeys: [queryKeys.legal.all],
    successMessage: 'Event added to case',
  });
}
```

---

## 33.8 QUERY KEYS

```typescript
// lib/query/index.ts (extend)

legal: {
  all: ['legal-cases'] as const,
  list: (params: LegalCaseQueryParams) => ['legal-cases', 'list', params] as const,
  detail: (id: string) => ['legal-cases', 'detail', id] as const,
  timeline: (id: string) => ['legal-cases', 'timeline', id] as const,
  byTenancy: (tenancyId: string) => ['legal-cases', 'tenancy', tenancyId] as const,
},

adminPM: {
  stats: () => ['admin-pm', 'stats'] as const,
  tenancies: (params: any) => ['admin-pm', 'tenancies', params] as const,
  bills: (params: any) => ['admin-pm', 'bills', params] as const,
  payouts: (params: any) => ['admin-pm', 'payouts', params] as const,
  maintenance: (params: any) => ['admin-pm', 'maintenance', params] as const,
  claims: (params: any) => ['admin-pm', 'claims', params] as const,
  companies: (params: any) => ['admin-pm', 'companies', params] as const,
},
```

---

## 33.9 FINAL CHECKLIST

Before marking PM frontend complete, ensure:

### Code Quality
- [ ] All components use TypeScript strict mode
- [ ] All forms have Zod validation
- [ ] All API calls use the hook patterns from Part 1
- [ ] Error handling follows Part 1 patterns
- [ ] Loading states use skeleton components

### Documentation
- [ ] All hooks documented in API-REGISTRY.md
- [ ] PROGRESS.md updated with session completion
- [ ] Components have JSDoc comments

### Testing
- [ ] Component tests for new PM components
- [ ] Integration tests for PM flows (tenancy creation, payment, etc.)
- [ ] MSW handlers for all PM endpoints

### Accessibility
- [ ] All forms have proper labels
- [ ] Keyboard navigation works
- [ ] Screen reader support (ARIA)
- [ ] Focus management in dialogs/modals

### Routes
- [ ] All routes protected by appropriate role guards
- [ ] Breadcrumbs updated for PM routes
- [ ] Navigation updated for all portals
