# FRONTEND (WEB) — PART 29 — BILLING, PAYMENTS & RECEIPTS UI

> **Sessions:** 6.1-6.4  
> **Covers:** Bills, payments, receipts, payment gateway integration

All rules from WEB PART 0–28 apply fully.

---

## 29.1 BILLING MODULE STRUCTURE

```
modules/billing/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-bills.ts
│   ├── use-bill.ts
│   ├── use-bill-mutations.ts
│   ├── use-payments.ts
│   └── use-payment-mutations.ts
├── components/
│   ├── index.ts
│   ├── bill-card.tsx
│   ├── bill-list.tsx
│   ├── bill-detail.tsx
│   ├── bill-line-items.tsx
│   ├── bill-status-badge.tsx
│   ├── payment-form.tsx
│   ├── payment-method-select.tsx
│   ├── receipt-viewer.tsx
│   └── payment-history.tsx
└── index.ts
```

---

## 29.2 BILL TYPES

```typescript
// modules/billing/types/index.ts

export interface Bill {
  id: string;
  tenancyId: string;
  billNumber: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  status: BillStatus;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  balance: number;
  issuedAt: Date;
  paidAt?: Date;
  lineItems?: BillLineItem[];
  payments?: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BillLineItem {
  id: string;
  billId: string;
  description: string;
  type: BillItemType;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export enum BillStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

export enum BillItemType {
  RENT = 'RENT',
  UTILITY_ELECTRIC = 'UTILITY_ELECTRIC',
  UTILITY_WATER = 'UTILITY_WATER',
  UTILITY_GAS = 'UTILITY_GAS',
  MAINTENANCE = 'MAINTENANCE',
  SERVICE_FEE = 'SERVICE_FEE',
  LATE_FEE = 'LATE_FEE',
  OTHER = 'OTHER',
}

export interface Payment {
  id: string;
  billId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  status: PaymentStatus;
  processedAt?: Date;
  receipt?: PaymentReceipt;
  createdAt: Date;
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  FPX = 'FPX',
  EWALLET = 'EWALLET',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentReceipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  pdfUrl?: string;
  issuedAt: Date;
}
```

---

## 29.3 BILL BACKEND ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/bills` | List bills |
| GET | `/api/v1/bills/:id` | Get bill detail |
| POST | `/api/v1/bills` | Create bill (owner/admin) |
| PATCH | `/api/v1/bills/:id` | Update bill |
| POST | `/api/v1/bills/:id/issue` | Issue bill |
| POST | `/api/v1/bills/:id/void` | Void bill |
| GET | `/api/v1/bills/:id/pdf` | Get bill PDF |
| GET | `/api/v1/payments` | List payments |
| GET | `/api/v1/payments/:id` | Get payment detail |
| POST | `/api/v1/payments` | Create payment |
| GET | `/api/v1/payments/:id/receipt` | Get receipt PDF |
| GET | `/api/v1/rent-payments` | List rent payments |

---

## 29.4 BILL LIST PAGE

### Route
```
app/dashboard/(auth)/occupant/bills/
├── page.tsx            → BillListPage
├── loading.tsx         → BillListSkeleton
└── [id]/
    ├── page.tsx        → BillDetailPage
    └── pay/
        └── page.tsx    → PaymentPage
```

### BillListPage
```tsx
export default function BillListPage() {
  const [status, setStatus] = useState<BillStatus | 'all'>('all');
  const { data, isLoading } = useBills({ 
    status: status === 'all' ? undefined : status 
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Bills" 
        description="View and pay your bills"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <BillSummaryCard 
          title="Outstanding" 
          amount={data?.summary?.outstanding || 0}
          variant="warning"
        />
        <BillSummaryCard 
          title="Due This Month" 
          amount={data?.summary?.dueThisMonth || 0}
          variant="default"
        />
        <BillSummaryCard 
          title="Overdue" 
          amount={data?.summary?.overdue || 0}
          variant="destructive"
        />
      </div>

      {/* Filter Tabs */}
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ISSUED">Pending</TabsTrigger>
          <TabsTrigger value="OVERDUE">Overdue</TabsTrigger>
          <TabsTrigger value="PAID">Paid</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bill List */}
      <BillList bills={data?.items || []} isLoading={isLoading} />
    </div>
  );
}
```

