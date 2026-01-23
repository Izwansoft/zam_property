# TERRA IMS API Registry

> **This document tracks ALL implemented API endpoints.**  
> Update this file after implementing any endpoint.

---

## 📋 Summary

| Module | Endpoints | Status |
|--------|-----------|--------|
| Auth | 2 | ✅ Implemented |
| Users | 6 | ✅ Implemented |
| API Docs | 1 | ✅ Implemented |
| Tenants | 0 | ⏳ Pending |
| Companies | 0 | ⏳ Pending |
| Roles & Permissions | 0 | ⏳ Pending |
| Modules | 4 | ✅ Implemented |
| Events & Async | 0 | ✅ Implemented |
| HR - Employees | 14 | ✅ Implemented |
| HR - Leave | 10 | ✅ Implemented |
| Projects | 11 | ✅ Implemented |
| Tasks | 4 | ✅ Implemented |
| Time Entries | 0 | ⏳ Pending |
| Invoices | 10 | ✅ Implemented |
| Payments | 3 | ✅ Implemented |
| Agency - Clients | 11 | ✅ Implemented |
| Agency - Creatives | 8 | ✅ Implemented |
| Construction | 24 | ✅ Implemented |
| Compliance & Governance | 15 | ✅ Implemented |
| AI Services | 18 | ✅ Implemented |
| Notifications | 5 | ✅ Implemented |
| Real-time (WebSocket) | 1 | ✅ Implemented |
| Automation | 6 | ✅ Implemented |
| Audit | 2 | ✅ Implemented |
| Analytics | 5 | ✅ Implemented |
| Reports | 15 | ✅ Implemented |
| Portal Configuration | 9 | ✅ Implemented |
| Branding (White-label) | 21 | ✅ Implemented |
| Templates (Industry Templates) | 6 | ✅ Implemented |
| Vertical Governance | 4 | ✅ Implemented |
| Localization | 5 | ✅ Implemented |
| Partner System | 16 | ✅ Implemented |
| Public API & Developer Platform | 20 | ✅ Implemented |
| Integration Marketplace | 10 | ✅ Implemented |
| Webhooks | 7 | ✅ Implemented |
| **Total** | **265** | |

---

## ⚡ Real-time (WebSocket)

### Socket.IO Namespace: /ws
Real-time transport for presence + module-scoped topics.

**Authentication (MANDATORY):** JWT access token passed during handshake.
- Preferred: `handshake.auth.token = "{accessToken}"`
- Alternative: Header `Authorization: Bearer {accessToken}`

**Tenant scoping:** tenant/user/company/role/topic rooms are joined based on JWT claims. Cross-tenant delivery is forbidden.

**Rate limiting (abuse protection):**
- Connections may be rejected if connection rate limit is exceeded (socket will be disconnected).
- Message handlers (`topic.subscribe`, `topic.unsubscribe`, `presence.list-online`) return `{ "ok": false, "error": "Rate limited" }` when the per-socket message limit is exceeded.

**Failure behavior (Redis fallback):**
- If Redis is unavailable at startup, the WebSocket Redis adapter is disabled and the app still starts (single-instance Socket.IO only).
- Presence uses Redis when available, otherwise falls back to in-memory tracking (non-persistent; not shared across instances).

**Permission:** Authenticated (JWT required)
**Status:** ✅ Implemented

#### Server → Client Events

##### `realtime.ready`
Emitted to the connecting socket after successful authentication and room joins.

**Payload:**
```json
{
  "tenantId": "uuid",
  "userId": "uuid"
}
```

##### `presence.updated`
Broadcast to the tenant presence room whenever a user connects/disconnects.

**Payload:**
```json
{
  "tenantId": "uuid",
  "userId": "uuid",
  "companyId": "uuid",
  "status": "ONLINE",
  "lastSeenAt": "2025-01-01T00:00:00Z"
}
```

#### Client → Server Messages

##### `topic.subscribe`
Subscribe the socket to a tenant-scoped topic room for a module.

**Body:**
```json
{
  "moduleKey": "projects"
}
```

**Behavior:**
- Validates `moduleKey` is provided
- Checks Module Registry enablement for `{ tenantId, moduleKey }`

**Response:**
```json
{ "ok": true }
```

**Error Response:**
```json
{ "ok": false, "error": "Module 'projects' is disabled" }
```

##### `topic.unsubscribe`
Unsubscribe the socket from a tenant-scoped topic room.

**Body:**
```json
{
  "moduleKey": "projects"
}
```

**Response:**
```json
{ "ok": true }
```

##### `presence.list-online`
Get current online user IDs for the authenticated tenant.

**Body:** None

**Response:**
```json
{
  "ok": true,
  "data": {
    "userIds": ["uuid", "uuid"]
  }
}
```

---

## 📐 Conventions

### URL Structure
```
/api/v1/{resource}                    # Collection
/api/v1/{resource}/{id}               # Single resource
/api/v1/{resource}/{id}/{sub-resource} # Nested resource
/api/v1/{resource}/{id}/actions/{action} # Custom action
```

### Naming Rules
| Type | Convention | Example |
|------|------------|---------|
| URL paths | `kebab-case` | `/project-phases`, `/leave-requests` |
| Query params | `camelCase` | `?pageSize=20&sortBy=createdAt` |
| Request body | `camelCase` | `{ "fullName": "Ahmad" }` |
| Response body | `camelCase` | `{ "createdAt": "2025-01-01T00:00:00Z" }` |
| Enum values | `SCREAMING_SNAKE` | `"status": "IN_PROGRESS"` |
| Dates | ISO 8601 | `"2025-01-01T00:00:00Z"` |

### HTTP Methods
| Method | Purpose | Success Code |
|--------|---------|--------------|
| GET | Read resource(s) | 200 |
| POST | Create resource | 201 |
| PUT | Full update | 200 |
| PATCH | Partial update | 200 |
| DELETE | Remove resource | 204 |

### Query Parameters (Pagination)
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `pageSize` | number | 20 | Items per page (max: 100) |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `search` | string | - | Full-text search query |

### Standard Response Format

#### Success (Single Resource)
```json
{
  "data": {
    "id": "uuid",
    "...": "..."
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

#### Success (Collection)
```json
{
  "data": [
    { "id": "uuid", "...": "..." }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5,
    "requestId": "uuid"
  }
}
```

#### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

### Error Codes
| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | No permission |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource already exists |
| 422 | `BUSINESS_RULE_VIOLATION` | Business rule failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

---

## 📚 API Docs

### GET /api/docs
Swagger UI.

**Permission:** Public  
**Status:** ✅ Implemented

---

## 🔐 Authentication

### POST /api/v1/auth/login
Login with email and password.

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email |
| `password` | string | Yes | Plaintext password (validated + hashed compare server-side) |

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data.accessToken` | string | JWT access token |
| `data.expiresIn` | number \| string | Token TTL (seconds when parseable, otherwise duration string like `15m`) |
| `data.user.id` | uuid | User ID |
| `data.user.email` | string | User email |
| `data.user.fullName` | string | User full name |
| `data.user.roleCode` | string | Role code (RBAC wired in Session 1.6) |

**JWT Claims (inside `data.accessToken`):**
| Claim | Type | Description |
|------|------|-------------|
| `permissions` | string[] | Permission codes resolved from RBAC Role→Permission mapping |

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "fullName": "Admin User",
      "roleCode": "COMPANY_ADMIN"
    }
  }
}
```

**Permission:** Public  
**Status:** ✅ Implemented

---

### POST /api/v1/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Permission:** Public  
**Status:** ⏳ Pending

---

### POST /api/v1/auth/logout
Invalidate current session.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204):** No Content

**Permission:** Authenticated  
**Status:** ⏳ Pending

---

### GET /api/v1/auth/me
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data.userId` | uuid | User ID (`sub`) |
| `data.tenantId` | uuid | Active tenant ID |
| `data.companyId` | uuid \| null | Active company ID (null for account-level users) |
| `data.email` | string | User email |
| `data.role` | string | Role code |
| `data.permissions` | string[] | Permission codes granted to the current user |

**Response (200):**
```json
{
  "data": {
    "userId": "uuid",
    "tenantId": "uuid",
    "companyId": "uuid",
    "email": "admin@example.com",
    "role": "ACCOUNT_OWNER",
    "permissions": ["user:read"]
  }
}
```

**Permission:** `user:read`  
**Status:** ✅ Implemented

---

## 👥 Users

### GET /api/v1/users
List users (tenant-scoped).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | No | Page number |
| `pageSize` | number | No | Items per page |
| `status` | string | No | Filter by status (`ACTIVE`, `DISABLED`) |
| `roleCode` | string | No | Filter by role code |
| `search` | string | No | Search by name or email |

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data[]` | array | List of users |
| `data[].id` | uuid | User ID |
| `data[].email` | string | Email |
| `data[].fullName` | string | Full name |
| `data[].roleCode` | string | Role code |
| `data[].status` | string | User status |
| `data[].companyId` | uuid \| null | Company ID |
| `data[].companyName` | string \| null | Company name |
| `data[].createdAt` | string | ISO 8601 |
| `meta.page` | number | Current page |
| `meta.pageSize` | number | Page size |
| `meta.totalItems` | number | Total items |
| `meta.totalPages` | number | Total pages |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "roleCode": "EMPLOYEE",
      "status": "ACTIVE",
      "companyId": "uuid",
      "companyName": "Acme Corp",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 50,
    "totalPages": 3
  }
}
```

**Permission:** `user:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/users/:id
Get single user by ID.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data.id` | uuid | User ID |
| `data.email` | string | Email |
| `data.fullName` | string | Full name |
| `data.roleCode` | string | Role code |
| `data.status` | string | User status |
| `data.tenantId` | uuid | Tenant ID |
| `data.companyId` | uuid \| null | Company ID |
| `data.companyName` | string \| null | Company name |
| `data.createdAt` | string | ISO 8601 |
| `data.updatedAt` | string | ISO 8601 |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "roleCode": "EMPLOYEE",
    "status": "ACTIVE",
    "tenantId": "uuid",
    "companyId": "uuid",
    "companyName": "Acme Corp",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Permission:** `user:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/users
Create new user.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `companyId` | uuid | No | Target company ID (account-level users only). Not accepted in request body. |

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "fullName": "Jane Smith",
  "password": "SecurePassword123!",
  "roleCode": "EMPLOYEE"
}
```

**Response (201) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data.id` | uuid | User ID |
| `data.email` | string | Email |
| `data.fullName` | string | Full name |
| `data.roleCode` | string | Role code |
| `data.status` | string | Status |
| `data.companyId` | uuid \| null | Company ID |
| `data.createdAt` | string | ISO 8601 |

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "fullName": "Jane Smith",
    "roleCode": "EMPLOYEE",
    "status": "ACTIVE",
    "companyId": "uuid",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Permission:** `user:create`  
**Status:** ✅ Implemented

---

### PUT /api/v1/users/:id
Update user (full update).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data.id` | uuid | User ID |
| `data.email` | string | Email |
| `data.fullName` | string | Full name |
| `data.roleCode` | string | Role code |
| `data.status` | string | Status |
| `data.updatedAt` | string | ISO 8601 |

**Request Body:**
```json
{
  "fullName": "Jane Smith Updated",
  "roleCode": "PROJECT_MANAGER",
  "status": "ACTIVE"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "fullName": "Jane Smith Updated",
    "roleCode": "PROJECT_MANAGER",
    "status": "ACTIVE",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Permission:** `user:update`  
**Status:** ✅ Implemented

---

### PUT /api/v1/users/:id/role
Assign role to user.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roleCode` | string | Yes | Role code |

**Request Body:**
```json
{
  "roleCode": "ACCOUNT_OWNER"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "roleCode": "ACCOUNT_OWNER",
    "status": "ACTIVE",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Permission:** `user:update`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/users/:id
Deactivate user (soft delete).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Response (204):** No Content

**Permission:** `user:delete`  
**Status:** ✅ Implemented

---

## 🏢 Tenants (Accounts)

### GET /api/v1/tenants
List tenants (platform admin only).

**Permission:** `tenant:read` (PLATFORM scope)  
**Status:** ⏳ Pending

---

### GET /api/v1/tenants/:id
Get tenant details.

**Permission:** `tenant:read`  
**Status:** ⏳ Pending

---

### POST /api/v1/tenants
Create new tenant (platform admin only).

**Request Body:**
```json
{
  "name": "New Company Ltd",
  "slug": "new-company",
  "industry": "AGENCY",
  "plan": "PROFESSIONAL",
  "primaryEmail": "admin@newcompany.com"
}
```

**Permission:** `tenant:create` (PLATFORM scope)  
**Status:** ⏳ Pending

---

### PUT /api/v1/tenants/:id
Update tenant settings.

**Permission:** `tenant:update`  
**Status:** ⏳ Pending

---

### PUT /api/v1/tenants/:id/branding
Update tenant branding (logo, colors, theme).

**Request Body:**
```json
{
  "primaryColor": "#2563eb",
  "secondaryColor": "#1e40af",
  "logoUrl": "https://cdn.example.com/logo.png",
  "faviconUrl": "https://cdn.example.com/favicon.ico"
}
```

**Permission:** `tenant:update`  
**Status:** ⏳ Pending

---

## 🏬 Companies

### GET /api/v1/companies
List companies in current tenant.

**Permission:** `company:read`  
**Status:** ⏳ Pending

---

### GET /api/v1/companies/:id
Get company details.

**Permission:** `company:read`  
**Status:** ⏳ Pending

---

### POST /api/v1/companies
Create new company (subsidiary).

**Request Body:**
```json
{
  "name": "Subsidiary Corp",
  "code": "SUB001",
  "address": "123 Main St",
  "industry": "AGENCY"
}
```

**Permission:** `company:create`  
**Status:** ⏳ Pending

---

### PUT /api/v1/companies/:id
Update company.

**Permission:** `company:update`  
**Status:** ⏳ Pending

---

## 🔐 Roles & Permissions

### GET /api/v1/roles
List all roles.

**Permission:** `role:read`  
**Status:** ⏳ Pending

---

### GET /api/v1/roles/:code
Get role with permissions.

**Permission:** `role:read`  
**Status:** ⏳ Pending

---

### POST /api/v1/roles
Create custom role.

**Request Body:**
```json
{
  "code": "CUSTOM_ROLE",
  "name": "Custom Role",
  "scope": "COMPANY",
  "permissions": ["project:read", "project:create"]
}
```

**Permission:** `role:create`  
**Status:** ⏳ Pending

---

### PUT /api/v1/roles/:code
Update role permissions.

**Permission:** `role:update`  
**Status:** ⏳ Pending

---

### GET /api/v1/permissions
List all available permissions.

**Permission:** `permission:read`  
**Status:** ⏳ Pending

---

## 📦 Modules

### GET /api/v1/modules
List all available modules.

**Permission:** `module:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": [
    {
      "moduleKey": "projects",
      "name": "Project Management",
      "description": "Projects capability",
      "version": "1.0.0",
      "status": "ACTIVE",
      "isCore": false,
      "dependencies": [],
      "requiredPermissions": [],
      "enabled": false
    }
  ]
}
```

---

### PUT /api/v1/modules/:moduleKey/enabled
Enable or disable a module for the current tenant.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `moduleKey` | string | Module key (e.g., `projects`) |

**Request Body:**
```json
{
  "enabled": true
}
```

**Permission:** `module:manage`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "moduleKey": "projects",
    "enabled": true
  }
}
```

---

### GET /api/v1/feature-flags
List feature flags for the current tenant.

**Permission:** `feature-flag:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": [
    {
      "flagKey": "projects:kanban",
      "moduleKey": "projects",
      "name": "Kanban Board",
      "description": "Enable Kanban-style task boards",
      "defaultEnabled": false,
      "enabled": false
    }
  ]
}
```

---

### PUT /api/v1/feature-flags/:flagKey
Set a feature flag override for the current tenant.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `flagKey` | string | Feature flag key |

**Request Body:**
```json
{
  "enabled": true
}
```

**Permission:** `feature-flag:manage`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "flagKey": "projects:kanban",
    "enabled": true
  }
}
```

---

## 👔 HR - Employees

### POST /api/v1/hr/employees
Create employee.

**Request Body (application/json):**
```json
{
  "employeeNumber": "EMP-0001",
  "firstName": "Alya",
  "lastName": "Ahmad",
  "email": "alya@company.com",
  "phone": "+60123456789",
  "dateOfBirth": "1995-06-30",
  "gender": "FEMALE",
  "jobTitle": "Software Engineer",
  "employmentType": "FULL_TIME",
  "joinDate": "2025-01-01",
  "probationEnd": "2025-03-31",
  "departmentId": "uuid",
  "positionId": "uuid",
  "managerId": "uuid",
  "userId": "uuid"
}
```

**Permission:** `hr.employee:create`  
**Status:** ✅ Implemented

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "employeeNumber": "EMP-0001",
    "firstName": "Alya",
    "lastName": "Ahmad",
    "email": "alya@company.com",
    "companyId": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### GET /api/v1/hr/employees
List employees.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (max: 100) |
| `search` | string | Search by name/email/employee number |

**Permission:** `hr.employee:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "employeeNumber": "EMP-0001",
      "firstName": "Alya",
      "lastName": "Ahmad",
      "email": "alya@company.com"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

---

### GET /api/v1/hr/employees/:id
Get employee by id.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Employee ID |

**Permission:** `hr.employee:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "employeeNumber": "EMP-0001",
    "firstName": "Alya",
    "lastName": "Ahmad",
    "email": "alya@company.com"
  }
}
```

---

### PATCH /api/v1/hr/employees/:id
Update employee.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Employee ID |

**Request Body (application/json):**
```json
{
  "jobTitle": "Senior Software Engineer",
  "status": "ACTIVE",
  "departmentId": "uuid",
  "positionId": "uuid",
  "managerId": null,
  "userId": null
}
```

**Permission:** `hr.employee:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "jobTitle": "Senior Software Engineer",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### DELETE /api/v1/hr/employees/:id
Soft delete employee.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Employee ID |

**Permission:** `hr.employee:delete`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "ok": true
  }
}
```

---

### GET /api/v1/hr/org-chart
Get org chart structure.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `rootEmployeeId` | uuid | Optional root employee id (returns top-level nodes if omitted) |

**Permission:** `hr.employee:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "nodes": [
      {
        "employeeId": "uuid",
        "firstName": "Alya",
        "lastName": "Ahmad",
        "managerId": null,
        "departmentId": "uuid",
        "positionId": "uuid",
        "directReports": []
      }
    ]
  }
}
```

---

### POST /api/v1/hr/departments
Create department.

**Request Body (application/json):**
```json
{
  "name": "Engineering",
  "code": "ENG",
  "description": "Product engineering department",
  "parentDepartmentId": "uuid",
  "headEmployeeId": "uuid",
  "isActive": true
}
```

