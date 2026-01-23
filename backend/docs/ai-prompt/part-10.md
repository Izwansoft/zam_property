# PART 10 — MEDIA, ASSETS & CDN STRATEGY (LOCKED)

This part defines how files, images, videos, and other assets are handled
across the platform in a secure, scalable, and vertical-agnostic way.

All rules from PART 0–9 apply.

---

## 10.1 MEDIA PHILOSOPHY

Media is:
- Shared infrastructure
- Not business logic
- Not vertical-specific
- Treated as metadata + object storage

Media must never drive core workflows.

---

## 10.2 SUPPORTED MEDIA TYPES

The platform must support:
- Images (JPEG, PNG, WebP)
- Videos (MP4, streaming-ready)
- Documents (PDF, DOC)
- Other binary assets (configurable)

Unsupported formats must be rejected explicitly.

---

## 10.3 STORAGE STRATEGY

Rules:
- Use **S3-compatible object storage**
- Objects are immutable once uploaded
- Deletions are soft (logical), not physical
- Physical cleanup is async and scheduled

The application must remain stateless.

---

## 10.4 MEDIA METADATA MODEL

Each media record must include:
- id
- tenant_id
- owner_type (listing, vendor, user, etc.)
- owner_id
- media_type
- mime_type
- size
- storage_key
- visibility (public / private)
- created_at

Rules:
- Media metadata lives in the database
- Binary data lives only in object storage
- Media ownership is mandatory

---

## 10.5 OWNERSHIP & ACCESS RULES

Rules:
- Media always belongs to a tenant
- Media access is tenant-scoped
- Vendors may only access their own media
- Public media must be explicitly marked

Cross-tenant media access is forbidden.

---

## 10.6 UPLOAD FLOW (SECURE)

Rules:
- Uploads use **pre-signed URLs**
- Backend never streams large files
- Upload intent must be authorized
- File size and type validated before upload

Direct-to-storage uploads are mandatory.

---

## 10.7 CDN INTEGRATION

Rules:
- Public media is served via CDN (Cloudflare)
- Private media requires signed URLs
- Cache headers must be explicit
- CDN invalidation must be minimal

CDN configuration must be environment-aware.

---

## 10.8 IMAGE & VIDEO PROCESSING

Rules:
- Processing is async only
- Thumbnails, resizing, transcoding via jobs
- Original files are preserved
- Processing failures must not block uploads

Processing pipelines must be replaceable.

---

## 10.9 MEDIA & LISTINGS

Rules:
- Listings reference media by ID only
- Ordering metadata may be stored separately
- Media does not store listing semantics

Verticals may define display rules, not storage rules.

---

## 10.10 MEDIA & SEARCH

Rules:
- Search indexes only media references
- Thumbnails or URLs are resolved at query time
- Media blobs are never indexed

Search must remain lightweight.

---

## 10.11 SECURITY & COMPLIANCE

Rules:
- Virus scanning may be integrated async
- Content moderation flags must be supported
- Access logs must be auditable
- GDPR-style deletion requests must be honored logically

Media handling must be compliant by design.

---

## 10.12 PERFORMANCE & COST CONTROL

Rules:
- Enforce file size limits
- Enforce upload quotas via entitlements
- Avoid duplicate uploads where possible
- Monitor storage growth

Media costs must be controllable.

---

## 10.13 FORBIDDEN PRACTICES

You must not:
- Store media blobs in the database
- Stream large files through the API
- Hardcode CDN URLs
- Bypass ownership checks

---

## 10.14 EXECUTION DIRECTIVE

All modules must:
- Treat media as shared infrastructure
- Respect ownership and visibility rules
- Remain vertical-agnostic

Media is a utility, not a domain.

END OF PART 10.