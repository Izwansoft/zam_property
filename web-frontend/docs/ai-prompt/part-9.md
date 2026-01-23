# FRONTEND (WEB) — PART 9 — TENANTS & VENDORS DASHBOARD MODULES (ONBOARDING, APPROVALS, ROLES) (LOCKED)

This part defines the UI for managing **Tenants** and **Vendors**:
- onboarding flows
- approval & verification
- role visibility
- safe operations across Platform and Tenant portals

All rules from WEB PART 0–8 apply fully.

---

## 9.1 TENANTS & VENDORS UI PHILOSOPHY

Tenants and vendors are **actors**, not content.
The UI must emphasize:
- clarity of status
- safe lifecycle actions
- auditability
- strict scope boundaries

---

## 9.2 TENANTS MODULE OWNERSHIP (PLATFORM PORTAL)

Domain module:
- `modules/tenants/*`

Rules:
- Tenants module is accessible only in Platform portal
- Tenant-related actions must be auditable
- Tenant creation is a controlled, admin-only operation

---

## 9.3 TENANTS LIST PAGE (PLATFORM)

List page must include:
- Search by name / ID
- Status filter (active / suspended / cancelled)
- Plan indicator
- Vertical enablement summary
- Created date
- Quick actions (view, suspend)

Rules:
- Pagination mandatory
- Sorting by name and created date
- Status badge standardized

---

## 9.4 TENANT DETAIL PAGE (PLATFORM)

Detail page sections:
- Overview (name, status, plan, created at)
- Vertical enablement (read/edit per permission)
- Vendors list (linked to vendors module)
- Usage & limits summary
- Subscription summary
- Audit log (tenant-scoped)
- Ops tools (platform-only: reindex, refresh entitlements)

Rules:
- Destructive actions (suspend/cancel) require confirmation + reason
- Changes to vertical enablement must invalidate relevant caches

---

## 9.5 TENANT SETTINGS (TENANT PORTAL)

Tenant Admins may manage:
- Branding (logo, name, theme tokens if supported)
- Allowed verticals (within platform allowance)
- Review moderation rules (if configurable)
- Notification preferences (tenant-wide)

Rules:
- Tenant portal must not expose platform-level plan configuration
- Settings UI must reflect entitlements clearly

---

## 9.6 VENDORS MODULE OWNERSHIP

Domain module:
- `modules/vendors/*`

Rules:
- Vendors belong to exactly one tenant
- Vendors are managed by:
  - Platform Admin (global view)
  - Tenant Admin (tenant view)
- Vendors manage their own profile in Vendor portal

---

## 9.7 VENDORS LIST PAGE (TENANT PORTAL)

List page must include:
- Vendor name
- Verification status (pending/verified/rejected)
- Listings count
- Last activity
- Actions (approve/reject/suspend)

Rules:
- Pagination mandatory
- Bulk approval optional but permissioned
- Clear empty state (“No vendors yet”)

---

## 9.8 VENDOR APPROVAL & VERIFICATION FLOW

Approval page must include:
- Vendor profile details
- Submitted verification data (documents, metadata)
- Decision controls:
  - Approve
  - Reject (with reason)
  - Request changes (optional)
- Audit note field (required for reject)

Rules:
- Decisions must be confirmed
- Result must be visible immediately in vendor portal
- Rejected vendors must see reason (sanitized)

---

## 9.9 VENDOR DETAIL PAGE

Detail page sections:
- Overview (name, status, verification)
- Listings (link to listings module filtered by vendor)
- Interactions summary (leads/bookings)
- Reviews summary
- Audit trail
- Support notes (platform-only)

Rules:
- Platform Admin can view across tenants
- Tenant Admin restricted to own tenant
- Vendor portal cannot see internal audit/support notes

---

## 9.10 VENDOR SELF-SERVICE (VENDOR PORTAL)

Vendor users may:
- View verification status
- Update profile details (as allowed)
- Upload verification documents (if supported)
- View reasons for rejection/suspension
- View plan limits and usage

Rules:
- Vendor portal must never allow vendor to approve itself
- Sensitive admin notes must not be exposed

---

## 9.11 ROLES & MEMBERSHIP VISIBILITY (UI)

Rules:
- Role management UI (assign/remove users) is scoped:
  - Platform roles → platform portal
  - Tenant roles → tenant portal
  - Vendor roles → vendor portal (self-limited)
- Role labels must be consistent with backend
- UI must clearly show “who can do what”

---

## 9.12 ENTITLEMENTS & LIMITS UX (TENANTS & VENDORS)

Rules:
- Tenant detail page must show:
  - current plan
  - enabled features
  - vertical allowances
- Vendor portal shows:
  - vendor-specific limits (if applicable)
  - read-only plan summary

No ambiguous limits.

---

## 9.13 AUDIT & HISTORY VISIBILITY

Rules:
- Tenant & vendor lifecycle actions must be visible in audit viewer
- UI must allow filtering audit logs by entity
- Platform Admin sees global + tenant logs
- Tenant Admin sees tenant-only logs

---

## 9.14 MODULE API SURFACE (EXPECTED)

Tenants module:
- `useTenantsList()`
- `useTenantDetail()`
- `useCreateTenant()`
- `useSuspendTenant()`
- `useUpdateTenantSettings()`

Vendors module:
- `useVendorsList()`
- `useVendorDetail()`
- `useApproveVendor()`
- `useRejectVendor()`
- `useUpdateVendorProfile()`

---

## 9.15 TESTING REQUIREMENTS (TENANTS & VENDORS)

Must include:
- unit tests for tenant/vendor mappers
- unit tests for approval guards
- integration tests for:
  - tenant creation
  - vendor approval flow
- E2E critical path:
  - platform admin → create tenant
  - tenant admin → approve vendor
  - vendor → create listing

---

## 9.16 FORBIDDEN PRACTICES

You must not:
- Allow tenant admins to manage platform plans
- Allow vendors to bypass approval
- Expose audit/support notes to vendors
- Mix tenant and platform vendor lists
- Hardcode role logic inconsistent with backend

---

## 9.17 EXECUTION DIRECTIVE

Tenants & Vendors UI must:
- Reflect lifecycle clearly
- Enforce strict scope boundaries
- Be safe, auditable, and predictable
- Integrate cleanly with listings and interactions

These modules govern who participates in the marketplace.

END OF WEB PART 9.