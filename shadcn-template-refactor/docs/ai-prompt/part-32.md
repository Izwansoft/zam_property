# FRONTEND (WEB) — PART 32 — CLAIMS, COMPANIES, AGENTS & AFFILIATES UI

> **Sessions:** 7.6, 8.1-8.5  
> **Covers:** Claim management, company registration, agent & affiliate portals

All rules from WEB PART 0–31 apply fully.

---

## 32.1 CLAIM MODULE

### Module Structure
```
modules/claim/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-claims.ts
│   ├── use-claim.ts
│   └── use-claim-mutations.ts
├── components/
│   ├── index.ts
│   ├── claim-form.tsx
│   ├── claim-card.tsx
│   ├── claim-detail.tsx
│   ├── claim-status-badge.tsx
│   ├── claim-evidence-uploader.tsx
│   └── claim-action-dialog.tsx
└── index.ts
```

### Claim Types

```typescript
// modules/claim/types/index.ts

export interface Claim {
  id: string;
  claimNumber: string;
  tenancyId: string;
  depositId?: string;
  submittedBy: string;
  submittedRole: 'OWNER' | 'OCCUPANT';
  type: ClaimType;
  status: ClaimStatus;
  title: string;
  description: string;
  claimAmount: number;
  approvedAmount?: number;
  evidence?: ClaimEvidence[];
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ClaimType {
  PROPERTY_DAMAGE = 'PROPERTY_DAMAGE',
  UNPAID_RENT = 'UNPAID_RENT',
  DEPOSIT_DISPUTE = 'DEPOSIT_DISPUTE',
  BREACH_OF_CONTRACT = 'BREACH_OF_CONTRACT',
  OTHER = 'OTHER',
}

export enum ClaimStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  REJECTED = 'REJECTED',
  SETTLED = 'SETTLED',
  ESCALATED = 'ESCALATED',
}

export interface ClaimEvidence {
  id: string;
  claimId: string;
  type: EvidenceType;
  fileUrl: string;
  fileName: string;
  description?: string;
  uploadedAt: Date;
}

export enum EvidenceType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  RECEIPT = 'RECEIPT',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}
```

---

## 32.2 CLAIM BACKEND ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/claims` | List claims |
| GET | `/api/v1/claims/:id` | Get claim detail |
| POST | `/api/v1/claims` | Submit claim |
| PATCH | `/api/v1/claims/:id` | Update claim |
| POST | `/api/v1/claims/:id/evidence` | Add evidence |
| POST | `/api/v1/claims/:id/approve` | Approve claim |
| POST | `/api/v1/claims/:id/reject` | Reject claim |
| POST | `/api/v1/claims/:id/settle` | Settle claim |

---

## 32.3 CLAIM FORM

