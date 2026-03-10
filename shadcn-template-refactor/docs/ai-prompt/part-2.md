# FRONTEND (WEB) — PART 2 — WEB ARCHITECTURE SHAPE, ROUTING & MODULE BOUNDARIES (LOCKED)

This part defines the **system shape** of the web dashboard:
- routing strategy
- folder structure
- module boundaries
- how we adapt the downloaded Shadcn UI Kit without rebuilding it

All rules from WEB PART 0–1 apply fully.

---

## 2.1 ARCHITECTURE GOALS

The web architecture must:
- Mirror backend spine boundaries (core vs vertical plugins vs infra)
- Support role portals within one Next.js app
- Prevent cross-tenant data leakage by design
- Keep pages thin and modules thick (domain-driven UI)
- Enable schema-driven forms for vertical listings
- Stay maintainable under multi-vertical expansion

---

## 2.2 SINGLE APP, MULTI-PORTAL ROUTING (AUTHORITATIVE)

We use **one Next.js app (App Router)** with role-based portals.

Route structure:
- `/(public)/*`           → Public pages (no auth)
- `/(auth)/*`             → Login, Register, etc.
- `/dashboard/platform/*` → Platform Admin Portal (SUPER_ADMIN)
- `/dashboard/tenant/*`   → Tenant Admin Portal (TENANT_ADMIN)
- `/dashboard/vendor/*`   → Vendor Portal (VENDOR_ADMIN, VENDOR_STAFF)
- `/dashboard/account/*`  → Customer Account Portal (CUSTOMER)

Rules:
- Each portal has its own layout shell and navigation
- Shared components are reused, but portal navigation is isolated
- Route protection happens at layout/group level via middleware
- Public pages work without authentication

---

## 2.3 TENANT CONTEXT MODEL (WEB)

Rules:
- For `/dashboard/tenant/*` and `/dashboard/vendor/*`, tenant context is required
- Tenant context is resolved from:
  - session token claims (preferred), OR
  - selected tenant switcher (platform admin only), OR
  - active vendor’s tenant (vendor portal)
- Every data query must include tenant context implicitly via auth token
- The UI must never “guess” tenant_id in the client

Tenant switching is a portal-level capability (platform admin only).

---

## 2.4 WEB LAYERING MODEL (MIRRORS BACKEND)

Web is organized into:

1) **App Shell Layer**
- routing, layouts, navigation
- authentication gate
- portal-level providers (query client, theme)

2) **Domain UI Modules**
- per-domain data fetching hooks
- mutation hooks
- domain-specific components
- view-model adapters (DTO → UI types)

3) **Vertical UI Plugins**
- schema registry consumption
- attribute renderer system
- vertical filter builder
- vertical-specific UI metadata (labels/units)

4) **Infrastructure Layer**
- generated API client
- auth/session helpers
- query client config
- error normalization
- logging

Pages must not directly implement business logic.

---

## 2.5 AUTHORITATIVE FOLDER STRUCTURE (NEXT APP ROUTER)

This is the locked target structure. Items marked ✅ already EXIST in the template.
Items marked 🆕 will be CREATED during development sessions.

