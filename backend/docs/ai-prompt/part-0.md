# PART 0 — GLOBAL RULES, AI GOVERNANCE & SPINE AUTHORITY (LOCKED)

This document defines the **absolute, non-negotiable rules** governing the development of the platform.

All subsequent parts (PART 1 onward) are subordinate to this part.
If any instruction conflicts with PART 0, PART 0 ALWAYS WINS.

---

## 0.1 PROJECT IDENTITY

This project is a **VERTICAL-AGNOSTIC MULTI-TENANT MARKETPLACE PLATFORM**.

It is NOT:
- A property system
- A car system
- An electronics system
- A single-industry application

It IS:
- A reusable marketplace engine
- Supporting multiple business verticals via modular extensions
- Designed for long-term expansion without architectural refactor

---

## 0.2 SPINE-FIRST DEVELOPMENT RULE

This project follows a **SPINE ARCHITECTURE APPROACH**.

Rules:
1. Architecture is defined FIRST
2. Structure is locked BEFORE implementation
3. Modules attach to the spine, never reshape it
4. No implementation may violate spine rules
5. Any change requires updating the spine first

Skipping or bypassing the spine is forbidden.

---

## 0.3 AI BEHAVIOUR & GOVERNANCE (CRITICAL)

Any AI agent (Copilot, ChatGPT, Cursor, etc.) involved in this project MUST:

### MUST DO
- Follow parts in order (PART 0 → PART N)
- Respect all constraints explicitly stated
- Ask for clarification ONLY when rules are ambiguous
- Use existing structures and patterns
- Prefer explicitness over convenience

### MUST NOT DO
- Invent new architecture
- Simplify designs for speed
- Merge modules arbitrarily
- Introduce new frameworks or stacks
- Refactor across parts without instruction
- “Improve” architecture on its own initiative

AI is an **executor**, not a co-architect.

---

## 0.4 ARCHITECTURAL STYLE (LOCKED)

The platform uses:
- **Modular Monolith**
- **Event-driven internal communication**
- **Async-first for side effects**
- **Strong domain boundaries**
- **Vertical-agnostic core + pluggable vertical modules**

Microservices are explicitly forbidden at this stage.

---

## 0.5 TECHNOLOGY STACK AUTHORITY

The backend stack is LOCKED unless explicitly revised later:

- Runtime: Node.js (20+)
- Framework: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Cache: Redis
- Queue: BullMQ
- Search: OpenSearch
- Storage: S3-compatible
- CDN: Cloudflare
- Infra: Docker + Nginx
- Package Manager: pnpm
- CI/CD: GitHub Actions
- API Docs: OpenAPI / Swagger

No substitutions allowed without spine amendment.

---

## 0.6 MULTI-TENANCY AS A FIRST-CLASS RULE

The system is **multi-tenant by design**, not by convention.

Rules:
- Every domain entity must be tenant-aware
- Cross-tenant access is forbidden by default
- Tenant isolation is enforced at service and data level
- Monetisation, entitlements, and limits are tenant-scoped

Single-tenant assumptions are forbidden.

---

## 0.7 VERTICAL-AGNOSTIC PRINCIPLE

The platform core must:
- Contain ZERO business-specific assumptions
- Know nothing about “property”, “car”, etc.
- Treat all listings generically

Business-specific logic lives ONLY in:
- Vertical modules
- Attribute schemas
- Validation rules
- Search mappings

Hardcoding vertical logic in core is forbidden.

---

## 0.8 DOMAIN BOUNDARY ENFORCEMENT

Rules:
- Controllers are thin
- Services contain business logic
- Repositories handle persistence
- No cross-module imports
- Inter-module communication uses events

Violating domain boundaries is forbidden.

---

## 0.9 DATA MODEL RULES

Rules:
- One logical PostgreSQL database
- Shared core tables
- Polymorphic listing model
- Vertical attributes stored as JSONB
- Strong validation at domain boundaries

Creating separate databases per vertical is forbidden.

---

## 0.10 MONETISATION & BILLING SEPARATION

Rules:
- Access is controlled via entitlements
- Billing providers are adapters only
- Domains must be billing-agnostic
- Monetisation logic must not leak into domains

Payments are an implementation detail, not a core dependency.

---

## 0.11 SEARCH & DISCOVERY RULE

Rules:
- Search is externalized (OpenSearch)
- Core does not assume search structure
- Vertical modules define search mappings
- Ranking logic is centralized

Search logic must not leak into domains.

---

## 0.12 CHANGE MANAGEMENT RULE

Any of the following requires a **new spine amendment**:
- Stack change
- Architectural shift
- New execution model
- Fundamental domain change

Ad-hoc changes are forbidden.

---

## 0.13 EXECUTION DIRECTIVE

If at any point instructions:
- Are incomplete
- Are contradictory
- Would violate this spine

The AI MUST stop and request clarification.

---

## 0.14 FINAL AUTHORITY

This spine represents the **authoritative source of truth**.

Speed is secondary.  
Correctness is mandatory.  
Long-term maintainability is non-negotiable.

END OF PART 0.
