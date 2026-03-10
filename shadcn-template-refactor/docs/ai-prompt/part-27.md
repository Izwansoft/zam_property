# FRONTEND (WEB) — PART 27 — OCCUPANT PORTAL & TENANCY UI

> **Sessions:** 5.1-5.5, 5.9-5.11  
> **Covers:** Occupant onboarding, tenancy management, portal setup

All rules from WEB PART 0–26 apply fully.

---

## 27.1 OCCUPANT PORTAL SETUP

### Overview
The Occupant portal is for tenants/occupants who rent properties. They need to manage their tenancies, pay bills, submit maintenance requests, and view inspections.

### Route Structure
```
app/dashboard/(auth)/occupant/
├── page.tsx                    → Dashboard redirect
├── layout.tsx                  → Occupant-specific layout
├── onboarding/
│   └── page.tsx               → Onboarding wizard
├── tenancy/
│   ├── page.tsx               → My tenancies list
│   └── [id]/
│       └── page.tsx           → Tenancy detail
├── bills/
│   ├── page.tsx               → My bills list
│   └── [id]/
│       └── page.tsx           → Bill detail + payment
├── maintenance/
│   ├── page.tsx               → My maintenance requests
│   └── new/
│       └── page.tsx           → Submit new request
├── inspections/
│   └── page.tsx               → My inspections
├── documents/
│   └── page.tsx               → My documents
└── settings/
    └── page.tsx               → Profile settings
```

### Navigation Config
```typescript
// config/navigation.ts
export const occupantNav: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard/occupant', icon: Home },
  { title: 'My Tenancy', href: '/dashboard/occupant/tenancy', icon: Building },
  { title: 'Bills & Payments', href: '/dashboard/occupant/bills', icon: Receipt },
  { title: 'Maintenance', href: '/dashboard/occupant/maintenance', icon: Wrench },
  { title: 'Inspections', href: '/dashboard/occupant/inspections', icon: Search },
  { title: 'Documents', href: '/dashboard/occupant/documents', icon: FileText },
  { title: 'Settings', href: '/dashboard/occupant/settings', icon: Settings },
];
```

### Module Structure
```
modules/occupant/
├── types/index.ts              → Occupant, OccupantDocument interfaces
├── hooks/
│   ├── index.ts               → Barrel export
│   ├── use-occupant-profile.ts
│   ├── use-occupant-documents.ts
│   └── use-occupant-onboarding.ts
├── components/
│   ├── index.ts               → Barrel export
│   ├── onboarding-wizard.tsx
│   ├── document-uploader.tsx
│   └── occupant-dashboard-stats.tsx
└── index.ts                    → Module barrel
```

---

## 27.2 OCCUPANT BACKEND ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/occupants/me` | Get current occupant profile |
| PATCH | `/api/v1/occupants/me` | Update occupant profile |
| POST | `/api/v1/occupants/me/documents` | Upload document |
| GET | `/api/v1/occupants/me/documents` | List my documents |
| GET | `/api/v1/occupants/me/onboarding-status` | Check onboarding status |
| POST | `/api/v1/occupants/me/complete-onboarding` | Submit onboarding |
| GET | `/api/v1/occupants/:id` | Get occupant by ID (owner/admin) |
| GET | `/api/v1/occupants` | List occupants (admin) |

### Occupant Types

```typescript
// modules/occupant/types/index.ts

export interface Occupant {
  id: string;
  userId: string;
  tenantId: string;
  icNumber?: string;
  employmentStatus?: EmploymentStatus;
  monthlyIncome?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  onboardingCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  documents?: OccupantDocument[];
}

export interface OccupantDocument {
  id: string;
  occupantId: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

export enum DocumentType {
  IC_FRONT = 'IC_FRONT',
  IC_BACK = 'IC_BACK',
  PAYSLIP = 'PAYSLIP',
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  UTILITY_BILL = 'UTILITY_BILL',
  BANK_STATEMENT = 'BANK_STATEMENT',
  OTHER = 'OTHER',
}

export enum EmploymentStatus {
  EMPLOYED = 'EMPLOYED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  UNEMPLOYED = 'UNEMPLOYED',
  STUDENT = 'STUDENT',
  RETIRED = 'RETIRED',
}
```

---

## 27.3 ONBOARDING WIZARD

### Component Spec
```typescript
// modules/occupant/components/onboarding-wizard.tsx

interface OnboardingWizardProps {
  onComplete: () => void;
}

// Steps:
// 1. Personal Details (IC number, employment status, income)
// 2. Document Upload (IC front/back, payslip - required based on employment)
// 3. Emergency Contact (name, phone, relationship)
// 4. Review & Submit
```

