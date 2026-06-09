# Project Progress — Ejada Internal (نظام إجادة الداخلي)

**Last updated:** 9 June 2026 (F3 microfrontend split complete — single deploy)  
**Repo:** [BuadDigital/case_srudy](https://github.com/BuadDigital/case_srudy) · branch `main`
**Audience:** Project manager and developers — single handoff document.

---

## Executive summary


| Layer             | What is real today                                                                                                               | What is prototype-only                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **PostgreSQL**    | Users, profiles (HR/Proc/CRM), work orders, properties, contacts, courts catalog, **workflow tasks**, **case study form drafts** | Failures (تعذرات), file bytes, messages/KPI data, info-role matrix                  |
| **ASP.NET API**   | Auth (JWT), users, work orders, courts, **workflow tasks**, **case study forms**                                                 | No messaging, search, attachments blob, failures                                    |
| **Next.js shell** | PO + users + active-transaction queues + tasks + case study forms wired to API                                                   | Failures, info-role matrix, attachment previews; sidebar **role switcher** for demo |


**Demo path:** Login → PO list/intake → properties per PO → **البيانات الأولية** → **استعلام بورصة** (حالة الصك: فعال / غير فعال → متعذر) → **توزيع المعاملات** → **دراسة حالة العقارات** → **نموذج الدراسة** → party tasks → **إدارة التعذرات** (supervisor) → **جميع حقول النظام** / **الإعدادات**.

---

## Domain glossary (agreed — do not confuse)

Three separate concepts; **do not merge** in UI labels or data models.


| Concept                          | Who                                                                      | Uses the system?                                  | Where in product                                                                           |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **أطراف التنفيذ / أطراف القضية** | Parties in the **court enforcement case** (محكوم له/عليه، مالك، وكيل، …) | **No** — external; recorded as **case data** only | PO/property contacts, documents requested *from* them (see deferred §16)                   |
| **منفّذو العمل (إسناد داخلي)**   | Ejadah staff/vendors who **do the work** on a transaction                | **Yes**                                           | توزيع المعاملات → child tasks; e.g. **المحكمة → مراجع حكومي**، **المعاينة → معاين ميداني** |
| **أدوار المستخدمين (صلاحيات)**   | Login accounts — **which screens** each person sees                      | **Yes**                                           | JWT + prototype `RoleId`; org registration under **إدارة المنظمة**                         |


**Removed (8 Jun 2026):** `/workflow-users` page (mislabelled «أطراف التنفيذ»). Internal assignees now come from `distribution-party-accounts.ts` + seeded users — **not** court parties (see deferred §16).

**Internal execution mapping (confirmed):**


| Work               | Internal role                                                          |
| ------------------ | ---------------------------------------------------------------------- |
| زيارة المحكمة      | مراجع حكومي (`government-reviewer`)                                    |
| المعاينة الميدانية | معاين ميداني (`field-inspector`)                                       |
| التقييم            | مقيم عقاري (`real-estate-appraiser`) — via valuation dept distribution |


---

## Repository layout

```
property_study/
├── apps/
│   ├── shell/               # Next.js 16 host (@platform/shell) — login, layout, nav, mock routes
│   ├── mfe-case-study/      # @case-study/mfe — API-ready PO + المعاملات النشطة (F3)
│   └── plan/                # Frontend planning notes (FRONTEND.md)
├── backend/
│   ├── RealEstateEval.Api/  # ASP.NET Core 10 API
│   └── plan/                # Backend infra notes (LOCAL_INFRA.md)
├── packages/
│   ├── app-shared/          # @platform/app-shared — PrototypeContext, registration, shared nav/constants
│   ├── api-client/          # fetch wrappers (auth, users, work-orders, courts, workflow-tasks, case-study-forms)
│   ├── auth-client/         # JWT session + AppAuthGate
│   ├── design-system/       # prototype.css, registration.css, StatusBadge
│   └── types/               # PageId, RoleId, user/org DTO types, CASE_STUDY_READY_NAV
├── infra/                   # docker-compose (Postgres + observability stack)
├── docs/                    # This file + DATABASE_OVERVIEW + PM review + credentials
├── requirements/            # HTML prototypes (reference)
└── package.json             # npm workspaces root scripts
```

**Frontend F3 (9 Jun 2026):** API-ready flows live in `@case-study/mfe`; shell re-exports routes and runs `npm run dev` / `npm run build` as one app. Module Federation (F5) deferred until independent deploy is needed.

---

## 1. How to run

### Prerequisites

- Node.js + npm (workspaces)
- .NET SDK (API)
- Docker (Postgres; optional full infra stack)

### Daily dev (minimum)

```bash
docker compose -f infra/docker-compose.yml up -d postgres
npm install            # once, at repo root
npm run dev:api        # API http://localhost:5160 — applies EF migrations on start
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


| Endpoint               | Description            |
| ---------------------- | ---------------------- |
| `POST /api/auth/login` | Email + password → JWT |
| `GET /api/auth/me`     | Current user           |


UI: `apps/shell/src/app/login/page.tsx` → stores session via `@platform/auth-client`.

### Two role systems (do not confuse)


| System                        | Purpose                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity roles (API JWT)**  | `CDO`, `HrAdmin`, `ProcAdmin`, `CrmAdmin`, `HR`, `PROC`, `CRM`, legacy `Admin`, … — control **API authorization** (e.g. user list scope)    |
| **Prototype roles (sidebar)** | `general-manager`, `case-specialist`, `cdo`, … in `constants.ts` — control **which pages appear** and PO button permissions (`po-roles.ts`) |


After login, `auth-role-map.ts` maps **known emails** to a prototype role in `sessionStorage` (`evalPrototypeRole`). The sidebar **role dropdown** can still switch prototype role without re-login (demo only).

### API seed accounts (PostgreSQL)


| Email                 | Password    | Identity role | Prototype sidebar (if mapped) |
| --------------------- | ----------- | ------------- | ----------------------------- |
| `admin@local.dev`     | `Admin123!` | Admin         | general-manager               |
| `s.salhy@gmail.com`   | `sliman123` | CDO           | cdo                           |
| `a.alamin@gmail.com`  | `ali123`    | HrAdmin       | hr-admin                      |
| `a.alqadri@gmail.com` | `ahmad123`  | ProcAdmin     | proc-admin                    |
| `g.abdo@gmail.com`    | `gamal123`  | CrmAdmin      | crm-admin                     |


Seeder: `backend/RealEstateEval.Infrastructure/Data/DataSeeder.cs` (runs on API startup).

### Demo role-switcher credentials

`docs/DEMO_ROLE_CREDENTIALS.txt` lists `@ejadah.dev` passwords. Sidebar personas are seeded as HR employees (+ Jeddah survey office as PROC). Prototype **role switcher** still overrides UI `RoleId` without re-login (demo only).

---

## 3. Database (PostgreSQL / EF Core)

**Provider:** Npgsql · **Context:** `ApplicationDbContext.cs`

### 3.1 Tables


| Table                | Contents                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Identity**         | `Users`, `Roles`, `UserRoles`, `UserClaims`, `RoleClaims`, `UserLogins`, `UserTokens`       |
| **Users domain**     | `UserProfiles` (+ `HrEmployeeProfiles`, `ProcServiceProviderProfiles`, `CrmClientProfiles`) |
| **Case study**       | `WorkOrders`, `WorkOrderProperties`, `PropertyContacts`, `CourtCatalogEntries`              |
| **Workflow**         | `WorkflowTasks` — phases, distribution JSON, obstruction fields, parent/child links         |
| **Case study forms** | `CaseStudyForms` — specialist + party drafts per task (answers JSON, step, status)          |


### 3.2 Work order schema (current model)

`**WorkOrders`:** `PoNumber` (unique), `AssignmentType`, `PromulgationDate`, `ReceivedFromEnfathAt`, `ReceivedFromEnfathTime`, `AssignmentSpecialist`, `AssignmentSpecialistEmail`, `ExpectedPropertyCount`, `DueDateAt`, `CreatedAtUtc`.

`**WorkOrderProperties`:** `IdentifierType` (deed / real-estate reg / bourse inquiry), deed/task/owner/court/circuit, `DeedDate`, location (`City`, `District`), classification/type, `DeedStatus`, `Area`, boundaries flags (`BoundariesAvailability`, `BoundariesExternalDocName`), `RestrictionsPresent`, attachment **filenames** (`AssignmentDocFileName`, `RealEstateRegFileName`, `DelegationLetterFileName`, `OtherDocumentFileNames` JSON), `BourseDataCompleted`.

`**PropertyContacts`:** `Name`, `Phone`, `Role`, `SortOrder`.

`**CourtCatalogEntries`:** `City`, `Court`, `CircuitsJson` (jsonb).

`**WorkflowTasks`:** `PoNumber`, `PropertyId`, `Kind`, `Phase`, `Status`, `Title`, distribution parties, `ParentTaskId`, `ObstructionReason`, `ObstructionPriorPhase`, assignee fields, timestamps.

`**CaseStudyForms`:** `TaskId`, `IsParty`, form JSON blob (answers, steps, remarks, signatures).

### 3.3 Migration history (apply in order)


| Migration                                          | Summary                                                                    |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| `20260514092140_InitialIdentity`                   | ASP.NET Identity                                                           |
| `20260518071658_AddUserProfiles`                   | User profiles + HR/Proc/CRM tables                                         |
| `20260518073656_RenameIdentityTables`              | Table names Users/Roles/…                                                  |
| `20260519111340_AddCaseStudyWorkOrders`            | PO + properties + contacts + courts                                        |
| `20260521060600_AddPropertyContactRole`            | Contact `Role` column                                                      |
| `20260521141637_PoWorkflowRefactor`                | `PromulgationDate`, specialist email, property boundary/restriction fields |
| `20260521143044_AddExpectedPropertyCount`          | Expected property count on PO                                              |
| `20260601193436_DropUnusedPropertyBoundaryFields`  | Removed legacy boundary text columns                                       |
| `20260601193623_DropUnusedAuditFields`             | Removed unused audit columns                                               |
| `20260607072126_AddWorkflowTasksAndCaseStudyForms` | **Workflow tasks + case study forms**                                      |


### 3.4 Not stored in database

- Failure records (إدارة التعذرات — `failures-storage` in browser)
- Info-role matrix (علاقة المستخدم بالمعلومة — `evalCaseStudyInfoRoles`)
- Assignment/reg/decree **file content** (filenames only; preview cache in localStorage)
- PO intake draft (`evalPoIntakeDraft`)
- Messages, KPI, survey, valuation mock entities

---

## 4. Backend API reference

**Project:** `backend/RealEstateEval.Api` · **Auth:** JWT Bearer on protected controllers.

### 4.1 Auth — `AuthController`


| Method | Route             |
| ------ | ----------------- |
| POST   | `/api/auth/login` |
| GET    | `/api/auth/me`    |


### 4.2 Users — `UsersController` (policy `CanManageUsers` = authenticated)


| Method | Route                     | Notes                                                        |
| ------ | ------------------------- | ------------------------------------------------------------ |
| GET    | `/api/users`              | Scoped: CDO all; HrAdmin HR; ProcAdmin Proc; CrmAdmin CRM    |
| GET    | `/api/users/organization` | CDO org overview                                             |
| POST   | `/api/users/hr`           | HrAdmin or CDO                                               |
| POST   | `/api/users/proc`         | ProcAdmin or CDO                                             |
| POST   | `/api/users/crm`          | CrmAdmin or CDO                                              |
| DELETE | `/api/users/registered`   | **Development only** — wipe registered users, keep org seeds |


**Services:** `UserRegistrationService`, `RegistrationMapper`, `RegistrationValidator` · Password min **6** chars.

**Org roles:** `Models/OrgRoles.cs`, `DepartmentRoles.cs`.

### 4.3 Work orders — `WorkOrdersController`


| Method | Route                                                        |
| ------ | ------------------------------------------------------------ |
| GET    | `/api/work-orders`                                           |
| GET    | `/api/work-orders/exists?poNumber=`                          |
| GET    | `/api/work-orders/properties/pending-bourse`                 |
| GET    | `/api/work-orders/deeds/prior?deedNumber=&excludePo=`        |
| GET    | `/api/work-orders/{poNumber}`                                |
| POST   | `/api/work-orders`                                           |
| PUT    | `/api/work-orders/{poNumber}`                                |
| DELETE | `/api/work-orders/{poNumber}`                                |
| POST   | `/api/work-orders/{poNumber}/properties`                     |
| PUT    | `/api/work-orders/{poNumber}/properties/{propertyId}/bourse` |
| PUT    | `/api/work-orders/{poNumber}/properties/{propertyId}`        |
| DELETE | `/api/work-orders/{poNumber}/properties/{propertyId}`        |


**Business rules (`WorkOrderValidator`, `BusinessDueDateCalculator`):**

- **Due date:** 4 business days (Sun–Thu); receipt day counts as day 1 if before **17:00** on a business day; else start next business day; default time `10:00`.
- **تنفيذ:** `AssignmentDocFileName` required per property.
- **تسجيل عيني:** `RealEstateRegFileName` required.
- **Bourse inquiry:** إنفاذ step vs bourse step validation split (district/classification only on bourse completion).
- Contacts: ≥1, name + phone (≥10 digits).
- Unique deed per PO; unique `PoNumber`.

**Pending bourse DTO** includes `DeedDate` (تاريخ الصك) for queue display.

### 4.4 Courts — `CourtsController`


| Method | Route         |
| ------ | ------------- |
| GET    | `/api/courts` |
| PUT    | `/api/courts` |


### 4.5 Workflow tasks — `WorkflowTasksController`


| Method | Route                                                          | Notes                                      |
| ------ | -------------------------------------------------------------- | ------------------------------------------ |
| GET    | `/api/workflow-tasks`                                          | List all tasks                             |
| GET    | `/api/workflow-tasks/{id}`                                     | Single task                                |
| POST   | `/api/workflow-tasks/sync`                                     | Rebuild from work orders                   |
| PATCH  | `/api/workflow-tasks/{id}/distribution`                        | Save distribution draft                    |
| POST   | `/api/workflow-tasks/{id}/confirm-distribution`                | Confirm + spawn party child tasks          |
| POST   | `/api/workflow-tasks/{id}/advance-after-enfath`                | After primary data save                    |
| POST   | `/api/workflow-tasks/{id}/advance-after-bourse`                | After bourse completion                    |
| PATCH  | `/api/workflow-tasks/{id}`                                     | General patch (phase, status, obstruction) |
| DELETE | `/api/workflow-tasks/by-po/{poNumber}`                         | Cascade delete for PO                      |
| DELETE | `/api/workflow-tasks/by-po/{poNumber}/properties/{propertyId}` | Delete property tasks                      |


**Service:** `WorkflowTaskService.cs` · **Frontend:** `packages/api-client/src/workflow-tasks.ts`, `tasks-storage.ts`.

### 4.6 Case study forms — `CaseStudyFormsController`


| Method | Route                                  | Notes                 |
| ------ | -------------------------------------- | --------------------- |
| GET    | `/api/case-study-forms/{taskId}`       | Specialist form draft |
| PUT    | `/api/case-study-forms/{taskId}`       | Save specialist draft |
| GET    | `/api/case-study-forms/party/{taskId}` | Party form draft      |
| PUT    | `/api/case-study-forms/party/{taskId}` | Save party draft      |


**Service:** `CaseStudyFormService.cs` · **Frontend:** `packages/api-client/src/case-study-forms.ts`, `case-study-form-storage.ts`.

---

## 5. Frontend — routes & screens

**App:** `apps/shell` · **Router:** Next.js App Router · **Styling:** `prototype.css` + `registration.css` + Tailwind (`globals.css`).

### 5.1 Top-level routes


| URL                                    | Screen                        | Data source                                  |
| -------------------------------------- | ----------------------------- | -------------------------------------------- |
| `/login`                               | Login                         | API JWT                                      |
| `/welcome`                             | Redirect                      | `next.config` → `/dashboard`                 |
| `/dashboard`                           | Dashboard                     | PO + property stats API; team table mock     |
| `/[page]`                              | Dynamic pages                 | See table below                              |
| `/po`                                  | PO list                       | API                                          |
| `/po/intake`                           | PO header intake              | API                                          |
| `/po/{poNumber}/edit`                  | PO header edit                | API                                          |
| `/po/{poNumber}/property`              | Properties under PO           | API (`PoPropertiesPage`)                     |
| `/po/{poNumber}/property/new`          | Add property                  | API                                          |
| `/po/{poNumber}/property/{id}`         | Property detail               | API                                          |
| `/po/{poNumber}/property/{id}/edit`    | Edit property                 | API                                          |
| `/po/{poNumber}/property/{id}/failure` | Report failure                | **localStorage**                             |
| `/my-tasks/{taskId}`                   | Redirect                      | `next.config` → `/active-primary-data?task=` |
| `/case-study/{taskId}`                 | Case study workspace (أخصائي) | PO API + **API tasks** + **API form**        |


**Redirects:** `/properties` → `/po`; `/my-tasks` → `/active-primary-data`; `/assignment` → `/dashboard`.

### 5.2 Dynamic pages (`apps/shell/src/app/(app)/[page]/page.tsx`)


| `PageId`                                                                                                    | Component                | API                         | Nav note                            |
| ----------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------- | ----------------------------------- |
| `dashboard`                                                                                                 | `DashboardView`          | Partial                     | —                                   |
| `active-primary-data`                                                                                       | `MyTasksView`            | PO + **workflow tasks** API | المعاملات النشطة                    |
| `bourse-inquiry`                                                                                            | `BourseInquiryView`      | PO + tasks API              | المعاملات النشطة                    |
| `active-distribution`                                                                                       | `ActiveDistributionView` | PO + tasks API              | المعاملات النشطة                    |
| `active-case-study`                                                                                         | `ActiveCaseStudyView`    | PO + tasks API              | المعاملات النشطة                    |
| `case-study-info-roles`                                                                                     | `CaseStudyInfoRolesView` | **localStorage**            | جميع حقول النظام                    |
| `property-inspection`, `government-review`, `valuation-coordination`, `property-appraisal`, `active-survey` | `PartyActiveTaskView`    | PO + tasks + form API       | المعاملات النشطة                    |
| `failures`                                                                                                  | `FailuresView`           | **localStorage**            | Live page                           |
| `users`                                                                                                     | `UsersView`              | API                         | الإعدادات                           |
| `courts`                                                                                                    | `CourtsView`             | API                         | جميع حقول النظام (placeholder flag) |
| `system-tools`                                                                                              | `SystemToolsView`        | Catalog only                | جميع حقول النظام                    |
| `survey`, `keys`, `valuation-requests`, `field-form`, `messages`, `financial`, `kpi`                        | Various `*View`          | **Mocks**                   | Red placeholder in nav              |


### 5.3 Sidebar — المعاملات النشطة

Under **أوامر العمل (PO)** (`active-transactions.ts`):


| Item                                                                              | Route                  | Status                                     |
| --------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------ |
| البيانات الأولية                                                                  | `/active-primary-data` | Done                                       |
| استعلام بورصة                                                                     | `/bourse-inquiry`      | Done (+ حالة الصك / تعذر flow)             |
| توزيع المعاملات                                                                   | `/active-distribution` | Done                                       |
| دراسة حالة العقارات                                                               | `/active-case-study`   | Done (queue; opens `/case-study/{taskId}`) |
| معاينة العقار / المراجعة الحكومية / استلام التقييم / تقييم العقار / الرفع المساحي | Party `PageId`s        | Done (queue + work panel; see section 8.5) |


**Badges:** `use-active-transaction-nav-badges.ts` (primary open, bourse pending, distribution open, case-study open).

### 5.3.1 Sidebar — جميع حقول النظام (footer)

Pinned at bottom of sidebar (`AppShell` → `sb-nav-footer`):


| Item                     | Route                    | Access                                            |
| ------------------------ | ------------------------ | ------------------------------------------------- |
| ادوات النظام             | `/system-tools`          | **All prototype roles**                           |
| علاقة المستخدم بالمعلومة | `/case-study-info-roles` | **All prototype roles**                           |
| المحاكم و الدوائر        | `/courts`                | **All prototype roles** (nav placeholder styling) |


Config: `system-fields-nav.ts` · `prototype-role-access.ts` appends `SYSTEM_FIELDS_PAGE_IDS` to every role.

### 5.3.2 Sidebar — الإعدادات (footer)


| Item             | Route    | Access   |
| ---------------- | -------- | -------- |
| إدارة المستخدمين | `/users` | Per role |


Config: `settings-nav.ts` (system tools, courts, and info-roles **moved** to جميع حقول النظام in commit `4d3edc6`).

**Removed:** standalone **الإسناد والتوزيع** page (`AssignmentView` deleted; `/assignment` → `/dashboard`). Distribution lives under **توزيع المعاملات** (`ActiveDistributionView`).

### 5.4 PO permissions (`po-roles.ts`)


| Action                                               | Prototype role       |
| ---------------------------------------------------- | -------------------- |
| استلام PO جديد                                       | `section-supervisor` |
| Edit/delete PO header, courts admin, delete property | `section-supervisor` |
| Add/edit property                                    | `case-specialist`    |
| PO view-only (no specialist edit path)               | `general-manager`    |
| Eye button on PO list                                | Non–case-specialist  |


---

## 6. User management (detail)

### Frontend by prototype role


| Role                                    | UI                                                         |
| --------------------------------------- | ---------------------------------------------------------- |
| `cdo`                                   | `UsersOrganizationView` — departments + admins (read-only) |
| `hr-admin` / `proc-admin` / `crm-admin` | Department list + `RegisterUserFlow`                       |
| Others with `users` page                | Staff list (API scoped or full per role)                   |


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
- Optional browser draft: `evalPoIntakeDraft` (not persisted to API until submit).

### Property forms

- **مصدر البيانات:** صك ملكية · تسجيل عيني · **البورصة العقارية** (`PoPropertyEnfathForm.tsx`).
- Bourse completion: `PoPropertyBourseForm.tsx` on **استعلام بورصة** tab and specialist bourse step.
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

### استعلام بورصة — `BourseInquiryView.tsx`

- Queue from `GET /api/work-orders/properties/pending-bourse` (includes **تاريخ الصك** column).
- Properties with open failure (except `returned`) are **hidden** from queue.
- **حالة الصك** in `PoPropertyBourseForm` (`showDeedVitalityFlow`):
  - **الصك فعال** → complete bourse fields → `completePropertyBourse` → advance task.
  - **الصك غير فعال** → **متعذر** panel + required **سبب التعذر** → `submitBourseObstruction` → إدارة التعذرات (supervisor review).

### توزيع المعاملات — `ActiveDistributionView.tsx`

- Filter: `filterTasksForDistribution` (phase `distribution`).
- Distribution UI: `DistributionPartiesForm.tsx` + `distribution-parties.ts` (mock party lists).

### Workflow tasks — `tasks-storage.ts` (**PostgreSQL via API**)


| Phase                  | Meaning                                 |
| ---------------------- | --------------------------------------- |
| `enfath`               | البيانات الأولية                        |
| `bourse`               | Awaiting/filling bourse                 |
| `distribution`         | توزيع المعاملات                         |
| `case-study`           | دراسة حالة العقار (after تأكيد التوزيع) |
| `done` / `obstruction` | Terminal                                |


**Task kinds:** `case-study-property` (parent per property) + child kinds after distribution (`field-inspection`, `government-review`, `property-appraisal`, `engineering-survey`, `valuation-coordination`) with `parentTaskId`.

**Persistence:** `WorkflowTasks` table · synced from PO records via `POST /api/workflow-tasks/sync`. Confirming distribution moves linked tasks to `phase: case-study` and creates child party tasks.

**Obstruction:** `escalateTaskForObstruction` sets `phase: obstruction`, `status: blocked`; specialist sees blocked state until supervisor resolves failure.

### Bourse obstruction — `bourse-obstruction.ts` + `failures-storage.ts`


| Step                                 | Behaviour                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| Specialist selects **الصك غير فعال** | Bourse fields hidden; **متعذر** + reason required                                         |
| Submit                               | `reportBourseObstructionToSupervisor` → failure record + `submitFailureForReview`         |
| Property                             | `deedStatus` → **قيد التحقق**                                                             |
| Task                                 | Escalated to supervisor (`obstruction` phase)                                             |
| Supervisor                           | **إدارة التعذرات** — approve (موقوف) or return (فعال, property may re-enter bourse queue) |


**Still browser-only:** failure records (`evalFailures` localStorage). Task escalation uses API; failure list does not.

### Validation note (panel save)

Partial property updates use `propertyToEnfathDto` when bourse not completed — avoids **الحي مطلوب** on primary panel. Full bourse rules on **استعلام بورصة** and `PUT …/bourse`.

### 8.5 دراسة حالة العقارات

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


| Area        | Detail                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| Steps       | 5 (بيانات التعميد removed; PO data still seeded)                                                             |
| Questions   | 37 across deed / survey / comp / occ / extra (`case-study-form-data.ts`)                                     |
| Draft       | **API** `CaseStudyForms` table (`case-study-form-storage.ts`)                                                |
| Progress UI | Donut + `2/37` beside step tabs (full-width bottom border on row)                                            |
| Step 5      | Extra questions + **الاعتماد والتوقيع** (system approver ثابت) + **التقرير النهائي** (HTML/PDF from answers) |
| Report      | `case-study-report-model.ts`, `case-study-report-html.ts`, `CaseStudyReportDocument.tsx`                     |
| Assets      | `public/case-study/emad-signature.png`, `ejadah-stamp.png`                                                   |


**Business rules (report):** مزود الخدمة = شركة إجادة المهنية للتقييم · معتمد التقرير = عماد رشيد الرشيد (not PO assignee) · أخصائي الإسناد from PO in meta only.

#### علاقة المستخدم بالمعلومة — `/case-study-info-roles`

**Purpose:** Admin matrix — for each of 37 questions, assign each **party** a role: أصيل · ثانوي · معتمد · لا دور.


| Party (`case-study-info-roles-data.ts`) | Prototype `RoleId`      |
| --------------------------------------- | ----------------------- |
| أخصائي دراسة الحالة                     | `case-specialist`       |
| المعاين العقاري                         | `field-inspector`       |
| المراجع الحكومي                         | `government-reviewer`   |
| المقيم العقاري                          | `real-estate-appraiser` |
| المكتب الهندسي                          | `engineering-office`    |
| مشرف دراسة الحالة                       | `section-supervisor`    |


**Storage:** `evalCaseStudyInfoRoles` (`case-study-info-roles-storage.ts`) — **not in API/DB yet**.

**Runtime rules (implemented):**


| Actor                                       | Form behaviour                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **أخصائي** (`CaseStudyForm` default)        | All 37 questions **editable**; full report on step 5                                                                      |
| **Distributed parties** (`variant="party"`) | All 37 questions **visible**; editable only where matrix assigns أصيل/ثانوي/معتمد; else **عرض فقط** (disabled checkboxes) |
| Party answers                               | **API** party form per `childTaskId`; display merges parent specialist draft for read-only context                        |


#### Party tasks — نموذج الدراسة tab

`PartyActiveTaskWork.tsx`: tabs **{workTitle}** + **نموذج الدراسة** → `PartyCaseStudyFormTab.tsx` embeds `CaseStudyForm` linked to parent `case-study-property` task.

Applies to: معاينة العقار · المراجعة الحكومية · استلام التقييم · تقييم العقار · الرفع المساحي (after تأكيد التوزيع creates child tasks).

---

## 9. ادوات النظام (`/system-tools`)

**Purpose:** Living **field/screen catalog** for PO module (PM/BA/dev alignment).


| File                         | Role                                 |
| ---------------------------- | ------------------------------------ |
| `SystemToolsView.tsx`        | Filterable expandable cards          |
| `system-tools-po-catalog.ts` | Screen/field definitions (PO module) |
| `system-tools-view-model.ts` | Card builder + filters               |
| `PO_ROLE_RULES`              | Documented permission matrix         |


**No API · no DB.** Nav item lives under **جميع حقول النظام** dropdown (see section 5.3.1).

---

## 10. Browser storage (prototype state)


| Key / module                         | Purpose                                                   |
| ------------------------------------ | --------------------------------------------------------- |
| `evalCaseStudyInfoRoles`             | Question × party × role matrix (علاقة المستخدم بالمعلومة) |
| `evalPoIntakeDraft`                  | PO intake draft (optional, pre-submit)                    |
| `evalFailures` (failures-storage)    | تعذر records (إدارة التعذرات)                             |
| `assignment-doc-attachments`         | Image preview cache per property                          |
| `evalPrototypeRole` (sessionStorage) | Sidebar role switcher                                     |
| JWT session (`auth-client`)          | API auth                                                  |


**Moved to API (no longer localStorage):**


| Former key                             | Now                                              |
| -------------------------------------- | ------------------------------------------------ |
| `evalWorkflowTasks`                    | `WorkflowTasks` table + `/api/workflow-tasks`    |
| `evalCaseStudyForm:{taskId}`           | `CaseStudyForms` table + `/api/case-study-forms` |
| `evalCaseStudyFormParty:{childTaskId}` | `/api/case-study-forms/party/{taskId}`           |


---

## 11. Monorepo packages


| Package                   | Exports                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `@platform/shell`         | Next.js app                                                                                  |
| `@platform/api-client`    | `auth`, `users`, `work-orders`, `courts`, `workflow-tasks`, `case-study-forms`, field-errors |
| `@platform/auth-client`   | Session + `AppAuthGate`                                                                      |
| `@platform/design-system` | CSS + `StatusBadge`                                                                          |
| `@platform/types`         | `PageId`, `RoleId`, users, organization types                                                |


---

## 12. Screen status matrix (PM)


| Screen                                                 | Backend     | Frontend data                        | Nav styling                         |
| ------------------------------------------------------ | ----------- | ------------------------------------ | ----------------------------------- |
| Login / JWT                                            | Yes         | API                                  | —                                   |
| Dashboard                                              | Partial     | API + mocks                          | Normal                              |
| PO list/detail/properties                              | Yes         | API                                  | Normal                              |
| PO intake                                              | Yes         | API (+ optional draft)               | Normal                              |
| البيانات الأولية                                       | Yes         | API (PO + tasks)                     | Normal + badge                      |
| استعلام بورصة                                          | Yes         | API (+ obstruction → local failures) | Normal + badge                      |
| توزيع المعاملات                                        | Yes         | API (PO + tasks)                     | Normal + badge                      |
| دراسة حالة العقارات                                    | Yes         | API (PO + tasks + forms)             | Normal + badge                      |
| Case study workspace + form + report                   | Yes (forms) | API                                  | `/case-study/[taskId]`              |
| علاقة المستخدم بالمعلومة                               | No          | localStorage                         | جميع حقول النظام                    |
| Party queues + نموذج الدراسة tab                       | Yes         | API                                  | المعاملات النشطة                    |
| Users / org                                            | Yes         | API                                  | الإعدادات                           |
| Courts                                                 | Yes         | API                                  | جميع حقول النظام (placeholder flag) |
| Failures (إدارة التعذرات)                              | No          | localStorage                         | Normal                              |
| System tools                                           | No          | Static catalog                       | جميع حقول النظام                    |
| Survey, keys, VR, field-form, messages, financial, KPI | No          | Mocks                                | Red                                 |


### 12.1 Backend ↔ Frontend alignment (how many backends?)

**Short answer:** one API monolith today (`RealEstateEval.Api`) with **7 live domains** (+1 dev-only). You need **~6 more domains** for production-ready current screens, or **~15 total new pieces** for full sidebar alignment (including red placeholder modules).

**Not 15 separate servers** — extend the same API with new controllers/services until a future split (see `docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md`).

#### Live backend domains today (7 + dev)


| #   | Domain             | Controller                 | Frontend consumers                                            |
| --- | ------------------ | -------------------------- | ------------------------------------------------------------- |
| 1   | Auth               | `AuthController`           | `/login`, `prototype-auth.ts` silent login                    |
| 2   | Users              | `UsersController`          | `/users`, `HrRegistrationFlow` / Proc / Crm                   |
| 3   | Work orders        | `WorkOrdersController`     | PO list, intake, properties, bourse fields                    |
| 4   | Workflow tasks     | `WorkflowTasksController`  | المعاملات النشطة, party queues, distribution                  |
| 5   | Case study forms   | `CaseStudyFormsController` | `/case-study/[taskId]`, party نموذج الدراسة tab               |
| 6   | Courts             | `CourtsController`         | `/courts`                                                     |
| 7   | System maintenance | `SystemController`         | `clear-all-po-data.ts` → `DELETE /api/system/data` (dev only) |


**Core transaction path is aligned:** PO → البيانات الأولية → استعلام بورصة → توزيع → دراسة حالة → party tasks.

#### Frontend `PageId` coverage (27 routes in `packages/types`)


| Status                            | Count | Pages / notes                                                                                                                                                                                                                                                    |
| --------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fully API-backed**              | 14    | `po`, `active-primary-data`, `bourse-inquiry`, `active-distribution`, `active-case-study`, party queues (`property-inspection`, `valuation-coordination`, `property-appraisal`, `active-survey`), `government-review`, `users`, `courts`, `/case-study/[taskId]` |
| **Partial API**                   | 4     | `dashboard` (PO/property stats API; team + VR mock), `bourse-inquiry` (task obstruction API; failure row localStorage), PO attachments (filename in DB; preview bytes in browser), `users` (list/create OK; no edit/deactivate)                                  |
| **Browser-only — needs backend**  | 2     | `failures`, `case-study-info-roles`                                                                                                                                                                                                                              |
| **Mock / static — needs backend** | 8     | `survey`, `keys`, `valuation-requests`, `field-form`, `messages`, `financial`, `kpi`, plus `internal-delegation-letters` (government review, localStorage)                                                                                                       |
| **Intentionally no backend**      | 1     | `system-tools` (static field catalog)                                                                                                                                                                                                                            |


**Rough score:** ~18/27 screens use the API as primary data (14 full + 4 partial).

#### New backend work still needed (by priority)


| Phase                        | Count | Items                                                                                                                   | Blocks                                             |
| ---------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **1 — live prototype gaps**  | 3     | Failures API; info-roles API; attachments/blob API (صك، تكليف، سجل عيني)                                                | `failures`, بورصة تعذر end-to-end, file previews   |
| **2 — users & auth**         | 3     | Users PATCH (edit/deactivate/search); PROC org teams persistence; `/api/auth/me` + JWT roles (replace sidebar switcher) | `/users` completeness, real RBAC                   |
| **3 — richer screens**       | 2     | Delegation letters API; dashboard aggregates API                                                                        | `government-review` letters, `dashboard` team load |
| **4 — red nav placeholders** | 7     | Messages, KPI, financial, survey offices, keys, valuation requests, field-form persistence                              | Placeholder sidebar pages                          |
| **Deferred**                 | 1     | Court case parties on PO/property (§16)                                                                                 | أطراف التنفيذ                                      |


#### Summary table (PM)


| Question                                        | Answer                                        |
| ----------------------------------------------- | --------------------------------------------- |
| Backend domains that exist today?               | **7** (+1 dev-only system reset)              |
| Frontend areas aligned with API?                | **14 full** + **4 partial**                   |
| New domains for production-ready current flows? | **6** (Phase 1 + Phase 2)                     |
| New domains for full sidebar alignment?         | **~15** (Phases 1–4 + deferred court parties) |
| Target controller count in one API?             | **~13** (7 today + ~6 new)                    |


**Seeder path (corrected):** `backend/RealEstateEval.Infrastructure/Data/DataSeeder.cs` — seeds org admins + all sidebar `@ejadah.dev` HR personas + Jeddah survey PROC provider (`survey.jeddah@ejadah.dev`; `UserName` = email, not Arabic display name).

---

## 13. Other documentation in repo


| Path                                                    | Description                                                                                                                        |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `docs/DATABASE_OVERVIEW.md` / `.html`                   | DB overview EN / AR                                                                                                                |
| `docs/SYSTEM_BEHAVIOR_PM_REVIEW.md`                     | PM behavior review                                                                                                                 |
| `docs/DEMO_ROLE_CREDENTIALS.txt`                        | Future @ejadah.dev demo passwords                                                                                                  |
| `docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md` | Target architecture                                                                                                                |
| `docs/LEARNING_FAST_APPS.md`                            | **Study guide (EN):** frontend (TanStack/CWV/Next.js), backend (EF/HybridCache), PostgreSQL (EXPLAIN, indexes, pg_stat_statements) |
| `docs/infath_case_study_fields.md`                      | Case study field reference                                                                                                         |
| `docs/case_study_module.md`                             | Case study module notes                                                                                                            |
| `README.md`                                             | Full stack readme + roadmap                                                                                                        |
| `apps/plan/FRONTEND.md`                                 | Frontend plan                                                                                                                      |
| `backend/plan/LOCAL_INFRA.md`                           | Infra URLs                                                                                                                         |


---

## 14. Backlog (suggested next steps)

### 14.1 إدارة المنظمة — screens & permissions

**Reference:** `docs/ejada-registration_1.html` — applied to `/users` registration UX (8 Jun 2026):


| Done | Item                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------ |
| ✓    | HR full 4-step wizard (employment, org tree, personal, account, review)                                |
| ✓    | PROC individual path (unchanged logic) + org teams UI (mgmt + ops — UI only, not persisted to API yet) |
| ✓    | CRM 4-step flow (existing, themed shell)                                                               |
| ✓    | Side panel + ERP portal styling per source (HR / PROC / CRM)                                           |


**Still TODO:** persist PROC org teams to DB; map `hr_perms` → prototype `RoleId`; edit/deactivate users.

**Registration flows for:**


| Department      | Prototype role | API identity | Current UI                        |
| --------------- | -------------- | ------------ | --------------------------------- |
| الموارد البشرية | `hr-admin`     | `HrAdmin`    | `/users` → `HrRegistrationFlow`   |
| المالية والعقود | `proc-admin`   | `ProcAdmin`  | `/users` → `ProcRegistrationFlow` |
| علاقات العملاء  | `crm-admin`    | `CrmAdmin`   | `/users` → `CrmRegistrationFlow`  |


**Where exactly:** sidebar group **إدارة المنظمة** (role switcher) → page **إدارة المستخدمين** (`/users`, `settings-nav.ts` / الإعدادات footer). CDO sees `UsersOrganizationView` (read-only org tree); department admins see staff list + registration wizard (`RegisterUserFlow` / `RegistrationPortal`).

**Scope of build:** align fields, steps, labels, and permission model in that HTML with the three flows above — **not** court parties, **not** توزيع المعاملات assignees.

**Prerequisite:** add/commit `docs/ejada-registration_1.html`; confirm with PM before coding.

**Failures API:** persist إدارة التعذرات in PostgreSQL; link bourse obstruction end-to-end (today: task escalation via API, failure record in browser only).

**Info roles API:** persist علاقة المستخدم بالمعلومة matrix in DB; enforce أصيل/ثانوي/معتمد server-side.

**Users (other):** edit/deactivate; search; export.

**PO:** blob storage for attachments; server pagination/search.

**Case study:** backend validation on form submit; documents/time-log tabs; wire matrix rules to required vs read-only vs approve-only.

**Platform:** wire RabbitMQ/Redis/observability; remaining mock modules; map `@ejadah.dev` demo users to Identity + prototype roles; real `/api/auth/me` role binding (replace sidebar switcher).

**Courts nav:** remove red placeholder styling when PM confirms courts screen is production-ready.

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
12. **نموذج الدراسة:** 5-step form (37 questions), printable report aligned to PDF reference, fixed approver/stamp assets.
13. **UI polish:** workspace chrome, progress donut in form step row, tab panel spacing.
14. **Sidebar الإعدادات:** dropdown at footer (ادوات النظام · إدارة المستخدمين · المحاكم و الدوائر).
15. **علاقة المستخدم بالمعلومة:** admin matrix (`/case-study-info-roles`), `evalCaseStudyInfoRoles`.
16. **Party integration:** `PartyActiveTaskWork` tab **نموذج الدراسة** — all questions visible, answer only per matrix; party storage per child task.
17. **Distribution parties:** child workflow tasks + party nav pages (`party-task-pages.ts`).
18. **جميع حقول النظام:** new sidebar group; system tools, info-roles, courts visible to all roles; الإعدادات reduced to users only (`4d3edc6`).
19. **Workflow tasks API:** `WorkflowTasks` table, full REST, frontend off localStorage (`9016a40`).
20. **Case study forms API:** `CaseStudyForms` table, specialist + party drafts persisted (`9016a40`).
21. **استعلام بورصة:** تاريخ الصك in pending queue; **حالة الصك** (فعال / غير فعال) → **متعذر** + reason → supervisor in إدارة التعذرات (`9016a40`).
22. **Terminology (8 Jun 2026):** documented court parties vs internal assignees vs user roles; deferred §16; org registration scope §14.1; removed `/workflow-users` prototype page.
23. **Backend layers (8 Jun 2026):** Domain / Application / Infrastructure split; HR persona seeding; JWT role scoping for department user lists; prototype silent auth.
24. **Alignment matrix (8 Jun 2026):** §12.1 — 7 live API domains, 6 needed for production-ready flows, ~15 for full sidebar.

---

*This file was verified against the codebase on 8 June 2026. Update when `main` changes materially.*