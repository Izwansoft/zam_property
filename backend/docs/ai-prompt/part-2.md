# PART 2 — ARCHITECTURAL PRINCIPLES & SYSTEM SHAPE (LOCKED)

This part defines the **fundamental architectural principles** and the **overall system shape**.
All design and implementation decisions must comply with this part.

All rules from PART 0 and PART 1 apply.

---

## 2.1 ARCHITECTURAL GOALS

The architecture must:
- Support multiple business verticals
- Enforce strong domain boundaries
- Scale without architectural rewrites
- Enable safe AI-assisted development
- Minimise coupling and maximise replaceability

Correctness and longevity are prioritised over short-term speed.

---

## 2.2 ARCHITECTURAL STYLE (AUTHORITATIVE)

The platform uses a:

**Modular Monolith with Event-Driven Internals**

Definitions:
- One deployable backend application
- Clear module boundaries
- Independent domains within a single runtime
- Asynchronous communication via domain events

Microservices are explicitly forbidden at this stage.

---

## 2.3 CORE SYSTEM LAYERS

The backend is organised into the following layers:

1. **API Layer**
   - HTTP controllers
   - Request validation
   - Authentication & guards
   - OpenAPI / Swagger exposure

2. **Application Layer**
   - Use cases
   - Orchestration
   - Transactions
   - Command & query coordination

3. **Domain Layer**
   - Business rules
   - Domain entities
   - Domain services
   - Vertical logic

4. **Infrastructure Layer**
   - Database access
   - External services
   - Caching
   - Queues
   - Search adapters

Layer crossing rules are strictly enforced.

---

## 2.4 DOMAIN MODULARITY RULE

Rules:
- Each domain lives in its own module
- Modules communicate only via events or explicit interfaces
- No direct imports between unrelated domains
- Shared utilities must be explicitly marked as shared

Violating modularity is forbidden.

---

## 2.5 EVENT-DRIVEN INTERNAL COMMUNICATION

Events are used for:
- Side effects
- Cross-domain reactions
- Asynchronous workflows

Rules:
- Events are immutable
- Events represent facts, not commands
- Event handlers must be idempotent
- No circular event dependencies

Synchronous domain calls must be minimized.

---

## 2.6 SYNCHRONOUS VS ASYNCHRONOUS RULES

Synchronous:
- Validation
- Authorization
- Core business invariants

Asynchronous:
- Notifications
- Search indexing
- Analytics
- Usage tracking
- External integrations

Blocking on side effects is forbidden.

---

## 2.7 TRANSACTIONAL BOUNDARIES

Rules:
- Transactions are scoped to a single domain
- Cross-domain consistency is eventual
- Events are published after successful commits
- Distributed transactions are forbidden

Consistency is managed via retries and idempotency.

---

## 2.8 VERTICAL-AGNOSTIC CORE SHAPE

The core system must:
- Know nothing about specific verticals
- Expose extension points for vertical logic
- Treat listings generically
- Delegate validation and rules to vertical modules

Vertical modules plug into the core via contracts.

---

## 2.9 EXTENSION MODEL (VERTICAL MODULES)

Vertical modules:
- Implement defined interfaces
- Register attribute schemas
- Register validation rules
- Register search mappings
- Register workflows

Core must never import vertical code directly.

---

## 2.10 FAILURE & RESILIENCE MODEL

Rules:
- Fail fast on core invariants
- Retry asynchronous operations
- Circuit-break external dependencies
- Degrade gracefully where possible

Silent failures are forbidden.

---

## 2.11 OBSERVABILITY & TRACEABILITY

The system must support:
- Structured logging
- Correlation IDs
- Event tracing
- Error categorisation

Observability is not optional.

---

## 2.12 PERFORMANCE PRINCIPLES

Rules:
- Cache reads aggressively
- Avoid N+1 queries
- Use async jobs for heavy work
- Search queries must not hit the DB

Premature optimisation is forbidden, but obvious inefficiencies are not allowed.

---

## 2.13 SECURITY PRINCIPLES

Rules:
- Deny by default
- Explicit permissions
- Tenant isolation at every layer
- Input validation at boundaries

Security must not be bolted on later.

---

## 2.14 EXECUTION DIRECTIVE

All future structure, module design, and implementation:
- Must conform to this system shape
- Must preserve modular boundaries
- Must support vertical expansion

Any deviation requires a spine amendment.

END OF PART 2.