### Step 1: Personal Details
- IC Number (12 digits, Malaysian format)
- Employment Status (select from enum)
- Monthly Income (currency input, required if employed)

### Step 2: Document Upload
- IC Front (required)
- IC Back (required)
- Payslip (required if employed)
- Employment Letter (optional)
- Use MediaUploader pattern from modules/media

### Step 3: Emergency Contact
- Contact Name (required)
- Contact Phone (required)
- Relationship (select: parent, spouse, sibling, friend, other)

### Step 4: Review
- Display all entered information
- Editable (go back to previous steps)
- Submit button triggers `POST /occupants/me/complete-onboarding`

### Validation Schema
```typescript
import { z } from 'zod';

export const onboardingStep1Schema = z.object({
  icNumber: z.string().regex(/^\d{12}$/, 'IC must be 12 digits'),
  employmentStatus: z.nativeEnum(EmploymentStatus),
  monthlyIncome: z.number().positive().optional(),
});

export const onboardingStep3Schema = z.object({
  emergencyContactName: z.string().min(2),
  emergencyContactPhone: z.string().regex(/^(\+60|0)\d{9,10}$/),
  emergencyContactRelationship: z.enum(['parent', 'spouse', 'sibling', 'friend', 'other']),
});
```

---

## 27.4 TENANCY MODULE

### Route Structure
```
app/dashboard/(auth)/occupant/tenancy/
├── page.tsx                    → TenancyListPage (my tenancies)
├── loading.tsx                 → TenancyListSkeleton
└── [id]/
    ├── page.tsx               → TenancyDetailPage
    └── loading.tsx            → TenancyDetailSkeleton
```

### Module Structure
```
modules/tenancy/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-tenancies.ts
│   ├── use-tenancy.ts
│   ├── use-tenancy-mutations.ts
│   └── use-tenancy-timeline.ts
├── components/
│   ├── index.ts
│   ├── tenancy-card.tsx
│   ├── tenancy-list.tsx
│   ├── tenancy-status-badge.tsx
│   ├── tenancy-detail-header.tsx
│   ├── tenancy-timeline.tsx
│   └── tenancy-booking-wizard.tsx
└── index.ts
```

### Tenancy Types

```typescript
// modules/tenancy/types/index.ts

export interface Tenancy {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId?: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  depositAmount: number;
  status: TenancyStatus;
  terminatedAt?: Date;
  terminationReason?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  property?: Property;
  unit?: PropertyUnit;
  owner?: User;
  occupants?: TenancyOccupant[];
  contracts?: Contract[];
  deposits?: Deposit[];
  bills?: Bill[];
}

export enum TenancyStatus {
  DRAFT = 'DRAFT',
  PENDING_DEPOSIT = 'PENDING_DEPOSIT',
  PENDING_CONTRACT = 'PENDING_CONTRACT',
  ACTIVE = 'ACTIVE',
  TERMINATED = 'TERMINATED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface TenancyOccupant {
  id: string;
  tenancyId: string;
  occupantId: string;
  isPrimary: boolean;
  occupant?: Occupant;
}

// Status colors
export const tenancyStatusColors: Record<TenancyStatus, string> = {
  DRAFT: 'gray',
  PENDING_DEPOSIT: 'yellow',
  PENDING_CONTRACT: 'orange',
  ACTIVE: 'green',
  TERMINATED: 'red',
  EXPIRED: 'slate',
  CANCELLED: 'slate',
};
```

---

## 27.5 TENANCY BACKEND ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tenancies` | List tenancies (filtered by role) |
| GET | `/api/v1/tenancies/:id` | Get tenancy detail |
| POST | `/api/v1/tenancies` | Create tenancy (owner/admin) |
| PATCH | `/api/v1/tenancies/:id` | Update tenancy |
| POST | `/api/v1/tenancies/:id/activate` | Activate tenancy |
| POST | `/api/v1/tenancies/:id/terminate` | Terminate tenancy |
| POST | `/api/v1/tenancies/:id/extend` | Extend tenancy |
| GET | `/api/v1/tenancies/:id/timeline` | Get tenancy events |
| POST | `/api/v1/tenancies/:id/occupants` | Add occupant |
| DELETE | `/api/v1/tenancies/:id/occupants/:occupantId` | Remove occupant |

### Query Params

```typescript
interface TenancyQueryDto {
  page?: number;
  limit?: number;
  status?: TenancyStatus | TenancyStatus[];
  propertyId?: string;
  ownerId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  search?: string;
}
```

---

## 27.6 TENANCY COMPONENTS

