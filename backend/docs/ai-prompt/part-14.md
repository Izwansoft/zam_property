# PART 14 — WORKFLOWS, STATE MACHINES & LONG-RUNNING PROCESSES (LOCKED)

This part defines how **complex, multi-step processes** are handled safely
without turning the system into a tangle of conditionals.

All rules from PART 0–13 apply.

---

## 14.1 WORKFLOW PHILOSOPHY

Workflows:
- Represent business processes over time
- Are driven by state transitions and events
- Must be explicit, observable, and recoverable
- Must tolerate partial failure

Implicit workflows are forbidden.

---

## 14.2 STATE MACHINE PRINCIPLE

Rules:
- All long-lived entities must have explicit states
- State transitions must be validated
- Invalid transitions must be rejected
- State transitions must emit events

State machines are the only allowed control mechanism.

---

## 14.3 SUPPORTED WORKFLOW TYPES

The platform must support workflows for:
- Listing lifecycle extensions
- Vendor onboarding & approval
- Booking confirmation flows
- Review moderation
- Subscription lifecycle
- Compliance & verification processes

Each workflow must be explicitly modeled.

---

## 14.4 WORKFLOW OWNERSHIP

Rules:
- Core workflows live in core modules
- Vertical-specific workflows live in vertical modules
- Workflows must not span ownership boundaries
- Cross-domain workflows communicate via events

No workflow may directly mutate another domain.

---

## 14.5 IMPLEMENTATION MODEL

Rules:
- Workflows are implemented as:
  - State machines
  - Event handlers
  - Background jobs
- No hidden orchestration logic
- No deeply nested conditional logic

Readability and predictability are mandatory.

---

## 14.6 LONG-RUNNING PROCESS HANDLING

Rules:
- Long-running steps must be async
- Each step must be idempotent
- Progress must be persistable
- Workflows must be resumable

Retries must not corrupt state.

---

## 14.7 FAILURE & COMPENSATION

Rules:
- Failures must be explicit
- Compensating actions must be defined
- Partial completion must be detectable
- Manual intervention must be possible

Silent workflow corruption is forbidden.

---

## 14.8 EVENT EMISSION (MANDATORY)

Rules:
- Each state transition emits an event
- Events must include previous and new state
- Events must include tenant context
- Events must be immutable

Workflows are observable via events.

---

## 14.9 VERTICAL WORKFLOW EXTENSIONS

Vertical modules MAY:
- Extend workflows with additional states
- Add approval steps
- Add domain-specific checks

Rules:
- Core invariants must not be broken
- Vertical workflows must be registered
- Workflow diagrams must be documented

---

## 14.10 VISIBILITY & MONITORING

Rules:
- Workflow state must be queryable
- Admins must inspect workflow progress
- Stuck workflows must be detectable
- Metrics must exist for workflow health

---

## 14.11 FORBIDDEN PRACTICES

You must not:
- Encode workflows in controllers
- Hide state transitions in services
- Rely on time-based hacks
- Mutate state without emitting events

---

## 14.12 EXECUTION DIRECTIVE

All complex processes must:
- Be explicitly modeled as workflows
- Use state machines
- Be event-driven
- Be resilient to failure

If you can’t diagram it, you can’t build it.

END OF PART 14.