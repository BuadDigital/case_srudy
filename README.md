# Ejada Internal (نظام إجادة الداخلي) — Real Estate Evaluation & Case Study Platform

<div align="center">
  <h1>نظام إجادة الداخلي</h1>
  <p><strong>A full-stack, multi-role internal platform for property case study, valuation workflows, and operations.</strong></p>
  <p><i>دراسة الحالة — Arabic RTL enterprise workspace</i></p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-blue.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Backend-ASP.NET%20Core%2010-512BD4.svg" alt="Backend">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791.svg" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Architecture-Microfrontends%20%7C%20Microservices-orange.svg" alt="Architecture">
  <img src="https://img.shields.io/badge/Infra-Docker%20Compose-2496ED.svg" alt="Docker">
  <img src="https://img.shields.io/badge/Status-Study%20Case%20%2F%20Prototype-yellow.svg" alt="Status">
</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [✨ Key Features](#-key-features)
  - [👔 Management & Supervision](#-management--supervision)
  - [📋 Case Study Department](#-case-study-department)
  - [🏠 Valuation Department](#-valuation-department)
  - [⚙️ Platform & Administration](#️-platform--administration)
- [🔒 Security Features](#-security-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏛️ Architecture](#️-architecture)
- [📡 Platform & Observability Stack](#-platform--observability-stack)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Infrastructure (Docker)](#1-infrastructure-docker)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
- [🔑 Configuration](#-configuration)
- [📝 API Endpoints](#-api-endpoints)
- [🎨 Design Features](#-design-features)
- [📱 Screens & Modules](#-screens--modules)
- [✅ What's Included in This Repo](#-whats-included-in-this-repo)
- [🧭 How to Run & Manage the Project](#-how-to-run--manage-the-project)
  - [Daily development (3 steps)](#daily-development-3-steps)
  - [Where to change code](#where-to-change-code)
  - [Working with prototypes](#working-with-prototypes)
  - [Troubleshooting](#troubleshooting)
- [🛤️ How to Deliver the Roadmap](#️-how-to-deliver-the-roadmap)
- [🗺️ Roadmap & Remaining Work](#️-roadmap--remaining-work)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)

---

## 🌎 About The Project

**Ejada Internal** (نظام إجادة الداخلي) is an internal **real-estate evaluation and case-study** platform. It supports end-to-end workflows for purchase orders (PO), properties, assignments, survey offices, keys, impediments (تعذرات), valuation requests, field inspection, messaging, financial reporting, and KPIs — with a **premium Arabic RTL** interface aligned to HTML prototypes in `requirements/`.

The project is built on a **modern, production-oriented** stack:

- **Next.js 16** shell app (microfrontend-ready monorepo) for the web UI
- **ASP.NET Core 10** API with **JWT** + **ASP.NET Identity** (domain services planned)
- **PostgreSQL** as the system of record
- **Docker Compose** local platform: **RabbitMQ**, **Redis**, **Jaeger**, **Prometheus**, **Grafana**, **Elasticsearch**, **Kibana**, **Fluent Bit**
- Target: **microfrontends** (Module Federation) + **domain microservices** behind an API gateway

**Current phase:** UI screens are **implemented** with **mock data** on the frontend; core business logic and service boundaries are still being defined with product management. Infrastructure is **ready locally**; observability and messaging are **not fully wired in application code yet**.

### User roles (prototype)

| Role | Arabic label (examples) |
|------|------------------------|
| General Manager | مدير الإدارة العام |
| Section Supervisor | مشرف قسم دراسة الحالة |
| Operations Coordinator | منسق العمليات |
| Case Specialist | أخصائي دراسة الحالة |
| Report Preparer | معد التقرير |
| Court Delegate | مندوب المحكمة |
| Valuation Coordinator | منسق التقييم |
| Real Estate Appraiser | مقيم عقاري |
| Field Inspector | معاين ميداني |
| Financial Officer | موظف الشؤون المالية |

---

## ✨ Key Features

### 👔 Management & Supervision

- **Executive dashboard** with KPIs, workload, and team overview
- **Role-based navigation** — each role sees allowed modules only (prototype role switcher today)
- **Financial reports** and **performance indicators (KPI)**
- **View-only mode** for general manager on selected screens (e.g. users, PO)

### 📋 Case Study Department

- **Purchase orders (PO)** — list, status, progress tracking
- **Properties** — registry, workflow stages (survey / valuation / study)
- **Assignment & distribution** — workload across specialists
- **Survey (الرفع المساحي)** — engineering offices and jobs
- **Keys management (إدارة المفاتيح)** — property keys tracking
- **Impediments (إدارة التعذرات)** — review, pending, approval workflows
- **Internal messaging** between departments

### 🏠 Valuation Department

- **Valuation requests** — intake from case study, status tracking
- **Field inspector form** — on-site inspection data and photos (UI prototype)
- Coordination with case study (planned via **RabbitMQ** events)

### ⚙️ Platform & Administration

- **User management (إدارة المستخدمين)** — list staff; **add user** modal (name, role, email, password, contract type: موظف داخلي / متعاون / مزود خدمة); persisted in browser `localStorage` until API is connected
- **Secure login** — JWT in `sessionStorage`; optional backend Identity API
- **Planned per-role accounts** — `@ejadah.dev` (see `docs/DEMO_ROLE_CREDENTIALS.txt`)

---

## 🔒 Security Features

Security is layered across the **browser app**, **API**, and **planned platform** services. Today the foundation is **authentication + route protection**; **authorization** (real roles on the server) and **hardening for production** are still in progress.

### Authentication & session (implemented)

| Feature | Where | Description |
|---------|--------|-------------|
| **Email + password login** | `POST /api/auth/login` | ASP.NET **Identity** validates credentials against PostgreSQL |
| **JWT access tokens** | `JwtTokenService` | Signed **HMAC-SHA256** token; issuer, audience, lifetime, and signing key validation |
| **Token expiry** | JWT (8 hours dev) | `expiresAtUtc` returned to client; validated on each API call |
| **Protected API route** | `GET /api/auth/me` | Requires `[Authorize]` — Bearer JWT |
| **Client session store** | `@platform/auth-client` | Token + user profile in **`sessionStorage`** (cleared on tab close) |
| **App auth gate** | `AppAuthGate` | Unauthenticated users redirected to `/login` |
| **Logout** | `AppShell` | Clears session and full navigation to `/login` |
| **HTTPS redirection** | API `Program.cs` | `UseHttpsRedirection()` on backend |
| **Password policy (Identity)** | `Program.cs` | Min **8** chars, upper, lower, digit, non-alphanumeric |
| **Unique email** | Identity | `RequireUniqueEmail = true` |

**Login flow:**

```text
Browser → POST /api/auth/login (email, password)
       ← JWT + user + expiresAtUtc
       → sessionStorage["auth"]
       → App routes allowed under AppAuthGate
Future API calls → Authorization: Bearer <token>
```

### Authorization & access control (partial — prototype)

| Feature | Status | Description |
|---------|--------|-------------|
| **Role-based navigation** | ✅ UI | Sidebar shows only pages allowed for current `RoleId` in `ROLES` |
| **View-only mode (GM)** | ✅ UI | General manager: read-only on PO, users, keys, survey, failures, valuation (no edit buttons) |
| **Workflow permissions** | ✅ UI | e.g. failures: specialist vs supervisor approve paths in `FailuresView` |
| **JWT role claims** | ⏳ Backend | Token can include `ClaimTypes.Role`; frontend does **not** use them yet |
| **Server-side authorization** | ⏳ | Domain endpoints will use `[Authorize(Roles = "...")]` per API |
| **Remove demo role switcher** | ⏳ | Planned: role from logged-in user only (`docs/DEMO_ROLE_CREDENTIALS.txt`) |
| **Per-route API policies** | ⏳ | Gateway + service policies when microservices split |

> **Important:** The sidebar **role dropdown** is for **demos only**. Anyone logged in can switch roles in the browser until login is bound to real Identity roles.

### Application & transport security

| Feature | Status | Notes |
|---------|--------|--------|
| **CORS** | ✅ Dev | API allows `http://localhost:3000` only (default policy) |
| **Secrets in config** | ⚠️ Dev | DB password in `appsettings.Development.json`; JWT key in `appsettings.json` — **override in production** |
| **Env override for DB** | ✅ | `REAL_ESTATE_EVAL_PG_CONNECTION_STRING` avoids committing passwords |
| **User secrets / Key Vault** | ⏳ | Use .NET user secrets or cloud vault for prod JWT key and connection strings |
| **Add-user passwords in UI** | ⚠️ Demo | Stored in **`localStorage`** with staff list — **not secure**; for prototype until Identity API |
| **No passwords in JWT** | ✅ | Only claims + metadata in token |
| **EF Core migrations** | ✅ | Schema applied on startup; seeded admin user |

### Security-related platform (planned)

| Feature | Technology | Purpose |
|---------|------------|---------|
| **Rate limiting** | Redis / gateway | Throttle login and sensitive APIs |
| **Token refresh / revoke** | Identity + Redis blocklist | Short-lived access token + refresh or revoke on logout |
| **Centralized audit log** | Elasticsearch or Postgres | Who changed PO/property/failure status |
| **Secrets management** | K8s Secrets / Azure Key Vault | No keys in git |
| **TLS everywhere** | Ingress / reverse proxy | HTTPS for shell + API in production |
| **Security headers** | Shell / gateway | CSP, HSTS, X-Frame-Options for web app |
| **mTLS / service auth** | Between microservices | When services split behind gateway |
| **Cassandra** | Optional later | High-volume audit only if Postgres is insufficient |

### JWT configuration (backend)

Set in `backend/RealEstateEval.Api/appsettings.json` (use **user secrets** or environment in production):

```json
"Jwt": {
  "Issuer": "RealEstateEval",
  "Audience": "RealEstateEval",
  "SigningKey": "<64+ char secret — never commit real prod key>"
}
```

Optional frontend env:

```env
NEXT_PUBLIC_API_URL=http://localhost:5160
```

### Security checklist before production

- [ ] Replace dev JWT signing key and rotate regularly
- [ ] Store connection strings and JWT key in **user secrets** / vault, not in git
- [ ] Enforce **HTTPS** only; secure cookies if moving token from `sessionStorage`
- [ ] Seed real users with `@ejadah.dev`; **disable** prototype role switcher
- [ ] Enforce roles on **every** API endpoint (`[Authorize]` + policies)
- [ ] Stop storing staff passwords in `localStorage`; use Identity `UserManager` only
- [ ] Add **refresh tokens** or short TTL + re-auth for sensitive actions
- [ ] Enable **audit logging** for admin and workflow approvals
- [ ] Restrict CORS to production shell origin only
- [ ] Security review of case study / valuation forms (PII, document uploads)

### Reporting security issues

Report vulnerabilities to the project owner / security contact internally — do not open public issues with exploit details.

---

## 🛠️ Technology Stack

| Area | Technology / Library |
| :--- | :--- |
| **Web app (host)** | `Next.js 16`, `React 19`, `TypeScript 5`, Tailwind CSS 4 |
| **Monorepo** | npm workspaces — `apps/shell`, `packages/*` |
| **Shared packages** | `@platform/design-system`, `@platform/auth-client`, `@platform/api-client`, `@platform/types` |
| **Backend** | `ASP.NET Core 10`, `Entity Framework Core`, `ASP.NET Identity` |
| **Auth** | JWT Bearer, session storage (frontend), planned role claims |
| **Database** | `PostgreSQL 17` |
| **Message broker** | `RabbitMQ 3.13` (local; planned for domain events) |
| **Cache** | `Redis 7` (planned) |
| **Metrics** | `Prometheus` + `Grafana` |
| **Tracing** | `Jaeger` + OpenTelemetry (planned) |
| **Logs** | `Fluent Bit` → `Elasticsearch` → `Kibana` (Fluentd family) |
| **Wide-column DB** | `Cassandra` — **deferred** (MVP uses Postgres) |
| **Local infra** | `Docker Compose` (`infra/docker-compose.yml`) |
| **Reference UI** | HTML prototypes in `requirements/` |

---

## 🏛️ Architecture

The platform is evolving from a **single shell app + auth API** toward **microfrontends** and **domain microservices**.

### Current structure (phase F0 — done)

```text
project1_study_case/
├── apps/
│   └── shell/                 # Next.js host — all screens today
├── packages/
│   ├── design-system/         # prototype.css, badges
│   ├── auth-client/           # session, AppAuthGate
│   ├── api-client/            # getApiBase + users/work-orders/courts fetch helpers
│   └── types/                 # PageId, RoleId, nav types
├── backend/
│   └── RealEstateEval.Api/    # Identity + JWT (monolith for now)
├── infra/                     # Docker Compose, Prometheus, Fluent Bit, …
├── docs/                      # Architecture, LOCAL_INFRA, demo credentials
└── requirements/              # HTML prototypes (reference only)
```

### Target microfrontends (planned)

| MFE | Routes |
|-----|--------|
| **shell** | Login, layout, nav, auth |
| **mfe-case-study** | dashboard, PO, properties, assignment, failures |
| **mfe-valuation** | valuation-requests, field-form |
| **mfe-operations** | survey, keys |
| **mfe-financial** | financial |
| **mfe-platform** | users, messages, kpi |

### Target backend (planned)

```text
Browser → API Gateway (YARP / BFF)
            → Identity & Access
            → Case Study Service      → PostgreSQL (case_db)
            → Valuation Service       → PostgreSQL (valuation_db)
            → Operations / Financial / Reporting …
            ↔ RabbitMQ (async events)
            ↔ Redis (cache)
```

### Observability (target)

```text
Services → OpenTelemetry → Jaeger (traces)
         → /metrics      → Prometheus → Grafana
         → JSON logs     → Fluent Bit → Elasticsearch → Kibana
```

Details: [docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md](docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md)

---

## 📡 Platform & Observability Stack

| Technology | Role | Local URL | Wired in apps |
|------------|------|-----------|---------------|
| **PostgreSQL** | OLTP / Identity DB | `localhost:5432` | ✅ API |
| **RabbitMQ** | Async domain events | `5672`, UI `15672` (`dev` / `dev`) | ⏳ Planned |
| **Redis** | Cache, locks, rate limits | `6379` | ⏳ Planned |
| **Prometheus** | Metrics | http://localhost:9090 | ⏳ Config only |
| **Grafana** | Dashboards | http://localhost:3001 (`admin` / `admin`) | ⏳ |
| **Jaeger** | Distributed tracing | http://localhost:16686, OTLP `4318` | ⏳ |
| **Elasticsearch** | Log / search index | http://localhost:9200 | ⏳ via Fluent Bit |
| **Kibana** | Log exploration | http://localhost:5601 (`fluentbit-*`) | ⏳ |
| **Fluent Bit** | Log collector (Fluentd family) | container `ree-fluent-bit` | ⏳ Sample pipeline |
| **Fluentd** | Alternative log router | Not in compose | Use Fluent Bit locally |
| **Cassandra** | Massive append-only store | Not in compose | ❌ Deferred for MVP |

```bash
docker compose -f infra/docker-compose.yml up -d
```

Full guide: [docs/LOCAL_INFRA.md](docs/LOCAL_INFRA.md)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and **npm**
- **.NET SDK 10** (for the API)
- **Docker Desktop** (recommended ~6 GB RAM free for Elasticsearch + Kibana)

### 1. Infrastructure (Docker)

From the **repository root**:

```bash
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps
```

### 2. Backend Setup

```bash
cd backend/RealEstateEval.Api
dotnet run
# API: http://localhost:5160 (see launchSettings.json)
```

Default seeded user (after DB migrate/seed): **`admin@local.dev`** / **`Admin123!`**

### 3. Frontend Setup

From the **repository root**:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — login page; app routes under `/dashboard`, `/properties`, `/users`, etc.

```bash
npm run build   # production build
npm run lint    # ESLint
```

---

## 🔑 Configuration

### Backend — `appsettings.Development.json`

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=realestate_eval_dev;Username=postgres;Password=Admin"
}
```

Matches Docker Postgres in `infra/docker-compose.yml`.

### Frontend — environment (optional)

```env
NEXT_PUBLIC_API_URL=http://localhost:5160
```

Used by `@platform/api-client` for login (`/api/auth/login`).

### Planned demo users

See [docs/DEMO_ROLE_CREDENTIALS.txt](docs/DEMO_ROLE_CREDENTIALS.txt) — `@ejadah.dev` accounts (not seeded in API yet).

### Connection strings (future services)

```text
PostgreSQL:  Host=localhost;Port=5432;Database=realestate_eval_dev;Username=postgres;Password=Admin
Redis:       localhost:6379
RabbitMQ:    amqp://dev:dev@localhost:5672/
Jaeger OTLP: http://localhost:4318
```

---

## 📝 API Endpoints

Base URL (dev): `http://localhost:5160`

### Authentication (live today)

| Method | Endpoint | Description | Auth |
| :----- | :------- | :---------- | :--- |
| `POST` | `/api/auth/login` | Email + password → JWT | Public |

**Response:** `token`, `expiresAtUtc`, `user` (`id`, `email`, `displayName`).

### Domain APIs (live today)

| Area | Prefix | Status |
|------|--------|--------|
| Auth | `/api/auth` | Login + `/me` |
| Users | `/api/users` | List, org overview, HR/Proc/CRM registration |
| Work orders | `/api/work-orders` | PO + properties CRUD, prior deed, pending bourse |
| Courts | `/api/courts` | Catalog GET/PUT |

Workflow tasks, case-study form drafts, and failures remain **browser localStorage** until persisted. See `docs/progress.md`.

Future service split sketch: [docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md](docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md).

---

## 🎨 Design Features

- **Arabic RTL** layout with **IBM Plex Sans Arabic**
- **Design tokens** in `globals.css` (primary navy, accent teal, status colors)
- **Prototype components** ported from `requirements/system_prototype_4.html` (`prototype.css`)
- **Role-aware sidebar** with grouped navigation (دراسة الحالة, التقييم العقاري, …)
- **Status badges** — workflow stages, PO/VR status, contract types
- **Responsive tables, cards, KPI grids**, modals for add-user
- **Login page** styled independently for stable layout after logout

---

## 📱 Screens & Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/dashboard` | KPIs, team, summaries |
| Purchase orders | `/po` | PO list and progress |
| Properties | `/properties` | Redirects to `/po` |
| Assignment | `/assignment` | Legacy redirect → `/dashboard` |
| Survey | `/survey` | Engineering offices |
| Keys | `/keys` | إدارة المفاتيح |
| Impediments | `/failures` | إدارة التعذرات |
| Valuation requests | `/valuation-requests` | VR from case study |
| Field form | `/field-form` | Inspector form |
| Messages | `/messages` | Internal messaging |
| Financial | `/financial` | Financial reports |
| KPI | `/kpi` | Performance indicators |
| Users | `/users` | إدارة المستخدمين |
| Login | `/login` | Authentication |
| Welcome (redirect) | `/welcome` | Legacy redirect → dashboard |

---

## ✅ What's Included in This Repo

Use this checklist to see what exists **today** vs what is only planned.

| Area | Included? | Notes |
|------|-----------|--------|
| **All main UI screens** | ✅ | Mock data in `apps/shell/src/lib/prototype/constants.ts` |
| **Login + JWT** | ✅ | Needs API + Postgres running |
| **Security (Identity, JWT, auth gate, password policy)** | ✅ | See [Security Features](#-security-features) |
| **Role switcher (demo)** | ✅ | Sidebar dropdown — **not** real server-side security yet |
| **Add user (إدارة المستخدمين)** | ✅ | API (`POST /api/users/hr|proc|crm`) + registration wizards |
| **Monorepo F0** | ✅ | `apps/shell` + `packages/*` |
| **Microfrontends (F2–F5)** | ❌ | Only documented; not built |
| **Domain APIs** (PO, properties, courts, users) | ✅ | `RealEstateEval.Api` — see `docs/progress.md` |
| **Per-role `@ejadah.dev` login** | ❌ | Draft in `docs/DEMO_ROLE_CREDENTIALS.txt` |
| **Docker platform stack** | ✅ | Postgres, RabbitMQ, Redis, Jaeger, Prometheus, Grafana, ES, Kibana, Fluent Bit |
| **Apps wired to Redis/RabbitMQ/Jaeger** | ❌ | Infra runs; code not connected |
| **Cassandra** | ❌ | Deferred; not in Docker Compose |
| **Case study form UI** | ✅ | `CaseStudyForm` + `/case-study/[taskId]` (draft in localStorage) |
| **Registration flow UI** | ✅ | `RegisterUserFlow` + HR/Proc/CRM flows → API |
| **PO/property detail pages** | ✅ | `/po/{poNumber}/property/*` routes |
| **Module Federation** | ❌ | Single Next.js deploy |

### Reference files (`requirements/`)

| File | Purpose |
|------|---------|
| `system_prototype_4.html` | Main app shell, nav, all module screens |
| `case_study_form 2.html` | Detailed case study form layout |
| `ejada-registration_1.html` | Registration / onboarding flow reference |

Open these in a browser to compare with the live app at http://localhost:3000.

---

## 🧭 How to Run & Manage the Project

### Daily development (3 steps)

Run these in **three terminals** (or skip API if you only need UI with mocks):

**Terminal 1 — Infrastructure (once per machine session)**

```bash
cd c:\workspace\project1_study_case
docker compose -f infra/docker-compose.yml up -d
```

**Terminal 2 — Backend (for login)**

```bash
cd backend\RealEstateEval.Api
dotnet run
```

**Terminal 3 — Frontend**

```bash
cd c:\workspace\project1_study_case
npm install          # first time only
npm run dev
```

| What | URL |
|------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:5160 |
| RabbitMQ UI | http://localhost:15672 (`dev` / `dev`) |
| Grafana | http://localhost:3001 (`admin` / `admin`) |
| Jaeger | http://localhost:16686 |
| Kibana | http://localhost:5601 |

**Login without API:** screens work with mock data, but `/login` needs the API for JWT. For UI-only work, use session after one successful login or adjust `AppAuthGate` temporarily during design reviews.

**Stop everything:**

```bash
docker compose -f infra/docker-compose.yml down
# Ctrl+C in dotnet and npm terminals
```

### Where to change code

| You want to… | Edit this |
|--------------|-----------|
| Change labels, nav, mock tables | `apps/shell/src/lib/prototype/constants.ts` |
| Change a screen layout | `apps/shell/src/components/views/*View.tsx` |
| Map URL → screen | `apps/shell/src/app/(app)/[page]/page.tsx` |
| Login page | `apps/shell/src/app/login/page.tsx` |
| Sidebar / layout / logout | `apps/shell/src/components/views/AppShell.tsx` |
| Role switcher behavior | `apps/shell/src/contexts/PrototypeContext.tsx` |
| Shared styles / badges | `packages/design-system/` |
| Auth session helpers | `packages/auth-client/` |
| API base URL | `packages/api-client/` + `NEXT_PUBLIC_API_URL` |
| User registration / staff list | `apps/shell/src/lib/users-api.ts` + `components/prototype/registration/` |
| Backend login / users | `backend/RealEstateEval.Api/` |
| Docker / observability | `infra/docker-compose.yml`, `docs/LOCAL_INFRA.md` |

**Add a new menu page (short path):**

1. Add `PageId` in `packages/types/src/navigation.ts`
2. Add nav item + mock data in `constants.ts`
3. Create `YourView.tsx` under `components/views/`
4. Register in `[page]/page.tsx` → `VIEWS` map
5. Add role `pages` array for each role in `ROLES`

### Working with prototypes

1. Open `requirements/system_prototype_4.html` in Chrome/Edge (file:// or Live Server).
2. Compare side-by-side with http://localhost:3000 (same role via sidebar switcher).
3. For new forms, start from `case_study_form 2.html` or `ejada-registration_1.html`, then port HTML/CSS patterns into React + `prototype.css`.
4. Do **not** copy prototype JS business logic blindly — keep mock data in `constants.ts` until APIs exist.

**Reset prototype role:**

```js
localStorage.removeItem('evalPrototypeRole');
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 3000 in use | Stop other `npm run dev` or change port in `apps/shell` |
| Port 5432 in use | Stop local PostgreSQL or change compose port |
| Login fails | Start Docker + `dotnet run`; check `admin@local.dev` / `Admin123!` |
| Elasticsearch OOM | Lower `ES_JAVA_OPTS` in `infra/docker-compose.yml` or give Docker more RAM |
| TypeScript path `@/` errors | Restart TS server; open repo root; see `tsconfig.json` references |
| Added users disappeared | They are in `localStorage` — same browser profile only |
| Grafana empty | Normal until apps export `/metrics` to Prometheus |

More: [docs/LOCAL_INFRA.md](docs/LOCAL_INFRA.md)

---

## 🛤️ How to Deliver the Roadmap

Recommended order while product logic is still under discussion:

```text
Phase 0 (DONE)     Monorepo + all screens + mock data + Docker infra
       ↓
Phase 1 (next)     Agree domain rules with PM → seed @ejadah.dev users → login sets role
       ↓
Phase 2            One real API (e.g. GET /properties) → wire one page → keep mocks elsewhere
       ↓
Phase 3            Split mfe-valuation OR case-study (pick one boundary first)
       ↓
Phase 4            RabbitMQ + Redis when 2+ backend services exist
       ↓
Phase 5            OpenTelemetry + Prometheus + Kibana in app code
       ↓
Phase 6            Module Federation + separate deploys per MFE
```

| Goal | Who | Action |
|------|-----|--------|
| **UI parity** | Frontend | Match `requirements/*.html`; track gaps in GitHub issues |
| **Roles & permissions** | PM + Backend | Finalize role matrix; add JWT claims; remove demo switcher |
| **Case study rules** | PM | Sign off `case_study_form 2.html` fields before API design |
| **Registration** | PM | Decide if `ejada-registration_1.html` is in scope for v1 |
| **Microservices** | Architect | Follow [architecture doc](docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md) phases A–E |
| **Observability** | DevOps | Wire OTel after second service is running |

**Rule of thumb:** do not split microfrontends (F2+) until at least **one** domain API replaces mocks — otherwise you maintain mocks in multiple repos.

---

## 🗺️ Roadmap & Remaining Work

### ✅ Done

- All main UI screens with mock data
- Monorepo F0 (`apps/shell` + `packages/*`)
- Identity API + PostgreSQL + Docker platform stack
- Add-user flow (frontend `localStorage`)

### ⏳ In progress / planned

**Frontend**

- [ ] F1–F5 microfrontends (valuation → case-study → operations → Module Federation)
- [ ] Login per `@ejadah.dev` role; JWT role claims; remove demo role switcher
- [ ] Production security hardening (secrets, HTTPS-only, audit log, rate limits)
- [ ] Wire users API; PO/property detail; case study form (`requirements/case_study_form 2.html`)
- [ ] Registration flow (`requirements/ejada-registration_1.html`) if in scope
- [ ] Replace `MOCK_*` with real APIs

**Backend**

- [ ] API gateway, Case Study, Valuation, Operations services
- [ ] RabbitMQ events, Redis cache, OpenTelemetry → Jaeger, `/metrics` → Prometheus
- [ ] Fluent Bit / Serilog → Elasticsearch → Kibana

**Platform**

- [ ] Cassandra only if high-volume audit requirement emerges

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/DATABASE_OVERVIEW.html](docs/DATABASE_OVERVIEW.html) | **Current PostgreSQL schema** (HTML, PM-friendly) |
| [docs/DATABASE_OVERVIEW.md](docs/DATABASE_OVERVIEW.md) | Same content in Markdown |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Frontend apps, shell, MFE plan |
| [apps/README.md](apps/README.md) | Short pointer to `docs/FRONTEND.md` |
| [docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md](docs/ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md) | Full architecture & phases |
| [docs/LOCAL_INFRA.md](docs/LOCAL_INFRA.md) | Docker services, URLs, troubleshooting |
| [docs/DEMO_ROLE_CREDENTIALS.txt](docs/DEMO_ROLE_CREDENTIALS.txt) | Draft `@ejadah.dev` demo accounts |

---

## 🤝 Contributing

1. Fork or branch from the team repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes with a clear message
4. Run `npm run lint` and `npm run build` (frontend) / `dotnet build` (API)
5. Open a Pull Request for review

Align UI changes with prototypes in `requirements/` and architecture in `docs/`.

---

<div align="center">
  <p>Built for internal real-estate evaluation & case study — Ejada</p>
  <p><strong>نظام إجادة الداخلي</strong> · Study case / prototype phase</p>
</div>
