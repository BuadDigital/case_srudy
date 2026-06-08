# Project Progress — Ejada Internal (نظام إجادة الداخلي)

**Last updated:** 8 June 2026 (مصطلحات أطراف التنفيذ، إدارة المنظمة، تأجيل أطراف القضية)  
**Repo:** `study-realstate-eval` monorepo on branch `main`  
**Audience:** Project manager and developers — single handoff document.

---

## Executive summary

| Layer | What is real today | What is prototype-only |
|-------|-------------------|------------------------|
| **PostgreSQL** | Users, profiles (HR/Proc/CRM), work orders, properties, contacts, courts catalog | Workflow tasks, failures, file bytes, messages/KPI data |
| **ASP.NET API** | Auth (JWT), users, work orders, courts | No messaging, search, attachments blob, failures |
| **Next.js shell** | PO + users + active-transaction queues wired to API | Most other nav screens use mocks; sidebar **role switcher** for demo |

**Demo path:** Login → PO list/intake → properties per PO → **البيانات الأولية** → **استعلام بورصة** → **توزيع المعاملات** (تأكيد التوزيع) → **دراسة حالة العقارات** (queue + workspace) → **نموذج الدراسة** per party task → **الإعدادات** (علاقة المستخدم بالمعلومة) → users → **ادوات النظام**.

---

## Domain glossary (agreed — do not confuse)

Three separate concepts; **do not merge** in UI labels or data models.

| Concept | Who | Uses the system? | Where in product |
|---------|-----|------------------|------------------|
| **أطراف التنفيذ / أطراف القضية** | Parties in the **court enforcement case** (محكوم له/عليه، مالك، وكيل، …) | **No** — external; recorded as **case data** only | PO/property contacts, documents requested *from* them (see deferred §16) |
| **منفّذو العمل (إسناد داخلي)** | Ejadah staff/vendors who **do the work** on a transaction | **Yes** | توزيع المعاملات → child tasks; e.g. **المحكمة → مراجع حكومي**، **المعاينة → معاين ميداني** |
| **أدوار المستخدمين (صلاحيات)** | Login accounts — **which screens** each person sees | **Yes** | JWT + prototype `RoleId`; org registration under **إدارة المنظمة** |

**Wrong today (prototype debt):** page `/workflow-users` labelled «أطراف التنفيذ» manages **internal assignees** (Firas, passwords) — **not** court parties. Rename/repurpose when §16 and org screens are implemented.

**Internal execution mapping (confirmed):**

| Work | Internal role |
|------|----------------|
| زيارة المحكمة | مراجع حكومي (`government-reviewer`) |
| المعاينة الميدانية | معاين ميداني (`field-inspector`) |
| التقييم | مقيم عقاري (`real-estate-appraiser`) — via valuation dept distribution |

---

## Repository layout

```
property_study/
├── apps/shell/              # Next.js 16 app (@platform/shell) — main UI
├── apps/plan/               # Frontend planning notes (FRONTEND.md)
├── backend/
│   ├── RealEstateEval.Api/  # ASP.NET Core 10 API
│   └── plan/                # Backend infra notes (LOCAL_INFRA.md)
├── packages/
│   ├── api-client/          # fetch wrappers (auth, users, work-orders, courts)
│   ├── auth-client/         # JWT session + AppAuthGate
│   ├── design-system/       # prototype.css, registration.css, StatusBadge
│   └── types/               # PageId, RoleId, user/org DTO types
├── infra/                   # docker-compose (Postgres + observability stack)
├── docs/                    # This file + DATABASE_OVERVIEW + PM review + credentials
├── requirements/            # HTML prototypes (reference)
└── package.json             # npm workspaces root scripts
```

---

## 1. How to run

### Prerequisites

- Node.js + npm (workspaces)
- .NET SDK (API)
- Docker (Postgres; optional full infra stack)

### Daily dev (minimum)

```bash
docker compose -f infra/docker-compose.yml up -d postgres
npm run dev:api          # API http://localhost:5160 — applies EF migrations on start
npm install            # once, at repo root
npm run dev            # Next.js http://localhost:3000 (LAN)
# or: npm run dev:local
npm run dev:stop       # free ports 3000 + 5160
```

**Postgres (Docker):** `localhost:5432`, database `realestate_eval_dev`, user `postgres`, password `Admin` (see `infra/docker-compose.yml` and `appsettings.Development.json`).

