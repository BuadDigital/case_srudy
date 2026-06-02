# Project Progress — Ejada Internal (نظام إجادة الداخلي)

**Last updated:** 1 June 2026 (primary-data panel, البورصة العقارية, PO intake chrome)  
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
- Other domains (valuation workflow, assignment distribution, messages, financial, KPI) — still prototype/mock UI where noted in Section 7.9

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

# 2. API (applies migrations; auto-reload on save)
npm run dev:api
# or: cd backend/RealEstateEval.Api && dotnet run

# 3. Frontend (from repo root)
npm install   # if needed
npm run dev          # LAN — binds 0.0.0.0, prints Wi‑Fi URL for phone/tablet
npm run dev:local    # localhost only
npm run dev:stop     # free ports 3000 + 5160 (or: node apps/shell/scripts/dev-stop.mjs 5160)
```

**Login for user management:** `admin@local.dev` / `Admin123!`

After backend changes without `dev:api`, **restart the API** so inserts/validation fixes take effect.

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

## 7. PO intake & properties — case study (completed in prototype)

**Goal:** Persist work orders (أوامر العمل / PO) and their properties in PostgreSQL; Arabic RTL wizards and list/detail screens wired to the API. Assignment type **تنفيذ** requires a per-property assignment decree (filename + browser preview cache).

**Auth:** All work-order and courts endpoints require JWT (same login as users: `admin@local.dev` / `Admin123!`).

---

### 7.1 Database (PostgreSQL / EF Core)

**Migration:** `20260519111340_AddCaseStudyWorkOrders`

| Table | Purpose |
|-------|---------|
| `WorkOrders` | PO header: `PoNumber` (unique), assignment type, Enfath receipt date/time, assignment specialist, computed `DueDateAt` |
| `WorkOrderProperties` | Property under a PO: deed/reg identifier, location, classification/type, court/circuit, deed status, attachment **filenames** only (`AssignmentDocFileName`, `RealEstateRegFileName`) |
| `PropertyContacts` | 1..n contacts per property (`Name`, `Phone`, `SortOrder`) |
| `CourtCatalogEntries` | City → court → circuits (JSON), seeded on first API read if empty |

**Constraints & indexes:**

- Unique `PoNumber` on `WorkOrders`
- Unique `(WorkOrderId, DeedNumber)` on `WorkOrderProperties` (no duplicate deed within same PO)
- Cascade delete: PO → properties → contacts

**Enums (stored as int):**

- `AssignmentType`: تنفيذ / تركات / قطاع خاص (API labels in Arabic)
- `PropertyIdentifierType`: deed / real-estate registration / bourse inquiry (`BourseDataCompleted` tracks bourse step)
- `ExpectedPropertyCount` on `WorkOrders` (header-only intake; properties added afterward)

**Not stored in DB (prototype):**

- Binary file content for decree / reg attachments (only filenames)
- Property workflow stages (survey, valuation, study) — derived in UI from mocks/rules
- Failure records (تعذر) — still `localStorage` (`failures-storage.ts`)

---

### 7.2 Backend API (`backend/RealEstateEval.Api`)

**Work orders** — `WorkOrdersController` → `WorkOrderService` + `WorkOrderValidator` + `WorkOrderMapper`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/work-orders` | List PO summaries (counts, status for list UI) |
| `GET` | `/api/work-orders/exists?poNumber=` | Duplicate PO check on intake |
| `GET` | `/api/work-orders/deeds/prior?deedNumber=&excludePo=` | Prior deed registration in another PO |
| `GET` | `/api/work-orders/{poNumber}` | Full PO + properties + contacts |
| `GET` | `/api/work-orders/properties/pending-bourse` | Properties awaiting bourse completion |
| `POST` | `/api/work-orders` | Create PO header (`properties` may be empty; `expectedPropertyCount`) |
| `PUT` | `/api/work-orders/{poNumber}` | Update header only (supervisor) |
| `DELETE` | `/api/work-orders/{poNumber}` | Delete PO and all properties |
| `POST` | `/api/work-orders/{poNumber}/properties` | Add property to existing PO |
| `PUT` | `/api/work-orders/{poNumber}/properties/{propertyId}/bourse` | Complete bourse data for a property |
| `PUT` | `/api/work-orders/{poNumber}/properties/{propertyId}` | Update Enfath property (or full property when bourse already done) |
| `DELETE` | `/api/work-orders/{poNumber}/properties/{propertyId}` | Remove property (blocked if last one) |

