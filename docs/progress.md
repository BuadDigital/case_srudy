# Project Progress — Ejada Internal (نظام إجادة الداخلي)

**Last updated:** May 2026  
**Purpose:** Working log of what has been implemented in this case-study repo (for handoff and documentation).

---

## 1. Environment & repo fixes

| Item | What we did |
|------|-------------|
| **Frontend `node_modules`** | After renaming the project folder, symlinks broke (`@platform/design-system` not found). Fixed with `npm install` at repo root. |
| **C# extension in Cursor** | Language-server errors were from a third-party C# extension, not project code. Recommendation: use the official Microsoft C# extension. |

---

## 2. User management — Phase 1 (completed)

**Goal:** Persist users from the three registration wizards (HR, Proc, CRM) in PostgreSQL; list and create only (no edit/delete in this phase).

### 2.1 Database schema

- **Identity tables** (ASP.NET Identity), renamed for clarity:
  - `Users`, `Roles`, `UserRoles`, `UserClaims`, `RoleClaims`, `UserLogins`, `UserTokens`
- **Domain tables:**
  - `UserProfiles` — 1:1 with `Users` (contract type, job title, permission level, status, registration source, JSON payload, timestamps)
  - `HrEmployeeProfiles` — HR-specific fields
  - `ProcServiceProviderProfiles` — service provider fields
  - `CrmClientProfiles` — client fields
- **Migrations:** `AddUserProfiles`, `RenameIdentityTables`
- **Seeder:** roles `Admin`, `Supervisor`, `Editor`, `Reader` + default admin `admin@local.dev` / `Admin123!`

### 2.2 Backend API (`backend/RealEstateEval.Api`)

| Endpoint | Description |
|----------|-------------|
| `GET /api/users` | List all registered users with profile details |
| `POST /api/users/hr` | Create user from HR wizard payload |
| `POST /api/users/proc` | Create user from Proc wizard payload |
| `POST /api/users/crm` | Create user from CRM wizard payload |

**Services & contracts:**

- `UserRegistrationService`, `RegistrationMapper`, `RegistrationValidator`
- `UsersController` with `CanManageUsers` policy
- Password rules relaxed to **min 6 characters** (aligned with wizards)
- `/api/auth/me` JWT `sub` claim fix for current user

**List response includes:**

- Summary fields for the table (name, job title, email, contract type, status, source)
- `userName`, `phoneNumber`, `createdAtUtc`, `systemRoles`
- `details[]` — labeled fields grouped by **section** for the expandable UI

### 2.3 Frontend (`apps/shell`)

| Change | Details |
|--------|---------|
| **Removed mocks** | `MOCK_STAFF` and `localStorage` (`evalStaffUsers`) no longer used for the users list |
| **API client** | `packages/api-client/src/users.ts`, `packages/types/src/users.ts` |
| **Shell wiring** | `users-api.ts`, `UsersView.tsx`, all three `*RegistrationFlow.tsx` submit to API on save |
| **Empty list UX** | Empty list does not show a load error; error only on real API/network failure |

### 2.4 Explicitly out of scope (Phase 1)

- Edit / deactivate users
- Other domains (PO, properties, valuation, messages, financial, KPI) — still prototype/mock UI

---

## 3. Users UI — expandable details (completed)

**File:** `apps/shell/src/components/prototype/UsersView.tsx`  
**Styles:** `packages/design-system/src/styles/registration.css`

| Feature | Description |
|---------|-------------|
| **Expand control** | Small chevron button beside each name toggles a detail row |
| **Chevron direction** | Points **down** when expanded, sideways when collapsed |
| **Grouped sections** | Details shown under titled blocks (RTL-friendly layout) |

**Detail sections by registration path:**

| Path | Sections |
|------|----------|
| **All** | الحساب والصلاحيات · النظام |
| **HR** | + بيانات التوظيف |
| **Proc** | + بيانات المزود · الخدمة والموقع · الفوترة |
| **CRM** | + تصنيف العميل · البيانات الأساسية · التواصل |

**Account section highlights:**

- مسار التسجيل، اسم المستخدم، دور النظام (من Identity roles)، مستوى الصلاحيات، الجوال  
- Header chips: registration path, `@username`, registration date  
- System: user GUID, registration timestamp  

---

## 4. Documentation

| File | Description |
|------|-------------|
| `docs/DATABASE_OVERVIEW.md` | PM-friendly database overview (English) |
| `docs/DATABASE_OVERVIEW.html` | Same content in **Arabic**, RTL, printable/shareable HTML |
| `docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md` | Architecture notes (pre-existing) |

**Database connection (local):** `localhost:5432`, database `realestate_eval_dev`, user `postgres` (see `infra/docker-compose.yml`).

---

## 5. How to run (quick reference)

```bash
# 1. Postgres
docker compose -f infra/docker-compose.yml up -d postgres

# 2. API (applies migrations)
cd backend/RealEstateEval.Api
dotnet run

# 3. Frontend
npm install   # from repo root, if needed
npm run dev
```

**Login for user management:** `admin@local.dev` / `Admin123!`

After backend changes, **restart the API** so list/details endpoints return the latest fields.

---

## 6. Key file map

| Area | Paths |
|------|--------|
| Backend models | `backend/RealEstateEval.Api/Models/` |
| EF context | `backend/RealEstateEval.Api/Data/ApplicationDbContext.cs` |
| Migrations | `backend/RealEstateEval.Api/Data/Migrations/` |
| User API | `backend/RealEstateEval.Api/Controllers/UsersController.cs` |
| Mapping / details | `backend/RealEstateEval.Api/Services/RegistrationMapper.cs` |
| Users screen | `apps/shell/src/components/prototype/UsersView.tsx` |
| Registration wizards | `apps/shell/src/components/prototype/registration/` |
| Registration field defs | `apps/shell/src/lib/prototype/registration-data.ts` |

---

## 7. Suggested next steps (not done yet)

- Edit / deactivate users  
- Filter/search on the users table  
- Wire remaining prototype modules to real APIs and tables  
- Export users list (CSV/PDF)  
- Extract extra fields from `RegistrationPayloadJson` if any wizard fields are not yet mapped to profile columns  

---

## 8. Session changelog (high level)

1. Fixed dev environment (npm, tooling notes).  
2. Designed and implemented user persistence from HR / Proc / CRM wizards.  
3. Wrote database overview docs (EN markdown + AR HTML).  
4. Built expandable user rows with API-driven profile details.  
5. Added grouped sections, username, system roles, user id.  
6. Adjusted expand chevron to point down when open.  

---

*This file is maintained for job documentation only; update it when major features land.*