**Permission:** `hr.department:create`  
**Status:** ✅ Implemented

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Engineering",
    "code": "ENG",
    "isActive": true
  }
}
```

---

### GET /api/v1/hr/departments
List departments.

**Permission:** `hr.department:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "code": "ENG",
      "isActive": true
    }
  ]
}
```

---

### PATCH /api/v1/hr/departments/:id
Update department.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Department ID |

**Request Body (application/json):**
```json
{
  "name": "Engineering",
  "description": "Updated description",
  "parentDepartmentId": null,
  "headEmployeeId": null,
  "isActive": true
}
```

**Permission:** `hr.department:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Engineering",
    "code": "ENG",
    "isActive": true
  }
}
```

---

### DELETE /api/v1/hr/departments/:id
Soft delete department.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Department ID |

**Permission:** `hr.department:delete`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "ok": true
  }
}
```

---

### POST /api/v1/hr/positions
Create position.

**Request Body (application/json):**
```json
{
  "name": "Software Engineer",
  "code": "SWE",
  "description": "Builds and maintains product features",
  "isActive": true
}
```

**Permission:** `hr.position:create`  
**Status:** ✅ Implemented

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Software Engineer",
    "code": "SWE",
    "isActive": true
  }
}
```

---

### GET /api/v1/hr/positions
List positions.

**Permission:** `hr.position:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Software Engineer",
      "code": "SWE",
      "isActive": true
    }
  ]
}
```

---

### PATCH /api/v1/hr/positions/:id
Update position.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Position ID |

**Request Body (application/json):**
```json
{
  "name": "Software Engineer",
  "description": "Updated description",
  "isActive": true
}
```

**Permission:** `hr.position:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Software Engineer",
    "code": "SWE",
    "isActive": true
  }
}
```

---

### DELETE /api/v1/hr/positions/:id
Soft delete position.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Position ID |

**Permission:** `hr.position:delete`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "ok": true
  }
}
```

---

## 🌴 HR - Leave

### POST /api/v1/hr/leave-types
Create leave type.

**Request Body (application/json):**
```json
{
  "name": "Annual Leave",
  "code": "ANNUAL",
  "description": "Standard annual leave entitlement",
  "defaultAnnualEntitlementDays": 14,
  "isActive": true
}
```

**Permission:** `hr.leave-type:create`  
**Status:** ✅ Implemented

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Annual Leave",
    "code": "ANNUAL",
    "defaultAnnualEntitlementDays": 14,
    "isActive": true
  }
}
```

---

### GET /api/v1/hr/leave-types
List leave types.

**Permission:** `hr.leave-type:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Annual Leave",
      "code": "ANNUAL",
      "defaultAnnualEntitlementDays": 14,
      "isActive": true
    }
  ]
}
```

---

### PATCH /api/v1/hr/leave-types/:id
Update leave type.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Leave type ID |

**Request Body (application/json):**
```json
{
  "name": "Annual Leave (Updated)",
  "defaultAnnualEntitlementDays": 16,
  "isActive": true
}
```

**Permission:** `hr.leave-type:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Annual Leave (Updated)",
    "defaultAnnualEntitlementDays": 16,
    "isActive": true
  }
}
```

---

### DELETE /api/v1/hr/leave-types/:id
Soft delete leave type.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Leave type ID |

**Permission:** `hr.leave-type:delete`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "ok": true
  }
}
```

---

### POST /api/v1/hr/leave-requests
Submit leave request.

**Request Body (application/json):**
```json
{
  "leaveTypeId": "uuid",
  "startDate": "2025-01-15",
  "endDate": "2025-01-17",
  "reason": "Family vacation",
  "employeeId": "uuid"
}
```

**Permission:** `hr.leave-request:create`  
**Status:** ✅ Implemented

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "leaveTypeId": "uuid",
    "employeeId": "uuid",
    "startDate": "2025-01-15T00:00:00.000Z",
    "endDate": "2025-01-17T00:00:00.000Z",
    "requestedDays": 3,
    "status": "PENDING"
  }
}
```

---

### GET /api/v1/hr/leave-requests
List leave requests.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (max: 100) |
| `employeeId` | uuid | Filter by employee |
| `status` | string | Filter by status (`PENDING`, `APPROVED`, `REJECTED`) |
| `startDate` | date | Filter by start date (inclusive) |
| `endDate` | date | Filter by end date (inclusive) |

**Permission:** `hr.leave-request:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "leaveTypeId": "uuid",
      "requestedDays": 3,
      "status": "PENDING"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

---

### GET /api/v1/hr/leave-requests/:id
Get leave request details.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Leave request ID |

**Permission:** `hr.leave-request:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "leaveTypeId": "uuid",
    "startDate": "2025-01-15T00:00:00.000Z",
    "endDate": "2025-01-17T00:00:00.000Z",
    "requestedDays": 3,
    "status": "PENDING",
    "reason": "Family vacation"
  }
}
```

---

### POST /api/v1/hr/leave-requests/:id/approve
Approve leave request.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Leave request ID |

**Request Body (application/json):**
```json
{
  "remarks": "Approved"
}
```

**Permission:** `hr.leave-request:approve`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedAt": "2025-01-10T00:00:00.000Z"
  }
}
```

---

### POST /api/v1/hr/leave-requests/:id/reject
Reject leave request.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Leave request ID |

**Request Body (application/json):**
```json
{
  "reason": "Insufficient leave balance"
}
```

**Permission:** `hr.leave-request:approve`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "rejectedAt": "2025-01-10T00:00:00.000Z",
    "rejectionReason": "Insufficient leave balance"
  }
}
```

---

### GET /api/v1/hr/leave-balances
Get leave balances for current user or specified employee.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `employeeId` | uuid | Employee ID (optional, defaults to self via linked employee) |
| `year` | number | Year (optional, defaults to current) |

**Permission:** `hr.leave-balance:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "employeeId": "uuid",
    "year": 2025,
    "items": [
      {
        "leaveTypeId": "uuid",
        "year": 2025,
        "entitlementDays": 14,
        "usedDays": 3,
        "remainingDays": 11
      }
    ]
  }
}
```

---

## 📋 Projects

### POST /api/v1/projects
Create project.

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectCode` | string | Yes | Unique project code (max 50 chars) |
| `name` | string | Yes | Project name (max 200 chars) |
| `description` | string | No | Project description (max 2000 chars) |
| `startDate` | string (date) | No | Project start date (ISO 8601 date string, e.g. `2025-01-01`) |
| `endDate` | string (date) | No | Project end date (ISO 8601 date string, e.g. `2025-06-30`) |
| `managerId` | uuid | No | Manager user ID |
| `clientId` | uuid | No | Client ID |

**Request Body:**
```json
{
  "projectCode": "PRJ001",
  "name": "Website Redesign",
  "description": "Complete website redesign project",
  "startDate": "2025-01-01",
  "endDate": "2025-06-30",
  "managerId": "uuid",
  "clientId": "uuid"
}
```

**Permission:** `project:create`  
**Status:** ✅ Implemented

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "projectCode": "PRJ001",
    "name": "Website Redesign",
    "description": "Complete website redesign project",
    "status": "DRAFT",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-06-30T00:00:00.000Z",
    "managerId": "uuid",
    "clientId": "uuid"
  }
}
```

---

### GET /api/v1/projects
List projects.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (max: 100) |
| `status` | string | Filter by status (`DRAFT`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`) |
| `managerId` | uuid | Filter by project manager |
| `clientId` | uuid | Filter by client |
| `search` | string | Search by name or projectCode |

**Permission:** `project:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "projectCode": "PRJ001",
      "name": "Website Redesign",
      "status": "DRAFT"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

---

### GET /api/v1/projects/:id
Get project details.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Project ID |

**Permission:** `project:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "projectCode": "PRJ001",
    "name": "Website Redesign",
    "description": "Complete website redesign project",
    "status": "ACTIVE",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-06-30T00:00:00.000Z",
    "managerId": "uuid",
    "clientId": "uuid"
  }
}
```

---

### PATCH /api/v1/projects/:id
Update project.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Project ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Project name (max 200 chars) |
| `description` | string \| null | No | Project description (max 2000 chars) |
| `startDate` | string (date) \| null | No | Project start date (ISO 8601 date string) |
| `endDate` | string (date) \| null | No | Project end date (ISO 8601 date string) |
| `managerId` | uuid \| null | No | Manager user ID |
| `clientId` | uuid \| null | No | Client ID |

**Request Body:**
```json
{
  "name": "Website Redesign (Updated)",
  "description": "Updated description",
  "startDate": "2025-01-02",
  "endDate": "2025-07-01",
  "managerId": "uuid",
  "clientId": "uuid"
}
```

**Permission:** `project:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "projectCode": "PRJ001",
    "name": "Website Redesign (Updated)",
    "status": "ACTIVE"
  }
}
```

---

### POST /api/v1/projects/:id/activate
Activate project (DRAFT/ON_HOLD → ACTIVE).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Project ID |

**Permission:** `project:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "ACTIVE"
  }
}
```

---

### POST /api/v1/projects/:id/on-hold
Put project on hold (ACTIVE → ON_HOLD).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Project ID |

**Permission:** `project:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "ON_HOLD"
  }
}
```

---

### POST /api/v1/projects/:id/complete
Complete project (ACTIVE/ON_HOLD → COMPLETED).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Project ID |

**Permission:** `project:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "COMPLETED"
  }
}
```

---

### POST /api/v1/projects/:id/archive
Archive project (→ ARCHIVED).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Project ID |

**Permission:** `project:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "ARCHIVED"
  }
}
```

---

### GET /api/v1/projects/:id/members
List project members.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Project ID |

**Permission:** `project:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "userId": "uuid",
      "role": "MEMBER"
    }
  ]
}
```

---

### POST /api/v1/projects/:id/members
Add member to project.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Project ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | uuid | Yes | User ID to add to the project |
| `role` | string | No | Membership role (defaults to `MEMBER`) |

**Request Body:**
```json
{
  "userId": "uuid",
  "role": "MEMBER"
}
```

**Permission:** `project:update`  
**Status:** ✅ Implemented

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "userId": "uuid",
    "role": "MEMBER"
  }
}
```

---

### DELETE /api/v1/projects/:id/members/:userId
Remove member from project.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Project ID |
| `userId` | uuid | User ID |

**Permission:** `project:update`  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "data": {
    "ok": true
  }
}
```

---

## 📋 Tasks

### GET /api/v1/projects/:projectId/tasks
List tasks for a project.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (max: 100) |
| `status` | string | Filter by status (`TODO`, `IN_PROGRESS`, `DONE`) |
| `priority` | string | Filter by priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) |
| `assigneeId` | uuid | Filter by assignee (external reference) |
| `search` | string | Search by title or description |

**Permission:** `task:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/tasks/:id
Get task details.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Task ID |

**Permission:** `task:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/projects/:projectId/tasks
Create task.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Request Body:**
```json
{
  "title": "Design homepage mockup",
  "description": "Create initial mockup for homepage",
  "assigneeId": "uuid",
  "priority": "HIGH",
  "dueDate": "2025-01-15",
  "sortOrder": 0
}
```

**Permission:** `task:create`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/tasks/:id
Update task.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Task ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Task title (max 200 chars) |
| `description` | string \| null | No | Task description (max 2000 chars) |
| `status` | string | No | `TODO` \| `IN_PROGRESS` \| `DONE` |
| `priority` | string | No | `LOW` \| `MEDIUM` \| `HIGH` \| `URGENT` |
| `assigneeId` | uuid \| null | No | Assignee user ID (external reference) |
| `dueDate` | string (date) \| null | No | Due date (ISO 8601 date string, e.g. `2025-01-15`) |
| `sortOrder` | number | No | Sort order within project (defaults to `0`) |

**Permission:** `task:update`  
**Status:** ✅ Implemented

---

## ⏱️ Time Entries

### GET /api/v1/time-entries
List time entries.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Filter by project |
| `taskId` | uuid | Filter by task |
| `userId` | uuid | Filter by user |
| `startDate` | date | Filter from date |
| `endDate` | date | Filter to date |

**Permission:** `time-entry:read`  
**Status:** ⏳ Pending

---

### POST /api/v1/time-entries
Create time entry.

**Request Body:**
```json
{
  "taskId": "uuid",
  "date": "2025-01-15",
  "hours": 4.5,
  "description": "Worked on homepage design"
}
```

**Permission:** `time-entry:create`  
**Status:** ⏳ Pending

---

### PUT /api/v1/time-entries/:id
Update time entry.

**Permission:** `time-entry:update`  
**Status:** ⏳ Pending

---

### DELETE /api/v1/time-entries/:id
Delete time entry.

**Permission:** `time-entry:delete`  
**Status:** ⏳ Pending

---

## 💰 Invoices

### GET /api/v1/invoices
List invoices.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `pageSize` | number | Items per page (max: 100) |
| `status` | string | Filter by status (`DRAFT`, `ISSUED`, `PAID`, `OVERDUE`, `CANCELLED`) |
| `search` | string | Search by invoice number or customer name |

**Permission:** `billing.invoice:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/invoices/:id
Get invoice details.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Invoice ID |

**Permission:** `billing.invoice:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/invoices
Create invoice (DRAFT).

**Request Body:**
```json
{
  "customerName": "Acme Corp",
  "customerEmail": "billing@acme.com",
  "customerAddress": "123 Main St",
  "issueDate": "2025-01-01T00:00:00Z",
  "dueDate": "2025-01-31T00:00:00Z",
  "taxPercent": 6,
  "currency": "USD",
  "notes": "Payment due within 30 days",
  "projectId": "uuid",
  "paymentTermId": "uuid",
  "items": [
    {
      "description": "Website Development",
      "quantity": 1.5,
      "unitPriceCents": 250000,
      "taskId": "uuid",
      "sortOrder": 0
    }
  ]
}
```

**Permission:** `billing.invoice:create`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/invoices/:id
Update invoice (DRAFT only).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Invoice ID |

**Permission:** `billing.invoice:update`  
**Status:** ✅ Implemented

---

### POST /api/v1/invoices/:id/items
Add invoice item (DRAFT only).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Invoice ID |

**Request Body:**
```json
{
  "description": "Design services",
  "quantity": 2,
  "unitPriceCents": 50000,
  "taskId": "uuid",
  "sortOrder": 0
}
```

**Permission:** `billing.invoice:update`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/invoices/:id/items/:itemId
Update invoice item (DRAFT only).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Invoice ID |
| `itemId` | uuid | Invoice item ID |

**Permission:** `billing.invoice:update`  
**Status:** ✅ Implemented

---

### POST /api/v1/invoices/:id/issue
Issue invoice (DRAFT → ISSUED).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Invoice ID |

**Permission:** `billing.invoice:issue`  
**Status:** ✅ Implemented

---

### POST /api/v1/invoices/:id/mark-paid
Mark invoice paid (ISSUED → PAID).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Invoice ID |

**Permission:** `billing.invoice:pay`  
**Status:** ✅ Implemented

---

### POST /api/v1/invoices/:id/cancel
Cancel invoice.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Invoice ID |

**Permission:** `billing.invoice:cancel`  
**Status:** ✅ Implemented

---

### GET /api/v1/invoices/:id/balance
Get invoice balance (total, paid, remaining).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Invoice ID |

**Response (200) Example:**
```json
{
  "data": {
    "invoiceId": "11111111-1111-1111-1111-111111111111",
    "totalCents": 50000,
    "paidCents": 20000,
    "balanceCents": 30000,
    "currency": "USD"
  }
}
```

**Permission:** `billing.invoice:read`  
**Status:** ✅ Implemented

---

## 💳 Payments

### GET /api/v1/invoices/:invoiceId/payments
List payments for an invoice.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `invoiceId` | uuid | Invoice ID |

**Response (200) Example:**
```json
{
  "data": [
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "tenantId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "companyId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "invoiceId": "11111111-1111-1111-1111-111111111111",
      "amountCents": 25000,
      "currency": "USD",
      "paidAt": "2025-01-20T00:00:00.000Z",
      "notes": "Bank transfer",
      "createdAt": "2025-01-20T00:00:01.000Z",
      "updatedAt": "2025-01-20T00:00:01.000Z",
      "createdBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "updatedBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "deletedAt": null
    }
  ]
}
```

**Permission:** `billing.payment:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/invoices/:invoiceId/payments
Record a payment and generate a receipt.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `invoiceId` | uuid | Invoice ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amountCents` | number | Yes | Payment amount in cents (must be `<=` invoice remaining balance) |
| `paidAt` | string (date-time) | Yes | ISO 8601 timestamp when payment was made |
| `notes` | string | No | Optional payment notes (e.g., bank transfer ref) |

**Request Body Example:**
```json
{
  "amountCents": 25000,
  "paidAt": "2025-01-20T00:00:00Z",
  "notes": "Bank transfer"
}
```

**Response (201) Example:**
```json
{
  "data": {
    "payment": {
      "id": "22222222-2222-2222-2222-222222222222",
      "tenantId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "companyId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "invoiceId": "11111111-1111-1111-1111-111111111111",
      "amountCents": 25000,
      "currency": "USD",
      "paidAt": "2025-01-20T00:00:00.000Z",
      "notes": "Bank transfer",
      "createdAt": "2025-01-20T00:00:01.000Z",
      "updatedAt": "2025-01-20T00:00:01.000Z",
      "createdBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "updatedBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "deletedAt": null
    },
    "receipt": {
      "id": "33333333-3333-3333-3333-333333333333",
      "tenantId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "companyId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "paymentId": "22222222-2222-2222-2222-222222222222",
      "receiptNumber": "RCT-2025-00001",
      "issuedAt": "2025-01-20T00:00:02.000Z",
      "createdAt": "2025-01-20T00:00:02.000Z",
      "updatedAt": "2025-01-20T00:00:02.000Z",
      "createdBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "updatedBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "deletedAt": null
    },
    "balance": {
      "invoiceId": "11111111-1111-1111-1111-111111111111",
      "totalCents": 50000,
      "paidCents": 25000,
      "balanceCents": 25000,
      "currency": "USD"
    }
  }
}
```

**Permission:** `billing.payment:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/receipts/:id
Get receipt by id.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Receipt ID |

**Response (200) Example:**
```json
{
  "data": {
    "id": "33333333-3333-3333-3333-333333333333",
    "tenantId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "companyId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "paymentId": "22222222-2222-2222-2222-222222222222",
    "receiptNumber": "RCT-2025-00001",
    "issuedAt": "2025-01-20T00:00:02.000Z",
    "createdAt": "2025-01-20T00:00:02.000Z",
    "updatedAt": "2025-01-20T00:00:02.000Z",
    "createdBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "updatedBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "deletedAt": null
  }
}
```

**Permission:** `billing.receipt:read`  
**Status:** ✅ Implemented

---

## 🎯 Agency - Clients

### POST /api/v1/agency/clients
Create agency client.

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Client name |
| `contactEmail` | string | No | Contact email |
| `status` | string | No | `ACTIVE` \| `INACTIVE` |
| `notes` | string | No | Free-form notes |

**Request Example:**
```json
{
  "name": "Acme Corporation",
  "contactEmail": "contact@acme.com",
  "status": "ACTIVE",
  "notes": "Key client for Q1 campaigns."
}
```

**Response (201) Example:**
```json
{
  "data": {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "name": "Acme Corporation",
    "contactEmail": "contact@acme.com",
    "status": "ACTIVE",
    "notes": "Key client for Q1 campaigns.",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T00:00:00.000Z",
    "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "deletedAt": null
  }
}
```

**Permission:** `agency.client:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/agency/clients
List agency clients.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |
| `status` | string | `ACTIVE` \| `INACTIVE` |
| `search` | string | Search by `name` or `contactEmail` |

