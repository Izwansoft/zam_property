# ZAM-PROPERTY - AI Coding Agent Instructions (Root)

> **MONOREPO STRUCTURE**: This workspace contains both backend and frontend projects.

## Current Development Phase: **COMPLETE**

Backend development is **COMPLETE** (66/66 sessions). Frontend marketplace is **COMPLETE** (46/46). Frontend PM is **COMPLETE** (34/34 sessions). All 146 sessions finished.

---

## 🎯 Active Project: Frontend

**For all frontend tasks, refer to:**
```
shadcn-template-refactor/.github/copilot-instructions.md
```

### Quick Navigation
| Resource | Path |
|----------|------|
| **Copilot Instructions** | [shadcn-template-refactor/.github/copilot-instructions.md](shadcn-template-refactor/.github/copilot-instructions.md) |
| **Development Cheatsheet** | [shadcn-template-refactor/docs/DEVELOPMENT-CHEATSHEET.md](shadcn-template-refactor/docs/DEVELOPMENT-CHEATSHEET.md) |
| **Progress Tracker** | [shadcn-template-refactor/docs/PROGRESS.md](shadcn-template-refactor/docs/PROGRESS.md) |
| **Navigation Structure** | [shadcn-template-refactor/docs/NAV-STRUCTURE.md](shadcn-template-refactor/docs/NAV-STRUCTURE.md) |
| **API Hooks Registry** | [shadcn-template-refactor/docs/API-REGISTRY.md](shadcn-template-refactor/docs/API-REGISTRY.md) |
| **AI Prompts** | [shadcn-template-refactor/docs/ai-prompt/](shadcn-template-refactor/docs/ai-prompt/) |

### Frontend Tech Stack
- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4+
- **UI Components:** shadcn/ui (Radix primitives, 58+ components)
- **Server State:** TanStack Query v5+
- **Client State:** Zustand
- **Forms:** React Hook Form + Zod
- **Real-time:** Socket.IO client
- **Package Manager:** pnpm

### Current Session
Check `shadcn-template-refactor/docs/PROGRESS.md` for current session status.

**All Sessions Complete** — 80/80 frontend sessions (100%), 146/146 total sessions

---

## 📁 Workspace Structure

```
zam-property/
├── .github/
│   └── copilot-instructions.md    ← YOU ARE HERE (Root)
├── backend/                        ← COMPLETE (66/66 sessions)
│   ├── .github/
│   │   └── copilot-instructions.md
│   ├── docs/
│   │   ├── ai-prompt/             (35 parts)
│   │   ├── DEVELOPMENT-CHEATSHEET.md
│   │   ├── PROGRESS.md
│   │   └── API-REGISTRY.md
│   └── src/                       (implemented)
├── shadcn-template-refactor/       ← COMPLETE (80/80 sessions)
│   ├── .github/
│   │   └── copilot-instructions.md
│   ├── docs/
│   │   ├── ai-prompt/             (26 parts)
│   │   ├── DEVELOPMENT-CHEATSHEET.md
│   │   ├── PROGRESS.md
│   │   ├── NAV-STRUCTURE.md
│   │   └── API-REGISTRY.md
│   ├── app/
│   │   ├── dashboard/             (template reference + portals)
│   │   │   ├── (auth)/            (authenticated routes)
│   │   │   │   ├── platform/      (Platform Admin)
│   │   │   │   ├── tenant/        (Tenant Admin)
│   │   │   │   ├── vendor/        (Vendor)
│   │   │   │   ├── account/       (Customer)
│   │   │   │   └── reference/     (UI kit examples)
│   │   │   └── (guest)/           (guest routes)
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/                (existing 58+ UI components)
│   ├── modules/                   (to be created)
│   ├── verticals/                 (to be created)
│   └── lib/                       (existing + extend)
└── web-frontend/                   ← DEPRECATED (had issues)
```

---