```tsx
// modules/claim/components/claim-form.tsx

const claimSchema = z.object({
  type: z.nativeEnum(ClaimType),
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(2000),
  claimAmount: z.number().positive(),
  depositId: z.string().optional(),
});

interface ClaimFormProps {
  tenancyId: string;
  submitterRole: 'OWNER' | 'OCCUPANT';
  onSuccess: (claim: Claim) => void;
}

export function ClaimForm({ tenancyId, submitterRole, onSuccess }: ClaimFormProps) {
  const form = useForm<z.infer<typeof claimSchema>>({
    resolver: zodResolver(claimSchema),
  });

  const [evidence, setEvidence] = useState<string[]>([]);
  const { data: deposits } = useDepositsByTenancy(tenancyId);
  const createClaim = useCreateClaim();

  const onSubmit = async (data: z.infer<typeof claimSchema>) => {
    const claim = await createClaim.mutateAsync({
      tenancyId,
      submittedRole: submitterRole,
      evidence,
      ...data,
    });
    onSuccess(claim);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Claim Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Claim Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(ClaimType).map(type => (
                    <SelectItem key={type} value={type}>
                      {claimTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Link to Deposit (if applicable) */}
        {form.watch('type') === ClaimType.DEPOSIT_DISPUTE && deposits?.items.length > 0 && (
          <FormField
            control={form.control}
            name="depositId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Deposit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deposit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {deposits.items.map(deposit => (
                      <SelectItem key={deposit.id} value={deposit.id}>
                        {depositTypeLabel(deposit.type)} - {formatCurrency(deposit.amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Claim Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Brief summary of the claim" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={6} placeholder="Detailed description..." />
              </FormControl>
              <FormDescription>
                Provide a detailed account of the issue, including dates, amounts, and any relevant context.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Claim Amount */}
        <FormField
          control={form.control}
          name="claimAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Claim Amount (MYR)</FormLabel>
              <FormControl>
                <CurrencyInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Evidence Upload */}
        <ClaimEvidenceUploader
          onUpload={(ids) => setEvidence(prev => [...prev, ...ids])}
          onRemove={(id) => setEvidence(prev => prev.filter(e => e !== id))}
        />

        <Button type="submit" disabled={createClaim.isPending}>
          {createClaim.isPending ? 'Submitting...' : 'Submit Claim'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 32.4 COMPANY MODULE

### Module Structure
```
modules/company/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-companies.ts
│   ├── use-company.ts
│   ├── use-my-company.ts
│   └── use-company-mutations.ts
├── components/
│   ├── index.ts
│   ├── company-registration-wizard.tsx
│   ├── company-card.tsx
│   ├── company-dashboard.tsx
│   ├── company-settings.tsx
│   └── company-stats-card.tsx
└── index.ts
```

### Company Types

```typescript
// modules/company/types/index.ts

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  registrationNumber: string;
  type: CompanyType;
  status: CompanyStatus;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logoUrl?: string;
  documents?: CompanyDocument[];
  agents?: Agent[];
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum CompanyType {
  REAL_ESTATE_AGENCY = 'REAL_ESTATE_AGENCY',
  PROPERTY_MANAGEMENT = 'PROPERTY_MANAGEMENT',
  DEVELOPER = 'DEVELOPER',
  OTHER = 'OTHER',
}

export enum CompanyStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export interface CompanyDocument {
  id: string;
  type: 'SSM_CERTIFICATE' | 'LICENSE' | 'TAX_REGISTRATION' | 'OTHER';
  fileUrl: string;
  fileName: string;
  verified: boolean;
}
```

---

## 32.5 COMPANY REGISTRATION WIZARD

```tsx
// modules/company/components/company-registration-wizard.tsx

const steps = [
  { id: 'basic', title: 'Company Info' },
  { id: 'contact', title: 'Contact Details' },
  { id: 'documents', title: 'Documents' },
  { id: 'review', title: 'Review' },
];

export function CompanyRegistrationWizard({ onComplete }: { onComplete: (company: Company) => void }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<CreateCompanyDto>>({});
  const [documents, setDocuments] = useState<string[]>([]);

  const registerCompany = useRegisterCompany();

  const handleNext = (stepData: Partial<CreateCompanyDto>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    const company = await registerCompany.mutateAsync({
      ...formData as CreateCompanyDto,
      documents,
    });
    onComplete(company);
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <WizardProgress steps={steps} currentStep={step} />

      {/* Step Content */}
      {step === 0 && (
        <CompanyBasicInfoStep
          defaultValues={formData}
          onNext={handleNext}
        />
      )}
      {step === 1 && (
        <CompanyContactStep
          defaultValues={formData}
          onNext={handleNext}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <CompanyDocumentsStep
          documents={documents}
          onDocumentsChange={setDocuments}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <CompanyReviewStep
          data={formData}
          documents={documents}
          onSubmit={handleSubmit}
          onBack={() => setStep(2)}
          isSubmitting={registerCompany.isPending}
        />
      )}
    </div>
  );
}
```

---

## 32.6 AGENT MODULE

### Module Structure
```
modules/agent/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-agents.ts
│   ├── use-agent.ts
│   ├── use-my-agent-profile.ts
│   └── use-agent-mutations.ts
├── components/
│   ├── index.ts
│   ├── agent-card.tsx
│   ├── agent-list.tsx
│   ├── agent-dashboard.tsx
│   ├── agent-commission-table.tsx
│   └── agent-invite-form.tsx
└── index.ts
```

### Agent Types

```typescript
// modules/agent/types/index.ts

