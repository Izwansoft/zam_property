# PART 26 — TESTING STRATEGY, QUALITY GATES & RELEASE DISCIPLINE (LOCKED)

This part defines how quality, stability, and confidence are enforced
across the platform while maintaining development velocity.

All rules from PART 0–25 apply.

---

## 26.1 QUALITY PHILOSOPHY

Quality is:
- Built-in, not inspected-in
- Enforced automatically
- Measured continuously
- Non-negotiable for production

Speed without quality is technical debt.

---

## 26.2 TESTING PYRAMID (AUTHORITATIVE)

The platform must follow this testing distribution:

- **Unit Tests** (largest share)
- **Integration Tests**
- **API / Contract Tests**
- **E2E Tests** (smallest share)

Over-reliance on E2E tests is forbidden.

---

## 26.3 UNIT TESTS

Rules:
- Cover pure business logic
- Mock external dependencies
- Fast and deterministic
- Required for all services, validators, and policies

Unit tests must run on every commit.

---

## 26.4 INTEGRATION TESTS

Rules:
- Test module boundaries
- Use real infrastructure where feasible (DB, Redis)
- Validate data contracts
- Cover critical workflows

Integration tests must not rely on external SaaS.

---

## 26.5 API & CONTRACT TESTS

Rules:
- Validate API request/response schemas
- Ensure OpenAPI matches implementation
- Prevent breaking changes
- Verify error formats and auth rules

API contracts are promises.

---

## 26.6 END-TO-END (E2E) TESTS

Rules:
- Cover only critical user journeys
- Run against staging or ephemeral environments
- Avoid fragile UI-based flows where possible
- Keep execution time bounded

E2E tests are confidence checks, not safety nets.

---

## 26.7 TEST DATA & FIXTURES

Rules:
- Deterministic fixtures required
- No reliance on shared mutable state
- Test data must be disposable
- Seed scripts must be versioned

Flaky data equals flaky tests.

---

## 26.8 QUALITY GATES (MANDATORY)

Before merge or deploy:
- All tests must pass
- Linting must pass
- Type checks must pass
- Security scans must pass
- Coverage thresholds must be met

No green pipeline, no merge.

---

## 26.9 COVERAGE REQUIREMENTS

Rules:
- Minimum coverage thresholds defined
- Critical paths require higher coverage
- Coverage must not be gamed

Coverage is a signal, not a goal.

---

## 26.10 RELEASE DISCIPLINE

Rules:
- Releases must be tagged and versioned
- Changelogs must be generated
- Breaking changes require version bumps
- Rollback procedures must exist

Shipping must be deliberate.

---

## 26.11 ENVIRONMENT PROMOTION FLOW

Rules:
- Local → Staging → Production
- No skipping environments
- Promotions must be automated
- Manual hotfixes forbidden

Production is earned, not assumed.

---

## 26.12 REGRESSION & INCIDENT LEARNING

Rules:
- Bugs require regression tests
- Incidents require postmortems
- Learnings must feed back into tests

Every failure improves the system.

---

## 26.13 PERFORMANCE & LOAD TESTING

Rules:
- Load tests required for major releases
- Bottlenecks must be identified early
- Baselines must be recorded

Performance regressions are failures.

---

## 26.14 FORBIDDEN PRACTICES

You must not:
- Merge failing pipelines
- Disable tests to ship faster
- Rely on manual QA only
- Skip versioning for convenience

---

## 26.15 EXECUTION DIRECTIVE

Quality must:
- Be automated
- Be enforced
- Be visible
- Improve continuously

Fast teams ship safely. Slow teams ship bugs.

END OF PART 26.