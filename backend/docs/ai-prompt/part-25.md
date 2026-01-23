# PART 25 — INFRASTRUCTURE, ENVIRONMENTS & DEPLOYMENT STRATEGY (LOCKED)

This part defines how the platform is deployed, scaled, and operated
across environments using modern DevOps practices.

All rules from PART 0–24 apply.

---

## 25.1 INFRASTRUCTURE PHILOSOPHY

Infrastructure must be:
- Reproducible
- Environment-isolated
- Horizontally scalable
- Observable
- Secure by default

Manual snowflake servers are forbidden.

---

## 25.2 SUPPORTED ENVIRONMENTS

The platform must support:
- Local development
- Staging / UAT
- Production

Rules:
- Each environment is isolated
- No shared state between environments
- Config differences are explicit

---

## 25.3 CONTAINERIZATION (MANDATORY)

Rules:
- All services run in Docker containers
- Images must be immutable
- Images must be versioned
- Secrets must not be baked into images

Local and production parity is required.

---

## 25.4 SERVICE TOPOLOGY

Typical services:
- API (NestJS)
- Worker (BullMQ)
- Search (OpenSearch)
- Database (PostgreSQL)
- Cache (Redis)
- Object Storage (S3-compatible)

Rules:
- Stateless services preferred
- Horizontal scaling must be supported
- Background workers are separate processes

---

## 25.5 DATABASE STRATEGY

Rules:
- PostgreSQL is the source of truth
- Migrations must be versioned
- Backups must be automated
- Read replicas supported where needed

Schema changes must be controlled.

---

## 25.6 CACHE & QUEUE STRATEGY

Rules:
- Redis used for caching and queues
- BullMQ for background jobs
- Queue workers must be scalable
- Job failures must be observable

Queues must not become silent failure points.

---

## 25.7 SEARCH INFRASTRUCTURE

Rules:
- OpenSearch clusters must be monitored
- Index backups must exist
- Reindexing must be supported
- Index versioning mandatory

Search downtime must not affect writes.

---

## 25.8 NETWORKING & EDGE

Rules:
- Nginx used as reverse proxy
- TLS everywhere
- CDN (Cloudflare) for static & media
- Rate limiting at edge and app layers

Security starts at the edge.

---

## 25.9 SECRETS & CONFIG MANAGEMENT

Rules:
- Secrets stored in secure vaults
- Environment variables for configuration
- No secrets in code or repos
- Rotation must be supported

---

## 25.10 CI/CD PIPELINE (MANDATORY)

Rules:
- CI/CD via GitHub Actions
- Steps include:
  - Lint
  - Test
  - Build
  - Security scan
  - Deploy
- Deployments must be automated

Manual deployments are forbidden.

---

## 25.11 DEPLOYMENT STRATEGY

Supported strategies:
- Rolling deployments
- Blue/green deployments
- Canary releases (optional)

Deployments must be reversible.

---

## 25.12 OBSERVABILITY

Rules:
- Centralized logging
- Metrics collection
- Distributed tracing
- Health checks & readiness probes

You must know when things break.

---

## 25.13 DISASTER RECOVERY

Rules:
- Regular backups
- Restore procedures tested
- RPO/RTO defined
- Incident runbooks documented

Hope is not a strategy.

---

## 25.14 COST MANAGEMENT

Rules:
- Resource usage must be visible
- Budgets and alerts must exist
- Overprovisioning must be avoided

Scalability without cost awareness is failure.

---

## 25.15 FORBIDDEN PRACTICES

You must not:
- SSH into production for fixes
- Modify infrastructure manually
- Skip migrations
- Deploy without CI/CD

---

## 25.16 EXECUTION DIRECTIVE

Infrastructure must:
- Support rapid change
- Remain secure and observable
- Scale horizontally
- Fail predictably

Good architecture dies without good infrastructure.

END OF PART 25.