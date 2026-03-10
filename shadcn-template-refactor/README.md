# Zam-Property — Web Frontend

> Multi-tenant property marketplace dashboard built with Next.js 16, React 19, and shadcn/ui.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
  - [Docker](#docker)
  - [Vercel](#vercel)
  - [Node.js (Standalone)](#nodejs-standalone)
- [Security Headers](#security-headers)
- [Backend Integration](#backend-integration)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 22 |
| pnpm | ≥ 9 |
| Backend API | Running at `http://localhost:3000` |

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd shadcn-template-refactor

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Edit .env.local with your values (see "Environment Variables" below)

# 5. Start the development server
pnpm dev

# 6. Open http://localhost:3001 in your browser
```

---

## Environment Variables

All environment variables are validated at startup via Zod (`lib/config/env.ts`).
Missing or invalid variables will cause a **fail-fast** error with clear messages.

### Client-side (exposed to browser)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_ENV` | `local` | `local` \| `staging` \| `production` |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3000/api/v1` | Backend API URL (browser-facing) |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3000` | WebSocket server URL (Socket.IO root) |
| `NEXT_PUBLIC_PORTAL_NAME` | `Zam-Property` | Portal branding name |
| `NEXT_PUBLIC_API_MOCKING` | `false` | Enable MSW mock server (`true`/`false`) |
| `NEXT_PUBLIC_ENABLE_OPS_UI` | `false` | Enable Ops admin tools |
| `NEXT_PUBLIC_SENTRY_DSN` | _(empty)_ | Sentry DSN for client error tracking |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | _(empty)_ | Google Analytics GA4 ID |

### Server-only (NEVER prefix with `NEXT_PUBLIC_`)

| Variable | Default | Description |
|----------|---------|-------------|
| `API_INTERNAL_BASE_URL` | `http://localhost:3000/api/v1` | Internal API for SSR (can use internal DNS) |
| `OPENAPI_SPEC_URL` | `http://localhost:3000/api/docs-json` | OpenAPI spec for code generation |
| `SENTRY_AUTH_TOKEN` | _(none)_ | Sentry auth token for source-map upload (CI) |

> **Security rule:** Secrets must **NEVER** use the `NEXT_PUBLIC_` prefix.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server (port 3001) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run all Vitest tests |
| `pnpm test:unit` | Run unit tests only (excludes e2e) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run Playwright E2E tests |

---

## Project Structure

```
shadcn-template-refactor/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Guest-only pages (login, register)
│   ├── (public)/           # Public pages (search, listings, vendors)
│   ├── dashboard/(auth)/   # Authenticated portal pages
│   │   ├── platform/       # Platform Admin (SUPER_ADMIN)
│   │   ├── tenant/         # Tenant Admin
│   │   ├── vendor/         # Vendor Portal
│   │   └── account/        # Customer Account
│   └── dashboard/(guest)/  # Design reference pages
├── components/             # Shared UI components (shadcn/ui + custom)
├── config/                 # Navigation config, route mappings
├── hooks/                  # Custom React hooks
├── lib/                    # Core utilities
│   ├── api/                # Axios client, response types
│   ├── auth/               # Auth utilities, route config
│   ├── config/             # Environment config (Zod-validated)
│   ├── errors/             # Error normalisation
│   ├── mocks/              # MSW handlers
│   ├── performance/        # Web Vitals, optimised components
│   ├── query/              # TanStack Query setup, key factories
│   └── websocket/          # Socket.IO client
├── modules/                # Domain modules (auth, listing, vendor, etc.)
├── verticals/              # Pluggable vertical system (real-estate, etc.)
├── test/                   # Test utilities (setup, factories, providers)
├── e2e/                    # Playwright E2E tests
└── public/                 # Static assets
```

---

## Deployment

### Docker

The project includes a multi-stage Dockerfile optimised for production.

```bash
# Build the image (pass NEXT_PUBLIC_* as build args)
docker build \
  --build-arg NEXT_PUBLIC_APP_ENV=production \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.zam-property.com/api/v1 \
  --build-arg NEXT_PUBLIC_WS_URL=https://api.zam-property.com \
  --build-arg NEXT_PUBLIC_PORTAL_NAME=Zam-Property \
  -t zam-property-web .

# Run the container
docker run -p 3001:3001 \
  -e API_INTERNAL_BASE_URL=http://api:3000/api/v1 \
  zam-property-web
```

**Build args vs runtime env:**
- `NEXT_PUBLIC_*` variables are baked into the JS bundle at build time → pass as `--build-arg`.
- Server-only variables (`API_INTERNAL_BASE_URL`, etc.) → pass as `-e` at runtime.

### Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.
Vercel handles `NEXT_PUBLIC_*` injection at build time automatically.

### Node.js (Standalone)

```bash
# 1. Build with standalone output
NEXT_PUBLIC_APP_ENV=production pnpm build

# 2. Copy static assets to standalone output
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# 3. Start the server
cd .next/standalone
PORT=3001 HOSTNAME=0.0.0.0 node server.js
```

---

## Security Headers

The following security headers are configured in `next.config.ts`:

| Header | Value |
|--------|-------|
| Content-Security-Policy | Restrictive CSP (scripts, styles, images, connections) |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| X-XSS-Protection | `1; mode=block` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | Disables camera, microphone, geolocation, browsing-topics |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` (production only) |
| Cross-Origin-Opener-Policy | `same-origin` |
| Cross-Origin-Resource-Policy | `same-origin` |

The `X-Powered-By` header is disabled to reduce fingerprinting.

---

## Portal Routes

| Portal | URL Prefix | Roles Required |
|--------|-----------|----------------|
| Platform Admin | `/dashboard/platform/` | `SUPER_ADMIN` |
| Tenant Admin | `/dashboard/tenant/` | `SUPER_ADMIN`, `TENANT_ADMIN` |
| Vendor | `/dashboard/vendor/` | `VENDOR_ADMIN`, `VENDOR_STAFF` |
| Customer Account | `/dashboard/account/` | Any authenticated user |
| Public Pages | `/` | None (guest accessible) |
| Auth Pages | `/login`, `/register`, `/forgot-password` | Guest only (redirects if logged in) |

See [ARCHITECTURE.md](ARCHITECTURE.md) for folder boundaries, vertical schema-driven concept, and key conventions.

---

## OpenAPI Client Regeneration

If the backend OpenAPI spec changes, regenerate the typed client:

```bash
# Ensure backend is running at http://localhost:3000
pnpm openapi:generate
```

This reads the spec from `OPENAPI_SPEC_URL` (default: `http://localhost:3000/api/docs-json`) and outputs typed definitions used by `lib/api/`.

---

## Backend Integration

| Item | URL |
|------|-----|
| Backend API | `http://localhost:3000/api/v1` |
| Swagger Docs | `http://localhost:3000/api/docs` |
| WebSocket | `http://localhost:3000` (Socket.IO) |
| API Registry | `docs/API-REGISTRY.md` |

The frontend communicates with the backend exclusively through `lib/api/client.ts`.
All API base URLs are resolved from validated environment config — never hardcoded in modules.

---

## Minimum System Requirements

- Node.js ≥ 22
- 2 GB RAM (for `next build`)
- Docker 24+ (for container deployment)

Note: If you experience problems with versions above Node.js v20, please replace with version v20.