**API connection override:** env `REAL_ESTATE_EVAL_PG_CONNECTION_STRING` or `ConnectionStrings:DefaultConnection`.

**Frontend API base:** configured for local API port **5160** (see `packages/api-client` / shell env).

### Full local platform (optional — not wired to app code yet)

`infra/docker-compose.yml` also defines: **RabbitMQ**, **Redis**, **Jaeger**, **Prometheus**, **Grafana** (port 3001), **Elasticsearch**, **Kibana**, **Fluent Bit**. See `README.md` and `backend/plan/LOCAL_INFRA.md`.

---

## 2. Authentication & roles (important for PM)

### Real login (JWT)

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Email + password → JWT |
| `GET /api/auth/me` | Current user |

UI: `apps/shell/src/app/login/page.tsx` → stores session via `@platform/auth-client`.

### Two role systems (do not confuse)

| System | Purpose |
|--------|---------|
| **Identity roles (API JWT)** | `CDO`, `HrAdmin`, `ProcAdmin`, `CrmAdmin`, `HR`, `PROC`, `CRM`, legacy `Admin`, … — control **API authorization** (e.g. user list scope) |
| **Prototype roles (sidebar)** | `general-manager`, `case-specialist`, `cdo`, … in `constants.ts` — control **which pages appear** and PO button permissions (`po-roles.ts`) |

After login, `auth-role-map.ts` maps **known emails** to a prototype role in `sessionStorage` (`evalPrototypeRole`). The sidebar **role dropdown** can still switch prototype role without re-login (demo only).

### API seed accounts (PostgreSQL)

| Email | Password | Identity role | Prototype sidebar (if mapped) |
|-------|----------|---------------|-------------------------------|
| `admin@local.dev` | `Admin123!` | Admin | general-manager |
| `s.salhy@gmail.com` | `sliman123` | CDO | cdo |
| `a.alamin@gmail.com` | `ali123` | HrAdmin | hr-admin |
| `a.alqadri@gmail.com` | `ahmad123` | ProcAdmin | proc-admin |
| `g.abdo@gmail.com` | `gamal123` | CrmAdmin | crm-admin |

Seeder: `backend/RealEstateEval.Api/Data/DataSeeder.cs`.

### Demo role-switcher credentials (document only)

`docs/DEMO_ROLE_CREDENTIALS.txt` lists `@ejadah.dev` emails/passwords for future role binding — **not** all wired in API seeder today. Use seed accounts above for API-backed demos.

---

## 3. Database (PostgreSQL / EF Core)

**Provider:** Npgsql · **Context:** `ApplicationDbContext.cs`

### 3.1 Tables

| Table | Contents |
|-------|----------|
| **Identity** | `Users`, `Roles`, `UserRoles`, `UserClaims`, `RoleClaims`, `UserLogins`, `UserTokens` |
| **Users domain** | `UserProfiles` (+ `HrEmployeeProfiles`, `ProcServiceProviderProfiles`, `CrmClientProfiles`) |
| **Case study** | `WorkOrders`, `WorkOrderProperties`, `PropertyContacts`, `CourtCatalogEntries` |

### 3.2 Work order schema (current model)

**`WorkOrders`:** `PoNumber` (unique), `AssignmentType`, `PromulgationDate`, `ReceivedFromEnfathAt`, `ReceivedFromEnfathTime`, `AssignmentSpecialist`, `AssignmentSpecialistEmail`, `ExpectedPropertyCount`, `DueDateAt`, `CreatedAtUtc`.

**`WorkOrderProperties`:** `IdentifierType` (deed / real-estate reg / bourse inquiry), deed/task/owner/court/circuit, location (`City`, `District`), classification/type, `DeedStatus`, `Area`, boundaries flags (`BoundariesAvailability`, `BoundariesExternalDocName`), `RestrictionsPresent`, attachment **filenames** (`AssignmentDocFileName`, `RealEstateRegFileName`, `DelegationLetterFileName`, `OtherDocumentFileNames` JSON), `BourseDataCompleted`.

**`PropertyContacts`:** `Name`, `Phone`, `Role`, `SortOrder`.

**`CourtCatalogEntries`:** `City`, `Court`, `CircuitsJson` (jsonb).

