# FRONTEND (WEB) — PART 28 — CONTRACTS, DEPOSITS & E-SIGNATURE UI

> **Sessions:** 5.6-5.8  
> **Covers:** Contract viewer, e-signature, deposit tracking

All rules from WEB PART 0–27 apply fully.

---

## 28.1 CONTRACT MODULE

### Module Structure
```
modules/contract/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-contract.ts
│   ├── use-contracts.ts
│   └── use-sign-contract.ts
├── components/
│   ├── index.ts
│   ├── contract-viewer.tsx
│   ├── contract-card.tsx
│   ├── contract-status-badge.tsx
│   ├── e-signature-dialog.tsx
│   └── signature-pad.tsx
└── index.ts
```

### Contract Types

```typescript
// modules/contract/types/index.ts

export interface Contract {
  id: string;
  tenancyId: string;
  templateId?: string;
  status: ContractStatus;
  content: string;          // HTML content
  pdfUrl?: string;          // Generated PDF URL
  signedAt?: Date;
  signedByOccupant?: string;
  signedByOwner?: string;
  ownerSignature?: string;  // Base64 or URL
  occupantSignature?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_OCCUPANT = 'PENDING_OCCUPANT',
  PENDING_OWNER = 'PENDING_OWNER',
  SIGNED = 'SIGNED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;          // HTML with {{placeholders}}
  verticalId?: string;
  isDefault: boolean;
  createdAt: Date;
}
```

---

## 28.2 CONTRACT BACKEND ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/contracts` | List contracts (by tenancy or all) |
| GET | `/api/v1/contracts/:id` | Get contract detail |
| POST | `/api/v1/contracts` | Create contract from template |
| POST | `/api/v1/contracts/:id/send` | Send contract for signing |
| POST | `/api/v1/contracts/:id/sign` | Submit signature |
| GET | `/api/v1/contracts/:id/pdf` | Download contract PDF |
| GET | `/api/v1/contract-templates` | List templates |
| POST | `/api/v1/contract-templates` | Create template (admin) |

---

## 28.3 CONTRACT VIEWER COMPONENT

```typescript
// modules/contract/components/contract-viewer.tsx

interface ContractViewerProps {
  contract: Contract;
  mode: 'view' | 'sign';
  onSign?: () => void;
}

// Features:
// - Display HTML content in scrollable container
// - If PDF available, offer PDF view toggle
// - Zoom controls (75%, 100%, 125%, 150%)
// - Print button
// - Download PDF button
// - Sign button (if mode='sign' and pending signature)
```

### Implementation Pattern
```tsx
export function ContractViewer({ contract, mode, onSign }: ContractViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'html' | 'pdf'>('html');

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(75, z - 25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(150, z + 25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {contract.pdfUrl && (
            <ToggleGroup type="single" value={viewMode} onValueChange={setViewMode}>
              <ToggleGroupItem value="html">HTML</ToggleGroupItem>
              <ToggleGroupItem value="pdf">PDF</ToggleGroupItem>
            </ToggleGroup>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          {contract.pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={contract.pdfUrl} download>
                <Download className="h-4 w-4 mr-2" /> PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 p-4">
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
          {viewMode === 'html' ? (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: contract.content }} 
            />
          ) : (
            <iframe src={contract.pdfUrl} className="w-full h-[800px]" />
          )}
        </div>
      </ScrollArea>

      {/* Sign Button */}
      {mode === 'sign' && shouldShowSign(contract) && (
        <div className="p-4 border-t">
          <Button onClick={onSign} className="w-full">
            Sign Contract
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## 28.4 E-SIGNATURE DIALOG

```typescript
// modules/contract/components/e-signature-dialog.tsx