**Business rules (server):**

- `BusinessDueDateCalculator`: **4 business days** (Sun–Thu; Fri/Sat off); **receipt day = day 1** if before **17:00**; after 17:00 or weekend → count from next business day; default time `10:00` if omitted
- **تنفيذ**: each property must have `AssignmentDocFileName` on create/update
- Real-estate reg identifier: `RealEstateRegFileName` required
- Contacts: ≥1 with name + phone (≥10 digits)
- Duplicate deed rejected within same PO
- Header update validates assignment type; تنفيذ PO cannot drop decree requirement on existing properties

**Courts catalog** — `CourtsController`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/courts` | List courts/circuits (auto-seed defaults) |
| `PUT` | `/api/courts` | Replace catalog (supervisor) |

**Key backend files:**

| Area | Path |
|------|------|
| Models | `Models/WorkOrder.cs`, `WorkOrderProperty.cs`, `PropertyContact.cs`, `CourtCatalogEntry.cs` |
| DTOs | `Contracts/WorkOrderDtos.cs` |
| Services | `Services/WorkOrderService.cs`, `WorkOrderValidator.cs`, `WorkOrderMapper.cs`, `BusinessDueDateCalculator.cs` |
| EF | `Data/ApplicationDbContext.cs`, `Data/Migrations/20260519111340_AddCaseStudyWorkOrders.cs` |
| HTTP samples | `RealEstateEval.Api.http` |

---

### 7.3 API client & shell data layer

| Package / file | Role |
|----------------|------|
| `packages/api-client/src/work-orders.ts` | Typed client: list, get, create, update header, CRUD properties, exists, prior deed |
| `packages/api-client` (courts) | Courts list/update (used by `courts-storage.ts`) |
| `apps/shell/src/lib/work-orders-api-config.ts` | JWT config, `resolveApiError` / field errors, `WORK_ORDERS_CHANGED_EVENT` |
| `apps/shell/src/lib/prototype/po-intake-storage.ts` | Maps API DTOs ↔ `PoIntakeRecord` / `PoPropertyIntake`; CRUD wrappers; builds property list rows for tables |
| `apps/shell/src/lib/prototype/po-intake-data.ts` | Reference lists (classifications, cities, courts fallback), `computeBusinessDueDate`, `formatPoDisplay`, `PROPERTY_CLASSIFICATIONS` |
| `apps/shell/src/lib/prototype/courts-storage.ts` | Loads/saves courts from API with static fallback |
| `apps/shell/src/lib/prototype/assignment-doc-attachments.ts` | `localStorage` image preview cache (≤2MB), keyed by `poNumber:propertyId` |
| `apps/shell/src/lib/query/prototype-queries.ts` | React Query: `usePoListRowsQuery`, `usePoRecordQuery`, `usePoRecordsQuery`, `usePropertyListItemsQuery` |
| `apps/shell/src/lib/prototype/po-roles.ts` | Who can receive PO, edit header, edit property, delete PO, manage courts |

**Draft:** Intake step 1 draft still in `localStorage` key `evalPoIntakeDraft` until submit.

---

### 7.4 Frontend — PO intake wizard (استلام أمر عمل جديد)

**Entry:** `PoListView` → **+ استلام PO جديد** (role: case specialist).

| Step | Component | Notes |
|------|-----------|--------|
| 1 | `PoIntakeFlow.tsx` + `PoIntakeWizardShell.tsx` | Header only: PO number (= تعميد), assignment type, Enfath receipt date, assignment specialist + email, **expected property count**; saves PO with `properties: []`. **`hideWizardChrome`:** no dept/title/step badge/hint; form fields + **حفظ أمر العمل** only (no card title, subtitle, or blue info note). |
| Success | `PoIntakeSuccess.tsx` | Summary card; user adds properties from PO detail or العقارات list |

**Property intake (separate screens):**

| Action | Component | Notes |
|--------|-----------|--------|
| Add / edit Enfath | `PoPropertyCreate.tsx`, `PoPropertyEdit.tsx`, `PoPropertyEnfathForm.tsx` | **مصدر البيانات** pills: **صك ملكية** / **تسجيل عيني** / **البورصة العقارية** (label was «استعلام بورصة»); contacts via `PoContactEditor.tsx`; decree upload for **تنفيذ** |
| Bourse completion | `BourseInquiryView.tsx` | Queue from `GET …/pending-bourse`; `PUT …/properties/{id}/bourse` |
| Stack preview | `PoPropertyStackCard.tsx`, `PoDetailPropertyCard.tsx` | Bourse-inquiry rows show status label instead of internal `INQ-…` placeholder |

**Validation:** `po-property-enfath-validation.ts`, `po-property-bourse-validation.ts`, `po-property-validation.ts` (contacts; mirrors server rules).

---

### 7.5 Frontend — PO list, detail, header edit

| Screen | Component | Notes |
|--------|-----------|--------|
| List | `PoListView.tsx` | Stats, table from API, view / edit header / delete by role |
| Detail | `PoDetailView.tsx` + `PoEditShell.tsx` (`variant="detail"`) | Summary panel, past-due alert, per-property cards, decree attachment preview |
| Header edit | `PoHeaderEdit.tsx` | Supervisor edits PO header fields only |

**UI polish:**

- Card-based detail layout, badges, white detail background (`reg-main--detail-view`)
- `formatPoDisplay()` — avoids duplicate label `PO PO-2025-0001` → `PO-2025-0001`
- Due date: fixed exclusive business-day count + local date formatting (no UTC off-by-one)

---

### 7.6 Frontend — Properties (العقارات)

| Screen | Component | Notes |
|--------|-----------|--------|
| List | `PropertiesListView.tsx` | All properties from API; filters: **All** / specific PO, region, status; add property (requires specific PO); edit / failure actions |
| Add | `PoPropertyCreate.tsx` | Add property to chosen PO (`POST …/properties`; server assigns property id) |
| Edit | `PoPropertyEdit.tsx` | Enfath form + optional bourse section; delete property (if not last) |
| Bourse queue | `BourseInquiryView.tsx` | Complete location/classification for pending properties |

**Attachment preview:** `AssignmentDocAttachment.tsx` — thumbnail + in-page **lightbox** on click (avoids `about:blank` from opening large `data:` URLs in a new tab). Preview only in the browser where the file was uploaded.

**Failures:** `FailuresView` / `failures-storage.ts` — report تعذر from properties list; updates deed status locally; **not** persisted to PostgreSQL yet.

---

### 7.7 Frontend — Courts management

| Screen | File |
|--------|------|
| إدارة المحاكم | `CourtsView.tsx` — supervisor edits catalog via API |

Property form loads courts from API (`courts-storage.ts`) with fallback to `COURTS_BY_CITY` in `po-intake-data.ts`.

---

### 7.8 Styles

| File | PO-related additions |
|------|---------------------|
| `packages/design-system/src/styles/registration.css` | `reg-flow-po`, `po-intake-success-*`, `po-detail-*`, `po-attach-*`, `po-edit-foot-actions`, property stack cards |

---

### 7.9 Still prototype / not done

| Item | Status |
|------|--------|
| **دراسة حالة العقار** | Sidebar placeholder (`placeholder: true`) — red nav text, `ActiveTransactionPlaceholderView.tsx` |
| **توزيع المعاملات** | **Implemented** — see §10.3 (restored after brief removal) |
| Upload decree/reg files to server | Filename only in DB; preview in `localStorage` |
| Failures (تعذر) | `localStorage` only; no احتمال تعذر vs تعذر approval workflow yet |
| Property workflow (مسح / تقييم / دراسة) | Mock stages on list rows |
| Dashboard KPIs for PO | Mix of API + legacy mock constants where not refreshed |
| Edit PO number after create | Locked in UI |
| Export PO/properties | Not implemented |
| Workflow tasks persistence | `tasks-storage.ts` — `localStorage` + sync from PO records; not PostgreSQL |

---

## 8. Key file map (PO & properties)

| Area | Paths |
|------|--------|
| PO list / intake entry | `apps/shell/src/components/views/PoListView.tsx` |
| Properties list | `apps/shell/src/components/views/PropertiesListView.tsx` |
| Intake wizard | `apps/shell/src/components/prototype/po-intake/PoIntakeFlow.tsx` |
| Enfath property form | `apps/shell/src/components/prototype/po-intake/PoPropertyEnfathForm.tsx` |
| Bourse screen | `apps/shell/src/components/views/BourseInquiryView.tsx` |
| Detail / attachments | `PoDetailView.tsx`, `AssignmentDocAttachment.tsx` |
| Shell storage | `apps/shell/src/lib/prototype/po-intake-storage.ts` |
| Shared PO data/rules | `apps/shell/src/lib/prototype/po-intake-data.ts` |
| API client | `packages/api-client/src/work-orders.ts` |
| Backend API | `backend/RealEstateEval.Api/Controllers/WorkOrdersController.cs` |

---

## 9. Active transactions & البيانات الأولية (June 2026 session)

**Goal:** Replace the old in-page “transaction type” dropdown with a **sidebar group** under أوامر العمل, implement **البيانات الأولية** as a workflow task queue, polish **استعلام بورصة**, and remove the standalone **الإسناد والتوزيع** section.

---

### 9.1 Navigation & routing

| Change | Details |
|--------|---------|
| **Sidebar group** | **المعاملات النشطة** — expandable dropdown under **أوامر العمل (PO)** in `AppShell.tsx` |
| **Sub-routes** | `active-primary-data`, `bourse-inquiry`, `active-distribution`, `active-case-study` |
| **Redirects** | `/my-tasks` → `/active-primary-data`; old `/assignment` → `/dashboard` |
| **Task work URL** | `/active-primary-data?task=<id>` (and `/active-distribution?task=<id>`); `/my-tasks/[id]` redirects to query URL |
| **List home** | `myTasksPath()` → `/active-primary-data` (`my-task-routes.ts`) |

**Config files:**

- `apps/shell/src/lib/prototype/active-transactions.ts` — nav items, `filterTasksForPrimaryData`, `taskMatchesBourseInquiry`, placeholder flags
- `apps/shell/src/lib/prototype/constants.ts` — `PageId`s, roles, breadcrumbs, `PAGE_TITLES`
- `packages/types/src/navigation.ts` — shared page ids
- `apps/shell/src/app/(app)/[page]/page.tsx` — view map

**Removed:**

- **الإسناد والتوزيع** nav section and `AssignmentView.tsx`
- In-page transaction-type dropdown on list views

**Moved:**

- **حمل الفريق الحالي** → dashboard card `TeamCurrentLoadCard.tsx` (manager roles)

---

### 9.2 Sidebar UX (badges & placeholders)

| Feature | Implementation |
|---------|----------------|
| **Placeholder routes** | `active-case-study` + some legacy NAV mocks use `placeholder: true` → red text via `.nav-item-dummy` |
| **Group toggle style** | Parent **المعاملات النشطة** uses grey `.nav-active-tx-group`, not red |
| **Count badges** | Red badges on **البيانات الأولية**, **استعلام بورصة**, and **توزيع المعاملات** via `use-active-transaction-nav-badges.ts` |

---

### 9.3 البيانات الأولية list (`MyTasksView.tsx` + `ActiveTransactionQueueView.tsx`)

**Route:** `/active-primary-data`  
**Layout:** Shared **`ActiveTransactionQueueView`** — table | toggle rail | **sticky side panel** (same pattern as استعلام بورصة). Panel opens on row click; URL `?task=`; no full-page navigation.  
**Chrome:** `TaskWorkChrome.tsx` — panel mode hides extra titles/hints/مسار banner; save label **حفظ** only.  
**Data:** `useWorkflowTasksQuery()` + `loadPoRecords()` → `syncTasksFromPoRecords()` → `tasksForRole()` → `filterTasksForPrimaryData()` (phase `enfath`, kind `case-study-property`) → open/blocked only.

**Table columns (RTL — first column = right / start of reading order):**

| # | Column | Source |
|---|--------|--------|
| 1 | **رقم العقار** | `formatPropertySlotOnPo` → e.g. `3/12` |
| 2 | **أمر العمل** | `PoNumber` link |
| 3 | **نوع الإسناد** | PO `assignmentType` + badge |
| 4 | **أخصائي الإسناد** | PO `assignmentSpecialist` |
| 5 | **المدة المتبقية** | Countdown to PO `dueDateAt` end-of-day (`T23:59:59`), format `days.hh.mm.ss`, ticks every 1s |

**Removed from this list (per UX requests):**

- رقم الصك, الموقع, التصنيف/النوع, حالة الصك, الحالة, الأخصائي column, eye/edit actions, مفتوحة/مكتملة filters, أوامر العمل button

**Row actions:** Click row → `primaryDataTaskPath(task.id)` → `CaseStudyTaskWork` in panel (`MyTaskWorkView.tsx`, `layout="panel"`).

**After save (إنفاذ):**

- **صك / البورصة العقارية:** auto-open next property in queue (`handleEnfathSaved` + `nextPrimaryDataTaskId` with ordinal fallback when saved task leaves list because phase → `bourse`).
- **تسجيل عيني:** `router.replace` to **توزيع المعاملات** (`/active-distribution?task=…`).

**Row builder:** `apps/shell/src/lib/prototype/my-task-row.ts` — `buildPrimaryDataTableRow`, `formatRemainingDuration`, `findPropertyForTask`.

---

### 9.4 Table layout — white space & Tailwind

**Problem (root causes):**

1. `prototype.css` **compact** column rules were defined **before** base `.po-properties-tbl .po-col-*` rules → base widths won → table shrank to content (~60% empty area in RTL).
2. **أخصائي الإسناد** at **32%** with short text looked like a huge gap before **المدة المتبقية**.
3. `<colgroup>` + class-based `%` widths are fragile when rules conflict.

**Fix (current approach):**

- **البيانات الأولية** table uses **Tailwind** on `th`/`td` directly (`table-fixed w-full`, `w-[12%]` … `w-[28%]` summing to 100%).
- Constants `primaryTh` / `primaryTd` at top of `MyTasksView.tsx`.
- Removed `po-properties-tbl--primary-queue` block from `prototype.css` (no longer used for this screen).
- Shell card still uses `po-properties-shell`, `po-properties-hero--compact`, etc.

**Tailwind in repo:** `apps/shell/src/app/globals.css` has `@import "tailwindcss"`. Most prototype screens still use `prototype.css` + `registration.css`; new layout-heavy UI can use Tailwind (as on this table).

**Column width split (primary queue):** 12% · 18% · 15% · 27% · 28%

---

### 9.5 استعلام بورصة (`BourseInquiryView.tsx`)

- Kept **bourse-specific layout** (stats, note, split form panel).
- **Queue list** styled like البيانات الأولية (`po-properties-shell--compact`, `po-properties-tbl--compact po-properties-tbl--bourse-queue`).
- Data: `loadPendingBourseItems()` from API (not workflow task list).
- Bourse table columns: رقم الصك, أمر العمل, المالك, الاستحقاق.

**Optional follow-up:** Apply same Tailwind column pattern as `MyTasksView` if bourse queue shows layout gaps.

---

### 9.6 Workflow tasks architecture (prototype)

| Piece | Role |
|-------|------|
| `tasks-storage.ts` | `WorkflowTask` list in `localStorage`; `syncTasksFromPoRecords` creates/updates tasks per PO property slot |
| `po-intake-storage.ts` | API-backed PO/property data; modified in this session (see git) |
| `MyTaskWorkView.tsx` | 3-phase workflow UI (إنفاذ → بورصة → …) for a single task |
| `failures-storage.ts` | تعذر still immediate/local — not discussed as implemented |

**Primary data filter:** `task.phase === "enfath"` and `task.kind === "case-study-property"` (`active-transactions.ts`).

---

### 9.7 Styles touched (`prototype.css`)

| Class / area | Notes |
|--------------|--------|
| `.po-properties-tbl-wrap` | `width: 100%` |
| `.po-properties-tbl--compact` | Must stay **after** base `.po-properties-tbl` col rules |
| `.po-properties-hero--compact` | Tighter padding (`10px 16px 8px`) |
| `.po-properties-tbl--bourse-queue` | 4-column widths for bourse list |
| ~~`.po-properties-tbl--primary-queue`~~ | **Removed** — primary list uses Tailwind in component |

---

### 9.8 Key file map (active transactions)

| Area | Path |
|------|------|
| Primary data list | `apps/shell/src/components/views/MyTasksView.tsx` |
| Shared queue layout | `apps/shell/src/components/views/ActiveTransactionQueueView.tsx` |
| Distribution queue | `apps/shell/src/components/views/ActiveDistributionView.tsx` |
| Panel chrome | `apps/shell/src/components/prototype/primary-data/TaskWorkChrome.tsx` |
| Task work screen | `apps/shell/src/components/views/MyTaskWorkView.tsx` |
| Bourse | `apps/shell/src/components/views/BourseInquiryView.tsx` |
| Placeholders | `apps/shell/src/components/views/ActiveTransactionPlaceholderView.tsx` |
| Sidebar | `apps/shell/src/components/views/AppShell.tsx` |
| Nav config | `apps/shell/src/lib/prototype/active-transactions.ts` |
| Routes | `apps/shell/src/lib/my-task-routes.ts`, `apps/shell/src/lib/my-tasks-chrome.ts` |
| Row data | `apps/shell/src/lib/prototype/my-task-row.ts` |
| Tasks | `apps/shell/src/lib/prototype/tasks-storage.ts` |
| Nav badges hook | `apps/shell/src/lib/query/use-active-transaction-nav-badges.ts` |
| Dashboard load card | `apps/shell/src/components/views/TeamCurrentLoadCard.tsx` |
| Styles | `packages/design-system/src/styles/prototype.css` |

---

### 9.9 Not done / continue later

| Item | Notes |
|------|--------|
| **دراسة حالة العقار** | Placeholder page only |
| **Bourse queue Tailwind** | Still on `po-properties-tbl--bourse-queue` CSS — migrate if gaps appear |
| **احتمال تعذر vs تعذر** | Approval workflow discussed, not implemented |
| **Tasks in PostgreSQL** | Still localStorage sync from PO |
| **Commit** | Session changes may be uncommitted — run `git status` before PR |

---

## 10. June 2026 — Primary-data panel, البورصة العقارية, validation (continued session)

### 10.1 Split panel & task work UX

| Item | Details |
|------|---------|
| **Shared layout** | `ActiveTransactionQueueView.tsx` — used by `MyTasksView` (البيانات الأولية) and `ActiveDistributionView` (توزيع المعاملات) |
| **Sticky panel** | `prototype.css` — `po-primary-data-layout`, rail toggle, panel animation; form scrolls with long tables |
| **In-panel work** | `CaseStudyTaskWork` (`MyTaskWorkView.tsx`) with `layout="panel"`, `onEnfathSaved`, `onClose` |
| **Removed panel chrome** | No «اختر معاملة», إغلاق, لوحة التحكم link, duplicate bourse labels in panel |
| **Bourse in panel** | `bourseInquiryPanelOnly` — primary panel shows إنفاذ fields only; full bourse form stays on **استعلام بورصة** tab |
| **Race fix** | `advancingRef` + open next task URL before `syncQueue` so panel does not close mid-advance |

**Styles:** `packages/design-system/src/styles/prototype.css` — primary-data layout, rail, sticky panel slot.

---

### 10.2 Labels — مصدر البيانات & البورصة العقارية

| Before | After | Where |
|--------|-------|--------|
| نوع المعرف | **مصدر البيانات** (right-aligned) | `PoPropertyEnfathForm.tsx`, `PoDetailPropertyCard.tsx` |
| استعلام بورصة (pill) | **البورصة العقارية** | Pill + `identifierTypeLabel()` in `po-intake-data.ts` |
| استعلام بورصة (sidebar) | Unchanged | Nav tab title still «استعلام بورصة» unless renamed later |

---

### 10.3 توزيع المعاملات (restored)

Briefly removed from sidebar; **restored** per product request.

| Piece | Path / behavior |
|-------|-----------------|
| **Page** | `/active-distribution` — `ActiveDistributionView.tsx` |
| **Nav** | `ACTIVE_TRANSACTIONS_NAV` in `active-transactions.ts` |
| **Filter** | `filterTasksForDistribution` — phase `distribution` |
| **Routes** | `activeDistributionPath()`, `distributionTaskPath()` in `my-task-routes.ts` |
| **تسجيل عيني save** | After إنفاذ on primary data → redirect to distribution task URL (not stay on primary list) |

---

### 10.4 البورصة العقارية — validation & save (primary-data panel only)

**Problem:** Saving from البيانات الأولية panel showed **الحي مطلوب** although **الحي** is not on that form. Causes:

1. API **update** used full `propertyToDto` → triggered **بورصة** validation when `bourseDataCompleted` was true.
2. Old API **إنفاذ** rules for `bourse_inquiry` required `district` / classification on insert.

**Fixes (scoped):**

| Layer | Change |
|-------|--------|
| **Backend** `WorkOrderValidator.cs` | `BourseInquiry` on **إنفاذ:** requires صك/مهمة/تاريخ/مالك/محكمة/دائرة (not الحي). **بورصة** step still requires الحي + المدينة + التصنيف + نوع العقار. |
| **Frontend** `po-intake-storage.ts` | `updatePropertyInPo` uses `propertyToEnfathDto` when `!bourseDataCompleted` |
| **Frontend** `MyTaskWorkView.tsx` | `saveEnfath` sets `bourseDataCompleted: false` for `bourse_inquiry` before update |
| **الحي in UI** | Removed only from this panel path — **still required** on `PoPropertyBourseForm` (استعلام بورصة tab) |

**Note:** Restart API (`dotnet run`) after backend validator changes so old DLL is not served.

---

### 10.5 Auto-advance after save (البورصة العقارية)

`nextPrimaryDataTaskId()` in `my-task-row.ts` — if saved task already left the list (phase `bourse`), pick next task by **`propertyOrdinal`** instead of list index only.

`MyTasksView.handleEnfathSaved` passes `saved?.propertyOrdinal` from `loadWorkflowTasks()`.

---

### 10.6 PO intake chrome removal

| Removed from `/po/intake` | Kept |
|---------------------------|------|
| قسم دراسة الحالة / استلام أمر عمل جديد / الخطوة 1 من 1 / step indicator / hint | **رجوع**, form fields, **حفظ أمر العمل** |
| Card title «بيانات أمر العمل (PO)» + subtitle | |
| Blue note (استحقاق 4 أيام / استعلام بورصة) | |

`PoIntakeWizardShell.tsx` — `hideWizardChrome` prop.  
`po-chrome.ts` — intake top bar title **أوامر العمل** (breadcrumb: دراسة الحالة / أوامر العمل).  
Removed unused `PO_INTAKE_HINTS` from `po-intake-data.ts`.

---

### 10.7 Key files (this session)

| Area | Path |
|------|------|
| Shared queue + panel | `ActiveTransactionQueueView.tsx` |
| Primary data | `MyTasksView.tsx` |
| Distribution queue | `ActiveDistributionView.tsx` |
| Panel chrome | `TaskWorkChrome.tsx` |
| Enfath / مصدر البيانات | `PoPropertyEnfathForm.tsx` |
| Task save / panel logic | `MyTaskWorkView.tsx` |
| Next-task helper | `my-task-row.ts` |
| API DTO / update split | `po-intake-storage.ts` |
| Server validation | `backend/RealEstateEval.Api/Services/WorkOrderValidator.cs` |
| Intake UI | `PoIntakeFlow.tsx`, `PoIntakeWizardShell.tsx` |

---

### 10.8 Git / deploy notes

- Pushed earlier commit on `main`: primary-data split panel (see repo history).
- Later session changes (validation, auto-advance, intake chrome, distribution restore) may be **local uncommitted** — run `git status` before PR.
- API must be **restarted** after `WorkOrderValidator` edits (build can fail while process locks `RealEstateEval.Api.exe`).

---

## 11. Suggested next steps (not done yet)

**Users (from Phase 1):**

- Edit / deactivate users  
- Filter/search on the users table  
- Export users list (CSV/PDF)  

**PO & properties:**

- Store assignment/reg attachments in blob storage (S3/Azure) with download URLs  
- Persist failures (تعذر) to database + API  
- Wire assignment/distribution screen to real workload rules  
- Real workflow status per property (survey, valuation, study)  
- Server-side PO/property search and pagination  

**General:**

- Wire remaining prototype modules (messages, financial, KPI) to real APIs  

---

## 12. Session changelog (high level)

1. Fixed dev environment (npm, tooling notes).  
2. Designed and implemented user persistence from HR / Proc / CRM wizards.  
3. Wrote database overview docs (EN markdown + AR HTML).  
4. Built expandable user rows with API-driven profile details.  
5. Added grouped sections, username, system roles, user id.  
6. Adjusted expand chevron to point down when open.  
7. **PO case study:** DB tables + migrations for work orders, properties, contacts, courts.  
8. **Backend:** Full work-order CRUD, validation, business due date, courts catalog API.  
9. **Frontend:** Two-step PO intake, multi-property stack, PO list/detail/edit, properties list/add/edit.  
10. **UX fixes:** Due date math, API error messages, decree preview lightbox, PO label formatting, properties PO filter (**All**), footer button alignment.  
11. **PO workflow refactor:** Header-only intake, `expectedPropertyCount`, split Enfath vs bourse flows, `PoPropertyEnfathForm` replaces monolithic `PoPropertyForm`.  
12. **Alignment fixes:** Identifier types + bourse validation on client/server; ASP.NET field-error parsing; property insert uses server-generated IDs (avoids concurrency 500).  
13. **LAN dev:** `dev-lan.mjs`, `dev:stop`, `dev:api`; Wi‑Fi URL for shared testing.  
14. **Active transactions (Jun 2026):** Sidebar group **المعاملات النشطة** under PO; routes `active-primary-data`, `bourse-inquiry`, placeholders for distribution/case study.  
15. **Removed** standalone **الإسناد والتوزيع** (`AssignmentView`); **حمل الفريق الحالي** on dashboard.  
16. **البيانات الأولية:** `MyTasksView` workflow queue; columns رقم العقار, PO, نوع الإسناد, أخصائي, countdown; removed رقم الصك and old filters/actions.  
17. **Layout:** Fixed table white space (CSS specificity + Tailwind on primary table); compact hero.  
18. **Sidebar:** Red dummy nav items, badge counts for primary + bourse queues.  
19. **Split panel:** `ActiveTransactionQueueView` — table + rail + sticky side panel on البيانات الأولية; `?task=` URLs; `TaskWorkChrome` minimal panel UI.  
20. **Save flows:** Auto-advance to next property after حفظ; تسجيل عيني → توزيع المعاملات; restored **توزيع المعاملات** page (`ActiveDistributionView`).  
21. **مصدر البيانات / البورصة العقارية:** Renamed labels; البورصة path validation aligned (no الحي on primary panel save); `propertyToEnfathDto` on partial update.  
22. **PO intake:** Stripped wizard chrome on `/po/intake` (`hideWizardChrome`).  

---

*This file is maintained for job documentation only; update it when major features land.*
