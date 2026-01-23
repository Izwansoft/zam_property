# FRONTEND (WEB) — PART 15 — NOTIFICATIONS UI, ACTIVITY FEEDS & USER FEEDBACK PATTERNS (LOCKED)

This part defines **cross-cutting UX systems** used across the dashboard:
- notifications (in-app visibility)
- activity feeds & timelines
- toasts, banners, confirmations
- consistent feedback for async actions

All rules from WEB PART 0–14 apply fully.

---

## 15.1 FEEDBACK SYSTEM PHILOSOPHY

Rules:
- Users must always know:
  - what just happened
  - what is happening
  - what to do next
- Feedback must be:
  - timely
  - contextual
  - non-intrusive
- No silent failures
- No spammy UX

Good feedback reduces support tickets.

---

## 15.2 MODULE OWNERSHIP

Domain module:
- `modules/notifications/*`

Shared UI components:
- `components/feedback/*`

Rules:
- Notifications module is read-only in Phase 1
- No notification sending from UI (backend-driven only)
- UI renders what backend emits

---

## 15.3 NOTIFICATION TYPES (UI)

UI must support rendering:
- In-app notifications (bell/menu)
- Inline notifications (page-level banners)
- Action-result notifications (toast/snackbar)
- System alerts (limited, admin-only)

Rules:
- Email/WhatsApp/SMS delivery is backend-only
- UI shows delivery status where available (read-only)

---

## 15.4 IN-APP NOTIFICATIONS UI

In-app notification panel must include:
- Unread count badge
- List of recent notifications
- Timestamp
- Contextual message
- Link to relevant entity/page

Rules:
- Notifications are role- and tenant-scoped
- Clicking a notification marks it as read
- Panel must be performant (pagination or lazy-load)
- “Mark all as read” allowed (if backend supports)

---

## 15.5 NOTIFICATION VISIBILITY BY ROLE

Rules:
- Platform Admin sees:
  - system alerts
  - ops notifications
- Tenant Admin sees:
  - moderation events
  - usage warnings
  - subscription state changes
- Vendor sees:
  - new leads/bookings
  - listing moderation outcomes
  - review updates

UI must not expose notifications outside role scope.

---

## 15.6 ACTIVITY FEEDS & TIMELINES

Activity feeds are contextual views of events.

Used in:
- Listing detail pages
- Vendor detail pages
- Tenant detail pages
- Interaction detail pages

Activity items may include:
- status changes
- moderation decisions
- user actions
- system actions

Rules:
- Activity feeds are read-only
- Must be time-ordered
- Must explain “who did what”
- Must hide internal-only notes from vendors

---

## 15.7 ACTIVITY FEED UI PATTERN

Standard feed item:
- Icon (action type)
- Short description
- Actor (masked where required)
- Timestamp
- Optional metadata (expandable)

Rules:
- Avoid wall-of-text
- Use consistent phrasing across domains
- Use status badges/icons consistently

---

## 15.8 TOASTS & ACTION FEEDBACK (GLOBAL PATTERN)

Rules:
- Success toasts:
  - short
  - auto-dismiss
- Error toasts:
  - descriptive
  - persistent until dismissed (or timeout longer)
- Info toasts:
  - sparingly used

Every mutation must trigger feedback:
- success → toast + UI update
- error → toast + inline error if relevant

---

## 15.9 PAGE-LEVEL BANNERS

Used for:
- blocked actions (entitlement/limit reached)
- system maintenance notices
- partial failures

Rules:
- Banners must be dismissible (where appropriate)
- Must not permanently block UI unless critical
- Must explain impact and next steps

---

## 15.10 CONFIRMATION & DESTRUCTIVE ACTION UX

Rules:
- Destructive actions require:
  - confirmation dialog
  - clear wording of impact
- Optional reason input for admin actions
- Confirm dialogs must:
  - disable confirm while processing
  - show error if action fails

No “Are you sure?” without context.

---

## 15.11 LOADING & PROGRESS FEEDBACK

Rules:
- Inline spinners for small actions
- Page-level skeletons for page loads
- Progress indicators for long-running ops
- Disable repeated actions while in-flight

Users must not guess whether something is happening.

---

## 15.12 NOTIFICATION PREFERENCES (READ-ONLY PHASE 1)

If backend supports preferences:
- UI may show current preferences
- UI may allow toggling read-only or limited fields
- Full preference editing may be Phase 1.5+

No partial preference UI that misleads users.

---

## 15.13 MODULE API SURFACE (EXPECTED)

Notifications module should provide:
- `useNotificationsList(params)`
- `useUnreadCount()`
- `useMarkAsRead(notificationId)`
- `useMarkAllAsRead()`

Activity feed may reuse:
- `useEntityActivity(entityType, entityId)`

---

## 15.14 TESTING REQUIREMENTS (FEEDBACK SYSTEM)

Must include:
- unit tests for notification mappers
- unit tests for unread count logic
- integration tests for:
  - mark as read
  - toast feedback on mutations
- E2E critical path:
  - vendor receives lead → sees notification → navigates to interaction

---

## 15.15 FORBIDDEN PRACTICES

You must not:
- Spam users with duplicate notifications
- Show notifications without actionable context
- Use toasts as the only error feedback
- Leak internal/system notifications to vendors

---

## 15.16 EXECUTION DIRECTIVE

Notifications & feedback UX must:
- Keep users informed
- Be role-appropriate
- Reduce confusion and retries
- Integrate seamlessly across modules

Clear feedback builds confidence.

END OF WEB PART 15.