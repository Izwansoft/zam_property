# FRONTEND (WEB) — PART 30 — OWNER DASHBOARD & PAYOUTS UI

> **Sessions:** 6.5-6.8  
> **Covers:** Owner billing dashboard, payout management, statements

All rules from WEB PART 0–29 apply fully.

---

## 30.1 OWNER BILLING DASHBOARD

### Route Structure
```
app/dashboard/(auth)/account/billing/
├── page.tsx            → OwnerBillingDashboard
├── receivables/
│   └── page.tsx       → ReceivablesListPage
└── payouts/
    ├── page.tsx       → PayoutListPage
    └── [id]/
        └── page.tsx   → PayoutDetailPage
```

### Dashboard Layout
```tsx
export default function OwnerBillingDashboard() {
  const { data: stats } = useOwnerBillingStats();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Billing & Payouts" 
        description="Manage your rental income"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Receivables"
          value={formatCurrency(stats?.totalReceivables || 0)}
          description="Outstanding rent from tenants"
          icon={DollarSign}
        />
        <StatsCard
          title="Collected This Month"
          value={formatCurrency(stats?.collectedThisMonth || 0)}
          description={`${stats?.paymentsThisMonth || 0} payments`}
          icon={TrendingUp}
          trend={stats?.collectionTrend}
        />
        <StatsCard
          title="Pending Payout"
          value={formatCurrency(stats?.pendingPayout || 0)}
          description="Next payout cycle"
          icon={Wallet}
        />
        <StatsCard
          title="Total Paid Out"
          value={formatCurrency(stats?.totalPaidOut || 0)}
          description="Lifetime payouts"
          icon={CheckCircle}
        />
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentPaymentsList limit={5} />
            <Button variant="link" asChild className="mt-2">
              <Link href="/dashboard/account/billing/receivables">
                View All Receivables →
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <NextPayoutSummary />
            <Button variant="link" asChild className="mt-2">
              <Link href="/dashboard/account/billing/payouts">
                View Payout History →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Receivables by Property */}
      <Card>
        <CardHeader>
          <CardTitle>Receivables by Property</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyReceivablesChart data={stats?.byProperty || []} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 30.2 PAYOUT MODULE

### Module Structure
```
modules/payout/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-payouts.ts
│   ├── use-payout.ts
│   └── use-payout-statement.ts
├── components/
│   ├── index.ts
│   ├── payout-card.tsx
│   ├── payout-list.tsx
│   ├── payout-detail.tsx
│   ├── payout-status-badge.tsx
│   ├── payout-breakdown.tsx
│   └── payout-statement-viewer.tsx
└── index.ts
```

### Payout Types

```typescript
// modules/payout/types/index.ts

export interface Payout {
  id: string;
  ownerId: string;
  period: string;              // e.g., "2024-01"
  status: PayoutStatus;
  grossAmount: number;
  deductions: PayoutDeduction[];
  netAmount: number;
  processedAt?: Date;
  completedAt?: Date;
  bankAccount?: string;        // Masked: ****1234
  reference?: string;
  statementUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Breakdown
  rentCollected: number;
  platformFee: number;
  maintenanceCosts: number;
  otherDeductions: number;
  items?: PayoutItem[];
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ON_HOLD = 'ON_HOLD',
}

export interface PayoutItem {
  id: string;
  payoutId: string;
  tenancyId: string;
  propertyAddress: string;
  rentAmount: number;
  deductions: number;
  netAmount: number;
}

export interface PayoutDeduction {
  type: DeductionType;
  description: string;
  amount: number;
}

export enum DeductionType {
  PLATFORM_FEE = 'PLATFORM_FEE',
  MAINTENANCE = 'MAINTENANCE',
  MANAGEMENT_FEE = 'MANAGEMENT_FEE',
  TAX_WITHHOLDING = 'TAX_WITHHOLDING',
  OTHER = 'OTHER',
}
```

---

## 30.3 PAYOUT BACKEND ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/payouts` | List payouts |
| GET | `/api/v1/payouts/:id` | Get payout detail |
| GET | `/api/v1/payouts/:id/statement` | Get statement PDF |
| GET | `/api/v1/payouts/pending` | Get pending payout info |
| GET | `/api/v1/payouts/summary` | Get payout statistics |

---

## 30.4 PAYOUT LIST PAGE