### 3.3 Migration history (apply in order)

| Migration | Summary |
|-----------|---------|
| `20260514092140_InitialIdentity` | ASP.NET Identity |
| `20260518071658_AddUserProfiles` | User profiles + HR/Proc/CRM tables |
| `20260518073656_RenameIdentityTables` | Table names Users/Roles/… |
| `20260519111340_AddCaseStudyWorkOrders` | PO + properties + contacts + courts |
| `20260521060600_AddPropertyContactRole` | Contact `Role` column |
| `20260521141637_PoWorkflowRefactor` | `PromulgationDate`, specialist email, property boundary/restriction fields |
| `20260521143044_AddExpectedPropertyCount` | Expected property count on PO |
| `20260601193436_DropUnusedPropertyBoundaryFields` | Removed legacy boundary text columns |
| `20260601193623_DropUnusedAuditFields` | Removed unused audit columns |

### 3.4 Not stored in database

- Workflow tasks (`evalWorkflowTasks` in browser)
- Failure records (`failures-storage` in browser)
- Assignment/reg/decree **file content** (filenames only)
- Messages, KPI, survey, valuation mock entities

---

## 4. Backend API reference

**Project:** `backend/RealEstateEval.Api` · **Auth:** JWT Bearer on protected controllers.

### 4.1 Auth — `AuthController`

| Method | Route |
|--------|-------|
| POST | `/api/auth/login` |
| GET | `/api/auth/me` |