---

## 29.5 BILL CARD COMPONENT

```tsx
interface BillCardProps {
  bill: Bill;
  onClick?: () => void;
}

export function BillCard({ bill, onClick }: BillCardProps) {
  const isOverdue = bill.status === 'OVERDUE';
  const isPending = ['ISSUED', 'PARTIALLY_PAID'].includes(bill.status);

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isOverdue && "border-red-500"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{bill.billNumber}</CardTitle>
          <BillStatusBadge status={bill.status} />
        </div>
        <CardDescription>
          {formatDate(bill.periodStart)} - {formatDate(bill.periodEnd)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-2xl font-bold">{formatCurrency(bill.balance)}</p>
          </div>
          {isPending && (
            <Button size="sm">Pay Now</Button>
          )}
        </div>
        
        {isOverdue && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Overdue by {differenceInDays(new Date(), bill.dueDate)} days
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 29.6 BILL DETAIL PAGE

```tsx
export default function BillDetailPage({ params }: { params: { id: string } }) {
  const { data: bill, isLoading } = useBill(params.id);

  if (isLoading) return <BillDetailSkeleton />;
  if (!bill) return <NotFound />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Bill ${bill.billNumber}`}
        description={`Due: ${formatDate(bill.dueDate)}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={`/api/v1/bills/${bill.id}/pdf`} download>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </a>
            </Button>
            {bill.balance > 0 && (
              <Button asChild>
                <Link href={`/dashboard/occupant/bills/${bill.id}/pay`}>
                  Pay {formatCurrency(bill.balance)}
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
            </CardHeader>
            <CardContent>
              <BillLineItems items={bill.lineItems || []} />
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(bill.subtotal)}</span>
                </div>
                {bill.tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>{formatCurrency(bill.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(bill.total)}</span>
                </div>
                {bill.paidAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span>-{formatCurrency(bill.paidAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Balance Due</span>
                  <span className={bill.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(bill.balance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {bill.payments && bill.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentHistory payments={bill.payments} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Status" value={<BillStatusBadge status={bill.status} />} />
              <InfoRow label="Bill Number" value={bill.billNumber} />
              <InfoRow label="Period" value={`${formatDate(bill.periodStart)} - ${formatDate(bill.periodEnd)}`} />
              <InfoRow label="Issue Date" value={formatDate(bill.issuedAt)} />
              <InfoRow label="Due Date" value={formatDate(bill.dueDate)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

## 29.7 PAYMENT FORM

```tsx
// modules/billing/components/payment-form.tsx

interface PaymentFormProps {
  bill: Bill;
  onSuccess: () => void;
}

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
});

export function PaymentForm({ bill, onSuccess }: PaymentFormProps) {
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: bill.balance,
      method: PaymentMethod.FPX,
    },
  });

  const createPayment = useCreatePayment();

  const onSubmit = async (data: z.infer<typeof paymentSchema>) => {
    await createPayment.mutateAsync({
      billId: bill.id,
      ...data,
    });
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <CurrencyInput {...field} max={bill.balance} />
              </FormControl>
              <FormDescription>
                Maximum: {formatCurrency(bill.balance)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Method */}
        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <FormControl>
                <PaymentMethodSelect {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reference (for bank transfer) */}
        {form.watch('method') === PaymentMethod.BANK_TRANSFER && (
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer Reference</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Transaction ID" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={createPayment.isPending}
        >
          {createPayment.isPending ? 'Processing...' : `Pay ${formatCurrency(form.watch('amount'))}`}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 29.8 PAYMENT METHOD SELECT

```tsx
// modules/billing/components/payment-method-select.tsx

const paymentMethods = [
  { value: PaymentMethod.FPX, label: 'FPX Online Banking', icon: Building2 },
  { value: PaymentMethod.CARD, label: 'Credit/Debit Card', icon: CreditCard },
  { value: PaymentMethod.EWALLET, label: 'E-Wallet', icon: Wallet },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: Banknote },
];

interface PaymentMethodSelectProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export function PaymentMethodSelect({ value, onChange }: PaymentMethodSelectProps) {
  return (
    <RadioGroup value={value} onValueChange={onChange}>
      <div className="grid gap-3">
        {paymentMethods.map(method => (
          <Label
            key={method.value}
            className={cn(
              "flex items-center gap-3 p-4 border rounded-lg cursor-pointer",
              value === method.value && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value={method.value} />
            <method.icon className="h-5 w-5" />
            <span>{method.label}</span>
          </Label>
        ))}
      </div>
    </RadioGroup>
  );
}
```

---

## 29.9 RECEIPT VIEWER

```tsx
// modules/billing/components/receipt-viewer.tsx

interface ReceiptViewerProps {
  payment: Payment;
}

export function ReceiptViewer({ payment }: ReceiptViewerProps) {
  const { data: receipt } = usePaymentReceipt(payment.id);

  if (!receipt) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Receipt className="mr-2 h-4 w-4" /> View Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogDescription>
            Receipt #{receipt.receiptNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Content */}
          <div className="border rounded-lg p-6 bg-white">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">PAYMENT RECEIPT</h2>
              <p className="text-muted-foreground">{receipt.receiptNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p>{formatDateTime(payment.processedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p>{paymentMethodLabel(payment.method)}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center">
              <span className="text-lg">Amount Paid</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            {receipt.pdfUrl && (
              <Button asChild>
                <a href={receipt.pdfUrl} download>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 29.10 HOOKS SPECIFICATION

```typescript
// modules/billing/hooks/use-bills.ts

export function useBills(params: BillQueryParams = {}) {
  return useApiPaginatedQuery<Bill>(
    queryKeys.bills.list(params),
    `/bills`,
    { params, staleTime: 30_000 }
  );
}

export function useBill(id: string | undefined) {
  return useApiQuery<Bill>(
    queryKeys.bills.detail(id!),
    `/bills/${id}`,
    { enabled: !!id, staleTime: 60_000 }
  );
}

// modules/billing/hooks/use-payment-mutations.ts

export function useCreatePayment() {
  return useApiMutation<Payment, CreatePaymentDto>({
    method: 'POST',
    endpoint: '/payments',
    invalidateKeys: [queryKeys.bills.all, queryKeys.payments.all],
    successMessage: 'Payment submitted successfully',
  });
}

export function usePaymentReceipt(paymentId: string) {
  return useApiQuery<PaymentReceipt>(
    queryKeys.payments.receipt(paymentId),
    `/payments/${paymentId}/receipt`,
    { enabled: !!paymentId }
  );
}
```

---

## 29.11 QUERY KEYS

```typescript
// lib/query/index.ts (extend)

bills: {
  all: ['bills'] as const,
  list: (params: BillQueryParams) => ['bills', 'list', params] as const,
  detail: (id: string) => ['bills', 'detail', id] as const,
  byTenancy: (tenancyId: string) => ['bills', 'tenancy', tenancyId] as const,
  summary: () => ['bills', 'summary'] as const,
},

payments: {
  all: ['payments'] as const,
  list: (params: PaymentQueryParams) => ['payments', 'list', params] as const,
  detail: (id: string) => ['payments', 'detail', id] as const,
  receipt: (paymentId: string) => ['payments', 'receipt', paymentId] as const,
  byBill: (billId: string) => ['payments', 'bill', billId] as const,
},
```