## 🚦 Development Order (MANDATORY)

```
1. Backend (66 sessions)  ✅ COMPLETE
   └── Phase 1: Foundation (12 sessions) ✅
   └── Phase 2: Core Domains (12 sessions) ✅
   └── Phase 3: Real-Time & Verticals (6 sessions) ✅
   └── Phase 4: Platform Features (6 sessions) ✅
   └── Phase 5: Property Management Foundation (8 sessions) ✅
   └── Phase 6: Rent & Maintenance (8 sessions) ✅
   └── Phase 7: Operations (6 sessions) ✅
   └── Phase 8: Growth Features (8 sessions) ✅

2. Frontend Marketplace (46 sessions) ✅ COMPLETE
   └── Phase 1: Foundation (12 sessions) ✅
   └── Phase 2: Core Modules (11 sessions) ✅
   └── Phase 3: Real-Time & Verticals (6 sessions) ✅
   └── Phase 4: Platform Features (17 sessions) ✅

3. Frontend PM (34 sessions) ✅ COMPLETE
   └── Phase 5: PM Foundation UI (12 sessions) ✅
   └── Phase 6: Billing & Payment UI (8 sessions) ✅
   └── Phase 7: Operations UI (6 sessions) ✅
   └── Phase 8: Growth Features UI (8 sessions) ✅
```

---

## 🧠 How to Start a Session

### Starting Frontend Development
```
I'm starting Zam-Property frontend development.

Read the following documents:
1. shadcn-template-refactor/docs/ai-prompt/master-prompt.md
2. shadcn-template-refactor/docs/ai-prompt/part-0.md
3. shadcn-template-refactor/docs/ai-prompt/part-1.md
4. shadcn-template-refactor/docs/ai-prompt/part-2.md

Then proceed with Session 1.1 from shadcn-template-refactor/docs/DEVELOPMENT-CHEATSHEET.md
```

### Continuing Frontend Development
```
Continuing Zam-Property frontend development.

Read shadcn-template-refactor/docs/ai-prompt/part-X.md (specific part for this session)

Then proceed with Session X.X from shadcn-template-refactor/docs/DEVELOPMENT-CHEATSHEET.md
```

### Template Reference
The `app/dashboard/` folder contains the existing shadcn UI kit template.
The `app/dashboard/(auth)/` folder has portal route stubs (platform, tenant, vendor, account).
The `app/dashboard/(guest)/` folder has auth page examples (login, register).
Reuse components and patterns from there to expedite development.

---

## ⚠️ Rules

1. **Complete backend before starting frontend**
2. **Follow sessions in order** - Don't skip sessions
3. **Update PROGRESS.md** after each session
4. **Update API-REGISTRY.md** after implementing endpoints
5. **All code goes in `shadcn-template-refactor/`** folder

---

## 📚 Documentation References

### Backend AI Prompts (35 parts)
- master-prompt.md - Master Project Brief
- part-0.md - Global Rules (NON-NEGOTIABLE)
- part-1 to part-34 - Domain-specific documentation

### Frontend AI Prompts (26 parts)
- master-prompt.md - Master Project Brief
- part-0.md - Global Rules (NON-NEGOTIABLE)
- part-1 to part-25 - Domain-specific documentation

---

## 🎯 Current Focus

**PROJECT:** Zam-Property  
**STATUS:** ALL COMPLETE (146/146 total sessions)  
**BACKEND:** 66/66 sessions ✅  
**FRONTEND:** 80/80 sessions ✅ (Marketplace 46/46 + PM 34/34)  

All development sessions have been completed. See `shadcn-template-refactor/docs/PROGRESS.md` for detailed tracking.

---

## 🔗 Backend Reference

Backend API documentation: [backend/docs/API-REGISTRY.md](backend/docs/API-REGISTRY.md)

Backend is running at: `http://localhost:3000/api/v1`
Swagger docs: `http://localhost:3000/api/docs`
