# Property Member & Independent Agent — Implementation Plan

> **Scope**: Add property-level access control (`PropertyMember`) and enable independent agents (`Agent.companyId` optional).
> **Status**: **COMPLETE** — All 5 parts implemented
> **Risk level**: Low — all changes are additive (no breaking changes to existing role system)
>
> **Verification**: Backend 0 errors, 686 tests pass. Frontend 0 errors. Seed verified. Migration applied.

---

## Background

### Problem 1: No Property-Level Access Control
Currently access is scoped at the **organization level** (Partner → Vendor → User). A vendor admin controls ALL properties under their vendor. There's no way to say "User X is the **leasing manager for Property Y only**."

Real-world need:
```
Property: KL Tower Residence
├── Property Manager (Ali)     — full control
├── Leasing Manager (Siti)     — handles applications, viewings, contracts
├── Maintenance Staff (Ahmad)  — maintenance tickets only
└── Property Staff (Lisa)      — read-only + limited actions
```

### Problem 2: Agent Requires Company
`Agent.companyId` is required. An independent agent (sole proprietor) cannot exist without creating a shell Company record.

### Solution
1. **Add `PropertyMember` model** — binds a User to a specific Listing/Property with a `PropertyRole`
2. **Add `PropertyMemberGuard`** — checks property-level access in PM domain controllers
3. **Make `Agent.companyId` optional** — one schema change + validation update

---

## Architecture

### Data Model

```
Partner (SaaS tenant)
├── Vendor (property owner)
│   └── Listing (property)
│       ├── PropertyMember { userId, listingId, role: PropertyRole }
│       │   ├── PROPERTY_ADMIN
│       │   ├── PROPERTY_MANAGER
│       │   ├── LEASING_MANAGER
│       │   ├── MAINTENANCE_STAFF
│       │   └── PROPERTY_STAFF
│       ├── Tenancy
│       ├── Maintenance
│       └── Inspection
├── Company (agency)
│   └── Agent { userId, companyId? }  ← now optional
└── User { partnerId, vendorId?, role }
```

### How PropertyMember Interacts with Existing Roles

The existing `Role` enum (`SUPER_ADMIN`, `PARTNER_ADMIN`, `VENDOR_ADMIN`, etc.) stays unchanged. PropertyMember is an **additional layer**, not a replacement.

**Access Resolution Order:**
```
1. SUPER_ADMIN / PARTNER_ADMIN → bypass (full access to all properties)
2. VENDOR_ADMIN of the property's vendor → bypass (already has full vendor access)
3. PropertyMember check → does user have PropertyRole on this listing?
4. VENDOR_STAFF with PropertyMember → scoped to their PropertyRole
5. No PropertyMember → access denied for property-specific operations
```

**Key Principle**: PropertyMember does NOT replace Role. It **refines** property-level access for users who already have a valid system Role (typically `VENDOR_ADMIN`, `VENDOR_STAFF`, or even `PARTNER_ADMIN` staff who manage specific properties).

### PropertyRole Permissions Matrix

| PropertyRole | Tenancy | Maintenance | Inspection | Billing | Members | Listing |
|---|---|---|---|---|---|---|
| PROPERTY_ADMIN | Full | Full | Full | Full | Manage | Edit |
| PROPERTY_MANAGER | Full | Full | Full | View | View | Edit |
| LEASING_MANAGER | Full | View | Schedule | View | — | Edit |
| MAINTENANCE_STAFF | View | Full | View | — | — | View |
| PROPERTY_STAFF | View | View | View | View | — | View |

---

## Part-by-Part Implementation Plan

### Part 1: Schema & Migration (Backend)
**Files to create/modify:**
- `prisma/schema.prisma` — Add `PropertyMember` model, `PropertyRole` enum, make `Agent.companyId` optional
- Migration file (auto-generated)
- `prisma/seed.ts` — Add sample PropertyMember data

**Schema additions:**
```prisma
enum PropertyRole {
  PROPERTY_ADMIN
  PROPERTY_MANAGER
  LEASING_MANAGER
  MAINTENANCE_STAFF
  PROPERTY_STAFF
}

model PropertyMember {
  id        String       @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  partnerId  String       @map("tenant_id") @db.Uuid
  listingId String       @map("listing_id") @db.Uuid
  userId    String       @map("user_id") @db.Uuid
  role      PropertyRole @default(PROPERTY_STAFF)
  notes     String?
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")
  removedAt DateTime?    @map("removed_at")

  partner  Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  listing  Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([listingId, userId])
  @@index([userId])
  @@index([listingId])
  @@index([partnerId])
  @@map("property_members")
}
```

**Agent change:**
```prisma
model Agent {
  companyId String?  @map("company_id") @db.Uuid   // was required, now optional
  company   Company? @relation(...)                  // was required, now optional
  
  @@unique([companyId, userId])  // still works with nullable
}
```