interface ESignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  signerRole: 'occupant' | 'owner';
  onSigned: () => void;
}
```

### Signature Methods
1. **Draw**: Canvas-based signature pad
2. **Type**: Typed name in script font
3. **Upload**: Upload signature image

### Implementation
```tsx
export function ESignatureDialog({ open, onOpenChange, contractId, signerRole, onSigned }: ESignatureDialogProps) {
  const [method, setMethod] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signature, setSignature] = useState<string>(''); // Base64
  const [agreed, setAgreed] = useState(false);
  
  const signMutation = useSignContract();

  const handleSign = async () => {
    await signMutation.mutateAsync({
      contractId,
      signature,
      method,
    });
    onSigned();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sign Contract</DialogTitle>
          <DialogDescription>
            Please review the contract and provide your signature below.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={method} onValueChange={setMethod}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw">
            <SignaturePad onSignature={setSignature} />
          </TabsContent>

          <TabsContent value="type">
            <TypedSignature onSignature={setSignature} />
          </TabsContent>

          <TabsContent value="upload">
            <SignatureUpload onSignature={setSignature} />
          </TabsContent>
        </Tabs>

        <div className="flex items-center space-x-2">
          <Checkbox id="agree" checked={agreed} onCheckedChange={setAgreed} />
          <label htmlFor="agree" className="text-sm">
            I agree that this electronic signature is legally binding
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSign} 
            disabled={!signature || !agreed || signMutation.isPending}
          >
            {signMutation.isPending ? 'Signing...' : 'Sign Contract'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 28.5 SIGNATURE PAD COMPONENT

```typescript
// modules/contract/components/signature-pad.tsx

interface SignaturePadProps {
  onSignature: (base64: string) => void;
  width?: number;
  height?: number;
}

// Uses canvas for drawing
// Features:
// - Pen color (black)
// - Line width (2px default)
// - Clear button
// - Undo last stroke
// - Touch support for mobile
```

### Implementation
```tsx
export function SignaturePad({ onSignature, width = 400, height = 200 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const dataUrl = canvasRef.current?.toDataURL('image/png');
    if (dataUrl) onSignature(dataUrl);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSignature('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-md p-1 bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <Button variant="outline" size="sm" onClick={clear}>
        Clear
      </Button>
    </div>
  );
}
```

---

## 28.6 DEPOSIT MODULE

### Module Structure
```
modules/deposit/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-deposit.ts
│   ├── use-deposits.ts
│   └── use-deposit-mutations.ts
├── components/
│   ├── index.ts
│   ├── deposit-card.tsx
│   ├── deposit-status-badge.tsx
│   ├── deposit-timeline.tsx
│   └── deposit-refund-form.tsx
└── index.ts
```

### Deposit Types

```typescript
// modules/deposit/types/index.ts

export interface Deposit {
  id: string;
  tenancyId: string;
  type: DepositType;
  amount: number;
  status: DepositStatus;
  collectedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  deductions?: DepositDeduction[];
  createdAt: Date;
  updatedAt: Date;
}

export enum DepositType {
  SECURITY = 'SECURITY',
  UTILITY = 'UTILITY',
  KEY = 'KEY',
  OTHER = 'OTHER',
}

export enum DepositStatus {
  PENDING = 'PENDING',
  COLLECTED = 'COLLECTED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  FULLY_REFUNDED = 'FULLY_REFUNDED',
  FORFEITED = 'FORFEITED',
}

export interface DepositDeduction {
  id: string;
  depositId: string;
  description: string;
  amount: number;
  evidenceUrl?: string;
  createdAt: Date;
}

export interface DepositTransaction {
  id: string;
  depositId: string;
  type: 'COLLECTION' | 'REFUND' | 'DEDUCTION';
  amount: number;
  reference?: string;
  createdAt: Date;
}
```

---

## 28.7 DEPOSIT BACKEND ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/deposits` | List deposits |
| GET | `/api/v1/deposits/:id` | Get deposit detail |
| POST | `/api/v1/deposits` | Create deposit |
| POST | `/api/v1/deposits/from-tenancy` | Create deposits from tenancy config |
| POST | `/api/v1/deposits/:id/collect` | Record collection |
| POST | `/api/v1/deposits/:id/refund` | Process refund |
| POST | `/api/v1/deposits/:id/forfeit` | Forfeit deposit |
| POST | `/api/v1/deposits/:id/deductions` | Add deduction |
| GET | `/api/v1/deposits/:id/transactions` | Get transaction history |

---

## 28.8 DEPOSIT TRACKING PAGE

### Route
```
app/dashboard/(auth)/occupant/tenancy/[id]/deposits/
└── page.tsx    → DepositTrackingPage
```

### Page Layout
```tsx
export default function DepositTrackingPage({ params }: { params: { id: string } }) {
  const { data: tenancy } = useTenancy(params.id);
  const { data: deposits } = useDepositsByTenancy(params.id);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Deposit Tracking" 
        description={`Deposits for ${tenancy?.property?.address}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deposits?.map(deposit => (
          <DepositCard key={deposit.id} deposit={deposit} />
        ))}
      </div>

      {/* Total Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Total Deposited</dt>
              <dd className="text-2xl font-bold">{formatCurrency(totalDeposited)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Refundable</dt>
              <dd className="text-2xl font-bold text-green-600">{formatCurrency(refundable)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
```

### DepositCard Component
```tsx
interface DepositCardProps {
  deposit: Deposit;
  showActions?: boolean;
}

export function DepositCard({ deposit, showActions }: DepositCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{depositTypeLabel(deposit.type)}</CardTitle>
          <DepositStatusBadge status={deposit.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(deposit.amount)}</div>
        
        {deposit.deductions && deposit.deductions.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground">Deductions:</p>
            {deposit.deductions.map(d => (
              <div key={d.id} className="flex justify-between text-sm">
                <span>{d.description}</span>
                <span className="text-red-600">-{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {deposit.status === 'COLLECTED' && deposit.refundedAt && (
          <p className="mt-2 text-sm text-green-600">
            Refunded: {formatCurrency(deposit.refundAmount)} on {formatDate(deposit.refundedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 28.9 HOOKS SPECIFICATION

### Contract Hooks
```typescript
// modules/contract/hooks/use-contract.ts

export function useContract(id: string | undefined) {
  return useApiQuery<Contract>(
    queryKeys.contracts.detail(id!),
    `/contracts/${id}`,
    { enabled: !!id }
  );
}

export function useContractsByTenancy(tenancyId: string) {
  return useApiPaginatedQuery<Contract>(
    queryKeys.contracts.byTenancy(tenancyId),
    `/contracts`,
    { params: { tenancyId } }
  );
}

export function useSignContract() {
  return useApiMutation<Contract, SignContractDto>({
    method: 'POST',
    endpoint: (vars) => `/contracts/${vars.contractId}/sign`,
    invalidateKeys: [queryKeys.contracts.all, queryKeys.tenancies.all],
    successMessage: 'Contract signed successfully',
  });
}
```

### Deposit Hooks
```typescript
// modules/deposit/hooks/use-deposit.ts

export function useDeposit(id: string | undefined) {
  return useApiQuery<Deposit>(
    queryKeys.deposits.detail(id!),
    `/deposits/${id}`,
    { enabled: !!id }
  );
}

export function useDepositsByTenancy(tenancyId: string) {
  return useApiPaginatedQuery<Deposit>(
    queryKeys.deposits.byTenancy(tenancyId),
    `/deposits`,
    { params: { tenancyId } }
  );
}

export function useRecordDepositCollection() {
  return useApiMutation<Deposit, CollectDepositDto>({
    method: 'POST',
    endpoint: (vars) => `/deposits/${vars.depositId}/collect`,
    invalidateKeys: [queryKeys.deposits.all, queryKeys.tenancies.all],
    successMessage: 'Deposit collection recorded',
  });
}

export function useRefundDeposit() {
  return useApiMutation<Deposit, RefundDepositDto>({
    method: 'POST',
    endpoint: (vars) => `/deposits/${vars.depositId}/refund`,
    invalidateKeys: [queryKeys.deposits.all],
    successMessage: 'Deposit refund processed',
  });
}
```

---

## 28.10 QUERY KEYS

```typescript
// lib/query/index.ts (extend)

contracts: {
  all: ['contracts'] as const,
  list: (params: ContractQueryParams) => ['contracts', 'list', params] as const,
  detail: (id: string) => ['contracts', 'detail', id] as const,
  byTenancy: (tenancyId: string) => ['contracts', 'tenancy', tenancyId] as const,
},

deposits: {
  all: ['deposits'] as const,
  list: (params: DepositQueryParams) => ['deposits', 'list', params] as const,
  detail: (id: string) => ['deposits', 'detail', id] as const,
  byTenancy: (tenancyId: string) => ['deposits', 'tenancy', tenancyId] as const,
  transactions: (id: string) => ['deposits', 'transactions', id] as const,
},
```