export interface Agent {
  id: string;
  companyId: string;
  userId: string;
  renNumber?: string;          // REN registration number
  status: AgentStatus;
  joinedAt: Date;
  commissionRate: number;
  totalCommission: number;
  totalDeals: number;
  user?: User;
  company?: Company;
  createdAt: Date;
}

export enum AgentStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export interface AgentCommission {
  id: string;
  agentId: string;
  transactionId: string;
  amount: number;
  rate: number;
  status: CommissionStatus;
  paidAt?: Date;
  createdAt: Date;
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  WITHHELD = 'WITHHELD',
}
```

---

## 32.7 AGENT DASHBOARD

```tsx
// modules/agent/components/agent-dashboard.tsx

export function AgentDashboard() {
  const { data: profile } = useMyAgentProfile();
  const { data: stats } = useAgentStats(profile?.id);
  const { data: commissions } = useAgentCommissions(profile?.id);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.user?.avatarUrl} />
            <AvatarFallback>{profile?.user?.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{profile?.user?.fullName}</h2>
            <p className="text-muted-foreground">{profile?.company?.name}</p>
            {profile?.renNumber && (
              <Badge variant="outline">REN: {profile.renNumber}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Commission"
          value={formatCurrency(stats?.totalCommission || 0)}
          icon={DollarSign}
        />
        <StatsCard
          title="This Month"
          value={formatCurrency(stats?.thisMonth || 0)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Deals"
          value={stats?.totalDeals || 0}
          icon={Handshake}
        />
        <StatsCard
          title="Pending Commission"
          value={formatCurrency(stats?.pending || 0)}
          icon={Clock}
        />
      </div>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentCommissionTable commissions={commissions?.items.slice(0, 5) || []} />
          <Button variant="link" asChild className="mt-2">
            <Link href="/dashboard/agent/commissions">View All →</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 32.8 AFFILIATE MODULE

### Module Structure
```
modules/affiliate/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-affiliate-profile.ts
│   ├── use-affiliate-referrals.ts
│   └── use-affiliate-mutations.ts
├── components/
│   ├── index.ts
│   ├── affiliate-dashboard.tsx
│   ├── referral-link-card.tsx
│   ├── referral-stats.tsx
│   └── affiliate-payout-history.tsx
└── index.ts
```

### Affiliate Types

```typescript
// modules/affiliate/types/index.ts

export interface AffiliateProfile {
  id: string;
  userId: string;
  referralCode: string;
  referralLink: string;
  commissionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  status: AffiliateStatus;
  createdAt: Date;
}

export enum AffiliateStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_PAYOUT = 'PENDING_PAYOUT',
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referredUserId: string;
  referredUserName: string;
  status: ReferralStatus;
  conversionDate?: Date;
  commissionEarned: number;
  createdAt: Date;
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  CONVERTED = 'CONVERTED',
  CHURNED = 'CHURNED',
}
```

---

## 32.9 AFFILIATE DASHBOARD

```tsx
// modules/affiliate/components/affiliate-dashboard.tsx

export function AffiliateDashboard() {
  const { data: profile } = useAffiliateProfile();
  const { data: referrals } = useAffiliateReferrals();

  const copyReferralLink = () => {
    navigator.clipboard.writeText(profile?.referralLink || '');
    toast.success('Referral link copied!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate Dashboard"
        description="Track your referrals and earnings"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Earnings"
          value={formatCurrency(profile?.totalEarnings || 0)}
          icon={DollarSign}
        />
        <StatsCard
          title="Pending Payout"
          value={formatCurrency(profile?.pendingEarnings || 0)}
          icon={Wallet}
        />
        <StatsCard
          title="Total Referrals"
          value={profile?.totalReferrals || 0}
          icon={Users}
        />
        <StatsCard
          title="Active Users"
          value={profile?.activeReferrals || 0}
          icon={UserCheck}
        />
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link to earn {(profile?.commissionRate || 0) * 100}% commission on referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              readOnly
              value={profile?.referralLink || ''}
              className="font-mono text-sm"
            />
            <Button onClick={copyReferralLink}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Referral Code: <code className="bg-muted px-1 rounded">{profile?.referralCode}</code>
          </p>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals?.items.map(referral => (
                <TableRow key={referral.id}>
                  <TableCell>{referral.referredUserName}</TableCell>
                  <TableCell>
                    <ReferralStatusBadge status={referral.status} />
                  </TableCell>
                  <TableCell>{formatDate(referral.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(referral.commissionEarned)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 32.10 HOOKS SPECIFICATION

```typescript
// modules/claim/hooks/
export function useClaims(params: ClaimQueryParams = {}) {
  return useApiPaginatedQuery<Claim>(queryKeys.claims.list(params), `/claims`, { params });
}

export function useClaim(id: string | undefined) {
  return useApiQuery<Claim>(queryKeys.claims.detail(id!), `/claims/${id}`, { enabled: !!id });
}

export function useCreateClaim() {
  return useApiMutation<Claim, CreateClaimDto>({
    method: 'POST',
    endpoint: '/claims',
    invalidateKeys: [queryKeys.claims.all],
    successMessage: 'Claim submitted successfully',
  });
}

// modules/company/hooks/
export function useMyCompany() {
  return useApiQuery<Company>(queryKeys.companies.my(), `/companies/me`);
}

export function useRegisterCompany() {
  return useApiMutation<Company, CreateCompanyDto>({
    method: 'POST',
    endpoint: '/companies',
    invalidateKeys: [queryKeys.companies.all],
    successMessage: 'Company registered successfully',
  });
}

// modules/agent/hooks/
export function useMyAgentProfile() {
  return useApiQuery<Agent>(queryKeys.agents.myProfile(), `/agents/me`);
}

export function useAgentCommissions(agentId: string | undefined) {
  return useApiPaginatedQuery<AgentCommission>(
    queryKeys.agents.commissions(agentId!),
    `/agents/${agentId}/commissions`,
    { enabled: !!agentId }
  );
}

// modules/affiliate/hooks/
export function useAffiliateProfile() {
  return useApiQuery<AffiliateProfile>(queryKeys.affiliates.profile(), `/affiliates/me`);
}

export function useAffiliateReferrals() {
  return useApiPaginatedQuery<AffiliateReferral>(
    queryKeys.affiliates.referrals(),
    `/affiliates/me/referrals`
  );
}
```

---

## 32.11 QUERY KEYS

```typescript
// lib/query/index.ts (extend)

claims: {
  all: ['claims'] as const,
  list: (params: ClaimQueryParams) => ['claims', 'list', params] as const,
  detail: (id: string) => ['claims', 'detail', id] as const,
  byTenancy: (tenancyId: string) => ['claims', 'tenancy', tenancyId] as const,
},

companies: {
  all: ['companies'] as const,
  list: (params: any) => ['companies', 'list', params] as const,
  detail: (id: string) => ['companies', 'detail', id] as const,
  my: () => ['companies', 'my'] as const,
  agents: (companyId: string) => ['companies', 'agents', companyId] as const,
},

agents: {
  all: ['agents'] as const,
  list: (params: any) => ['agents', 'list', params] as const,
  detail: (id: string) => ['agents', 'detail', id] as const,
  myProfile: () => ['agents', 'my'] as const,
  commissions: (agentId: string) => ['agents', 'commissions', agentId] as const,
  stats: (agentId: string) => ['agents', 'stats', agentId] as const,
},

affiliates: {
  profile: () => ['affiliates', 'profile'] as const,
  referrals: () => ['affiliates', 'referrals'] as const,
  payouts: () => ['affiliates', 'payouts'] as const,
},
```