**Relation additions on existing models:**
```prisma
// In model Listing:
  propertyMembers PropertyMember[]

// In model User:
  propertyMembers PropertyMember[]

// In model Partner:
  propertyMembers PropertyMember[]
```

---

### Part 2: Backend Module — PropertyMember CRUD (Backend)
**Files to create:**
```
src/modules/property-member/
├── property-member.module.ts
├── property-member.controller.ts
├── property-member.service.ts
├── dto/
│   ├── add-property-member.dto.ts
│   ├── update-property-member-role.dto.ts
│   ├── property-member-query.dto.ts
│   └── property-member-view.dto.ts
└── guards/
    └── property-member.guard.ts
```

**API Endpoints:**
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | `/api/v1/properties/:listingId/members` | Add member to property | SUPER_ADMIN, PARTNER_ADMIN, VENDOR_ADMIN, + PropertyRole.PROPERTY_ADMIN |
| GET | `/api/v1/properties/:listingId/members` | List property members | SUPER_ADMIN, PARTNER_ADMIN, VENDOR_ADMIN, VENDOR_STAFF |
| PATCH | `/api/v1/properties/:listingId/members/:memberId` | Update member role | SUPER_ADMIN, PARTNER_ADMIN, VENDOR_ADMIN, + PropertyRole.PROPERTY_ADMIN |
| DELETE | `/api/v1/properties/:listingId/members/:memberId` | Remove member | SUPER_ADMIN, PARTNER_ADMIN, VENDOR_ADMIN, + PropertyRole.PROPERTY_ADMIN |
| GET | `/api/v1/my/properties` | List properties I'm assigned to | Any authenticated |
| GET | `/api/v1/my/properties/:listingId/role` | Get my role on a property | Any authenticated |

**Service Logic:**
- `addMember()` — Validates listing belongs to partner, user exists, no duplicate. VENDOR_ADMIN can only add members to their own vendor's listings.
- `updateMemberRole()` — Cannot change own role (prevent self-escalation). PROPERTY_ADMIN can manage other members.
- `removeMember()` — Soft-delete (sets `removedAt`). Cannot remove self if only PROPERTY_ADMIN.
- `getMyProperties()` — Returns all listings where the user has an active PropertyMember record.
- `getMemberRole()` — Returns the user's PropertyRole for a specific listing (used by guards).

---

### Part 3: Guard Integration (Backend)
**Files to create/modify:**

**New:**
```
src/modules/property-member/guards/property-member.guard.ts
src/modules/property-member/decorators/property-access.decorator.ts
```

**Modify (add PropertyMember check to existing guards):**
```
src/modules/tenancy/guards/tenancy.guard.ts
src/modules/maintenance/maintenance.controller.ts
src/modules/inspection/inspection.controller.ts
src/modules/billing/billing.controller.ts
src/core/rbac/rbac.permissions.ts
```

**Guard Logic:**
```typescript
// property-member.guard.ts
@Injectable()
export class PropertyMemberGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<PropertyRole[]>('propertyRoles', handler);
    const user = request.user;
    
    // SUPER_ADMIN / PARTNER_ADMIN bypass
    if ([Role.SUPER_ADMIN, Role.PARTNER_ADMIN].includes(user.role)) return true;
    
    // VENDOR_ADMIN bypass for own vendor's listings
    if (user.role === Role.VENDOR_ADMIN) {
      const listing = await this.prisma.listing.findFirst({ where: { id: listingId, vendorId: user.vendorId } });
      if (listing) return true;
    }
    
    // Check PropertyMember
    const member = await this.prisma.propertyMember.findFirst({
      where: { listingId, userId: user.sub, removedAt: null }
    });
    if (!member) return false;
    
    // Check required PropertyRole
    return requiredRoles.includes(member.role);
  }
}
```

**Decorator:**
```typescript
// @PropertyAccess(PropertyRole.PROPERTY_MANAGER, PropertyRole.PROPERTY_ADMIN)
export const PropertyAccess = (...roles: PropertyRole[]) => SetMetadata('propertyRoles', roles);
```

**Existing Guard Updates:**
- `tenancy.guard.ts` — Add PropertyMember check for VENDOR_STAFF: if user has PROPERTY_MANAGER or LEASING_MANAGER on the tenancy's listing, allow access.
- Maintenance controller — Add `@UseGuards(PropertyMemberGuard)` + `@PropertyAccess(PROPERTY_ADMIN, PROPERTY_MANAGER, MAINTENANCE_STAFF)`.
- Inspection controller — Add `@UseGuards(PropertyMemberGuard)` + `@PropertyAccess(PROPERTY_ADMIN, PROPERTY_MANAGER, LEASING_MANAGER)`.
- Billing controller — Add `@PropertyAccess(PROPERTY_ADMIN, PROPERTY_MANAGER)` for mutations, allow wider read access.