**Response (200) Example:**
```json
{
  "data": [
    {
      "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "name": "Acme Corporation",
      "contactEmail": "contact@acme.com",
      "status": "ACTIVE",
      "notes": null,
      "createdAt": "2025-12-28T00:00:00.000Z",
      "updatedAt": "2025-12-28T00:00:00.000Z",
      "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Permission:** `agency.client:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/agency/clients/:id
Get agency client by id.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Client ID |

**Response (200) Example:**
```json
{
  "data": {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "name": "Acme Corporation",
    "contactEmail": "contact@acme.com",
    "status": "ACTIVE",
    "notes": null,
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T00:00:00.000Z",
    "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "deletedAt": null
  }
}
```

**Permission:** `agency.client:read`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/agency/clients/:id
Update agency client.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Client ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Client name |
| `contactEmail` | string | No | Contact email |
| `status` | string | No | `ACTIVE` \| `INACTIVE` |
| `notes` | string | No | Free-form notes |

**Request Example:**
```json
{
  "status": "INACTIVE",
  "notes": "Paused for now."
}
```

**Response (200) Example:**
```json
{
  "data": {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "name": "Acme Corporation",
    "contactEmail": "contact@acme.com",
    "status": "INACTIVE",
    "notes": "Paused for now.",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T01:00:00.000Z",
    "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "deletedAt": null
  }
}
```

**Permission:** `agency.client:update`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/agency/clients/:id
Soft delete agency client.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Client ID |

**Response (204):** No Content

**Permission:** `agency.client:delete`  
**Status:** ✅ Implemented

---

### POST /api/v1/agency/clients/:clientId/engagements
Create engagement for client.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `clientId` | uuid | Client ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectId` | string | Yes | Project reference (stored as string; no cross-domain FK) |
| `leadEmployeeId` | string | No | Lead employee reference (stored as string; no cross-domain FK) |
| `notes` | string | No | Notes |

**Request Example:**
```json
{
  "projectId": "11111111-1111-1111-1111-111111111111",
  "leadEmployeeId": "22222222-2222-2222-2222-222222222222",
  "notes": "Initial engagement for branding project."
}
```

**Response (201) Example:**
```json
{
  "data": {
    "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "projectId": "11111111-1111-1111-1111-111111111111",
    "leadEmployeeId": "22222222-2222-2222-2222-222222222222",
    "status": "ACTIVE",
    "startedAt": "2025-12-28T00:00:00.000Z",
    "completedAt": null,
    "notes": "Initial engagement for branding project.",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T00:00:00.000Z",
    "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "deletedAt": null
  }
}
```

**Permission:** `agency.engagement:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/agency/clients/:clientId/engagements
List engagements for client.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `clientId` | uuid | Client ID |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |
| `status` | string | `ACTIVE` \| `COMPLETED` \| `REFERENCE_ORPHANED` |

**Response (200) Example:**
```json
{
  "data": [
    {
      "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "projectId": "11111111-1111-1111-1111-111111111111",
      "leadEmployeeId": "22222222-2222-2222-2222-222222222222",
      "status": "ACTIVE",
      "startedAt": "2025-12-28T00:00:00.000Z",
      "completedAt": null,
      "notes": "Initial engagement for branding project.",
      "createdAt": "2025-12-28T00:00:00.000Z",
      "updatedAt": "2025-12-28T00:00:00.000Z",
      "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Permission:** `agency.engagement:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/agency/engagements/:id/close
Close engagement.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Engagement ID |

**Response (200) Example:**
```json
{
  "data": {
    "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "projectId": "11111111-1111-1111-1111-111111111111",
    "leadEmployeeId": null,
    "status": "COMPLETED",
    "startedAt": "2025-12-28T00:00:00.000Z",
    "completedAt": "2025-12-28T01:00:00.000Z",
    "notes": null,
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T01:00:00.000Z",
    "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "deletedAt": null
  }
}
```

**Permission:** `agency.engagement:update`  
**Status:** ✅ Implemented

---

### POST /api/v1/agency/clients/:clientId/retainers
Create retainer for client.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `clientId` | uuid | Client ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Retainer name |
| `amountCents` | number | Yes | Amount in cents |
| `currency` | string | No | Currency code (default: `USD`) |
| `interval` | string | No | `MONTHLY` \| `QUARTERLY` \| `YEARLY` (default: `MONTHLY`) |
| `startDate` | string | Yes | ISO 8601 date string |
| `endDate` | string | No | ISO 8601 date string |
| `status` | string | No | `ACTIVE` \| `CANCELLED` |

**Request Example:**
```json
{
  "name": "Monthly Design Retainer",
  "amountCents": 500000,
  "currency": "USD",
  "interval": "MONTHLY",
  "startDate": "2025-01-01T00:00:00Z"
}
```

**Response (201) Example:**
```json
{
  "data": {
    "id": "ffffffff-ffff-ffff-ffff-ffffffffffff",
    "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "name": "Monthly Design Retainer",
    "amountCents": 500000,
    "currency": "USD",
    "interval": "MONTHLY",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": null,
    "status": "ACTIVE",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T00:00:00.000Z",
    "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "deletedAt": null
  }
}
```