```
shadcn-template-refactor/
├── app/
│   ├── (public)/              # 🆕 Public pages (no auth required)
│   │   ├── page.tsx           # Home/landing
│   │   ├── search/            # Public search page
│   │   └── listing/[slug]/    # Public listing detail
│   ├── (auth)/                # 🆕 Auth pages (login, register, forgot-password)
│   │   ├── layout.tsx         # Guest-only layout (redirects authenticated users)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── session-expired/       # 🆕 Session expired page
│   ├── forbidden/             # 🆕 403 Forbidden page
│   ├── dashboard/             # ✅ All authenticated portals + UI kit template
│   │   ├── (auth)/            # ✅ Protected portal routes (shared layout)
│   │   │   ├── layout.tsx     # ✅ Shared sidebar/header layout (from template)
│   │   │   ├── page.tsx       # ✅ Default dashboard page
│   │   │   ├── platform/      # ✅ Platform Admin Portal (/dashboard/platform/*)
│   │   │   │   ├── page.tsx   # ✅ Dashboard (stub)
│   │   │   │   ├── tenants/   # 🆕
│   │   │   │   ├── plans/     # 🆕
│   │   │   │   ├── flags/     # 🆕
│   │   │   │   └── audit/     # 🆕
│   │   │   ├── tenant/        # ✅ Tenant Admin Portal (/dashboard/tenant/*)
│   │   │   │   ├── page.tsx   # ✅ Dashboard (stub)
│   │   │   │   ├── vendors/   # 🆕
│   │   │   │   ├── listings/  # 🆕
│   │   │   │   ├── reviews/   # 🆕
│   │   │   │   └── analytics/ # 🆕
│   │   │   ├── vendor/        # ✅ Vendor Portal (/dashboard/vendor/*)
│   │   │   │   ├── page.tsx   # ✅ Dashboard (stub)
│   │   │   │   ├── listings/  # 🆕
│   │   │   │   ├── inbox/     # 🆕
│   │   │   │   └── profile/   # 🆕
│   │   │   └── account/       # ✅ Customer Account Portal (/dashboard/account/*)
│   │   │       ├── page.tsx   # ✅ Dashboard (stub)
│   │   │       ├── profile/   # 🆕
│   │   │       ├── inquiries/ # 🆕
│   │   │       ├── saved/     # 🆕
│   │   │       └── settings/  # 🆕
│   │   ├── (guest)/           # ✅ Template demo pages (DESIGN REFERENCE ONLY)
│   │   │   ├── login/v1,v2/   # ✅ Login page design reference
│   │   │   ├── register/      # ✅ Register page design reference
│   │   │   └── reference/     # ✅ UI kit reference (error pages, etc.)
│   │   └── reference/         # ✅ UI kit reference pages (17+ sections)
│   ├── layout.tsx             # ✅ Root layout (ThemeProvider, fonts)
│   ├── not-found.tsx          # ✅ 404 page
│   └── providers.tsx          # 🆕 Global providers (QueryClient, Auth, Socket, etc.)
│
├── modules/                   # 🆕 Domain UI modules (to be created)
│   ├── auth/
│   ├── listing/
│   ├── vendor/
│   ├── tenant/
│   ├── interaction/
│   ├── review/
│   ├── subscription/
│   ├── analytics/
│   ├── audit/
│   ├── notification/
│   └── account/
│
├── verticals/                 # 🆕 Vertical UI plugins (to be created)
│   ├── registry/
│   ├── attribute-renderer/
│   └── filter-builder/
│
├── components/                # ✅ Reusable UI components (58+ pre-installed)
│   ├── ui/                    # ✅ shadcn/ui primitives (button, card, dialog, etc.)
│   ├── layout/                # ✅ Template layout (sidebar, header)
│   ├── forms/                 # 🆕 Form field wrappers
│   └── common/                # 🆕 Error boundaries, skeletons, etc.
│
├── lib/                       # ✅ Partial — extend with api/, auth/, query/, errors/
│   ├── api/                   # 🆕 API client, wrappers
│   ├── auth/                  # 🆕 Auth utilities
│   ├── query/                 # 🆕 TanStack Query setup
│   ├── errors/                # 🆕 Error normalization
│   ├── websocket/             # 🆕 Socket.IO client
│   ├── utils.ts               # ✅ cn() helper
│   ├── fonts.ts               # ✅ Font configuration
│   └── themes.ts              # ✅ Theme configuration
│
├── config/                    # 🆕 App configuration
│   └── navigation.ts          # 🆕 Portal navigation configs
│
├── hooks/                     # ✅ Template hooks (extend with domain hooks)
└── public/                    # ✅ Static assets
```

> **IMPORTANT: Template Reference Pages**
> The `app/dashboard/(guest)/` folder contains login/register pages from the shadcn template.
> These are DESIGN REFERENCE ONLY — copy their visual patterns but create actual auth pages
> at `app/(auth)/login/` and `app/(auth)/register/` with real auth logic.

Rules:
- Reuse components from `app/dashboard/` template (shadcn kit)
- Do not scatter UI primitives across modules
- Domain modules own hooks & domain UI, not base components
- `verticals/` is reserved for schema-driven listing UI extensions

---

## 2.6 TEMPLATE ADAPTATION RULES (CRITICAL)

The existing template is at `app/dashboard/` (shadcn UI kit).

Rules:
- **REUSE** components and patterns from `app/dashboard/`
- Copy/adapt layout shells, navigation, and UI components as needed
- Do not rebuild from scratch - leverage existing work
- Replace mock data with domain modules + API calls
- Keep UI consistent with template (spacing, typography, tokens)

Portal layouts should mirror the dashboard template's structure.

---

## 2.7 MODULE BOUNDARY RULES (WEB)

Rules:
- `app/*` routes must not call API client directly (except in server actions where explicitly allowed)
- All API interaction must go through `modules/*` hooks/services
- `components/*` must remain presentational (no API calls)
- `verticals/*` provides schema-driven rendering and must not fetch domain resources besides registry schema endpoints

No cross-module imports except via explicit public exports.

---

## 2.8 STATE MANAGEMENT RULES

We use:
- **TanStack Query** for server state (all API data)
- **Zustand** for minimal UI state only (sidebar state, selected portal filters, etc.)
- **React Hook Form + Zod** for form state

Rules:
- Do not store API data in Zustand
- Do not invent custom caching
- Do not use Redux

---

## 2.9 ERROR HANDLING & UX STATES (BASELINE)

Every page must define:
- Loading state
- Empty state
- Error state
- Retry action

Error normalization happens in `lib/errors/` and is consumed by UI.

No silent failures.

---

## 2.10 ACCESS CONTROL PLACEMENT (ROUTE GUARDS)

Rules:
- Portal layouts enforce base role checks
- Sensitive pages enforce additional permission/entitlement checks
- UI actions (buttons) must also check entitlements to avoid false affordances
- API must still enforce server-side (UI checks are not enough)

---

## 2.11 EXECUTION DIRECTIVE

All subsequent web parts must:
- Follow this folder structure
- Keep pages thin and modules thick
- Preserve template UI consistency
- Maintain core vs vertical separation (schema-driven attributes)

END OF WEB PART 2.