**RBAC Permissions Update:**
```typescript
// Add to rbac.permissions.ts
[Role.VENDOR_STAFF]: [
  ...existing,
  'property-member:read',    // can see who's assigned
],
// New property-specific permissions (resolved via PropertyMemberGuard, not Role)
```

---

### Part 4: Independent Agent (Backend)
**Files to modify:**
```
prisma/schema.prisma                          — Agent.companyId optional
src/modules/agent/dto/register-agent.dto.ts   — companyId @IsOptional()
src/modules/agent/agent.service.ts            — handle null companyId
src/modules/agent/agent.controller.ts         — no changes needed
```

**Changes:**
1. Schema: `companyId String?` + `company Company?`
2. DTO: `@IsOptional() @IsUUID() companyId?: string` 
3. Service `registerAgent()`:
   - If `companyId` provided → validate company exists (existing logic)
   - If `companyId` null → independent agent (skip company validation)
   - Unique constraint: `@@unique([companyId, userId])` still works — Prisma treats null as distinct
4. Service `findAll()`: Add filter `isIndependent: boolean` → `where: { companyId: null }` or `where: { companyId: { not: null } }`
5. View DTO: `companyId?: string | null`

---

### Part 5: Frontend Types, Hooks & UI
**Files to create:**
```
shadcn-template-refactor/
├── modules/property-member/
│   ├── types/index.ts            — PropertyMember, PropertyRole types
│   ├── hooks/
│   │   ├── use-property-members.ts  — CRUD hooks
│   │   └── use-my-properties.ts     — Current user's property assignments
│   └── components/
│       ├── property-member-list.tsx    — Table of members for a property
│       ├── add-property-member-dialog.tsx — Dialog to add/invite member
│       ├── property-role-badge.tsx     — Badge component for PropertyRole
│       └── property-role-select.tsx    — Dropdown selector for roles
├── modules/agent/types/index.ts  — Update: companyId optional
└── types/backend-contracts.ts    — Add PropertyRole, PropertyMember
```

**Frontend Types:**
```typescript
export enum PropertyRole {
  PROPERTY_ADMIN = "PROPERTY_ADMIN",
  PROPERTY_MANAGER = "PROPERTY_MANAGER",
  LEASING_MANAGER = "LEASING_MANAGER",
  MAINTENANCE_STAFF = "MAINTENANCE_STAFF",
  PROPERTY_STAFF = "PROPERTY_STAFF",
}

export interface PropertyMember {
  id: string;
  listingId: string;
  userId: string;
  role: PropertyRole;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  removedAt?: string;
  // Populated
  user?: { id: string; fullName: string; email: string; phone?: string };
}
```

**UI Integration Points:**
- **Vendor Portal** → Property Detail page → new "Team" tab showing `PropertyMemberList`
- **Partner Portal** → Property Detail page → "Team" tab (read-only or manage)
- **My Properties** → Vendor staff dashboard showing assigned properties
- **Agent Profile** → Show "Independent" badge if `companyId` is null

---

## Execution Order

| Part | Scope | Depends On | Est. Time |
|------|-------|-----------|-----------|
| **Part 1** | Schema + Migration | None | ~30 min |
| **Part 2** | PropertyMember CRUD module | Part 1 | ~60 min |
| **Part 3** | Guard integration | Part 2 | ~45 min |
| **Part 4** | Independent agent | None (can run parallel with 1-3) | ~20 min |
| **Part 5** | Frontend types + hooks + UI | Parts 1-4 | ~60 min |

**Recommended approach**: Parts 1-4 together (all backend), then Part 5 (all frontend). Parts 1+4 can even be combined since they're both schema changes in the same migration.

---

## What Does NOT Change

- `enum Role` — untouched (SUPER_ADMIN, PARTNER_ADMIN, etc.)
- `User.role` — still single role per user
- JWT payload — no changes
- Existing `@Roles()` decorators — still work
- Portal navigation — no new portals
- TenancyGuard / TenantGuard core logic — enhanced, not replaced
- All 8 portal dashboards — working as-is

---

## Migration Safety

Since PropertyMember is a **new table** and Agent.companyId goes from required → optional:
- No data loss
- No breaking column changes  
- Existing agents keep their companyId
- No user migration needed
- Rollback = drop `property_members` table + make `company_id` NOT NULL again

---

## How to Start

```
Read this doc: docs/PROPERTY-MEMBER-IMPLEMENTATION.md

Then implement Part 1: Schema & Migration
- Add PropertyRole enum and PropertyMember model to prisma/schema.prisma
- Make Agent.companyId optional
- Add relations to Listing, User, Partner models
- Run prisma migrate dev
- Regenerate Prisma Client
- Update seed.ts with sample PropertyMember data
- Verify: npx prisma validate && npx tsc --noEmit
```
