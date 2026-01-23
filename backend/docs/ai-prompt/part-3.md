# PART 3 — REPOSITORY STRUCTURE, TOOLING & BUILD DISCIPLINE (LOCKED)

This part defines the **physical repository skeleton** and the **tooling rules**.
All implementation must conform exactly.

All rules from PART 0–2 apply.

---

## 3.1 PACKAGE MANAGER (MANDATORY)

- Package manager is **pnpm** (only).

Rules:
- `pnpm-lock.yaml` must be committed
- No npm or yarn usage
- No mixed lockfiles
- Workspace usage must be explicit and consistent

Any PR with non-pnpm tooling is rejected.

---

## 3.2 REPOSITORY STRUCTURE (AUTHORITATIVE)

Repository root structure:

/
├── apps/
│ └── api/ # NestJS backend
│ ├── src/
│ ├── test/
│ ├── prisma/
│ └── Dockerfile
├── packages/
│ ├── shared/ # shared helpers (no business logic)
│ └── config/ # shared config schema/types
├── infra/
│ ├── docker/ # compose, service defs
│ └── nginx/ # reverse proxy config
├── scripts/ # dev scripts, db helpers
├── .github/
│ └── workflows/ # CI pipelines
├── pnpm-workspace.yaml
├── package.json
├── pnpm-lock.yaml
└── README.md

yaml
Copy code

Rules:
- All backend code lives in `apps/api`
- Shared packages must remain business-agnostic
- No domain logic outside `apps/api/src`

---

## 3.3 BACKEND SOURCE STRUCTURE (apps/api/src)

Authoritative structure:

src/
├── main.ts
├── app.module.ts
├── config/
├── common/
├── infrastructure/
├── core/ # vertical-agnostic marketplace core
├── verticals/ # vertical modules (property, cars, etc.)
├── modules/ # cross-cutting modules (billing, notifications, etc.)
└── health/

yaml
Copy code

Definitions:
- `core/` = generic marketplace engine (no vertical assumptions)
- `verticals/` = vertical plugins (real-estate, vehicles, goods, etc.)
- `modules/` = cross-cutting capabilities (auth, entitlements, analytics, etc.)
- `infrastructure/` = external system adapters (db, redis, queue, opensearch, s3)

Forbidden:
- Mixing vertical logic into `core/`
- Mixing core logic into `verticals/`

---

## 3.4 CODE STYLE & CONSISTENCY

Rules:
- TypeScript strict mode must be enabled
- Consistent naming:
  - folders: kebab-case
  - classes: PascalCase
  - variables/functions: camelCase
- No “utils” dumping grounds
- Explicit types over implicit any

---

## 3.5 DATABASE & PRISMA LAYOUT

apps/api/prisma/
├── schema.prisma
├── migrations/
└── seed.ts

yaml
Copy code

Rules:
- Single Prisma schema (no per-vertical schemas)
- Migrations are mandatory
- Seed scripts are deterministic
- No runtime migrations

---

## 3.6 LOCAL DEV INFRA (DOCKER)

Local dev must support:
- Postgres
- Redis
- OpenSearch
- S3-compatible storage (optional local)
- API service

Rules:
- Docker compose files must live in `infra/docker/`
- App remains stateless
- No reliance on local filesystem for persistence

---

## 3.7 OPENAPI / SWAGGER (MANDATORY)

OpenAPI is a required contract layer.

Rules:
- Swagger must be generated from NestJS decorators
- Every controller endpoint must be documented
- Every DTO must reflect correct schema
- Auth schemes must be documented
- Versioning must be visible in docs
- Swagger must be toggleable via configuration per environment

Undocumented endpoints are forbidden.

---

## 3.8 CI/CD BASELINE (GITHUB ACTIONS)

Minimum pipeline requirements:
- Install via pnpm
- Lint
- Type check
- Unit tests
- Build

Rules:
- CI must be deterministic
- CI must fail fast on type errors
- No environment secrets in logs

---

## 3.9 BUILD & RUN DISCIPLINE

Rules:
- Every part that introduces structure must end with:
  - sanity check
  - build/run discipline statement

During implementation:
- Run lint + typecheck + tests before declaring completion
- No “it should work” claims
- No placeholder TODOs

---

## 3.10 FORBIDDEN TOOLING PRACTICES

You must not:
- Introduce alternative package managers
- Skip CI checks
- Commit generated secrets
- Add heavyweight frameworks without spine amendment

---

## 3.11 EXECUTION DIRECTIVE

All work must:
- Respect the folder boundaries
- Keep core vertical-agnostic
- Keep verticals isolated
- Keep tooling deterministic via pnpm and CI

END OF PART 3.