**Permission:** `agency.retainer:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/agency/clients/:clientId/retainers
List retainers for client.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `clientId` | uuid | Client ID |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |
| `status` | string | `ACTIVE` \| `CANCELLED` |

**Response (200) Example:**
```json
{
  "data": [
    {
      "id": "ffffffff-ffff-ffff-ffff-ffffffffffff",
      "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "name": "Monthly Design Retainer",
      "amountCents": 500000,
      "currency": "USD",
      "interval": "MONTHLY",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": null,
      "status": "ACTIVE",
      "createdAt": "2025-12-28T00:00:00.000Z",
      "updatedAt": "2025-12-28T00:00:00.000Z",
      "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Permission:** `agency.retainer:read`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/agency/retainers/:id
Update retainer.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Retainer ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Retainer name |
| `amountCents` | number | No | Amount in cents |
| `currency` | string | No | Currency code (e.g., `USD`) |
| `interval` | string | No | `MONTHLY` \| `QUARTERLY` \| `YEARLY` |
| `startDate` | string | No | ISO 8601 date string |
| `endDate` | string | No | ISO 8601 date string |
| `status` | string | No | `ACTIVE` \| `CANCELLED` |

**Request Example:**
```json
{
  "amountCents": 650000,
  "interval": "MONTHLY"
}
```

**Response (200) Example:**
```json
{
  "data": {
    "id": "ffffffff-ffff-ffff-ffff-ffffffffffff",
    "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "name": "Monthly Design Retainer",
    "amountCents": 650000,
    "currency": "USD",
    "interval": "MONTHLY",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": null,
    "status": "ACTIVE",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T01:00:00.000Z",
    "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "deletedAt": null
  }
}
```

**Permission:** `agency.retainer:update`  
**Status:** ✅ Implemented

---

### POST /api/v1/agency/retainers/:id/cancel
Cancel retainer.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Retainer ID |

**Response (200) Example:**
```json
{
  "data": {
    "id": "ffffffff-ffff-ffff-ffff-ffffffffffff",
    "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "companyId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "name": "Monthly Design Retainer",
    "amountCents": 500000,
    "currency": "USD",
    "interval": "MONTHLY",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": null,
    "status": "CANCELLED",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T02:00:00.000Z",
    "createdBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "updatedBy": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "deletedAt": null
  }
}
```

**Permission:** `agency.retainer:update`  
**Status:** ✅ Implemented

---

## 🎨 Agency - Creatives

### POST /api/v1/agency/creatives
Create creative.

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Creative name |
| `clientId` | uuid | Yes | Agency client id |
| `type` | string | Yes | `BANNER` \| `VIDEO` \| `SOCIAL_POST` \| `WEBSITE` |
| `description` | string | No | Description |
| `projectId` | string | No | Optional project reference id (stored as string, not FK) |

**Request Example:**
```json
{
  "name": "Homepage Hero Banner",
  "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "type": "BANNER",
  "description": "Banner for the Q1 campaign",
  "projectId": "11111111-1111-1111-1111-111111111111"
}
```

**Response (201) Example:**
```json
{
  "data": {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "companyId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "projectId": "11111111-1111-1111-1111-111111111111",
    "name": "Homepage Hero Banner",
    "description": "Banner for the Q1 campaign",
    "type": "BANNER",
    "status": "DRAFT",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T00:00:00.000Z",
    "createdBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "updatedBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "deletedAt": null
  }
}
```

**Permission:** `agency.creative:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/agency/creatives
List creatives.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |
| `clientId` | uuid | Filter by client |
| `projectId` | string | Filter by project reference id |
| `status` | string | `DRAFT` \| `INTERNAL_REVIEW` \| `CLIENT_REVIEW` \| `APPROVED` \| `REVISION` |
| `type` | string | `BANNER` \| `VIDEO` \| `SOCIAL_POST` \| `WEBSITE` |
| `search` | string | Search by `name` or `description` |

**Response (200) Example:**
```json
{
  "data": [
    {
      "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "companyId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "projectId": "11111111-1111-1111-1111-111111111111",
      "name": "Homepage Hero Banner",
      "description": "Banner for the Q1 campaign",
      "type": "BANNER",
      "status": "DRAFT",
      "createdAt": "2025-12-28T00:00:00.000Z",
      "updatedAt": "2025-12-28T00:00:00.000Z",
      "createdBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      "updatedBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Permission:** `agency.creative:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/agency/creatives/:id
Get creative by id (includes versions and approvals).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Creative ID |

**Response (200) Example:**
```json
{
  "data": {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "companyId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "projectId": "11111111-1111-1111-1111-111111111111",
    "name": "Homepage Hero Banner",
    "description": "Banner for the Q1 campaign",
    "type": "BANNER",
    "status": "INTERNAL_REVIEW",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T00:00:00.000Z",
    "createdBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "updatedBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "deletedAt": null,
    "versions": [
      {
        "id": "v1111111-1111-1111-1111-111111111111",
        "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "companyId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
        "creativeId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "versionNumber": 1,
        "storageKey": "agency/creatives/c1/v1.png",
        "notes": "First draft",
        "createdAt": "2025-12-28T00:10:00.000Z",
        "updatedAt": "2025-12-28T00:10:00.000Z",
        "createdBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        "updatedBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        "deletedAt": null
      }
    ],
    "approvals": [
      {
        "id": "ap111111-1111-1111-1111-111111111111",
        "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "companyId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
        "creativeId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "versionId": "v1111111-1111-1111-1111-111111111111",
        "stage": "INTERNAL_REVIEW",
        "decision": "APPROVED",
        "notes": "Proceed to client review",
        "decidedAt": "2025-12-28T00:20:00.000Z",
        "createdAt": "2025-12-28T00:20:00.000Z",
        "updatedAt": "2025-12-28T00:20:00.000Z",
        "createdBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        "updatedBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        "deletedAt": null
      }
    ]
  }
}
```

**Permission:** `agency.creative:read`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/agency/creatives/:id
Update creative (only editable in `DRAFT` or `REVISION`).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Creative ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Creative name |
| `type` | string | No | Creative type |
| `description` | string | No | Description |
| `projectId` | string | No | Project reference id |

**Request Example:**
```json
{
  "name": "Homepage Hero Banner (Revised)",
  "description": "Adjusted CTA"
}
```

**Response (200) Example:**
```json
{
  "data": {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "companyId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "clientId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "projectId": "11111111-1111-1111-1111-111111111111",
    "name": "Homepage Hero Banner (Revised)",
    "description": "Adjusted CTA",
    "type": "BANNER",
    "status": "DRAFT",
    "createdAt": "2025-12-28T00:00:00.000Z",
    "updatedAt": "2025-12-28T00:30:00.000Z",
    "createdBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "updatedBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "deletedAt": null
  }
}
```

**Permission:** `agency.creative:update`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/agency/creatives/:id
Soft delete creative (only allowed in `DRAFT` or `REVISION`).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Creative ID |

**Permission:** `agency.creative:delete`  
**Status:** ✅ Implemented

---

### POST /api/v1/agency/creatives/:id/versions
Create creative version.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Creative ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `storageKey` | string | Yes | Storage key/path for the asset |
| `notes` | string | No | Notes |

**Request Example:**
```json
{
  "storageKey": "agency/creatives/c1/v1.png",
  "notes": "First draft for internal review"
}
```

**Response (201) Example:**
```json
{
  "data": {
    "id": "v1111111-1111-1111-1111-111111111111",
    "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "companyId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "creativeId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "versionNumber": 1,
    "storageKey": "agency/creatives/c1/v1.png",
    "notes": "First draft for internal review",
    "createdAt": "2025-12-28T00:10:00.000Z",
    "updatedAt": "2025-12-28T00:10:00.000Z",
    "createdBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "updatedBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "deletedAt": null
  }
}
```

**Permission:** `agency.creative:update`  
**Status:** ✅ Implemented

---

### POST /api/v1/agency/creatives/:id/submit-internal-review
Submit creative for internal review.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Creative ID |

**Response (200) Example:**
```json
{
  "data": {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "status": "INTERNAL_REVIEW"
  }
}
```

**Permission:** `agency.creative:update`  
**Status:** ✅ Implemented

---

### POST /api/v1/agency/creatives/:id/approvals
Record approval decision for a creative in `INTERNAL_REVIEW` or `CLIENT_REVIEW`.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Creative ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `decision` | string | Yes | `APPROVED` \| `REVISION` |
| `versionId` | uuid | No | Optional creative version id |
| `notes` | string | No | Notes |

**Request Example:**
```json
{
  "decision": "APPROVED",
  "versionId": "v1111111-1111-1111-1111-111111111111",
  "notes": "Proceed to client review"
}
```

**Response (201) Example:**
```json
{
  "data": {
    "approval": {
      "id": "ap111111-1111-1111-1111-111111111111",
      "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "companyId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "creativeId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "versionId": "v1111111-1111-1111-1111-111111111111",
      "stage": "INTERNAL_REVIEW",
      "decision": "APPROVED",
      "notes": "Proceed to client review",
      "decidedAt": "2025-12-28T00:20:00.000Z",
      "createdAt": "2025-12-28T00:20:00.000Z",
      "updatedAt": "2025-12-28T00:20:00.000Z",
      "createdBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      "updatedBy": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      "deletedAt": null
    },
    "creative": {
      "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "status": "CLIENT_REVIEW"
    }
  }
}
```

**Permission:** `agency.creative:approve`  
**Status:** ✅ Implemented

---

### POST /api/v1/creatives/:id/versions
Upload new version.

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Creative file |
| `notes` | string | Version notes |

**Permission:** `creative:update`  
**Status:** ⏳ Pending

---

### POST /api/v1/creatives/:id/submit-review
Submit for internal review.

**Permission:** `creative:update`  
**Status:** ⏳ Pending

---

### POST /api/v1/creatives/:id/approve
Approve creative (internal or client).

**Request Body:**
```json
{
  "approvalType": "INTERNAL",
  "comments": "Looks good, ready for client"
}
```

**Permission:** `creative:approve`  
**Status:** ⏳ Pending

---

### POST /api/v1/creatives/:id/request-revision
Request revision.

**Request Body:**
```json
{
  "comments": "Please adjust the color scheme"
}
```

**Permission:** `creative:update`  
**Status:** ⏳ Pending

---

## 🏗️ Construction

### POST /api/v1/construction/projects
Create construction project (extends a core Project).

**Request Body:**
```json
{
  "projectId": "uuid",
  "siteAddress": "123 Main St, Kuala Lumpur",
  "permitNo": "PERMIT-2026-0001",
  "contractValue": 1250000.5,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "status": "PLANNING",
    "siteAddress": "123 Main St, Kuala Lumpur",
    "permitNo": "PERMIT-2026-0001",
    "contractValue": 1250000.5,
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.project:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/projects
List construction projects.

**Query Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `page` | number | ❌ | Page number (default 1) |
| `pageSize` | number | ❌ | Page size (default 20, max 100) |
| `status` | string | ❌ | `PLANNING` \| `ACTIVE` \| `ON_HOLD` \| `COMPLETED` \| `ARCHIVED` |
| `projectId` | uuid | ❌ | Filter by core Project id |
| `search` | string | ❌ | Search by `siteAddress` or `permitNo` |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "status": "ACTIVE",
      "siteAddress": "123 Main St, Kuala Lumpur",
      "permitNo": "PERMIT-2026-0001",
      "contractValue": 1250000.5,
      "startDate": "2026-01-01",
      "endDate": "2026-12-31",
      "createdAt": "2026-01-03T00:00:00Z",
      "updatedAt": "2026-01-03T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1,
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.project:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/projects/:id
Get construction project by id.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "status": "ACTIVE",
    "siteAddress": "123 Main St, Kuala Lumpur",
    "permitNo": "PERMIT-2026-0001",
    "contractValue": 1250000.5,
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.project:read`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/construction/projects/:id
Update construction project.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Request Body (example):**
```json
{
  "siteAddress": "456 Updated Ave, Kuala Lumpur"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "status": "ACTIVE",
    "siteAddress": "456 Updated Ave, Kuala Lumpur",
    "permitNo": "PERMIT-2026-0001",
    "contractValue": 1250000.5,
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.project:update`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/construction/projects/:id
Soft delete construction project.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Response:** 204 No Content

**Permission:** `construction.project:delete`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/projects/:id/phases
List construction project phases.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "constructionProjectId": "uuid",
      "name": "Foundation",
      "description": null,
      "sortOrder": 1,
      "percentComplete": 10,
      "startDate": "2026-01-05",
      "endDate": "2026-02-01",
      "createdAt": "2026-01-03T00:00:00Z",
      "updatedAt": "2026-01-03T00:00:00Z"
    }
  ],
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.phase:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/construction/projects/:id/phases
Create construction project phase.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Request Body:**
```json
{
  "name": "Foundation",
  "sortOrder": 1,
  "percentComplete": 10,
  "startDate": "2026-01-05",
  "endDate": "2026-02-01"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "constructionProjectId": "uuid",
    "name": "Foundation",
    "description": null,
    "sortOrder": 1,
    "percentComplete": 10,
    "startDate": "2026-01-05",
    "endDate": "2026-02-01",
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.phase:create`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/construction/projects/:id/phases/:phaseId
Update construction project phase.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |
| `phaseId` | uuid | ✅ | Construction project phase id |

**Request Body (example):**
```json
{
  "percentComplete": 50
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "constructionProjectId": "uuid",
    "name": "Foundation",
    "description": null,
    "sortOrder": 1,
    "percentComplete": 50,
    "startDate": "2026-01-05",
    "endDate": "2026-02-01",
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.phase:update`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/construction/projects/:id/phases/:phaseId
Soft delete construction project phase.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |
| `phaseId` | uuid | ✅ | Construction project phase id |

**Response:** 204 No Content

**Permission:** `construction.phase:delete`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/projects/:id/site-logs
List site logs for a construction project.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Query Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `page` | number | ❌ | Page number (default 1) |
| `pageSize` | number | ❌ | Page size (default 20, max 100) |
| `fromDate` | string | ❌ | ISO date filter (inclusive) |
| `toDate` | string | ❌ | ISO date filter (inclusive) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "constructionProjectId": "uuid",
      "logDate": "2026-01-03",
      "weatherConditions": "Sunny",
      "workersCount": 12,
      "equipmentUsed": { "excavator": 1, "crane": 1 },
      "activitiesCompleted": "Completed excavation of north section.",
      "issuesReported": "None",
      "photos": ["https://example.com/photo1.jpg"],
      "createdAt": "2026-01-03T00:00:00Z",
      "updatedAt": "2026-01-03T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1,
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.site-log:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/construction/projects/:id/site-logs
Create site log entry.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Request Body:**
```json
{
  "logDate": "2026-01-03",
  "weatherConditions": "Sunny",
  "workersCount": 12,
  "equipmentUsed": { "excavator": 1, "crane": 1 },
  "activitiesCompleted": "Completed excavation of north section.",
  "issuesReported": "None",
  "photos": ["https://example.com/photo1.jpg"]
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "constructionProjectId": "uuid",
    "logDate": "2026-01-03",
    "weatherConditions": "Sunny",
    "workersCount": 12,
    "equipmentUsed": { "excavator": 1, "crane": 1 },
    "activitiesCompleted": "Completed excavation of north section.",
    "issuesReported": "None",
    "photos": ["https://example.com/photo1.jpg"],
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.site-log:create`  
**Status:** ✅ Implemented

---

### POST /api/v1/construction/contractors
Create construction contractor.

**Request Body:**
```json
{
  "companyName": "ABC Contractors Sdn Bhd",
  "registrationNumber": "ROC-1234567",
  "contactPerson": "Ahmad Ali",
  "phone": "+60-12-3456789",
  "email": "ops@abc-contractors.my",
  "tradeTypes": ["electrical"],
  "certifications": [{"name": "CIDB G7", "issuer": "CIDB"}],
  "safetyComplianceNotes": "Valid PPE and induction training.",
  "rating": 4.5,
  "status": "ACTIVE"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "companyName": "ABC Contractors Sdn Bhd",
    "registrationNumber": "ROC-1234567",
    "contactPerson": "Ahmad Ali",
    "phone": "+60-12-3456789",
    "email": "ops@abc-contractors.my",
    "tradeTypes": ["electrical"],
    "certifications": [{"name": "CIDB G7", "issuer": "CIDB"}],
    "safetyComplianceNotes": "Valid PPE and induction training.",
    "rating": "4.5",
    "status": "ACTIVE",
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.contractor:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/contractors
List construction contractors.

**Query Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `page` | number | ❌ | Page number (default 1) |
| `pageSize` | number | ❌ | Page size (default 20, max 100) |
| `status` | string | ❌ | `ACTIVE` \| `SUSPENDED` \| `BLACKLISTED` |
| `search` | string | ❌ | Search by company name, registration, contact, or email |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "companyName": "ABC Contractors Sdn Bhd",
      "status": "ACTIVE",
      "tradeTypes": ["electrical"],
      "createdAt": "2026-01-03T00:00:00Z",
      "updatedAt": "2026-01-03T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1,
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.contractor:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/contractors/:id
Get construction contractor by id.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Contractor id |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "companyName": "ABC Contractors Sdn Bhd",
    "status": "ACTIVE",
    "tradeTypes": ["electrical"],
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.contractor:read`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/construction/contractors/:id
Update construction contractor.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Contractor id |

**Request Body (example):**
```json
{
  "status": "SUSPENDED",
  "safetyComplianceNotes": "Suspended pending compliance review"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "companyName": "ABC Contractors Sdn Bhd",
    "status": "SUSPENDED",
    "safetyComplianceNotes": "Suspended pending compliance review",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.contractor:update`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/construction/contractors/:id
Soft delete construction contractor.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Contractor id |

**Response:** 204 No Content

**Permission:** `construction.contractor:delete`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/projects/:id/work-orders
List work orders for a construction project.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Query Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `page` | number | ❌ | Page number (default 1) |
| `pageSize` | number | ❌ | Page size (default 20, max 100) |
| `status` | string | ❌ | `DRAFT` \| `ISSUED` \| `IN_PROGRESS` \| `COMPLETED` \| `CANCELLED` |
| `contractorId` | uuid | ❌ | Filter by contractor |
| `search` | string | ❌ | Search by title/description |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "constructionProjectId": "uuid",
      "contractorId": "uuid",
      "title": "Install electrical wiring - Block A",
      "status": "ISSUED",
      "issuedDate": "2026-01-03T00:00:00Z",
      "dueDate": "2026-02-15T00:00:00Z",
      "createdAt": "2026-01-03T00:00:00Z",
      "updatedAt": "2026-01-03T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1,
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.work-order:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/construction/projects/:id/work-orders
Create work order for a construction project.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Request Body:**
```json
{
  "contractorId": "uuid",
  "title": "Install electrical wiring - Block A",
  "description": "Initial electrical rough-in",
  "scopeOfWork": "Supply and install conduits, DB boards, cabling",
  "value": 25000,
  "dueDate": "2026-02-15"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "constructionProjectId": "uuid",
    "contractorId": "uuid",
    "title": "Install electrical wiring - Block A",
    "status": "DRAFT",
    "value": "25000",
    "dueDate": "2026-02-15T00:00:00Z",
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.work-order:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/projects/:id/work-orders/:workOrderId
Get work order by id.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |
| `workOrderId` | uuid | ✅ | Work order id |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "constructionProjectId": "uuid",
    "contractorId": "uuid",
    "title": "Install electrical wiring - Block A",
    "status": "ISSUED",
    "issuedDate": "2026-01-03T00:00:00Z",
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.work-order:read`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/construction/projects/:id/work-orders/:workOrderId
Update work order (workflow-aware status transitions).

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |
| `workOrderId` | uuid | ✅ | Work order id |

**Request Body (example):**
```json
{
  "status": "ISSUED"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "ISSUED",
    "issuedDate": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.work-order:update`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/construction/projects/:id/work-orders/:workOrderId
Soft delete work order.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |
| `workOrderId` | uuid | ✅ | Work order id |

**Response:** 204 No Content

**Permission:** `construction.work-order:delete`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/projects/:id/safety-incidents
List safety incidents for a construction project.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Query Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `page` | number | ❌ | Page number (default 1) |
| `pageSize` | number | ❌ | Page size (default 20, max 100) |
| `fromDate` | string | ❌ | ISO date filter (inclusive) |
| `toDate` | string | ❌ | ISO date filter (inclusive) |
| `severity` | string | ❌ | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "constructionProjectId": "uuid",
      "incidentDate": "2026-01-10T00:00:00Z",
      "title": "Minor fall incident",
      "severity": "LOW",
      "injuriesCount": 0,
      "createdAt": "2026-01-03T00:00:00Z",
      "updatedAt": "2026-01-03T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1,
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.safety-incident:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/construction/projects/:id/safety-incidents
Report safety incident.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |

**Request Body:**
```json
{
  "incidentDate": "2026-01-10",
  "title": "Minor fall incident",
  "description": "Worker slipped on wet surface; no injury.",
  "severity": "LOW",
  "injuriesCount": 0,
  "actionTaken": "Area inspected and cleaned.",
  "attachments": ["https://example.com/report.pdf"]
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "constructionProjectId": "uuid",
    "incidentDate": "2026-01-10T00:00:00Z",
    "title": "Minor fall incident",
    "severity": "LOW",
    "injuriesCount": 0,
    "attachments": ["https://example.com/report.pdf"],
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.safety-incident:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/construction/projects/:id/safety-incidents/:incidentId
Get safety incident by id.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Construction project id |
| `incidentId` | uuid | ✅ | Safety incident id |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "constructionProjectId": "uuid",
    "incidentDate": "2026-01-10T00:00:00Z",
    "title": "Minor fall incident",
    "severity": "LOW",
    "createdAt": "2026-01-03T00:00:00Z",
    "updatedAt": "2026-01-03T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Permission:** `construction.safety-incident:read`  
**Status:** ✅ Implemented

---

## 🛡️ Compliance & Governance

### GET /api/v1/compliance/residency-check
Check data residency compliance for the current tenant.

**Query Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `originRegion` | string | ❌ | Optional origin region hint (e.g., `EU`, `US`, `MY`) |

**Response (200):**
```json
{
  "data": {
    "compliant": true,
    "violations": [],
    "residency": "GLOBAL",
    "originRegion": null
  }
}
```

**Permission:** `compliance:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/compliance/data-residency
Get the current tenant data residency setting.

**Response (200):**
```json
{
  "data": {
    "dataResidency": "GLOBAL"
  }
}
```

**Permission:** `compliance:read`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/admin/compliance/data-residency
Update the current tenant data residency setting.

**Request Body:**
```json
{
  "dataResidency": "MY"
}
```

**Response (200):**
```json
{
  "data": {
    "dataResidency": "MY"
  }
}
```

**Permission:** `compliance:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/retention/policies
List effective retention policies (defaults + overrides for tenant/company scope).

**Response (200):**
```json
{
  "data": {
    "policies": [
      {
        "category": "OPERATIONAL",
        "retentionDays": 365,
        "actionOnExpiry": "ARCHIVE",
        "source": "DEFAULT",
        "updatedAt": null
      }
    ]
  }
}
```

**Permission:** `retention:manage`  
**Status:** ✅ Implemented

---

### PUT /api/v1/admin/retention/policies/{category}
Upsert a retention policy override for a category.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `category` | string | ✅ | `OPERATIONAL` \| `AUDIT` \| `AI_CONVERSATIONS` \| `ANALYTICS` |

**Request Body:**
```json
{
  "retentionDays": 90,
  "actionOnExpiry": "DELETE",
  "isActive": true
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "category": "AI_CONVERSATIONS",
    "retentionDays": 90,
    "actionOnExpiry": "DELETE",
    "isActive": true,
    "updatedAt": "2025-12-28T00:00:00.000Z"
  }
}
```

**Permission:** `retention:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/retention/preview-deletion
Preview records impacted by retention expiry (read-only).

**Request Body:**
```json
{
  "category": "AI_CONVERSATIONS"
}
```

**Response (200):**
```json
{
  "data": {
    "category": "AI_CONVERSATIONS",
    "estimatedCandidates": 0,
    "note": "Preview is implemented as a safe stub in this phase (no destructive actions)."
  }
}
```

**Permission:** `retention:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/retention/deletion-history
List recent retention deletions (audit view).

**Response (200):**
```json
{
  "data": {
    "items": [],
    "totalItems": 0
  }
}
```

**Permission:** `retention:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/compliance/rules
List compliance rules (tenant scoped).

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "companyId": null,
        "code": "EXPORT_BLOCK_RESTRICTED",
        "title": "Block export of RESTRICTED data",
        "description": "Prevents exporting certain data classifications.",
        "severity": "HIGH",
        "isActive": true,
        "updatedAt": "2025-12-28T00:00:00.000Z"
      }
    ]
  }
}
```

**Permission:** `compliance:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/compliance/rules
Create a compliance rule.

**Request Body:**
```json
{
  "code": "EXPORT_BLOCK_RESTRICTED",
  "title": "Block export of RESTRICTED data",
  "description": "Prevents exporting certain data classifications.",
  "severity": "HIGH",
  "isActive": true,
  "conditions": {
    "classification": "RESTRICTED"
  }
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid"
  }
}
```

**Permission:** `compliance:manage`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/admin/compliance/rules/{id}
Update a compliance rule.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Compliance rule ID |

**Request Body:**
```json
{
  "title": "Block export of RESTRICTED data",
  "description": "Prevents exporting certain data classifications.",
  "severity": "HIGH",
  "isActive": true,
  "conditions": {
    "classification": "RESTRICTED"
  }
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid"
  }
}
```

**Permission:** `compliance:manage`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/admin/compliance/rules/{id}
Soft-delete a compliance rule.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Compliance rule ID |

**Response (200):**
```json
{
  "data": {
    "id": "uuid"
  }
}
```

**Permission:** `compliance:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/compliance/data-classifications
List data classifications (tenant scoped).

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "companyId": null,
        "code": "CUSTOMER_PII",
        "name": "Customer PII",
        "level": "RESTRICTED",
        "description": "Personally identifiable customer data.",
        "isActive": true,
        "updatedAt": "2025-12-28T00:00:00.000Z"
      }
    ]
  }
}
```

**Permission:** `compliance:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/compliance/data-classifications
Create a data classification.

**Request Body:**
```json
{
  "code": "CUSTOMER_PII",
  "name": "Customer PII",
  "level": "RESTRICTED",
  "description": "Personally identifiable customer data.",
  "isActive": true,
  "attributes": {
    "examples": ["email", "phone"]
  }
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid"
  }
}
```

**Permission:** `compliance:manage`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/admin/compliance/data-classifications/{id}
Update a data classification.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Data classification ID |

**Request Body:**
```json
{
  "name": "Customer PII",
  "level": "RESTRICTED",
  "description": "Personally identifiable customer data.",
  "isActive": true,
  "attributes": {
    "examples": ["email", "phone"]
  }
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid"
  }
}
```

**Permission:** `compliance:manage`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/admin/compliance/data-classifications/{id}
Soft-delete a data classification.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | ✅ | Data classification ID |

**Response (200):**
```json
{
  "data": {
    "id": "uuid"
  }
}
```

**Permission:** `compliance:manage`  
**Status:** ✅ Implemented

---

## 🤖 AI Services

### POST /api/v1/ai/chat
Send message to AI assistant.

**Request Body Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `message` | string | ✅ | User message |
| `context` | object | ❌ | Optional structured context (tenant-scoped) |
| `providerName` | string | ❌ | Provider (`OPENAI`, `CLAUDE`, `AZURE_OPENAI`, `OLLAMA`) |
| `model` | string | ❌ | Optional model override |
| `useKnowledgeBase` | boolean | ❌ | When true, retrieves tenant-scoped KB context before generating |
| `moduleKey` | string | ❌ | Optional module filter for KB retrieval |

**Request Body:**
```json
{
  "message": "What are the overdue tasks for this project?",
  "context": {
    "projectId": "uuid"
  },
  "providerName": "OPENAI",
  "model": "gpt-4o-mini",
  "useKnowledgeBase": true,
  "moduleKey": "projects"
}
```

**Response (SSE Stream):**
```
data: {"type": "token", "content": "Based on"}
data: {"type": "token", "content": " the project"}
data: {"type": "done", "usage": {"inputTokens": 150, "outputTokens": 200}}
```

**Permission:** `ai:use`  
**Status:** ✅ Implemented

---

### POST /api/v1/ai/copilot/query
Ask the AI Copilot (read-only, structured response). Copilot is advisory only.

**Request Body Parameters (application/json):**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `question` | string | ✅ | User question |
| `scope` | string | ❌ | `tenant` (default) or `platform` (requires `PLATFORM_ADMIN`) |

**Request Body:**
```json
{
  "question": "Summarize unusual spend patterns in billing last 30 days.",
  "scope": "tenant"
}
```

**Response (200):**
```json
{
  "data": {
    "summary": "Advisory summary...",
    "signals": [{ "metric": "ai_usage_last_30_days", "value": 12 }],
    "confidence": "MEDIUM",
    "confidenceReason": "Based on available usage + audit signals.",
    "recommendations": [{ "action": "Consider reviewing invoices", "priority": "LOW" }],
    "sources": [{ "type": "usage", "period": "last_30_days" }],
    "generatedAt": "2025-12-28T00:00:00.000Z",
    "promptVersion": "copilot-v1"
  },
  "interactionId": "uuid"
}
```

**Permission:** `ai:use`  
**Status:** ✅ Implemented

---

### POST /api/v1/ai/copilot/query/stream
Ask the AI Copilot (SSE stream). Returns a minimal stream containing `start`, a single `token` (the `summary`), and `done`.

**Request Body:**
```json
{
  "question": "What risks do you see in recent audit activity?",
  "scope": "tenant"
}
```

**Response (SSE Stream):**
```
data: {"type":"start"}

data: {"type":"token","content":"Advisory summary..."}

data: {"type":"done","data":{...},"interactionId":"uuid"}
```

**Permission:** `ai:use`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/copilot/suggestions
Get proactive Copilot suggestions (deterministic, read-only).

**Response (200):**
```json
{
  "data": {
    "summary": "Proactive Copilot suggestions (read-only).",
    "signals": [
      { "metric": "ai_usage_last_30_days", "value": 12 },
      { "metric": "audit_last_7_days", "value": 8 }
    ],
    "confidence": "HIGH",
    "confidenceReason": "Deterministic suggestions based on available signals.",
    "recommendations": [
      {
        "title": "Review recent AI usage",
        "description": "Consider checking AI usage and costs for unexpected changes.",
        "priority": "LOW"
      }
    ],
    "sources": [
      { "type": "usage", "model": "ai_usage_records", "period": "last_30_days" },
      { "type": "audit", "model": "audit_logs", "period": "last_7_days" }
    ],
    "generatedAt": "2025-12-28T00:00:00.000Z",
    "promptVersion": "copilot-suggestions-v1"
  }
}
```

**Permission:** `ai:use`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/copilot/history
List AI Copilot interaction history (tenant scoped). Non-admin viewers are restricted to their own interactions.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `pageSize` | number | 50 | Items per page (max: 200) |

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "actorUserId": "uuid",
        "actorRole": "COMPANY_ADMIN",
        "scope": "TENANT",
        "question": "...",
        "responseSummary": "...",
        "confidenceLevel": "MEDIUM",
        "promptVersion": "copilot-v1",
        "providerName": "OPENAI",
        "modelName": "gpt-4o-mini",
        "tokensIn": 100,
        "tokensOut": 200,
        "costCents": 12,
        "generatedAt": "2025-12-28T00:00:00.000Z"
      }
    ],
    "totalItems": 1,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

**Permission:** `ai:use`  
**Status:** ✅ Implemented

---

### POST /api/v1/ai/admin/knowledge-base/documents
Create (ingest) a knowledge base document. Content is chunked and embedded asynchronously.

**Request Body Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `sourceType` | string | ✅ | `KNOWLEDGE_BASE`, `POLICY`, `FAQ` |
| `sourceId` | string | ❌ | Optional external identifier |
| `title` | string | ✅ | Document title |
| `text` | string | ✅ | Plaintext content to ingest |
| `moduleKey` | string | ❌ | Optional module key (e.g., `hr`, `projects`) |
| `allowedRoles` | string[] | ❌ | Allowed role codes; include `"*"` to allow all roles within tenant |
| `tags` | string[] | ❌ | Tags for filtering |
| `metadata` | object | ❌ | Additional metadata JSON |

**Request Body:**
```json
{
  "sourceType": "KNOWLEDGE_BASE",
  "sourceId": "refund-policy-2025",
  "title": "Refund Policy (2025)",
  "text": "Full policy text...",
  "moduleKey": "billing",
  "allowedRoles": ["*"],
  "tags": ["policy", "refund"],
  "metadata": {}
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "title": "Refund Policy (2025)",
    "sourceType": "KNOWLEDGE_BASE",
    "sourceId": "refund-policy-2025",
    "chunkCount": 3
  }
}
```

**Permission:** `ai:knowledge:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/admin/knowledge-base/documents
List knowledge base documents (tenant + scope scoped).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `sourceType` | string | Optional filter (`KNOWLEDGE_BASE`, `POLICY`, `FAQ`) |
| `moduleKey` | string | Optional module filter |
| `search` | string | Optional title search |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "sourceType": "KNOWLEDGE_BASE",
      "sourceId": "refund-policy-2025",
      "title": "Refund Policy (2025)",
      "isActive": true,
      "metadata": {
        "moduleKey": "billing",
        "tags": ["policy"],
        "allowedRoles": ["*"]
      },
      "updatedAt": "2025-12-28T00:00:00.000Z"
    }
  ]
}
```

**Permission:** `ai:knowledge:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/admin/knowledge-base/documents/:id
Get a knowledge base document (tenant + scope scoped).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Knowledge base document ID |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "sourceType": "KNOWLEDGE_BASE",
    "sourceId": "refund-policy-2025",
    "title": "Refund Policy (2025)",
    "text": "Full policy text...",
    "metadata": {
      "moduleKey": "billing",
      "tags": ["policy"],
      "allowedRoles": ["*"]
    },
    "isActive": true,
    "updatedAt": "2025-12-28T00:00:00.000Z"
  }
}
```

**Permission:** `ai:knowledge:manage`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/ai/admin/knowledge-base/documents/:id
Soft-delete a knowledge base document (and its chunks).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Knowledge base document ID |

**Response (200):**
```json
{
  "data": {
    "id": "uuid"
  }
}
```

**Permission:** `ai:knowledge:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/ai/admin/knowledge-base/documents/:id/reindex
Re-embed all chunks for a document (async).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Knowledge base document ID |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "queued"
  }
}
```

**Permission:** `ai:knowledge:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/ai/admin/knowledge-base/search
Search the knowledge base using tenant-scoped vector similarity.

**Request Body Parameters:**
| Param | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `query` | string | ✅ | - | Search query text |
| `moduleKey` | string | ❌ | - | Optional module key filter |
| `topK` | number | ❌ | 5 | Max results (1-20) |

**Request Body:**
```json
{
  "query": "How do refunds work?",
  "moduleKey": "billing",
  "topK": 5
}
```

**Response (200):**
```json
{
  "data": {
    "query": "How do refunds work?",
    "topK": 5,
    "chunks": [
      {
        "id": "uuid",
        "documentId": "uuid",
        "content": "Title: Refund Policy (2025)\n\n...",
        "similarity": 0.82,
        "metadata": {
          "moduleKey": "billing",
          "tags": ["policy"],
          "allowedRoles": ["*"]
        }
      }
    ]
  }
}
```

**Permission:** `ai:knowledge:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/ai/analyze
Analyze data with AI.

**Request Body:**
```json
{
  "type": "PROJECT_HEALTH",
  "resourceId": "uuid"
}
```

**Response (200):**
```json
{
  "data": {
    "type": "PROJECT_HEALTH",
    "resourceId": "uuid",
    "summary": "Advisory summary text..."
  }
}
```

**Permission:** `ai:use`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/suggestions
Get AI-generated suggestions.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `context` | string | Context type (`TASK_ASSIGNMENT`, `SCHEDULE`, `BUDGET`) |
| `resourceId` | uuid | Related resource ID |

**Permission:** `ai:use`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/admin/provider-config
Get effective AI provider config for the current tenant scope.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "providerName": "OPENAI",
    "baseUrl": null,
    "defaultModel": "gpt-4o-mini",
    "settings": {},
    "isActive": true,
    "updatedAt": "2025-12-28T00:00:00.000Z"
  }
}
```

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### PUT /api/v1/ai/admin/provider-config
Upsert AI provider config (API key is stored encrypted).

**Request Body:**
```json
{
  "providerName": "OPENAI",
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com",
  "defaultModel": "gpt-4o-mini",
  "settings": {
    "apiVersion": "2024-10-01-preview",
    "deployment": "my-deployment"
  }
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "providerName": "OPENAI",
    "baseUrl": "https://api.openai.com",
    "defaultModel": "gpt-4o-mini",
    "settings": {
      "apiVersion": "2024-10-01-preview",
      "deployment": "my-deployment"
    },
    "isActive": true,
    "updatedAt": "2025-12-28T00:00:00.000Z"
  }
}
```

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/admin/models
List model registry entries (tenant scoped).

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "providerName": "OPENAI",
      "modelName": "gpt-4o-mini",
      "displayName": "GPT 4o mini",
      "capabilities": ["chat"],
      "isActive": true
    }
  ]
}
```

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### POST /api/v1/ai/admin/models
Create a model registry entry (tenant scoped).

**Request Body:**
```json
{
  "providerName": "OPENAI",
  "modelName": "gpt-4o-mini",
  "modelVersion": "2025-01-01",
  "displayName": "GPT 4o mini",
  "capabilities": ["chat"],
  "contextWindow": 128000,
  "maxOutputTokens": 4096,
  "costPerInputTokenCents": "0.01",
  "costPerOutputTokenCents": "0.02",
  "isActive": true
}
```

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/admin/models/:id
Get a model registry entry (tenant scoped).

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### PUT /api/v1/ai/admin/models/:id
Update a model registry entry (tenant scoped).

**Request Body:**
```json
{
  "displayName": "GPT 4o mini (default)",
  "isActive": true
}
```

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/admin/prompt-templates
List AI prompt templates (tenant scoped).

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "project-health-summary",
      "version": 1,
      "template": "Summarize project {{projectId}} using context.",
      "variables": ["projectId"],
      "status": "DRAFT"
    }
  ]
}
```

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### POST /api/v1/ai/admin/prompt-templates
Create an AI prompt template (tenant scoped).

**Request Body:**
```json
{
  "name": "project-health-summary",
  "version": 1,
  "systemPrompt": "You are a tenant-scoped advisor.",
  "template": "Summarize project {{projectId}} using the provided context.",
  "variables": ["projectId"],
  "status": "DRAFT"
}
```

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/admin/prompt-templates/:id
Get an AI prompt template (tenant scoped).

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### PUT /api/v1/ai/admin/prompt-templates/:id
Update an AI prompt template (tenant scoped).

**Request Body:**
```json
{
  "status": "ACTIVE"
}
```

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

### GET /api/v1/ai/admin/usage/recent
List recent AI usage records (tenant scoped).

**Query Parameters:**
| Param | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | number | 50 | Max number of usage records to return |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "providerName": "OPENAI",
      "modelName": "gpt-4o-mini",
      "purpose": "chat",
      "tokensIn": 150,
      "tokensOut": 200,
      "latencyMs": 1234,
      "costCents": "1.23",
      "createdAt": "2025-12-28T00:00:00.000Z"
    }
  ]
}
```

**Permission:** `ai:admin`  
**Status:** ✅ Implemented

---

## ⚙️ Automation

Approval-based automation framework (Human-in-the-Loop). **Propose ≠ Execute**: proposals do nothing until approved.

**Module key:** `automation` (Module Registry)

**Headers (All endpoints):**
```
Authorization: Bearer {accessToken}
```

### POST /api/v1/automation/proposals
Create an automation proposal.

**Request Body:**
```json
{
  "actionType": "projects.archive",
  "targetEntity": "projects",
  "targetId": "uuid",
  "payload": {
    "reason": "Closeout"
  },
  "source": "ADMIN_REQUEST",
  "sourceReference": "REQ-123"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "actionType": "projects.archive",
    "targetEntity": "projects",
    "targetId": "uuid",
    "payload": {
      "reason": "Closeout"
    },
    "expiresAt": "2025-01-01T00:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Permission:** `automation:propose`  
**Status:** ✅ Implemented

---

### GET /api/v1/automation/proposals
List automation proposals (defaults to `PENDING`).

**Query Parameters:**
| Param | Type | Default | Description |
|------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `pageSize` | number | 20 | Items per page |
| `status` | string | `PENDING` | Proposal status |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "PENDING",
      "actionType": "projects.archive",
      "targetEntity": "projects",
      "targetId": "uuid",
      "expiresAt": "2025-01-01T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Permission:** `automation:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/automation/proposals/:id
Get proposal details (includes recent execution logs).

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | Yes | Proposal ID |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "actionType": "projects.archive",
    "targetEntity": "projects",
    "targetId": "uuid",
    "payload": {
      "reason": "Closeout"
    },
    "executionLogs": [
      {
        "id": "uuid",
        "status": "SUCCEEDED",
        "startedAt": "2025-01-01T00:00:00Z",
        "finishedAt": "2025-01-01T00:00:03Z"
      }
    ]
  }
}
```

**Permission:** `automation:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/automation/proposals/:id/approve
Approve a proposal (queues async execution).

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | Yes | Proposal ID |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "APPROVED"
  }
}
```

**Permission:** `automation:approve`  
**Status:** ✅ Implemented

---

### POST /api/v1/automation/proposals/:id/reject
Reject a proposal.

**Path Parameters:**
| Param | Type | Required | Description |
|------|------|----------|-------------|
| `id` | uuid | Yes | Proposal ID |

**Request Body:**
```json
{
  "reason": "Insufficient justification"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "REJECTED"
  }
}
```

**Permission:** `automation:approve`  
**Status:** ✅ Implemented

---

### GET /api/v1/automation/history
List proposal history (non-pending by default).

**Query Parameters:**
| Param | Type | Default | Description |
|------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `pageSize` | number | 20 | Items per page |
| `status` | string | (optional) | Filter to a specific status |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "EXECUTED",
      "actionType": "projects.archive",
      "targetEntity": "projects",
      "targetId": "uuid",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Permission:** `automation:read`  
**Status:** ✅ Implemented

---

## 🔔 Notifications

### GET /api/v1/notifications
List notifications for current user.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | No | Page number (1-indexed). Default `1`. |
| `pageSize` | number | No | Items per page (max 100). Default `20`. |
| `read` | boolean | No | Filter by read status |
| `type` | string | No | Filter by type (`INFORMATIONAL`, `ACTIONABLE`, `SYSTEM`) |

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data[]` | array | List of notifications (in-app) |
| `data[].id` | uuid | Notification ID |
| `data[].type` | string | Notification type |
| `data[].status` | string | Status (`SENT`, `READ`) |
| `data[].title` | string | Title |
| `data[].message` | string | Message |
| `data[].metadata` | object \| null | JSON metadata |
| `data[].actionUrl` | string \| null | Optional action URL |
| `data[].readAt` | string \| null | ISO 8601 |
| `data[].createdAt` | string | ISO 8601 |
| `meta.page` | number | Current page |
| `meta.pageSize` | number | Page size |
| `meta.totalItems` | number | Total items |
| `meta.totalPages` | number | Total pages |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "INFORMATIONAL",
      "status": "SENT",
      "title": "Welcome",
      "message": "Your account is ready.",
      "metadata": { "source": "system" },
      "actionUrl": null,
      "readAt": null,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Permission:** Authenticated  