```tsx
export default function PayoutListPage() {
  const [status, setStatus] = useState<PayoutStatus | 'all'>('all');
  const { data, isLoading } = usePayouts({
    status: status === 'all' ? undefined : status,
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payout History" 
        description="View your rental income payouts"
      />

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payouts</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payout List */}
      <div className="space-y-4">
        {data?.items.map(payout => (
          <PayoutCard key={payout.id} payout={payout} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination {...data?.pagination} />
    </div>
  );
}
```

---

## 30.5 PAYOUT CARD

```tsx
interface PayoutCardProps {
  payout: Payout;
}

export function PayoutCard({ payout }: PayoutCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{formatPeriod(payout.period)}</h3>
              <PayoutStatusBadge status={payout.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {payout.items?.length || 0} properties
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Net Payout</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(payout.netAmount)}
            </p>
          </div>
        </div>

        {/* Quick Breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Rent Collected</p>
            <p className="font-medium">{formatCurrency(payout.rentCollected)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deductions</p>
            <p className="font-medium text-red-600">
              -{formatCurrency(payout.grossAmount - payout.netAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {payout.status === 'COMPLETED' ? 'Paid On' : 'Expected'}
            </p>
            <p className="font-medium">
              {formatDate(payout.completedAt || payout.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/account/billing/payouts/${payout.id}`}>
              View Details
            </Link>
          </Button>
          {payout.statementUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={payout.statementUrl} download>
                <Download className="mr-2 h-4 w-4" /> Statement
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 30.6 PAYOUT DETAIL PAGE

```tsx
export default function PayoutDetailPage({ params }: { params: { id: string } }) {
  const { data: payout, isLoading } = usePayout(params.id);

  if (isLoading) return <PayoutDetailSkeleton />;
  if (!payout) return <NotFound />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Payout - ${formatPeriod(payout.period)}`}
        actions={
          payout.statementUrl && (
            <Button asChild>
              <a href={payout.statementUrl} download>
                <Download className="mr-2 h-4 w-4" /> Download Statement
              </a>
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span>Gross Rent Collected</span>
                  <span>{formatCurrency(payout.grossAmount)}</span>
                </div>

                {/* Deductions */}
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground">Deductions</p>
                  {payout.deductions.map((deduction, i) => (
                    <div key={i} className="flex justify-between text-red-600">
                      <span>{deduction.description}</span>
                      <span>-{formatCurrency(deduction.amount)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between text-xl font-bold">
                  <span>Net Payout</span>
                  <span className="text-green-600">{formatCurrency(payout.netAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown by Property</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Rent</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payout.items?.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.propertyAddress}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.rentAmount)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(item.deductions)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.netAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Status" value={<PayoutStatusBadge status={payout.status} />} />
              <InfoRow label="Period" value={formatPeriod(payout.period)} />
              <InfoRow label="Bank Account" value={payout.bankAccount || 'N/A'} />
              {payout.reference && (
                <InfoRow label="Reference" value={payout.reference} />
              )}
              {payout.completedAt && (
                <InfoRow label="Completed" value={formatDateTime(payout.completedAt)} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

## 30.7 HOOKS SPECIFICATION

```typescript
// modules/payout/hooks/use-payouts.ts

export function usePayouts(params: PayoutQueryParams = {}) {
  return useApiPaginatedQuery<Payout>(
    queryKeys.payouts.list(params),
    `/payouts`,
    { params, staleTime: 60_000 }
  );
}

export function usePayout(id: string | undefined) {
  return useApiQuery<Payout>(
    queryKeys.payouts.detail(id!),
    `/payouts/${id}`,
    { enabled: !!id }
  );
}

export function usePendingPayout() {
  return useApiQuery<PendingPayoutInfo>(
    queryKeys.payouts.pending(),
    `/payouts/pending`
  );
}

export function useOwnerBillingStats() {
  return useApiQuery<OwnerBillingStats>(
    queryKeys.ownerBilling.stats(),
    `/payouts/summary`
  );
}
```

---

## 30.8 QUERY KEYS

```typescript
// lib/query/index.ts (extend)

payouts: {
  all: ['payouts'] as const,
  list: (params: PayoutQueryParams) => ['payouts', 'list', params] as const,
  detail: (id: string) => ['payouts', 'detail', id] as const,
  pending: () => ['payouts', 'pending'] as const,
  statement: (id: string) => ['payouts', 'statement', id] as const,
},

ownerBilling: {
  stats: () => ['owner-billing', 'stats'] as const,
  receivables: (params: any) => ['owner-billing', 'receivables', params] as const,
},
```
