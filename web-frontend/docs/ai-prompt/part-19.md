# FRONTEND (WEB) — PART 19 — ENV CONFIG, BUILD/DEPLOY SETUP & RUNTIME CONFIGURATION (LOCKED)

This part defines how the Next.js dashboard is configured and deployed:
- environment variables and config model
- build-time vs runtime configuration
- deployment strategy and constraints
- security rules for secrets
- integration with backend base URLs and OpenAPI generation

All rules from WEB PART 0–18 apply fully.

---

## 19.1 CONFIG PHILOSOPHY

Rules:
- Config is explicit, validated, and environment-specific
- Secrets never enter the repo
- Build and runtime config must be distinguishable
- Local/staging/prod parity is required

No hardcoded endpoints.

---

## 19.2 ENVIRONMENTS (AUTHORITATIVE)

The web app must support:
- Local development
- Staging/UAT
- Production

Rules:
- No shared cookies/sessions across environments
- Base URLs must be environment-specific
- Feature flags and registry availability differ by environment

---

## 19.3 REQUIRED ENV VARIABLES (BASELINE)

The web app must define (names are conceptual; finalize in implementation):

Core:
- `NEXT_PUBLIC_APP_ENV` = `local|staging|prod`
- `NEXT_PUBLIC_API_BASE_URL` (if using absolute URL)
- `NEXT_PUBLIC_PORTAL_NAME` (optional display)
- `NEXT_PUBLIC_SENTRY_DSN` (optional)
- `NEXT_PUBLIC_ENABLE_OPS_UI` (optional)

Server-only (never exposed to client):
- `API_INTERNAL_BASE_URL` (if server needs internal routing)
- `OPENAPI_SPEC_URL` (for generation)
- `SENTRY_AUTH_TOKEN` (CI only if used)

Rules:
- Anything prefixed `NEXT_PUBLIC_` is visible to browser
- Secrets must never use `NEXT_PUBLIC_`

---

## 19.4 CONFIG VALIDATION (MANDATORY)

Rules:
- Validate env vars at startup using Zod
- Fail fast on missing/invalid config
- Provide clear error messages

Config validation must run in:
- dev
- build
- production startup

---

## 19.5 BUILD-TIME VS RUNTIME CONFIG RULES

Rules:
- Build-time config affects:
  - Next build output
  - environment-dependent routes/flags (limited)
- Runtime config affects:
  - API base URL (preferred runtime)
  - logging endpoints
  - feature toggles (via backend flags, not env)

Avoid rebuilding for minor config changes where possible.

---

## 19.6 API BASE URL STRATEGY (LOCKED)

Rules:
- All API calls go through `lib/api/*` wrapper
- Wrapper resolves base URL from config safely
- In browser:
  - prefer same-origin proxy routes when possible
- In server:
  - allow internal base URL override for performance

Do not sprinkle base URLs across modules.

---

## 19.7 OPTIONAL: BFF / PROXY ROUTES (RECOMMENDED)

To simplify CORS and cookie auth:
- Use Next.js route handlers as a lightweight proxy:
  - `/api/proxy/*` → forwards to backend
- Forward:
  - cookies
  - headers
  - request IDs

Rules:
- Proxy must not implement business logic
- Proxy must not store PII
- Proxy must be auditable and minimal

If backend already shares domain with frontend, proxy may be skipped.

---

## 19.8 OPENAPI GENERATION IN PIPELINE (ALIGNED WITH WEB PART 3)

Rules:
- OpenAPI spec URL is environment-configured (usually staging)
- `pnpm api:gen` must run in CI or prebuild step
- Generated output must be committed OR generated during build (choose one consistently)

Recommended:
- Commit generated client for reproducibility
- Regenerate on spec change via CI check

No “generated drift” allowed.

---

## 19.9 DEPLOYMENT STRATEGY

Rules:
- Use automated CI/CD (GitHub Actions)
- Deployments must be repeatable
- Prefer:
  - preview deployments for PRs
  - staging deployments for release candidates
  - production deployments for tagged releases

Rollback must be possible (platform dependent).

---

## 19.10 STATIC ASSETS & CDN

Rules:
- Static assets served via Next + CDN (if configured)
- Avoid bundling large media assets
- Use CDN for uploaded media (S3+Cloudflare) by URL, not bundled assets

---

## 19.11 SECURITY RULES (CRITICAL)

Rules:
- Never log secrets
- Never expose internal URLs in client config if avoidable
- Protect admin portals via backend auth + route guards
- Prevent open redirect vulnerabilities in login redirect flows
- Ensure CSP/headers (platform dependent; recommended)

---

## 19.12 OBSERVABILITY (OPTIONAL BUT RECOMMENDED)

If using error tracking:
- Capture:
  - route errors
  - requestId correlation
  - portal context
- Mask PII in logs and error reports

---

## 19.13 FORBIDDEN PRACTICES

You must not:
- Hardcode API URLs in modules/pages
- Put secrets in `NEXT_PUBLIC_` vars
- Skip config validation
- Deploy manually without CI
- Regenerate OpenAPI client silently without checks

---

## 19.14 EXECUTION DIRECTIVE

Web deployment must:
- be environment-safe
- be config-driven and validated
- integrate cleanly with backend contracts
- remain secure and observable

Reliable config is production stability.

END OF WEB PART 19.