**Status:** ✅ Implemented

---

### PATCH /api/v1/notifications/:id/read
Mark notification as read.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Notification ID |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "readAt": "2025-01-01T00:00:00Z"
  }
}
```

**Permission:** Authenticated  
**Status:** ✅ Implemented

---

### POST /api/v1/notifications/read-all
Mark all notifications as read.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": {
    "updatedCount": 3
  }
}
```

**Permission:** Authenticated  
**Status:** ✅ Implemented

---

### GET /api/v1/notifications/settings
Get notification preferences.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data.emailEnabled` | boolean | Whether EMAIL notifications are enabled |
| `data.inAppEnabled` | boolean | Whether IN_APP notifications are enabled |
| `data.typeSettings` | object | Per-type settings (JSON object) |

**Response (200):**
```json
{
  "data": {
    "emailEnabled": true,
    "inAppEnabled": true,
    "typeSettings": {}
  }
}
```

**Permission:** Authenticated  
**Status:** ✅ Implemented

---

### PUT /api/v1/notifications/settings
Update notification preferences.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emailEnabled` | boolean | No | Enable/disable EMAIL channel |
| `inAppEnabled` | boolean | No | Enable/disable IN_APP channel |
| `typeSettings` | object | No | JSON object to store per-type settings |

**Request Body:**
```json
{
  "emailEnabled": true,
  "inAppEnabled": true,
  "typeSettings": {
    "taskAssigned": true,
    "projectUpdates": true
  }
}
```

**Response (200):**
```json
{
  "data": {
    "emailEnabled": true,
    "inAppEnabled": true,
    "typeSettings": {
      "taskAssigned": true,
      "projectUpdates": true
    }
  }
}
```

**Permission:** Authenticated  
**Status:** ✅ Implemented

---

## 📈 Analytics

> Read-only analytics derived asynchronously from domain events.

### GET /api/v1/analytics/overview
Get analytics overview (enabled modules only).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | No | `all_time` \| `daily` \| `monthly` (default: `all_time`) |
| `from` | string | No | ISO 8601 date/datetime |
| `to` | string | No | ISO 8601 date/datetime |

**Response (200):**
```json
{
  "data": {
    "tenantId": "uuid",
    "period": {
      "type": "daily",
      "from": "2025-12-01T00:00:00.000Z",
      "to": "2025-12-31T00:00:00.000Z"
    },
    "data": {
      "hr": { "totalEmployees": 10, "activeEmployees": 9 },
      "projects": {
        "totalProjects": 3,
        "projectsDraftCount": 1,
        "projectsActiveCount": 1,
        "projectsOnHoldCount": 0,
        "projectsCompletedCount": 1,
        "projectsArchivedCount": 0
      },
      "billing": {
        "totalInvoices": 5,
        "totalRevenueCents": "125000",
        "invoicesDraftCount": 1,
        "invoicesIssuedCount": 2,
        "invoicesPaidCount": 2,
        "invoicesOverdueCount": 0,
        "invoicesCancelledCount": 0
      },
      "agency": {
        "activeClients": 4,
        "activeEngagements": 2,
        "creativesCreatedCount": 7,
        "creativeApprovalsRecordedCount": 5
      }
    },
    "computedAt": "2025-12-31T00:00:00.000Z"
  }
}
```

**Permission:** `analytics.overview:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/analytics/hr
Get HR analytics time series.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | No | `all_time` \| `daily` \| `monthly` (default: `all_time`) |
| `from` | string | No | ISO 8601 date/datetime |
| `to` | string | No | ISO 8601 date/datetime |

**Response (200):**
```json
{
  "data": {
    "tenantId": "uuid",
    "period": {
      "type": "daily",
      "from": "2025-12-01T00:00:00.000Z",
      "to": "2025-12-31T00:00:00.000Z"
    },
    "data": {
      "series": [
        {
          "periodStart": "2025-12-01T00:00:00.000Z",
          "totalEmployees": 10,
          "activeEmployees": 9
        }
      ]
    },
    "computedAt": "2025-12-31T00:00:00.000Z"
  }
}
```

**Permission:** `analytics.hr:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/analytics/projects
Get Projects analytics time series.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | No | `all_time` \| `daily` \| `monthly` (default: `all_time`) |
| `from` | string | No | ISO 8601 date/datetime |
| `to` | string | No | ISO 8601 date/datetime |

**Response (200):**
```json
{
  "data": {
    "tenantId": "uuid",
    "period": {
      "type": "daily",
      "from": "2025-12-01T00:00:00.000Z",
      "to": "2025-12-31T00:00:00.000Z"
    },
    "data": {
      "series": [
        {
          "periodStart": "2025-12-01T00:00:00.000Z",
          "totalProjects": 3,
          "projectsDraftCount": 1,
          "projectsActiveCount": 1,
          "projectsOnHoldCount": 0,
          "projectsCompletedCount": 1,
          "projectsArchivedCount": 0
        }
      ]
    },
    "computedAt": "2025-12-31T00:00:00.000Z"
  }
}
```

**Permission:** `analytics.projects:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/analytics/billing
Get Billing analytics time series.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | No | `all_time` \| `daily` \| `monthly` (default: `all_time`) |
| `from` | string | No | ISO 8601 date/datetime |
| `to` | string | No | ISO 8601 date/datetime |

**Response (200):**
```json
{
  "data": {
    "tenantId": "uuid",
    "period": {
      "type": "daily",
      "from": "2025-12-01T00:00:00.000Z",
      "to": "2025-12-31T00:00:00.000Z"
    },
    "data": {
      "series": [
        {
          "periodStart": "2025-12-01T00:00:00.000Z",
          "totalInvoices": 5,
          "totalRevenueCents": "125000",
          "invoicesDraftCount": 1,
          "invoicesIssuedCount": 2,
          "invoicesPaidCount": 2,
          "invoicesOverdueCount": 0,
          "invoicesCancelledCount": 0
        }
      ]
    },
    "computedAt": "2025-12-31T00:00:00.000Z"
  }
}
```

**Permission:** `analytics.billing:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/analytics/agency
Get Agency analytics time series.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | No | `all_time` \| `daily` \| `monthly` (default: `all_time`) |
| `from` | string | No | ISO 8601 date/datetime |
| `to` | string | No | ISO 8601 date/datetime |

**Response (200):**
```json
{
  "data": {
    "tenantId": "uuid",
    "period": {
      "type": "daily",
      "from": "2025-12-01T00:00:00.000Z",
      "to": "2025-12-31T00:00:00.000Z"
    },
    "data": {
      "series": [
        {
          "periodStart": "2025-12-01T00:00:00.000Z",
          "activeClients": 4,
          "activeEngagements": 2,
          "creativesCreatedCount": 7,
          "creativeApprovalsRecordedCount": 5
        }
      ]
    },
    "computedAt": "2025-12-31T00:00:00.000Z"
  }
}
```