### TenancyCard
```typescript
interface TenancyCardProps {
  tenancy: Tenancy;
  onClick?: () => void;
  showActions?: boolean;
}

// Displays:
// - Property thumbnail
// - Property address
// - Unit number (if applicable)
// - Monthly rent
// - Tenancy period (start - end)
// - Status badge
// - Days remaining (if active)
```

### TenancyList
```typescript
interface TenancyListProps {
  tenancies: Tenancy[];
  isLoading?: boolean;
  emptyMessage?: string;
}

// Features:
// - Filter by status (tabs or dropdown)
// - Sort by start date, rent, created
// - Grid or list view toggle
```

### TenancyDetailHeader
```typescript
interface TenancyDetailHeaderProps {
  tenancy: Tenancy;
  onAction?: (action: TenancyAction) => void;
}

// Displays:
// - Property info with image
// - Owner contact info
// - Tenancy period with progress bar
// - Status badge (large)
// - Action buttons (based on status)
```

### TenancyTimeline
```typescript
interface TenancyTimelineProps {
  tenancyId: string;
}

// Event types:
// - CREATED, DEPOSIT_PAID, CONTRACT_SIGNED, ACTIVATED
// - RENT_PAID, MAINTENANCE_REQUEST, INSPECTION_SCHEDULED
// - TERMINATED, EXPIRED
```

---

## 27.7 OWNER TENANCY MANAGEMENT

### Route Structure (for owners/landlords)
```
app/dashboard/(auth)/account/properties/[propertyId]/tenancies/
├── page.tsx                    → OwnerTenancyListPage
└── [tenancyId]/
    └── page.tsx               → OwnerTenancyDetailPage

app/dashboard/(auth)/account/tenancies/
├── page.tsx                    → All owner tenancies
└── new/
    └── page.tsx               → Create tenancy wizard
```

### Owner Actions
- **Create Tenancy**: Link property/unit to occupant
- **View Applications**: Review pending tenancy requests
- **Activate**: Move from PENDING_CONTRACT to ACTIVE
- **Terminate**: End active tenancy (with reason)
- **Extend**: Extend tenancy end date

### OwnerTenancyActions Component
```typescript
interface OwnerTenancyActionsProps {
  tenancy: Tenancy;
  onActionComplete?: () => void;
}

// Renders action buttons based on status:
// DRAFT → Edit, Send Contract, Cancel
// PENDING_DEPOSIT → View Deposit, Cancel
// PENDING_CONTRACT → Send Reminder, Cancel
// ACTIVE → Extend, Terminate
// TERMINATED/EXPIRED → View History
```

---

## 27.8 TENANCY BOOKING WIZARD

### Overview
Multi-step wizard for creating new tenancy (used by owners)

### Steps
1. **Select Property & Unit**: Property dropdown, unit selector (if multi-unit)
2. **Tenancy Terms**: Start date, end date (min 1 month), monthly rent, deposit multiplier
3. **Select Occupant**: Search existing users or invite new
4. **Review & Create**: Summary with all details, create button

### Component Structure
```typescript
// modules/tenancy/components/tenancy-booking-wizard.tsx

interface TenancyBookingWizardProps {
  propertyId?: string; // Pre-select if coming from property page
  onComplete: (tenancy: Tenancy) => void;
  onCancel: () => void;
}

const steps = [
  { id: 'property', title: 'Property & Unit' },
  { id: 'terms', title: 'Tenancy Terms' },
  { id: 'occupant', title: 'Select Occupant' },
  { id: 'review', title: 'Review & Create' },
];
```

### Validation Schemas
```typescript
export const tenancyTermsSchema = z.object({
  startDate: z.date().min(new Date(), 'Start date must be in future'),
  endDate: z.date(),
  monthlyRent: z.number().positive('Monthly rent must be positive'),
  depositMonths: z.number().int().min(1).max(3, 'Max 3 months deposit'),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
```

---

## 27.9 HOOKS SPECIFICATION

### useTenancies
```typescript
// modules/tenancy/hooks/use-tenancies.ts

interface UseTenanciesParams {
  status?: TenancyStatus | TenancyStatus[];
  propertyId?: string;
  page?: number;
  limit?: number;
}

export function useTenancies(params: UseTenanciesParams = {}) {
  return useApiPaginatedQuery<Tenancy>(
    queryKeys.tenancies.list(params),
    `/tenancies`,
    { params, staleTime: 30_000 }
  );
}
```

### useTenancy
```typescript
export function useTenancy(id: string | undefined) {
  return useApiQuery<Tenancy>(
    queryKeys.tenancies.detail(id!),
    `/tenancies/${id}`,
    { enabled: !!id, staleTime: 60_000 }
  );
}
```