### 4.2 Users — `UsersController` (policy `CanManageUsers` = authenticated)

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/users` | Scoped: CDO all; HrAdmin HR; ProcAdmin Proc; CrmAdmin CRM |
| GET | `/api/users/organization` | CDO org overview |
| POST | `/api/users/hr` | HrAdmin or CDO |
| POST | `/api/users/proc` | ProcAdmin or CDO |
| POST | `/api/users/crm` | CrmAdmin or CDO |
| DELETE | `/api/users/registered` | **Development only** — wipe registered users, keep org seeds |

**Services:** `UserRegistrationService`, `RegistrationMapper`, `RegistrationValidator` · Password min **6** chars.

**Org roles:** `Models/OrgRoles.cs`, `DepartmentRoles.cs`.

### 4.3 Work orders — `WorkOrdersController`

| Method | Route |
|--------|-------|
| GET | `/api/work-orders` |
| GET | `/api/work-orders/exists?poNumber=` |
| GET | `/api/work-orders/properties/pending-bourse` |
| GET | `/api/work-orders/deeds/prior?deedNumber=&excludePo=` |
| GET | `/api/work-orders/{poNumber}` |
| POST | `/api/work-orders` |
| PUT | `/api/work-orders/{poNumber}` |
| DELETE | `/api/work-orders/{poNumber}` |
| POST | `/api/work-orders/{poNumber}/properties` |
| PUT | `/api/work-orders/{poNumber}/properties/{propertyId}/bourse` |
| PUT | `/api/work-orders/{poNumber}/properties/{propertyId}` |
| DELETE | `/api/work-orders/{poNumber}/properties/{propertyId}` |

**Business rules (`WorkOrderValidator`, `BusinessDueDateCalculator`):**

- **Due date:** 4 business days (Sun–Thu); receipt day counts as day 1 if before **17:00** on a business day; else start next business day; default time `10:00`.
- **تنفيذ:** `AssignmentDocFileName` required per property.
- **تسجيل عيني:** `RealEstateRegFileName` required.
- **Bourse inquiry:** إنفاذ step vs bourse step validation split (district/classification only on bourse completion).
- Contacts: ≥1, name + phone (≥10 digits).
- Unique deed per PO; unique `PoNumber`.

### 4.4 Courts — `CourtsController`

| Method | Route |
|--------|-------|
| GET | `/api/courts` | Auto-seed if empty |
| PUT | `/api/courts` | Replace catalog (supervisor) |

---

## 5. Frontend — routes & screens

**App:** `apps/shell` · **Router:** Next.js App Router · **Styling:** `prototype.css` + `registration.css` + Tailwind (`globals.css`).

### 5.1 Top-level routes

| URL | Screen | Data source |
|-----|--------|-------------|
| `/login` | Login | API JWT |
| `/welcome` | Redirect | `next.config` → `/dashboard` |
| `/dashboard` | Dashboard | PO + property stats API; team table mock |
| `/[page]` | Dynamic pages | See table below |
| `/po` | PO list | API |
| `/po/intake` | PO header intake | API |
| `/po/{poNumber}/edit` | PO header edit | API |
| `/po/{poNumber}/property` | Properties under PO | API (`PoPropertiesPage`) |
| `/po/{poNumber}/property/new` | Add property | API |
| `/po/{poNumber}/property/{id}` | Property detail | API |
| `/po/{poNumber}/property/{id}/edit` | Edit property | API |
| `/po/{poNumber}/property/{id}/failure` | Report failure | **localStorage** |
| `/my-tasks/{taskId}` | Redirect | `next.config` → `/active-primary-data?task=` |
| `/case-study/{taskId}` | Case study workspace (أخصائي) | PO API + **local tasks** + **local form** |

**Redirects:** `/properties` → `/po`; `/my-tasks` → `/active-primary-data`; `/assignment` → `/dashboard`.

### 5.2 Dynamic pages (`apps/shell/src/app/(app)/[page]/page.tsx`)

| `PageId` | Component | API | Nav note |
|----------|-----------|-----|----------|
| `dashboard` | `DashboardView` | Partial | — |
| `active-primary-data` | `MyTasksView` | PO API + **local tasks** | المعاملات النشطة |
| `bourse-inquiry` | `BourseInquiryView` | API pending-bourse | المعاملات النشطة |
| `active-distribution` | `ActiveDistributionView` | PO API + **local tasks** | المعاملات النشطة |
| `active-case-study` | `ActiveCaseStudyView` | PO API + **local tasks** | المعاملات النشطة |
| `case-study-info-roles` | `CaseStudyInfoRolesView` | **localStorage** | الإعدادات (sidebar footer) |
| `property-inspection`, `government-review`, `valuation-coordination`, `property-appraisal`, `active-survey` | `PartyActiveTaskView` | PO API + **local tasks** | المعاملات النشطة (after distribution) |
| `failures` | `FailuresView` | **localStorage** | Live page, static badge |
| `users` | `UsersView` | API | الإعدادات |
| `courts` | `CourtsView` | API | الإعدادات (placeholder flag) |
| `system-tools` | `SystemToolsView` | Catalog only | الإعدادات |
| `survey`, `keys`, `valuation-requests`, `field-form`, `messages`, `financial`, `kpi` | Various `*View` | **Mocks** | Red placeholder in nav |

### 5.3 Sidebar — المعاملات النشطة

Under **أوامر العمل (PO)** (`active-transactions.ts`):

| Item | Route | Status |
|------|-------|--------|
| البيانات الأولية | `/active-primary-data` | Done |
| استعلام بورصة | `/bourse-inquiry` | Done |
| توزيع المعاملات | `/active-distribution` | Done |
| دراسة حالة العقارات | `/active-case-study` | **Done** (queue; opens `/case-study/{taskId}`) |
| معاينة العقار / المراجعة الحكومية / استلام التقييم / تقييم العقار / الرفع المساحي | Party `PageId`s | **Done** (queue + work panel; see section 8.5) |

**Badges:** `use-active-transaction-nav-badges.ts` (primary open, bourse pending, distribution open, case-study open).

### 5.3.1 Sidebar — الإعدادات (footer)

Pinned at bottom of sidebar (`AppShell` → `sb-nav-footer`):

| Item | Route | Access |
|------|-------|--------|
| ادوات النظام | `/system-tools` | Per `ROLES[].pages` (CDO: all) |
| إدارة المستخدمين | `/users` | Per role |
| المحاكم و الدوائر | `/courts` | Per role (nav placeholder styling) |
| **علاقة المستخدم بالمعلومة** | `/case-study-info-roles` | CDO + `general-manager` (prototype) |

Config: `settings-nav.ts` · Matrix UI: `CaseStudyInfoRolesView.tsx`.

**Removed:** standalone **الإسناد والتوزيع** page (`AssignmentView` deleted; `/assignment` → `/dashboard`). Distribution lives under **توزيع المعاملات** (`ActiveDistributionView`).

### 5.4 PO permissions (`po-roles.ts`)

| Action | Prototype role |
|--------|----------------|
| استلام PO جديد | `section-supervisor` |
| Edit/delete PO header, courts admin, delete property | `section-supervisor` |
| Add/edit property | `case-specialist` |
| PO view-only (no specialist edit path) | `general-manager` |
| Eye button on PO list | Non–case-specialist |

---

## 6. User management (detail)

### Frontend by prototype role

| Role | UI |
|------|-----|
| `cdo` | `UsersOrganizationView` — departments + admins (read-only) |
| `hr-admin` / `proc-admin` / `crm-admin` | Department list + `RegisterUserFlow` |
| Others with `users` page | Staff list (API scoped or full per role) |

**Registration:** `HrRegistrationFlow`, `ProcRegistrationFlow`, `CrmRegistrationFlow` via `RegisterUserFlow.tsx`.

**Expandable rows:** sections from API `details[]` (الحساب والصلاحيات · النظام · path-specific).

### Not done

- Edit/deactivate user (except dev DELETE all registered)
- Search/filter/export

---

## 7. PO & properties (detail)

### Intake (`/po/intake`)

- `PoIntakeFlow.tsx` + `hideWizardChrome` — minimal UI (no step chrome / blue note).
- Saves header only: PO number, **تاريخ التعميد** (`PromulgationDate`), assignment type, specialist + email, expected property count.
- On success: navigates via `onCompleteAction`.

### Property forms

- **مصدر البيانات:** صك ملكية · تسجيل عيني · **البورصة العقارية** (`PoPropertyEnfathForm.tsx`).
- Bourse completion: `PoPropertyBourseForm.tsx` on **استعلام بورصة** tab.
- Decree preview: `AssignmentDocAttachment.tsx` + `assignment-doc-attachments.ts` (localStorage, ≤2MB).

### Properties access

- **Per PO:** `/po/{poNumber}/property` (`PoPropertiesPage.tsx`).

---

## 8. المعاملات النشطة (detail)

### Shared UI — `ActiveTransactionQueueView.tsx`

- Table + rail toggle + sticky side panel (`po-primary-data-layout` in CSS).
- URL: `?task=<taskId>`; row click opens panel.
- Table class: `po-properties-tbl--primary-data` (column widths in `prototype.css`).
- Countdown: `RemainingTimeCell` + `my-task-row.ts`.

### البيانات الأولية — `MyTasksView.tsx`

- Filter: `filterTasksForPrimaryData` (phase `enfath`).
- Columns: رقم العقار · أمر العمل · نوع الإسناد · أخصائي الإسناد · المدة المتبقية.
- Panel: `CaseStudyTaskWork` (`MyTaskWorkView.tsx`, `layout="panel"`), chrome `TaskWorkChrome.tsx`.
- After save: صك/بورصة → next task; تسجيل عيني → `/active-distribution?task=…`.

### توزيع المعاملات — `ActiveDistributionView.tsx`

- Filter: `filterTasksForDistribution` (phase `distribution`).
- Distribution UI: `DistributionPartiesForm.tsx` + `distribution-parties.ts` (mock party lists).

### Workflow tasks — `tasks-storage.ts`

| Phase | Meaning |
|-------|---------|
| `enfath` | البيانات الأولية |
| `bourse` | Awaiting/filling bourse |
| `distribution` | توزيع المعاملات |
| `case-study` | دراسة حالة العقار (after تأكيد التوزيع) |
| `done` / `obstruction` | Terminal |

**Task kinds:** `case-study-property` (parent per property) + child kinds after distribution (`field-inspection`, `government-review`, `property-appraisal`, `engineering-survey`, `valuation-coordination`) with `parentTaskId`.

**Storage key:** `evalWorkflowTasks` (localStorage). Synced from PO records via `syncTasksFromPoRecords`. Confirming distribution moves linked tasks to `phase: case-study` without auto-opening workspace (user stays on distribution).

### Validation note (panel save)

Partial property updates use `propertyToEnfathDto` when bourse not completed — avoids **الحي مطلوب** on primary panel. Full bourse rules on **استعلام بورصة** and `PUT …/bourse`.

### 8.5 دراسة حالة العقارات (prototype — localStorage)

**Reference HTML:** `docs/case_study_form 3.html`, `docs/role_definition_form.html`, PDF `requirements/__032785,315703003914,315703003914 دراسة الحالة.pdf`.

#### Queue — `ActiveCaseStudyView.tsx`

- Route: `/active-case-study` (table + row → full workspace; **no side panel**).
- Filter: `filterTasksForCaseStudy` — `kind === case-study-property`, `phase === case-study`.
- Nav label: **دراسة حالة العقارات** (plural).

#### Workspace — `/case-study/[taskId]` · `CaseStudyWorkspaceView.tsx`

- Header: back to queue, subtitle = PO · deed · city · district (no property code badge).
- Tabs: معلومات العقار · الأطراف والحالة · **نموذج الدراسة** · المستندات · السجل الزمني (last three placeholders).
- Breadcrumb: `دراسة الحالة / المعاملات النشطة / دراسة حالة العقارات / {deed}`.

#### نموذج الدراسة — `CaseStudyForm.tsx`

| Area | Detail |
|------|--------|
| Steps | 5 (بيانات التعميد removed; PO data still seeded) |
| Questions | 37 across deed / survey / comp / occ / extra (`case-study-form-data.ts`) |
| Draft | `evalCaseStudyForm:{taskId}` (`case-study-form-storage.ts`) |
| Progress UI | Donut + `2/37` beside step tabs (full-width bottom border on row) |
| Step 5 | Extra questions + **الاعتماد والتوقيع** (system approver ثابت) + **التقرير النهائي** (HTML/PDF from answers) |
| Report | `case-study-report-model.ts`, `case-study-report-html.ts`, `CaseStudyReportDocument.tsx` |
| Assets | `public/case-study/emad-signature.png`, `ejadah-stamp.png` |

**Business rules (report):** مزود الخدمة = شركة إجادة المهنية للتقييم · معتمد التقرير = عماد رشيد الرشيد (not PO assignee) · أخصائي الإسناد from PO in meta only.

#### علاقة المستخدم بالمعلومة — `/case-study-info-roles`

**Purpose:** Admin matrix — for each of 37 questions, assign each **party** a role: أصيل · ثانوي · معتمد · لا دور.

| Party (`case-study-info-roles-data.ts`) | Prototype `RoleId` |
|----------------------------------------|-------------------|
| أخصائي دراسة الحالة | `case-specialist` |
| المعاين العقاري | `field-inspector` |
| المراجع الحكومي | `government-reviewer` |
| المقيم العقاري | `real-estate-appraiser` |
| المكتب الهندسي | `engineering-office` |
| مشرف دراسة الحالة | `section-supervisor` |

**Storage:** `evalCaseStudyInfoRoles` (`case-study-info-roles-storage.ts`).

**Runtime rules (implemented):**

| Actor | Form behaviour |
|-------|----------------|
| **أخصائي** (`CaseStudyForm` default) | All 37 questions **editable**; full report on step 5 |
| **Distributed parties** (`variant="party"`) | All 37 questions **visible**; editable only where matrix assigns أصيل/ثانوي/معتمد; else **عرض فقط** (disabled checkboxes) |
| Party answers | `evalCaseStudyFormParty:{childTaskId}`; display merges parent specialist draft for read-only context |

#### Party tasks — نموذج الدراسة tab

`PartyActiveTaskWork.tsx`: tabs **{workTitle}** + **نموذج الدراسة** → `PartyCaseStudyFormTab.tsx` embeds `CaseStudyForm` linked to parent `case-study-property` task.

Applies to: معاينة العقار · المراجعة الحكومية · استلام التقييم · تقييم العقار · الرفع المساحي (after تأكيد التوزيع creates child tasks).

**Not in API/DB yet** — all case study form, matrix, and party answers are browser-only.

---

## 9. ادوات النظام (`/system-tools`)

**Purpose:** Living **field/screen catalog** for PO module (PM/BA/dev alignment).

| File | Role |
|------|------|
| `SystemToolsView.tsx` | Filterable expandable cards |
| `system-tools-po-catalog.ts` | Screen/field definitions (PO module) |
| `system-tools-view-model.ts` | Card builder + filters |
| `PO_ROLE_RULES` | Documented permission matrix |

**No API · no DB.** Nav item lives under **الإعدادات** dropdown (see section 5.3.1).

---

## 10. Browser storage (prototype state)

| Key / module | Purpose |
|--------------|---------|
| `evalWorkflowTasks` | Workflow tasks (phases incl. `case-study`, child party tasks) |
| `evalCaseStudyForm:{taskId}` | Specialist case study form draft per property task |
| `evalCaseStudyFormParty:{childTaskId}` | Party-specific answers on distributed tasks |
| `evalCaseStudyInfoRoles` | Question × party × role matrix (علاقة المستخدم بالمعلومة) |
| `evalPoIntakeDraft` | PO intake draft |
| `evalFailures` (failures-storage) | تعذر records |
| `assignment-doc-attachments` | Image preview cache per property |
| `evalPrototypeRole` (sessionStorage) | Sidebar role switcher |
| JWT session (`auth-client`) | API auth |

---

## 11. Monorepo packages

| Package | Exports |
|---------|---------|
| `@platform/shell` | Next.js app |
| `@platform/api-client` | `auth`, `users`, `work-orders`, `courts`, field-errors |
| `@platform/auth-client` | Session + `AppAuthGate` |
| `@platform/design-system` | CSS + `StatusBadge` |
| `@platform/types` | `PageId`, `RoleId`, users, organization types |

---

## 12. Screen status matrix (PM)

| Screen | Backend | Frontend data | Nav styling |
|--------|---------|---------------|-------------|
| Login / JWT | Yes | API | — |
| Dashboard | Partial | API + mocks | Normal |
| PO list/detail/properties | Yes | API | Normal |
| PO intake | Yes | API | Normal |
| البيانات الأولية | PO Yes; tasks No | API + localStorage | Normal + badge |
| استعلام بورصة | Yes | API | Normal + badge |
| توزيع المعاملات | PO Yes; tasks No | API + localStorage | Normal + badge |
| دراسة حالة العقارات | PO Yes; tasks/form No | API + localStorage | Normal + badge |
| Case study workspace + form + report | No | localStorage | `/case-study/[taskId]` |
| علاقة المستخدم بالمعلومة | No | localStorage | الإعدادات |
| Party queues + نموذج الدراسة tab | PO Yes; tasks/form No | API + localStorage | المعاملات النشطة |
| Users / org | Yes | API | الإعدادات |
| Courts | Yes | API | الإعدادات (placeholder flag) |
| Failures | No | localStorage | Normal (badge mock) |
| System tools | No | Static catalog | الإعدادات |
| Survey, keys, VR, field-form, messages, financial, KPI | No | Mocks | Red |

---

## 13. Other documentation in repo

| Path | Description |
|------|-------------|
| `docs/DATABASE_OVERVIEW.md` / `.html` | DB overview EN / AR |
| `docs/SYSTEM_BEHAVIOR_PM_REVIEW.md` | PM behavior review |
| `docs/DEMO_ROLE_CREDENTIALS.txt` | Future @ejadah.dev demo passwords |
| `docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md` | Target architecture |
| `docs/LEARNING_FAST_APPS.md` | **Study guide (EN):** frontend (TanStack/CWV/Next.js), backend (EF/HybridCache), PostgreSQL (EXPLAIN, indexes, pg_stat_statements) |
| `README.md` | Full stack readme + roadmap |
| `apps/plan/FRONTEND.md` | Frontend plan |
| `backend/plan/LOCAL_INFRA.md` | Infra URLs |

---

## 14. Backlog (suggested next steps)

### 14.1 إدارة المنظمة — screens & permissions

**Reference:** `docs/ejada-registration_1.html` — applied to `/users` registration UX (8 Jun 2026):

| Done | Item |
|------|------|
| ✓ | HR full 4-step wizard (employment, org tree, personal, account, review) |
| ✓ | PROC individual path (unchanged logic) + org teams UI (mgmt + ops — UI only, not persisted to API yet) |
| ✓ | CRM 4-step flow (existing, themed shell) |
| ✓ | Side panel + ERP portal styling per source (HR / PROC / CRM) |

**Still TODO:** persist PROC org teams to DB; map `hr_perms` → prototype `RoleId`; edit/deactivate users.

**Registration flows for:**

| Department | Prototype role | API identity | Current UI |
|------------|----------------|--------------|------------|
| الموارد البشرية | `hr-admin` | `HrAdmin` | `/users` → `HrRegistrationFlow` |
| المالية والعقود | `proc-admin` | `ProcAdmin` | `/users` → `ProcRegistrationFlow` |
| علاقات العملاء | `crm-admin` | `CrmAdmin` | `/users` → `CrmRegistrationFlow` |

**Where exactly:** sidebar group **إدارة المنظمة** (role switcher) → page **إدارة المستخدمين** (`/users`, `settings-nav.ts` / الإعدادات footer). CDO sees `UsersOrganizationView` (read-only org tree); department admins see staff list + registration wizard (`RegisterUserFlow` / `RegistrationPortal`).

**Scope of build:** align fields, steps, labels, and permission model in that HTML with the three flows above — **not** court parties, **not** توزيع المعاملات assignees.

**Prerequisite:** add/commit `docs/ejada-registration_1.html`; confirm with PM before coding.

**Users (other):** edit/deactivate; search; export.

**PO:** blob storage for attachments; failures API; server pagination/search; persist workflow phases in DB.

**Case study:** persist form + info-role matrix + party answers in API/DB; wire أصيل/ثانوي/معتمد to required vs read-only vs approve-only; backend validation on submit; documents/time-log tabs.

**Active transactions:** persist tasks in PostgreSQL; align courts nav (remove red placeholder).

**Platform:** wire RabbitMQ/Redis/observability; remaining mock modules; map `@ejadah.dev` demo users to Identity + prototype roles.

---

## 16. Deferred — أطراف التنفيذ (court case parties)

**Status:** discussion done; **implementation later**.

**Product question to answer when built:**

> من هم في القضية؟ ماذا نحتاج منهم؟

**Constraints (agreed):**

- أطراف التنفيذ = **أطراف القضية لدى المحكمة** (legal parties), **not** Ejadah employees.
- They **do not use the system** (no accounts, no `RoleId`, no tasks).
- Represent as **records on PO/property** (names, legal capacity, contact, documents required/received) — e.g. extend `PropertyContacts` / enforcement fields, not `workflow-users`.
- Existing hints in codebase: `CONTACT_ROLE_OPTIONS` (مالك، وكيل، …), `PoPropertyEnfathForm` text «يطلب السجل من أطراف التنفيذ», validator message on `RealEstateRegFileName`.

**Open design question for PM:** are parties stored **per PO** or **per property** within a PO?

**Out of scope for this item:** internal assignee lists (Firas, inspectors) — those stay under توزيع المعاملات + future «منفّذو الإسناد» admin if needed.

---

## 15. Changelog (high level)

1. Identity + user profiles (HR/Proc/CRM) in PostgreSQL.  
2. Work orders, properties, contacts, courts + full REST API.  
3. Next.js shell: PO intake refactor, Enfath/bourse split, Arabic RTL.  
4. Users UI: expandable API-driven details.  
5. Org model: CDO overview, department admins, scoped registration.  
6. المعاملات النشطة sidebar; primary data + distribution queues with side panel.  
7. Label/validation alignment: مصدر البيانات, البورصة العقارية, panel vs bourse save.  
8. PO intake chrome reduction; `PromulgationDate` on PO.  
9. System tools catalog page.  
10. Schema tidy-up migrations (boundary/audit field drops).  
11. **دراسة حالة العقارات:** queue (`ActiveCaseStudyView`), workspace route `/case-study/[taskId]`, phase `case-study` after distribution confirm.  
12. **نموذج الدراسة:** 5-step form (37 questions), local draft, printable report aligned to PDF reference, fixed approver/stamp assets.  
13. **UI polish:** workspace chrome, progress donut in form step row, tab panel spacing.  
14. **Sidebar الإعدادات:** dropdown at footer (ادوات النظام · إدارة المستخدمين · المحاكم و الدوائر).  
15. **علاقة المستخدم بالمعلومة:** admin matrix (`/case-study-info-roles`), `evalCaseStudyInfoRoles`.  
16. **Party integration:** `PartyActiveTaskWork` tab **نموذج الدراسة** — all questions visible, answer only per matrix; party storage `evalCaseStudyFormParty:{childTaskId}`.  
17. **Distribution parties:** child workflow tasks + party nav pages (`party-task-pages.ts`).  
18. **Terminology (8 Jun 2026):** documented court parties vs internal assignees vs user roles; deferred §16; org registration scope §14.1; `/workflow-users` flagged as misnamed prototype debt.

---

*This file was verified against the codebase on 8 June 2026. Update when `main` changes materially.*