**Permission:** `analytics.agency:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/analytics/trends
Get a fixed-metric trend series (read-only, derived asynchronously).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `metric` | string | Yes | `revenue_cents` \| `invoice_count` \| `employee_count` \| `project_count` \| `active_clients` |
| `period` | string | No | `all_time` \| `daily` \| `monthly` (default: `all_time`) |
| `from` | string | No | ISO 8601 date/datetime |
| `to` | string | No | ISO 8601 date/datetime |
| `compare` | string | No | `previous_period` |

**Response (200):**
```json
{
  "data": {
    "tenantId": "uuid",
    "metric": {
      "key": "revenue_cents",
      "label": "Revenue (cents)"
    },
    "period": {
      "type": "daily",
      "from": "2025-12-01T00:00:00.000Z",
      "to": "2025-12-31T00:00:00.000Z"
    },
    "data": {
      "summary": { "total": 125000 },
      "series": [
        { "periodStart": "2025-12-01T00:00:00.000Z", "value": 5000 }
      ]
    },
    "compare": {
      "period": {
        "type": "daily",
        "from": "2025-11-01T00:00:00.000Z",
        "to": "2025-12-01T00:00:00.000Z"
      },
      "summary": { "total": 100000, "pctChange": 0.25 }
    },
    "computedAt": "2025-12-31T00:00:00.000Z"
  }
}
```

**Permission:** `analytics.trends:read`  
**Status:** ✅ Implemented

---

## 📜 Audit

### GET /api/v1/audit-logs
List audit logs (admin only).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | No | Page number (1-indexed). Default `1`. |
| `pageSize` | number | No | Items per page (max 100). Default `50`. |
| `action` | string | No | Filter by action (contains match) |
| `moduleKey` | string | No | Filter by module key (exact match) |
| `resourceType` | string | No | Filter by resource type (exact match) |
| `resourceId` | uuid | No | Filter by resource id |
| `actorId` | uuid | No | Filter by actor id |
| `startDate` | string | No | ISO 8601 datetime (inclusive) |
| `endDate` | string | No | ISO 8601 datetime (inclusive) |

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data[]` | array | List of audit logs |
| `data[].id` | uuid | Audit log ID |
| `data[].tenantId` | uuid | Tenant ID |
| `data[].companyId` | uuid \| null | Company ID |
| `data[].actorType` | string | Actor type (`USER`, `SYSTEM`, `API`) |
| `data[].actorId` | uuid \| null | Actor ID |
| `data[].actorEmail` | string \| null | Actor email |
| `data[].actorIp` | string \| null | Actor IP |
| `data[].actorAgent` | string \| null | User agent |
| `data[].action` | string | Action (e.g. `user.created`) |
| `data[].moduleKey` | string \| null | Module key |
| `data[].resourceType` | string \| null | Resource type |
| `data[].resourceId` | uuid \| null | Resource ID |
| `data[].resourceName` | string \| null | Resource name |
| `data[].status` | string | Status (`SUCCESS`, `FAILURE`, `DENIED`) |
| `data[].createdAt` | string | ISO 8601 |
| `meta.page` | number | Current page |
| `meta.pageSize` | number | Page size |
| `meta.totalItems` | number | Total items |
| `meta.totalPages` | number | Total pages |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "companyId": "uuid",
      "actorType": "USER",
      "actorId": "uuid",
      "actorEmail": "admin@example.com",
      "actorIp": "127.0.0.1",
      "actorAgent": "Mozilla/5.0",
      "action": "user.created",
      "moduleKey": "spine",
      "resourceType": "user",
      "resourceId": "uuid",
      "resourceName": "John Doe",
      "status": "SUCCESS",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Permission:** `audit:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/audit-logs/:id
Get audit log by id.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Audit log ID |

**Permission:** `audit:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/audit-logs/export
Export audit logs (CSV/Excel).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `format` | string | Export format (`csv`, `xlsx`) |
| `startDate` | datetime | Filter from date |
| `endDate` | datetime | Filter to date |

**Permission:** `audit:export`  
**Status:** ⏳ Pending

---

## 📊 Reporting

### GET /api/v1/report-definitions
List report definitions (scoped).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Permission:** `report-definition:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/report-definitions
Create a report definition (scoped).

**Request Body:**
```json
{
  "key": "billing-summary",
  "name": "Billing Summary",
  "description": "Monthly billing summary",
  "moduleKey": "billing",
  "definition": {},
  "isActive": true
}
```

**Permission:** `report-definition:manage`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/report-definitions/:id
Update a report definition (scoped).

**Request Body:**
```json
{
  "name": "Billing Summary (v2)",
  "isActive": true,
  "definition": {}
}
```

**Permission:** `report-definition:manage`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/report-definitions/:id
Soft delete a report definition (scoped).

**Permission:** `report-definition:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/report-definitions/:id/schedule
Schedule a report definition (repeatable job).

**Request Body:**
```json
{
  "cron": "0 8 * * 1",
  "parameters": {}
}
```

**Permission:** `report-definition:manage`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/report-definitions/:id/schedule
Remove a scheduled report definition job.

**Permission:** `report-definition:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/reports
Create a report run and enqueue generation.

**Request Body:**
```json
{
  "definitionId": "uuid",
  "parameters": {}
}
```

**Permission:** `report:generate`  
**Status:** ✅ Implemented

---

### GET /api/v1/reports
List report runs (scoped).

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `definitionId` | uuid | No | Filter by definition |
| `status` | string | No | `PENDING` \| `COMPLETED` \| `FAILED` |
| `page` | number | No | Default `1` |
| `pageSize` | number | No | Default `20` (max `100`) |

**Permission:** `report:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/reports/:id
Get a report run (scoped).

**Permission:** `report:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/reports/:id/export/pdf
Export a completed report as PDF.

**Response (200):** `application/pdf` (binary)

**Permission:** `report:export`  
**Status:** ✅ Implemented

---

### GET /api/v1/reports/:id/export/excel
Export a completed report as Excel.

**Response (200):** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (binary)

**Permission:** `report:export`  
**Status:** ✅ Implemented

---

### GET /api/v1/dashboard-widgets
List dashboard widgets (scoped).

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `dashboardKey` | string | No | Optional dashboard key filter |

**Permission:** `dashboard-widget:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/dashboard-widgets
Create a dashboard widget (scoped).

**Request Body:**
```json
{
  "dashboardKey": "company-analytics",
  "title": "Revenue Trend",
  "widgetType": "chart",
  "config": {},
  "sortOrder": 0,
  "isActive": true
}
```

**Permission:** `dashboard-widget:manage`  
**Status:** ✅ Implemented

---

### PATCH /api/v1/dashboard-widgets/:id
Update a dashboard widget (scoped).

**Request Body:**
```json
{
  "title": "Revenue Trend (monthly)",
  "config": {},
  "sortOrder": 10,
  "isActive": true
}
```

**Permission:** `dashboard-widget:manage`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/dashboard-widgets/:id
Soft delete a dashboard widget (scoped).

**Permission:** `dashboard-widget:manage`  
**Status:** ✅ Implemented

---

## 🧭 Portal Configuration

Portals are configuration-driven and never bypass RBAC. Widgets are read-only.

### GET /api/v1/portal/config
Get the effective portal config for the current user (role-filtered, module-aware, permission-aware menu).

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `portalType` | enum | No | One of `EXECUTIVE`, `MANAGEMENT`, `STAFF`, `FINANCE`, `VENDOR`, `OPERATIONS`, `PLATFORM` |

**Response (200):**
```json
{
  "availablePortals": ["EXECUTIVE"],
  "selectedPortalType": "EXECUTIVE",
  "config": {
    "portalType": "EXECUTIVE",
    "themeConfig": {},
    "menuConfig": { "sections": [] },
    "enabledWidgetCodes": ["kpi-revenue"]
  }
}
```

**Notes:**
- `menuConfig` is returned after permission + module filtering.
- `enabledWidgetCodes` is returned after widget visibility filtering (permissions + enabled modules).

**Permission:** `portal:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/portal/available-widgets
List widget definitions that the current user is allowed to add (filtered by permissions + enabled modules).

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `portalType` | enum | No | Optional portal type filter |

**Response (200):**
```json
[
  {
    "code": "kpi-revenue",
    "name": "Revenue",
    "description": "Total revenue (from analytics read model)",
    "dataSource": "analytics.billing",
    "requiredPermissions": ["analytics.billing:read"],
    "requiredModules": ["billing"],
    "portalTypes": ["EXECUTIVE", "FINANCE"]
  }
]
```

**Permission:** `portal:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/portal/dashboard
Get the effective dashboard layout for a portal (user override → tenant default → system default).

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `portalType` | enum | No | Defaults to `STAFF` |

**Response (200):**
```json
{
  "portalType": "EXECUTIVE",
  "source": "tenant-default",
  "layout": {},
  "widgets": []
}
```

**Permission:** `portal:read`  
**Status:** ✅ Implemented

---

### PUT /api/v1/portal/dashboard
Save personal dashboard layout/widgets for the current user.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `portalType` | enum | No | Defaults to `STAFF` |

**Request Body:**
```json
{
  "personalLayout": { "grid": "auto" },
  "personalWidgets": [{ "code": "kpi-revenue" }]
}
```

**Response (200):**
```json
{
  "portalType": "EXECUTIVE",
  "layout": { "grid": "auto" },
  "widgets": [{ "code": "kpi-revenue" }]
}
```

**Permission:** `portal:update`  
**Status:** ✅ Implemented

---

### GET /api/v1/portal/widgets/:code/data
Get widget data for the given widget code.

**Path Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Widget code (e.g. `kpi-revenue`) |

**Response (200):**
```json
{
  "code": "kpi-revenue",
  "data": { "totalRevenueCents": 0 }
}
```

**Permission:** `portal:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/portal/configs
List portal configs for the current tenant/company.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "companyId": null,
    "portalType": "EXECUTIVE",
    "targetRoles": ["ACCOUNT_OWNER"],
    "menuConfig": { "sections": [] },
    "themeConfig": {},
    "enabledWidgetCodes": ["kpi-revenue"],
    "isActive": true
  }
]
```

**Permission:** `portal:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/portal/configs
Upsert a portal config for the current tenant/company.

**Request Body:**
```json
{
  "portalType": "EXECUTIVE",
  "targetRoles": ["ACCOUNT_OWNER"],
  "menuConfig": { "sections": [] },
  "themeConfig": {},
  "enabledWidgetCodes": ["kpi-revenue"],
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "companyId": null,
  "portalType": "EXECUTIVE",
  "targetRoles": ["ACCOUNT_OWNER"],
  "menuConfig": { "sections": [] },
  "themeConfig": {},
  "enabledWidgetCodes": ["kpi-revenue"],
  "isActive": true
}
```

**Permission:** `portal:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/portal/widgets
Upsert a widget definition for the current tenant.

**Request Body:**
```json
{
  "code": "kpi-revenue",
  "name": "Revenue",
  "description": "Total revenue",
  "dataSource": "analytics.billing",
  "requiredPermissions": ["analytics.billing:read"],
  "requiredModules": ["billing"],
  "portalTypes": ["EXECUTIVE", "FINANCE"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "code": "kpi-revenue",
  "name": "Revenue",
  "description": "Total revenue",
  "dataSource": "analytics.billing",
  "requiredPermissions": ["analytics.billing:read"],
  "requiredModules": ["billing"],
  "portalTypes": ["EXECUTIVE", "FINANCE"]
}
```

**Permission:** `portal:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/portal/layouts
Create a dashboard layout for the current tenant/company.

**Behavior:**
- Each request creates a new layout record.
- If `isDefault=true`, any previous default layout for the same `{portalType, tenantId, companyId}` is unset.

**Request Body:**
```json
{
  "portalType": "EXECUTIVE",
  "name": "Default Executive Layout",
  "isDefault": true,
  "layout": {},
  "widgets": [{ "code": "kpi-revenue" }]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "companyId": null,
  "portalType": "EXECUTIVE",
  "name": "Default Executive Layout",
  "isDefault": true,
  "layout": {},
  "widgets": [{ "code": "kpi-revenue" }]
}
```

**Permission:** `portal:manage`  
**Status:** ✅ Implemented

---

## 🎨 Branding (White-label)

Branding is resolved in precedence order: `COMPANY → TENANT → PARTNER → PLATFORM`. When no JWT is present, tenant context can be resolved from `Host` using `SubdomainMapping`.

### GET /api/v1/branding
Get the resolved branding for the current request.

**Response (200):**
```json
{
  "data": {
    "resolvedFromScopeType": "TENANT",
    "resolvedFromScopeId": "uuid",
    "logoLightUrl": null,
    "logoDarkUrl": null,
    "faviconUrl": null,
    "primaryColor": "#2563eb",
    "secondaryColor": null,
    "accentColor": null,
    "fontFamily": null,
    "customCss": "--brand-primary: #2563eb;",
    "loginTitle": "Welcome",
    "loginSubtitle": null,
    "footerText": null,
    "supportEmail": null,
    "supportUrl": null,
    "emailTemplates": []
  }
}
```

**Permission:** Public (uses JWT or Host-based tenant context if available)  
**Status:** ✅ Implemented

---

### GET /api/v1/branding/active
Alias of `GET /api/v1/branding`.

**Permission:** Public  
**Status:** ✅ Implemented

---

### GET /api/v1/branding/profile
Get the tenant branding config (authenticated).

**Response (200):**
```json
{
  "data": {
    "resolvedFromScopeType": "TENANT",
    "resolvedFromScopeId": "uuid",
    "logoLightUrl": "https://cdn.example.com/logo-light.png",
    "logoDarkUrl": null,
    "faviconUrl": null,
    "primaryColor": "#2563eb",
    "secondaryColor": null,
    "accentColor": null,
    "fontFamily": "Inter, system-ui, sans-serif",
    "customCss": "--brand-primary: #2563eb;",
    "loginTitle": "Welcome",
    "loginSubtitle": "Sign in to continue",
    "footerText": "© 2026 TERRA IMS",
    "supportEmail": "support@example.com",
    "supportUrl": "https://example.com/support",
    "emailTemplates": []
  }
}
```

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### PUT /api/v1/branding/profile
Create/update the tenant branding config (authenticated).

**Request Body (example):**
```json
{
  "logoLightUrl": "https://cdn.example.com/logo-light.png",
  "primaryColor": "#2563eb",
  "fontFamily": "Inter, system-ui, sans-serif",
  "customCss": "--brand-primary: #2563eb;\n--brand-secondary: #1e40af;",
  "loginTitle": "Welcome",
  "loginSubtitle": "Sign in to continue",
  "footerText": "© 2026 TERRA IMS",
  "supportEmail": "support@example.com",
  "supportUrl": "https://example.com/support",
  "isActive": true,
  "emailTemplates": [
    {
      "templateType": "WELCOME",
      "subjectTemplate": "Welcome to {{brandName}}",
      "bodyTemplate": "Hello {{fullName}}",
      "isActive": true
    }
  ]
}
```

**Notes:**
- `customCss` must contain CSS variable declarations only (no braces/selectors).
- If branding is `PENDING_APPROVAL`, activating (`isActive=true`) is rejected.

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/branding/assets
Set an asset URL (logo/favicon) for tenant branding (authenticated).

**Request Body:**
```json
{ "assetType": "LOGO_LIGHT", "url": "https://cdn.example.com/logo.png" }
```

**Response (201):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/branding/preview
Preview tenant branding changes without persisting (authenticated).

**Request Body (example):**
```json
{
  "primaryColor": "#2563eb",
  "customCss": "--brand-primary: #2563eb;",
  "loginTitle": "Welcome"
}
```

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/branding/submit-for-approval
Submit tenant branding changes for approval.

**Request Body:** None

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/branding/approve
Approve and activate tenant branding.

**Request Body:** None

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/branding/rollback
Rollback tenant branding to a previous version.

**Request Body (optional):**
```json
{ "versionId": "uuid" }
```

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/branding
Get the tenant branding config (tenant scope).

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### PUT /api/v1/admin/branding
Create/update the tenant branding config.

**Request Body (example):**
```json
{
  "primaryColor": "#123456",
  "fontFamily": "Inter, system-ui, sans-serif",
  "customCss": "--brand-primary: #123456;",
  "loginTitle": "TERRA Demo",
  "emailTemplates": [
    {
      "templateType": "WELCOME",
      "subjectTemplate": "Welcome to {{brandName}}",
      "bodyTemplate": "Hello {{fullName}}",
      "isActive": true
    }
  ]
}
```

**Notes:**
- `customCss` only allows CSS variable declarations (no braces/selectors).

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/branding/logo
Set an asset URL (logo/favicon) for tenant branding.

**Request Body:**
```json
{ "assetType": "LOGO_LIGHT", "url": "https://cdn.example.com/logo.png" }
```

**Response (201):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/branding/preview
Preview tenant branding changes without persisting.

**Request Body (example):**
```json
{
  "primaryColor": "#2563eb",
  "customCss": "--brand-primary: #2563eb;",
  "loginTitle": "Welcome"
}
```

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/branding/submit-for-approval
Submit tenant branding changes for approval.

**Request Body:** None

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/branding/approve
Approve and activate tenant branding.

**Request Body:** None

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/branding/rollback
Rollback tenant branding to a previous version.

**Request Body (optional):**
```json
{ "versionId": "uuid" }
```

**Response (200):** Same shape as `GET /api/v1/branding/profile`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/branding/domains
List subdomain/custom domain mappings for current tenant.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "subdomain": "acme",
      "customDomain": "app.acme.com",
      "verificationStatus": "PENDING",
      "sslProvisioned": false,
      "verifiedAt": null,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/branding/domains
Create a subdomain/custom domain mapping for current tenant.

**Request Body:**
```json
{ "subdomain": "acme", "customDomain": "app.acme.com" }
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "subdomain": "acme",
    "customDomain": "app.acme.com",
    "verificationStatus": "PENDING",
    "sslProvisioned": false,
    "verifiedAt": null,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  }
}
```

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### PUT /api/v1/admin/branding/domains/:id
Update a mapping (currently supports `customDomain` changes).

**Path Params:**
- `id` (uuid)

**Request Body:**
```json
{ "customDomain": "app.acme.com" }
```

**Response (200):** Same shape as `POST /api/v1/admin/branding/domains`.

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/branding/domains/:id/verification
Get DNS verification instructions (TXT record name/value) for a custom domain.

**Path Params:**
- `id` (uuid)

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "customDomain": "app.acme.com",
    "verificationStatus": "PENDING",
    "dns": {
      "recordType": "TXT",
      "recordName": "_terra-verification.app.acme.com",
      "recordValue": "hex-token"
    }
  }
}
```

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/admin/branding/domains/:id/verify
Verify DNS ownership for a custom domain.

**Path Params:**
- `id` (uuid)

