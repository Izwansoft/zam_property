# FRONTEND (WEB) — PART 17 — PERFORMANCE, SSR/CSR STRATEGY, CACHING & RENDERING DISCIPLINE (LOCKED)

This part defines how the dashboard remains fast and scalable:
- SSR vs CSR rules per page type
- caching boundaries
- TanStack Query performance patterns
- rendering discipline to avoid waterfalls and flicker
- pagination, virtualization guidance (where applicable)

All rules from WEB PART 0–16 apply fully.

---

## 17.1 PERFORMANCE PHILOSOPHY

Rules:
- Dashboards must feel fast under real data volumes
- Avoid network waterfalls
- Avoid re-render storms
- Prefer predictable caching over ad-hoc memoization
- Performance is part of correctness

---

## 17.2 SSR VS CSR (AUTHORITATIVE)

### SSR (Server Components) is preferred for:
- Portal shell + layout guard decisions
- Initial page scaffolding (title, breadcrumbs, static layout)
- Non-sensitive configuration (theme, nav structure)
- Redirects (unauthenticated/forbidden)

### CSR (Client Components) is preferred for:
- Data-heavy lists (TanStack Query)
- Interactive filters, tables, modals
- Forms (RHF)
- Media uploads
- Real-time-ish inbox updates (optional)

Rules:
- Auth gating should happen before rendering protected content
- Data fetching for dashboard content should primarily use TanStack Query client-side
- Avoid mixing server fetching and client fetching for the same resource unless strictly needed

---

## 17.3 RENDERING WATERFALL PREVENTION

Rules:
- Do not chain fetches when independent
- Fetch in parallel where possible
- Use `enabled` flags to avoid premature calls
- Derive query params synchronously from URL/context before calling hooks

Examples:
- Listing detail page loads:
  - listing detail
  - media list
  - interactions summary
  in parallel (not sequentially), where backend allows

No “fetch A then fetch B” unless B truly depends on A.

---

## 17.4 TANSTACK QUERY PERFORMANCE DEFAULTS

Rules:
- Use `staleTime` appropriately:
  - registry schemas: long
  - lists: medium
  - detail: medium
  - ops/audit: short/medium depending on frequency
- Use `gcTime` to control memory
- Use `keepPreviousData` for paginated lists
- Use `select` to map DTO → UI models efficiently
- Prefer query invalidation for correctness; avoid refetch storms

No unbounded cache growth.

---

## 17.5 PAGINATION & LARGE LISTS

Rules:
- All list endpoints must be paginated
- UI must always paginate (no “load all”)
- Page size must have a reasonable upper bound
- For extremely large tables:
  - consider virtualization (Phase 1.5+)
  - but pagination remains primary

Never render thousands of rows without pagination.

---

## 17.6 FILTER & SEARCH PERFORMANCE

Rules:
- Debounce `q` input (WEB PART 16)
- Apply filters without triggering multiple redundant refetches
- Prefer “Apply” for very complex filter panels (optional)
- Avoid sending empty/unset filters to backend

---

## 17.7 IMAGE & MEDIA PERFORMANCE

Rules:
- Use thumbnails in lists
- Lazy-load images below the fold
- Avoid rendering full-size media in tables
- Use CDN URLs; signed URLs where needed
- Show upload progress and avoid blocking UI

---

## 17.8 CODE-SPLITTING & BUNDLE DISCIPLINE

Rules:
- Keep portal bundles lean
- Lazy-load heavy components:
  - charting libs
  - rich editors
  - media viewers
- Avoid importing heavy libs into root layout

No “charts library in every page”.

---

## 17.9 STATE & RE-RENDER DISCIPLINE

Rules:
- Keep Zustand minimal (UI state only)
- Do not store large objects in global state
- Memoize only when measured/needed
- Use stable props and keys for tables/forms

Avoid “global rerender on every keystroke”.

---

## 17.10 REAL-TIME / POLLING (OPTIONAL)

Rules:
- Inbox may poll for updates (vendor interactions)
- Polling must be:
  - interval-based (not aggressive)
  - disabled when tab not visible (optional)
  - scoped to small payloads
- Prefer server push later (Phase 2)

No constant refetching loops.

---

## 17.11 ERROR BOUNDARIES & RESILIENCE

Rules:
- Unexpected UI exceptions must be caught by error boundaries
- Render fallback UI with retry
- Do not crash entire portal due to a single widget failure

Partial degradation is acceptable.

---

## 17.12 ACCESSIBILITY & UX PERFORMANCE

Rules:
- Preserve focus on modal open/close
- Keyboard navigation for tables/forms where feasible
- Avoid layout shift (use skeletons)
- Maintain consistent spacing to prevent jumping

---

## 17.13 TESTING & MEASUREMENT

Rules:
- Performance changes must be testable
- Track:
  - page load time (qualitative)
  - query counts per page
  - largest bundle offenders
- Add basic profiling checks during QA (manual acceptable Phase 1)

No performance regressions shipped blindly.

---

## 17.14 FORBIDDEN PRACTICES

You must not:
- Fetch the same resource multiple times per page
- Render huge tables without pagination
- Put heavy imports in root layout
- Use localStorage for server state caching
- Create infinite polling loops

---

## 17.15 EXECUTION DIRECTIVE

The dashboard must:
- render quickly
- fetch efficiently
- cache predictably
- scale with data volume

Performance is a feature.

END OF WEB PART 17.