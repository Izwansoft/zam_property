# ZAM-PROPERTY - AI Coding Agent Instructions (Root)

> **MONOREPO STRUCTURE**: This workspace contains both backend and frontend projects.

## Current Development Phase: **BACKEND**

We are currently developing the **backend** first. All backend development must be completed before starting frontend.

---

## 🎯 Active Project: Backend

**For all backend tasks, refer to:**
```
backend/.github/copilot-instructions.md
```

### Quick Navigation
| Resource | Path |
|----------|------|
| **Copilot Instructions** | [backend/.github/copilot-instructions.md](backend/.github/copilot-instructions.md) |
| **Development Cheatsheet** | [backend/docs/DEVELOPMENT-CHEATSHEET.md](backend/docs/DEVELOPMENT-CHEATSHEET.md) |
| **Progress Tracker** | [backend/docs/PROGRESS.md](backend/docs/PROGRESS.md) |
| **API Registry** | [backend/docs/API-REGISTRY.md](backend/docs/API-REGISTRY.md) |
| **AI Prompts** | [backend/docs/ai-prompt/](backend/docs/ai-prompt/) |

### Backend Tech Stack
- **Framework:** NestJS v10+ (TypeScript strict mode)
- **Database:** PostgreSQL 15+ with Prisma v5+
- **Cache/Queue:** Redis 7+ with BullMQ v5+
- **Search:** OpenSearch 2.x
- **Real-time:** Socket.IO with Redis adapter
- **Package Manager:** pnpm

### Current Session
Check `backend/docs/PROGRESS.md` for current session status.

**Next Session:** Session 1.1 - Initialize NestJS Project

---

## 📁 Workspace Structure

```
zam-property/
├── .github/
│   └── copilot-instructions.md    ← YOU ARE HERE (Root)
├── backend/                        ← ACTIVE DEVELOPMENT
│   ├── .github/
│   │   └── copilot-instructions.md
│   ├── docs/
│   │   ├── ai-prompt/             (35 parts)
│   │   ├── DEVELOPMENT-CHEATSHEET.md
│   │   ├── PROGRESS.md
│   │   └── API-REGISTRY.md
│   └── src/                       (to be created)
└── web-frontend/                   ← AFTER BACKEND COMPLETE
    ├── .github/
    │   └── copilot-instructions.md
    ├── docs/
    │   ├── ai-prompt/             (26 parts)
    │   ├── DEVELOPMENT-CHEATSHEET.md
    │   ├── PROGRESS.md
    │   ├── NAV-STRUCTURE.md
    │   └── API-REGISTRY.md
    └── src/                       (to be created)
```

---

## 🚦 Development Order (MANDATORY)

```
1. Backend (36 sessions)  ← CURRENT
   └── Phase 1: Foundation (12 sessions)
   └── Phase 2: Core Domains (12 sessions)
   └── Phase 3: Real-Time & Verticals (6 sessions)
   └── Phase 4: Platform Features (6 sessions)

2. Frontend (40 sessions) ← AFTER BACKEND
   └── Phase 1: Foundation (12 sessions)
   └── Phase 2: Core Modules (9 sessions)
   └── Phase 3: Real-Time & Verticals (6 sessions)
   └── Phase 4: Platform Features (13 sessions)
```

---

## 🧠 How to Start a Session

### Starting Backend Development
```
I'm starting Zam-Property backend development.

Read the following documents:
1. backend/docs/ai-prompt/master-prompt.md
2. backend/docs/ai-prompt/part-0.md
3. backend/docs/ai-prompt/part-1.md

Then proceed with Session 1.1 from backend/docs/DEVELOPMENT-CHEATSHEET.md
```

### Continuing Backend Development
```
Continuing Zam-Property backend development.

Read backend/docs/ai-prompt/part-X.md (specific part for this session)

Then proceed with Session X.X from backend/docs/DEVELOPMENT-CHEATSHEET.md
```

---

## ⚠️ Rules

1. **Complete backend before starting frontend**
2. **Follow sessions in order** - Don't skip sessions
3. **Update PROGRESS.md** after each session
4. **Update API-REGISTRY.md** after implementing endpoints
5. **All code goes in respective project folder** (backend/ or web-frontend/)

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

**PROJECT:** Backend  
**PHASE:** 1 - Foundation  
**SESSION:** 1.1 - Initialize NestJS Project  
**STATUS:** Not Started

When ready, copy the Session 1.1 prompt from `backend/docs/DEVELOPMENT-CHEATSHEET.md`.