**Request Body:** None

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "subdomain": "acme",
    "customDomain": "app.acme.com",
    "verificationStatus": "VERIFIED",
    "sslProvisioned": false,
    "verifiedAt": "2026-01-01T00:00:00Z",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  }
}
```

**Permission:** `branding:manage`  
**Status:** ✅ Implemented

---

## 🧩 Templates (Industry Templates)

Industry Templates are **data packages** (versioned, auditable, reversible). They do not bypass billing, governance, or approvals.

**Module:** `templates`  
**Permissions:** `template:read`, `template:apply`, `template:rollback`  
**Status:** ✅ Implemented

---

### GET /api/v1/templates
List published templates (marketplace listing).

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "starter-minimal",
      "name": "Starter (Minimal)",
      "description": "Minimal baseline configuration for quick onboarding.",
      "type": "FUNCTIONAL",
      "industry": null,
      "version": "1.0.0",
      "status": "PUBLISHED",
      "isActive": true,
      "updatedAt": "2026-01-05T00:00:00Z"
    }
  ]
}
```

**Permission:** `template:read`

---

### GET /api/v1/templates/:slug
Get template details by slug.

**Path Params:**
- `slug` (string)

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "slug": "starter-minimal",
    "name": "Starter (Minimal)",
    "description": "Minimal baseline configuration for quick onboarding.",
    "type": "FUNCTIONAL",
    "industry": null,
    "version": "1.0.0",
    "config": {
      "version": "1.0.0",
      "modules": []
    },
    "status": "PUBLISHED",
    "isActive": true,
    "updatedAt": "2026-01-05T00:00:00Z"
  }
}
```

**Permission:** `template:read`

---

### POST /api/v1/templates/:slug/preview
Preview what applying a template would change for the current tenant.

**Path Params:**
- `slug` (string)

**Request Body:** None

**Response (201):**
```json
{
  "data": {
    "modulesToEnable": [],
    "willCreateRoles": false,
    "willUpdatePortalConfigs": false,
    "willUpdateDashboards": false,
    "willUpdateApprovalRules": false,
    "willUpdateBranding": false,
    "sampleDataIncluded": false
  }
}
```

**Permission:** `template:apply`

---

### POST /api/v1/templates/:slug/apply
Apply a template to the current tenant. Writes an audit log entry and records a template application.

**Path Params:**
- `slug` (string)

**Request Body (optional):**
```json
{ "createRollbackSnapshot": true }
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "appliedAt": "2026-01-05T00:00:00Z",
    "appliedBy": "uuid",
    "status": "SUCCESS",
    "rollbackAvailable": true,
    "rolledBackAt": null,
    "rolledBackBy": null,
    "template": {
      "slug": "starter-minimal",
      "name": "Starter (Minimal)",
      "type": "FUNCTIONAL",
      "industry": null,
      "version": "1.0.0"
    }
  }
}
```

**Permission:** `template:apply`

---

### GET /api/v1/templates/history
List applied templates for the current tenant.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "appliedAt": "2026-01-05T00:00:00Z",
      "appliedBy": "uuid",
      "status": "SUCCESS",
      "rollbackAvailable": true,
      "rolledBackAt": null,
      "rolledBackBy": null,
      "template": {
        "slug": "starter-minimal",
        "name": "Starter (Minimal)",
        "type": "FUNCTIONAL",
        "industry": null,
        "version": "1.0.0"
      }
    }
  ]
}
```

**Permission:** `template:read`

---

### POST /api/v1/templates/history/:id/rollback
Rollback an applied template (if rollback snapshot is available). Writes an audit log entry.

**Path Params:**
- `id` (uuid)

**Request Body:** None

**Response (201):**
```json
{ "data": { "id": "uuid", "status": "ROLLED_BACK" } }
```

**Permission:** `template:rollback`

---

## 🧭 Vertical Governance

Multi-Vertical Governance (Part 33). Provides a platform-level registry of verticals and validation rules to prevent circular dependencies and invalid cross-vertical coupling.

**Permissions:** `vertical:read`, `vertical:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/admin/verticals
List all registered verticals.

**Response (200):**
```json
{
  "data": [
    {
      "slug": "projects",
      "name": "Projects",
      "description": null,
      "type": "CORE",
      "status": "STABLE",
      "lifecycle": "ACTIVE",
      "dependencies": [],
      "incompatibleWith": [],
      "maintainer": null,
      "version": "1.0.0",
      "documentationUrl": null,
      "updatedAt": "2026-01-05T00:00:00Z"
    }
  ]
}
```

**Permission:** `vertical:read`

---

### GET /api/v1/admin/verticals/dependencies
Get the current vertical dependency graph.

**Response (200):**
```json
{
  "data": {
    "nodes": [
      {
        "slug": "projects",
        "name": "Projects",
        "type": "CORE",
        "status": "STABLE",
        "lifecycle": "ACTIVE"
      }
    ],
    "edges": [
      { "from": "construction", "to": "projects" }
    ]
  }
}
```

**Permission:** `vertical:read`

---

### POST /api/v1/admin/verticals/validate
Validate a proposed vertical configuration.

**Request Body:**
```json
{
  "slug": "demo-vertical",
  "name": "Demo Vertical",
  "description": "Example vertical for validation",
  "type": "VERTICAL",
  "dependencies": ["projects"],
  "incompatibleWith": [],
  "allowVerticalToVertical": false,
  "existingDependenciesOnly": true
}
```

**Response (201):**
```json
{
  "data": {
    "ok": true,
    "errors": [],
    "warnings": []
  }
}
```

**Permission:** `vertical:manage`

---

### GET /api/v1/admin/verticals/:slug/impact
Impact analysis for a vertical (dependents + incompatibilities).

**Path Params:**
- `slug` (string)

**Response (200):**
```json
{
  "data": {
    "vertical": {
      "slug": "projects",
      "name": "Projects",
      "type": "CORE",
      "status": "STABLE",
      "lifecycle": "ACTIVE",
      "dependencies": [],
      "incompatibleWith": []
    },
    "dependents": ["agency", "construction"],
    "directDependents": ["agency", "construction"],
    "disableBlocked": true,
    "incompatibilities": []
  }
}
```

**Permission:** `vertical:read`

---

## 🌐 Localization

Localization Core (Part 34). Provides locale list, translation lookup, and user locale preferences. Locale resolution follows fallback chain: `USER → Accept-Language → TENANT → PLATFORM`. Timestamps remain stored in UTC.

**Permissions:** `locale:read`, `translation:read`, `translation:manage`, `user-settings:read`, `user-settings:update`  
**Status:** ✅ Implemented

---

### GET /api/v1/locales
List supported locales.

**Response (200):**
```json
{
  "data": [
    {
      "code": "en-US",
      "language": "en",
      "region": "US",
      "name": "English (United States)",
      "isDefault": true
    }
  ]
}
```

**Permission:** `locale:read`

---

### GET /api/v1/translations/:namespace
Get translations for a namespace using resolved locale.

**Path Params:**
- `namespace` (string)

**Headers (optional):**
- `Accept-Language` (string)

**Response (200):**
```json
{
  "data": {
    "localeCode": "en-US",
    "namespace": "common",
    "source": "header",
    "translations": {
      "hello": "Hello"
    }
  }
}
```

**Permission:** `translation:read`

---

### PUT /api/v1/admin/translations
Upsert translations for a locale + namespace.

**Request Body:**
```json
{
  "localeCode": "en-US",
  "namespace": "common",
  "items": [
    { "key": "hello", "value": "Hello" }
  ]
}
```

**Response (200):**
```json
{ "data": { "ok": true } }
```

**Permission:** `translation:manage`

---

### GET /api/v1/user/locale-settings
Get resolved locale settings for the authenticated user.

**Headers (optional):**
- `Accept-Language` (string)

**Response (200):**
```json
{
  "data": {
    "localeCode": "en-US",
    "localeSource": "tenant",
    "timezone": "UTC",
    "currency": "USD",
    "defaults": {
      "localeCode": "en-US",
      "timezone": "UTC",
      "currency": "USD"
    }
  }
}
```

**Permission:** `user-settings:read`

---

### PUT /api/v1/user/locale-settings
Update the user's locale preferences.

**Request Body:**
```json
{
  "preferredLocale": "ms-MY",
  "timezone": "Asia/Kuala_Lumpur",
  "currency": "MYR"
}
```

**Response (200):**
```json
{
  "data": {
    "localeCode": "ms-MY",
    "localeSource": "user",
    "timezone": "Asia/Kuala_Lumpur",
    "currency": "MYR",
    "defaults": {
      "localeCode": "en-US",
      "timezone": "UTC",
      "currency": "USD"
    }
  }
}
```

**Permission:** `user-settings:update`


## 🤝 Partner System

Partner & reseller distribution layer (Part 30). Partners are isolated as their own tenant, and can only see *assigned* tenants with limited fields.

---

### POST /api/v1/partners/tiers
Create a partner tier.

**Request Body:**
```json
{
  "code": "SILVER",
  "name": "Silver Tier",
  "description": "Entry tier for new resellers",
  "defaultCommissionRate": 10
}
```

**Permission:** `partner-tier:manage`  
**Status:** ✅ Implemented

---

### GET /api/v1/partners/tiers
List partner tiers.

**Permission:** `partner-tier:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/partners
Register a partner (creates a dedicated partner tenant + initial partner admin user).

**Request Body:**
```json
{
  "partnerCode": "ACME_RESELLER",
  "name": "Acme Reseller Sdn Bhd",
  "legalName": "Acme Reseller Sdn Bhd (Legal)",
  "type": "RESELLER",
  "tierCode": "SILVER",
  "contactEmail": "ops@acme.com",
  "contactPhone": "+60-12-345-6789",
  "commissionRate": 10,
  "territory": ["MY", "SG"],
  "adminEmail": "partner-admin@acme.com",
  "adminFullName": "Acme Partner Admin",
  "adminPassword": "ChangeMe123!"
}
```

**Response (201):**
```json
{
  "partnerId": "uuid",
  "partnerTenantId": "uuid",
  "partnerAdminUserId": "uuid"
}
```

**Permission:** `partner:create`  
**Status:** ✅ Implemented

---

### GET /api/v1/partners
List partners.

**Permission:** `partner:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/partners/:id
Get a partner by ID.

**Permission:** `partner:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/partners/:id/tenant-links
Link a tenant to a partner (assigned tenants list).

**Request Body:**
```json
{
  "tenantId": "uuid",
  "relationship": "REFERRED",
  "commissionOverride": 12
}
```

**Permission:** `partner-tenant-link:manage`  
**Status:** ✅ Implemented

---

### POST /api/v1/partners/commissions/calculate
Trigger commission calculation for a period (platform admin).

**Request Body:**
```json
{
  "period": "2026-01"
}
```

**Permission:** `partner-commission:calculate`  
**Status:** ✅ Implemented

---

### GET /api/v1/partners/:id/commissions
List a partner’s commissions (platform admin).

**Query Params:**
- `period` (optional, string, `YYYY-MM`)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "partnerId": "uuid",
      "tenant": { "id": "uuid", "name": "TERRA Demo", "slug": "terra-demo" },
      "period": "2026-01",
      "revenueCents": "100000",
      "commissionCents": "12000",
      "status": "PENDING",
      "computedAt": "2026-02-01T02:00:00.000Z",
      "paidAt": null
    }
  ]
}
```

**Permission:** `partner-commission:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/partners/:id/payouts
List a partner’s payouts (platform admin).

**Query Params:**
- `period` (optional, string, `YYYY-MM`)

**Permission:** `partner-payout:read`  
**Status:** ✅ Implemented

---

### POST /api/v1/partners/payouts
Create a payout for a partner + period (attaches eligible commissions).

**Request Body:**
```json
{
  "partnerId": "uuid",
  "period": "2026-01"
}
```

**Permission:** `partner-payout:create`  
**Status:** ✅ Implemented

---

### POST /api/v1/partners/payouts/:id/approve
Approve a payout and transition related commissions to `APPROVED`.

**Permission:** `partner-payout:approve`  
**Status:** ✅ Implemented

---

### POST /api/v1/partners/payouts/:id/pay
Mark a payout as `PAID` and transition related commissions to `PAID`.

**Permission:** `partner-payout:pay`  
**Status:** ✅ Implemented

---

### GET /api/v1/partner/me
Get partner profile for the current partner tenant.

**Permission:** `partner.profile:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/partner/tenants
List assigned tenants (limited fields only: `id`, `name`, `slug`, `status`).

**Permission:** `partner.tenant:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/partner/commissions
List commissions visible to the current partner tenant.

**Query Params:**
- `period` (optional, string, `YYYY-MM`)

**Permission:** `partner.commission:read`  
**Status:** ✅ Implemented

---

### GET /api/v1/partner/payouts
List payouts visible to the current partner tenant.

**Query Params:**
- `period` (optional, string, `YYYY-MM`)

**Permission:** `partner.payout:read`  
**Status:** ✅ Implemented

---

## 🔑 Public API & Developer Platform

**Public API authentication (v1):**
- `X-API-Key: <apiKey>`
- `Authorization: Bearer <access_token>` (OAuth access token)

**Scope enforcement:** Public endpoints require the appropriate scope (e.g., `projects.read`, `hr.employees.read`).

---

### GET /api/public/v1/docs
Swagger UI for Public API v1 only (filtered to `/api/public/v1/*` routes).

**Permission:** Public
**Status:** ✅ Implemented

---

### GET /api/v1/api-keys
List API keys (metadata only; never returns secrets).

**Permission:** `api-key:read`

**Response (200):**
```json
{
  "data": [
    {
      "id": "2a7f4c19-7c84-4b3f-a8ae-8b3f5a8d1c2e",
      "name": "Zapier Integration",
      "description": "Used for Zapier workflow automation",
      "keyPrefix": "a1b2c3d4",
      "scopes": ["analytics.read"],
      "rateLimitTier": "STANDARD",
      "status": "ACTIVE",
      "expiresAt": null,
      "lastUsedAt": "2025-12-29T00:00:00Z",
      "createdAt": "2025-12-29T00:00:00Z"
    }
  ]
}
```

**Status:** ✅ Implemented

---

### GET /api/v1/api-keys/:id
Get an API key by id (metadata only).

**Permission:** `api-key:read`

**Status:** ✅ Implemented

---

### POST /api/v1/api-keys
Create an API key. Returns the secret once.

**Permission:** `api-key:manage`

**Request Body:**
```json
{
  "name": "Zapier Integration",
  "description": "Used for Zapier workflow automation",
  "scopes": ["analytics.read"],
  "rateLimitTier": "STANDARD",
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

**Response (201):**
```json
{
  "data": {
    "apiKey": "<secret-shown-once>",
    "apiKeyMeta": {
      "id": "2a7f4c19-7c84-4b3f-a8ae-8b3f5a8d1c2e",
      "name": "Zapier Integration",
      "description": "Used for Zapier workflow automation",
      "keyPrefix": "a1b2c3d4",
      "scopes": ["analytics.read"],
      "rateLimitTier": "STANDARD",
      "status": "ACTIVE",
      "expiresAt": "2026-01-01T00:00:00.000Z",
      "lastUsedAt": null,
      "createdAt": "2025-12-29T00:00:00.000Z"
    }
  }
}
```

**Status:** ✅ Implemented

---

### POST /api/v1/api-keys/:id/rotate
Rotate an API key (issues a new secret once).

**Permission:** `api-key:manage`

**Status:** ✅ Implemented

---

### POST /api/v1/api-keys/:id/revoke
Revoke an API key.

**Permission:** `api-key:manage`

**Status:** ✅ Implemented

---

### GET /api/v1/oauth-clients
List OAuth clients.

**Permission:** `oauth-client:read`
**Status:** ✅ Implemented

---

### GET /api/v1/oauth-clients/:id
Get OAuth client by id.

**Permission:** `oauth-client:read`
**Status:** ✅ Implemented

---

### POST /api/v1/oauth-clients
Create an OAuth client (returns secret once for `CONFIDENTIAL` clients).

**Permission:** `oauth-client:manage`

**Request Body:**
```json
{
  "name": "Zapier OAuth App",
  "description": "OAuth client for Zapier integration",
  "clientType": "CONFIDENTIAL",
  "redirectUris": ["https://example.com/oauth/callback"],
  "scopes": ["projects.read", "hr.employees.read"],
  "rateLimitTier": "STANDARD",
  "allowAuthorizationCode": true,
  "allowClientCredentials": true
}
```

**Response (201):**
```json
{
  "data": {
    "clientId": "oc_...",
    "clientSecret": "ocs_...",
    "client": {
      "id": "uuid",
      "name": "Zapier OAuth App",
      "clientType": "CONFIDENTIAL",
      "scopes": ["projects.read", "hr.employees.read"],
      "rateLimitTier": "STANDARD",
      "status": "ACTIVE",
      "createdAt": "2025-12-29T00:00:00.000Z"
    }
  }
}
```

**Status:** ✅ Implemented

---

### POST /api/v1/oauth-clients/:id/rotate-secret
Rotate OAuth client secret (`CONFIDENTIAL` clients only).

**Permission:** `oauth-client:manage`
**Status:** ✅ Implemented

---

### POST /api/v1/oauth-clients/:id/revoke
Revoke OAuth client.

**Permission:** `oauth-client:manage`
**Status:** ✅ Implemented

---

### GET /api/v1/api-usage/events
List public API usage events (API key + OAuth client usage).

**Permission:** `api-usage:read`

**Query Parameters:**
- `page` (number, optional)
- `pageSize` (number, optional)
- `from` (ISO 8601 string, optional)
- `to` (ISO 8601 string, optional)
- `authType` (enum, optional)
- `actorId` (uuid, optional)

**Status:** ✅ Implemented

---

### POST /api/public/v1/oauth/authorize
Authorize an OAuth client for `authorization_code` grant (API-first, consent-less flow). Returns an authorization code.

**Auth:** JWT bearer (`Authorization: Bearer <accessToken>`) using internal login

**Query Parameters:**
- `client_id` (string, required)
- `redirect_uri` (string, required)
- `scope` (string, optional; space-delimited)
- `state` (string, optional)
- `code_challenge` (string, optional; required for PUBLIC clients)
- `code_challenge_method` (string, optional; required for PUBLIC clients)

**Response (200):**
```json
{
  "data": {
    "code": "ocd_...",
    "state": "abc"
  }
}
```

**Status:** ✅ Implemented

---

### POST /api/public/v1/oauth/token
Token endpoint for OAuth clients.

**Grant Types:** `client_credentials`, `authorization_code`

**Request Body (client_credentials):**
```json
{
  "grant_type": "client_credentials",
  "client_id": "oc_...",
  "client_secret": "ocs_...",
  "scope": "analytics.read"
}
```

**Response (201):**
```json
{
  "access_token": "oat_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "analytics.read"
}
```

**Request Body (authorization_code):**
```json
{
  "grant_type": "authorization_code",
  "client_id": "oc_...",
  "client_secret": "ocs_...",
  "code": "ocd_...",
  "redirect_uri": "https://example.com/oauth/callback",
  "code_verifier": "<pkce_verifier_for_public_clients>"
}
```

**Response (201):**
```json
{
  "access_token": "oat_...",
  "refresh_token": "ort_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "projects.read hr.employees.read"
}
```

**Status:** ✅ Implemented

---

### GET /api/public/v1/ping
Public API connectivity check (requires public API auth).

**Headers:**
- `X-API-Key: <apiKey>` OR
- `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "ok": true,
  "version": "v1"
}
```

**Rate Limit Headers (200/403/etc):**
- `X-RateLimit-Limit-Minute`, `X-RateLimit-Remaining-Minute`, `X-RateLimit-Reset-Minute`
- `X-RateLimit-Limit-Hour`, `X-RateLimit-Remaining-Hour`, `X-RateLimit-Reset-Hour`

**Status:** ✅ Implemented

---

### GET /api/public/v1/analytics/ping
Scoped example endpoint (requires `analytics.read` scope).

**Headers:**
- `X-API-Key: <apiKey>` OR
- `Authorization: Bearer <access_token>`

**Scope:** `analytics.read`

**Status:** ✅ Implemented

---

### GET /api/public/v1/projects
List projects (public API).

**Headers:**
- `X-API-Key: <apiKey>` OR
- `Authorization: Bearer <access_token>`

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 20)
- `status` (enum, optional: `DRAFT`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`)
- `search` (string, optional)
- `managerId` (uuid, optional)
- `clientId` (uuid, optional)