### useTenancyMutations
```typescript
// modules/tenancy/hooks/use-tenancy-mutations.ts

export function useCreateTenancy() {
  return useApiMutation<Tenancy, CreateTenancyDto>({
    method: 'POST',
    endpoint: '/tenancies',
    invalidateKeys: [queryKeys.tenancies.all],
    successMessage: 'Tenancy created successfully',
  });
}

export function useActivateTenancy() {
  return useApiMutation<Tenancy, { tenancyId: string }>({
    method: 'POST',
    endpoint: (vars) => `/tenancies/${vars.tenancyId}/activate`,
    invalidateKeys: [queryKeys.tenancies.all],
    successMessage: 'Tenancy activated',
  });
}

export function useTerminateTenancy() {
  return useApiMutation<Tenancy, { tenancyId: string; reason: string }>({
    method: 'POST',
    endpoint: (vars) => `/tenancies/${vars.tenancyId}/terminate`,
    invalidateKeys: [queryKeys.tenancies.all],
    successMessage: 'Tenancy terminated',
  });
}
```

### Query Keys
```typescript
// lib/query/index.ts (extend)

tenancies: {
  all: ['tenancies'] as const,
  list: (params: TenancyQueryParams) => ['tenancies', 'list', params] as const,
  detail: (id: string) => ['tenancies', 'detail', id] as const,
  timeline: (id: string) => ['tenancies', 'timeline', id] as const,
  byProperty: (propertyId: string) => ['tenancies', 'property', propertyId] as const,
},
```

---

## 27.10 MSW HANDLERS

```typescript
// lib/mocks/handlers/tenancy.ts

import { http, HttpResponse } from 'msw';
import { mockPaginatedResponse, mockSuccessResponse } from '../utils';

const mockTenancies: Tenancy[] = [
  {
    id: 'ten_1',
    propertyId: 'prop_1',
    status: 'ACTIVE',
    monthlyRent: 1500,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-01-01'),
    // ... other fields
  },
];

export const tenancyHandlers = [
  // List tenancies
  http.get('/api/v1/tenancies', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    let filtered = mockTenancies;
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }
    
    return HttpResponse.json(mockPaginatedResponse(filtered));
  }),

  // Get tenancy detail
  http.get('/api/v1/tenancies/:id', ({ params }) => {
    const tenancy = mockTenancies.find(t => t.id === params.id);
    if (!tenancy) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(mockSuccessResponse(tenancy));
  }),

  // Create tenancy
  http.post('/api/v1/tenancies', async ({ request }) => {
    const body = await request.json();
    const newTenancy = { id: `ten_${Date.now()}`, ...body, status: 'DRAFT' };
    return HttpResponse.json(mockSuccessResponse(newTenancy), { status: 201 });
  }),
];
```

---

## 27.11 NAVIGATION & ROUTE GUARDS

### Auth Flow Update
```typescript
// modules/auth/context/auth-context.tsx

// Add OCCUPANT to role handling
export function roleToPortal(role: Role): Portal {
  switch (role) {
    case 'SUPER_ADMIN': return 'platform';
    case 'TENANT_ADMIN': return 'tenant';
    case 'VENDOR_ADMIN':
    case 'VENDOR_STAFF': return 'vendor';
    case 'OCCUPANT': return 'occupant';  // NEW
    default: return 'account';
  }
}

export function roleToDefaultPath(role: Role): string {
  const portal = roleToPortal(role);
  return `/dashboard/${portal}`;
}
```

### Layout Guard
```typescript
// app/dashboard/(auth)/occupant/layout.tsx

import { ProtectedRoute } from '@/components/common/protected-route';

export default function OccupantLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['OCCUPANT', 'SUPER_ADMIN']}>
      <DashboardLayout navigation={occupantNav}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

---

## 27.12 UI PATTERNS

### Status Transitions
```
DRAFT → PENDING_DEPOSIT → PENDING_CONTRACT → ACTIVE
                                              ↓
                          TERMINATED ← ← ← ← ←
                          EXPIRED ← ← ← ← ← ← (auto on end date)
                          CANCELLED (from any pre-active state)
```

### Empty States
- No tenancies: "You don't have any tenancies yet. Contact your landlord to get started."
- No active tenancy: "No active tenancy found. Your previous tenancy may have ended."

### Loading States
- Use TenancyCardSkeleton for list items
- Use TenancyDetailSkeleton for detail page
- Follow Session 1.11 skeleton patterns

### Error Handling
- API errors → toast notification
- Not found → redirect to list with message
- Permission denied → show 403 page