**Scope:** `projects.read`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "companyId": "uuid",
      "projectCode": "PRJ-001",
      "name": "Website Redesign",
      "description": null,
      "status": "ACTIVE",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": null,
      "managerId": null,
      "clientId": null,
      "createdAt": "2025-12-29T00:00:00.000Z",
      "updatedAt": "2025-12-29T00:00:00.000Z",
      "createdBy": "uuid",
      "updatedBy": "uuid",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Status:** ✅ Implemented

---

### GET /api/public/v1/projects/:id
Get project by id (public API).

**Headers:**
- `X-API-Key: <apiKey>` OR
- `Authorization: Bearer <access_token>`

**Path Parameters:**
- `id` (uuid)

**Scope:** `projects.read`

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "companyId": "uuid",
    "projectCode": "PRJ-001",
    "name": "Website Redesign",
    "description": null,
    "status": "ACTIVE",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": null,
    "managerId": null,
    "clientId": null,
    "createdAt": "2025-12-29T00:00:00.000Z",
    "updatedAt": "2025-12-29T00:00:00.000Z",
    "createdBy": "uuid",
    "updatedBy": "uuid",
    "deletedAt": null
  }
}
```

**Status:** ✅ Implemented

---

### GET /api/public/v1/hr/employees
List employees (public API).

**Headers:**
- `X-API-Key: <apiKey>` OR
- `Authorization: Bearer <access_token>`

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 20, max: 100)
- `search` (string, optional)

**Scope:** `hr.employees.read`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "companyId": "uuid",
      "userId": null,
      "employeeNumber": "E-0001",
      "firstName": "Alya",
      "lastName": "Ismail",
      "email": "alya@company.com",
      "phone": null,
      "dateOfBirth": null,
      "gender": null,
      "jobTitle": null,
      "departmentId": null,
      "positionId": null,
      "managerId": null,
      "employmentType": "FULL_TIME",
      "status": "ACTIVE",
      "joinDate": "2025-01-01T00:00:00.000Z",
      "probationEnd": null,
      "exitDate": null,
      "exitReason": null,
      "avatarUrl": null,
      "metadata": {},
      "createdAt": "2025-12-29T00:00:00.000Z",
      "updatedAt": "2025-12-29T00:00:00.000Z",
      "createdBy": "uuid",
      "updatedBy": "uuid",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Status:** ✅ Implemented

---

### GET /api/public/v1/hr/employees/:id
Get employee by id (public API).

**Headers:**
- `X-API-Key: <apiKey>` OR
- `Authorization: Bearer <access_token>`

**Path Parameters:**
- `id` (uuid)

**Scope:** `hr.employees.read`

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "companyId": "uuid",
    "userId": null,
    "employeeNumber": "E-0001",
    "firstName": "Alya",
    "lastName": "Ismail",
    "email": "alya@company.com",
    "phone": null,
    "dateOfBirth": null,
    "gender": null,
    "jobTitle": null,
    "departmentId": null,
    "positionId": null,
    "managerId": null,
    "employmentType": "FULL_TIME",
    "status": "ACTIVE",
    "joinDate": "2025-01-01T00:00:00.000Z",
    "probationEnd": null,
    "exitDate": null,
    "exitReason": null,
    "avatarUrl": null,
    "metadata": {},
    "createdAt": "2025-12-29T00:00:00.000Z",
    "updatedAt": "2025-12-29T00:00:00.000Z",
    "createdBy": "uuid",
    "updatedBy": "uuid",
    "deletedAt": null
  }
}
```

**Status:** ✅ Implemented

---

## 🛒 Integration Marketplace

**Authentication (MANDATORY):** JWT access token

### GET /api/v1/integrations/catalog
List certified integration catalog entries.

**Permission:** `integration:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
[
  {
    "id": "uuid",
    "key": "slack",
    "name": "Slack",
    "description": "Send notifications to Slack channels",
    "provider": "Slack",
    "category": "communications",
    "version": "1.0.0",
    "documentationUrl": "https://slack.com",
    "homepageUrl": "https://slack.com",
    "requiredScopes": ["public.analytics.ping"],
    "status": "CERTIFIED"
  }
]
```

---

### GET /api/v1/integrations/catalog/:key
Get a certified integration catalog entry by key.

**Permission:** `integration:read`  
**Status:** ✅ Implemented

**Path Parameters:**
- `key` (string)

**Response (200):**
```json
{
  "id": "uuid",
  "key": "slack",
  "name": "Slack",
  "description": "Send notifications to Slack channels",
  "provider": "Slack",
  "category": "communications",
  "version": "1.0.0",
  "documentationUrl": "https://slack.com",
  "homepageUrl": "https://slack.com",
  "requiredScopes": ["public.analytics.ping"],
  "status": "CERTIFIED"
}
```

---

### GET /api/v1/integrations/installed
List installed integrations.

**Permission:** `integration:read`  
**Status:** ✅ Implemented

**Response (200):**
```json
[
  {
    "id": "uuid",
    "catalogKey": "slack",
    "catalogName": "Slack",
    "catalogProvider": "Slack",
    "catalogCategory": "communications",
    "status": "ACTIVE",
    "approvedScopes": ["public.analytics.ping"],
    "installedAt": "2025-12-29T00:00:00.000Z",
    "hasCredentials": true
  }
]
```

---

### GET /api/v1/integrations/installed/:catalogKey/health
Get installed integration health status (minimal internal check).

**Permission:** `integration:read`  
**Status:** ✅ Implemented

**Path Parameters:**
- `catalogKey` (string)

**Response (200):**
```json
{
  "catalogKey": "slack",
  "installationStatus": "ACTIVE",
  "hasCredentials": true,
  "ok": true
}
```

---

### POST /api/v1/integrations/install
Install an integration from the catalog.

**Notes:**
- `credentials` are encrypted at rest and never returned.
- `approvedScopes` must be a subset of the integration's `requiredScopes`.

**Permission:** `integration:install`  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "catalogKey": "slack",
  "approvedScopes": ["public.analytics.ping"],
  "settings": {
    "channel": "#ops"
  },
  "credentials": {
    "webhookUrl": "https://hooks.slack.com/services/T000/B000/X"
  }
}
```

**Response (201):**
```json
{
  "id": "uuid"
}
```

---

### POST /api/v1/integrations/:catalogKey/uninstall
Uninstall an integration by catalog key (soft delete).

**Permission:** `integration:install`  
**Status:** ✅ Implemented

**Path Parameters:**
- `catalogKey` (string)

**Response (201):**
```json
{
  "ok": true
}
```

---

### POST /api/v1/integrations/catalog
Create an integration catalog entry (draft).

**Permission:** `integration-catalog:manage`  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "key": "slack",
  "name": "Slack",
  "description": "Send notifications to Slack channels",
  "provider": "Slack",
  "category": "communications",
  "version": "1.0.0",
  "documentationUrl": "https://slack.com",
  "homepageUrl": "https://slack.com",
  "requiredScopes": ["public.analytics.ping"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "key": "slack",
  "name": "Slack",
  "description": "Send notifications to Slack channels",
  "provider": "Slack",
  "category": "communications",
  "version": "1.0.0",
  "documentationUrl": "https://slack.com",
  "homepageUrl": "https://slack.com",
  "requiredScopes": ["public.analytics.ping"],
  "status": "DRAFT"
}
```

---

### PATCH /api/v1/integrations/catalog/:key
Update an integration catalog entry.

**Permission:** `integration-catalog:manage`  
**Status:** ✅ Implemented

**Path Parameters:**
- `key` (string)

**Request Body (example):**
```json
{
  "description": "Updated description",
  "version": "1.0.1"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "key": "slack",
  "name": "Slack",
  "description": "Updated description",
  "provider": "Slack",
  "category": "communications",
  "version": "1.0.1",
  "documentationUrl": "https://slack.com",
  "homepageUrl": "https://slack.com",
  "requiredScopes": ["public.analytics.ping"],
  "status": "DRAFT"
}
```

---

### POST /api/v1/integrations/catalog/:key/certify
Certify an integration catalog entry (only certified entries are listable).

**Permission:** `integration-catalog:certify`  
**Status:** ✅ Implemented

**Path Parameters:**
- `key` (string)

**Response (201):**
```json
{
  "id": "uuid",
  "key": "slack",
  "name": "Slack",
  "description": "Send notifications to Slack channels",
  "provider": "Slack",
  "category": "communications",
  "version": "1.0.0",
  "documentationUrl": "https://slack.com",
  "homepageUrl": "https://slack.com",
  "requiredScopes": ["public.analytics.ping"],
  "status": "CERTIFIED"
}
```

---

### POST /api/v1/integrations/catalog/:key/disable
Disable an integration catalog entry (removes from listing).

**Permission:** `integration-catalog:manage`  
**Status:** ✅ Implemented

**Path Parameters:**
- `key` (string)

**Response (201):**
```json
{
  "id": "uuid",
  "key": "slack",
  "name": "Slack",
  "description": "Send notifications to Slack channels",
  "provider": "Slack",
  "category": "communications",
  "version": "1.0.0",
  "documentationUrl": "https://slack.com",
  "homepageUrl": "https://slack.com",
  "requiredScopes": ["public.analytics.ping"],
  "status": "DISABLED"
}
```

---

## 🔗 Webhooks

**Delivery Behavior (Platform Guarantees):**
- Delivery is asynchronous and at-least-once (consumers must be idempotent).
- Deliveries are processed via BullMQ queue `webhooks`.
- Retry backoff (max retries: 5): 1m, 5m, 30m, 2h, 24h.
- Circuit breaker: after 10 consecutive failures, the subscription is auto-paused.
- Every delivered payload is signed with HMAC-SHA256.
  - Signing string: `timestamp + "." + JSON payload`
  - Header format: `X-Webhook-Signature: t={timestamp},v1={signature}`

### GET /api/v1/webhooks/events
List supported webhook event types.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data.events` | string[] | Supported event types (may expand over time) |

**Response (200):**
```json
{
  "data": {
    "events": [
      "user.created",
      "user.updated",
      "employee.onboarded",
      "project.created",
      "project.status.changed",
      "invoice.issued",
      "invoice.paid",
      "subscription.upgraded",
      "approval.approved",
      "approval.rejected"
    ]
  }
}
```

**Permission:** `webhook:read`  
**Module:** `webhooks`  
**Status:** ✅ Implemented

---

### GET /api/v1/webhooks/subscriptions
List webhook subscriptions for the current tenant (and company scope).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data.items` | array | List of subscriptions |
| `data.items[].id` | uuid | Subscription ID |
| `data.items[].url` | string | Target URL (HTTPS-only by business rule) |
| `data.items[].eventTypes` | string[] | Event patterns (supports `*` wildcard per Part 28) |
| `data.items[].status` | string | `ACTIVE` \| `PAUSED` \| `DISABLED` |
| `data.items[].secretPrefix` | string | Non-sensitive secret prefix for identification |
| `data.items[].failureCount` | number | Consecutive failure counter (used for auto-pause) |
| `data.items[].pausedAt` | string \| null | ISO 8601 timestamp when paused |
| `data.items[].createdAt` | string | ISO 8601 |
| `data.items[].updatedAt` | string | ISO 8601 |

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "url": "https://example.com/webhooks/terra",
        "eventTypes": ["projects.project.created", "projects.*"],
        "status": "ACTIVE",
        "secretPrefix": "whsec_12",
        "failureCount": 0,
        "pausedAt": null,
        "createdAt": "2026-01-04T00:00:00.000Z",
        "updatedAt": "2026-01-04T00:00:00.000Z"
      }
    ]
  }
}
```

**Permission:** `webhook:read`  
**Module:** `webhooks`  
**Status:** ✅ Implemented

---

### POST /api/v1/webhooks/subscriptions
Create a webhook subscription. Secret is returned once.

**Permission:** `webhook:create`  
**Module:** `webhooks`  
**Status:** ✅ Implemented

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Target URL (must be HTTPS) |
| `eventTypes` | string[] | Yes | Event patterns to subscribe to |

```json
{
  "url": "https://example.com/webhooks/terra",
  "eventTypes": ["projects.project.created", "projects.*"]
}
```

**Response (201):**
```json
{
  "data": {
    "secret": "whsec_...",
    "subscription": {
      "id": "uuid",
      "url": "https://example.com/webhooks/terra",
      "eventTypes": ["projects.project.created", "projects.*"],
      "status": "ACTIVE",
      "secretPrefix": "whsec_...",
      "createdAt": "2026-01-03T00:00:00.000Z"
    }
  }
}
```

---

### PUT /api/v1/webhooks/subscriptions/{id}
Update a webhook subscription.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Subscription ID |

**Request Body (application/json):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | No | Target URL (must be HTTPS) |
| `eventTypes` | string[] | No | Event patterns to subscribe to |
| `status` | string | No | `ACTIVE` \| `PAUSED` \| `DISABLED` |

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "url": "https://example.com/webhooks/terra",
    "eventTypes": ["projects.project.created", "projects.*"],
    "status": "ACTIVE",
    "secretPrefix": "whsec_12",
    "failureCount": 0,
    "pausedAt": null,
    "updatedAt": "2026-01-04T00:00:00.000Z"
  }
}
```

**Permission:** `webhook:update`  
**Module:** `webhooks`  
**Status:** ✅ Implemented

---

### DELETE /api/v1/webhooks/subscriptions/{id}
Soft-delete a webhook subscription.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Subscription ID |

**Response (204):** No Content

**Permission:** `webhook:delete`  
**Module:** `webhooks`  
**Status:** ✅ Implemented

---

### POST /api/v1/webhooks/subscriptions/{id}/test
Generate a signed test payload for this subscription (does not deliver).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Subscription ID |

**Response (201) Body:**
| Field | Type | Description |
|-------|------|-------------|
| `data.headers` | object | Suggested delivery headers |
| `data.headers.x-webhook-signature` | string | Signature header (`t={unix},v1={hmac_hex}`) |
| `data.payload` | object | Signed JSON payload |

**Response (201):**
```json
{
  "data": {
    "headers": {
      "content-type": "application/json",
      "x-webhook-signature": "t=1735948800,v1=0123abcd..."
    },
    "payload": {
      "event_id": "uuid",
      "event_type": "webhook.test",
      "event_version": "v1",
      "tenant_id": "uuid",
      "occurred_at": "2026-01-04T00:00:00.000Z",
      "data": {
        "message": "This is a signed test webhook payload (not delivered).",
        "subscription_id": "uuid"
      },
      "metadata": {
        "source": "webhooks",
        "trace_id": "uuid"
      }
    }
  }
}
```

**Permission:** `webhook:test`  
**Module:** `webhooks`  
**Status:** ✅ Implemented

---

### POST /api/v1/webhooks/subscriptions/{id}/retry/{eventId}
Manually retry a failed webhook delivery.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Subscription ID |
| `eventId` | uuid | Event ID to retry (must exist and be `FAILED`) |

**Response (201):**
```json
{
  "data": {
    "retried": true
  }
}
```

**Permission:** `webhook:retry`  
**Module:** `webhooks`  
**Status:** ✅ Implemented

---

## 🏥 Health & Metrics

### GET /health
Health check endpoint.

**Parameters:** None

**Response (200):**
```json
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "queues": { "status": "up" }
  },
  "error": {},
  "details": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "queues": { "status": "up" }
  }
}
```

**Permission:** Public  
**Status:** ✅ Implemented

---

### GET /health/ready
Readiness check for Kubernetes.

**Parameters:** None

**Response (200):** Same schema as `GET /health`

**Permission:** Public  
**Status:** ✅ Implemented

---

### GET /health/live
Liveness check for Kubernetes.

**Parameters:** None

**Response (200):** Same schema as `GET /health`

**Permission:** Public  
**Status:** ✅ Implemented

---

### GET /ready
Readiness alias for load balancers and simple probes.

**Parameters:** None

**Response (200):** Same schema as `GET /health/ready`

**Permission:** Public  
**Status:** ✅ Implemented

---

### GET /metrics
Prometheus metrics endpoint.

**Parameters:** None

**Response (200):** Prometheus exposition format (`text/plain`)

**Permission:** Internal only  
**Status:** ✅ Implemented

---

## 📄 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-25 | 0.0.0 | Initial API Registry created |
| 2025-12-25 | 0.0.1 | Session 1.1: Project skeleton initialized (no endpoints implemented) |
| 2025-12-25 | 0.0.2 | Session 1.2: Prisma + database scaffolding (no endpoints implemented) |
| 2025-12-25 | 0.0.3 | Session 1.3: Tenant + Company schema, migration, and seed (no endpoints implemented) |
| 2025-12-25 | 0.0.4 | Session 1.4: TenantContext middleware + BaseRepository tenant enforcement (no endpoints implemented) |
| 2025-12-26 | 0.0.5 | Session 1.5: Auth login endpoint + JWT strategy/guard + User schema + seed |
| 2025-12-29 | 0.0.6 | Session 4.2: Portal configuration (configs, widgets, dashboards) + admin endpoints |
| 2025-12-29 | 0.0.7 | Session 4.3: Deployment & SRE (health checks + metrics + Docker + CI validation) |
| 2025-12-29 | 0.0.8 | Session 4.4: Public API (API keys, per-key rate limiting, URL-based versioning scaffold) |
| 2026-01-04 | n/a | Session 5.4: Partner commissions + payouts (calculation, payouts workflow, partner portal endpoints) |
| 2026-01-04 | n/a | Session 5.5: White-label Branding (branding resolution + admin endpoints + domain mappings) |

---

*Last updated: 2026-01-04*
