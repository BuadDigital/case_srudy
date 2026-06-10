# Frontend applications — نظام إجادة الداخلي

The **`apps/`** folder holds the **browser applications** for **نظام إجادة الداخلي** (internal Ejada platform): a case-study and real-estate evaluation workspace. The UI is **Arabic, RTL**, and mirrors flows in [`requirements/`](../requirements/) (HTML prototypes and forms).

The repo uses a **microfrontend-ready monorepo**. Today there is one live app (`apps/shell`); later, domains will split into separate deployable apps that the shell loads.

**See also:** [Project README](../README.md) (security, full stack, how to run everything) · [Architecture](./ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md) · [Local infra](./LOCAL_INFRA.md)

---

## What this project is

The platform supports end-to-end work around **property case study** and **valuation**, including:

| Area | Examples in the app |
|------|---------------------|
| **دراسة الحالة** | أوامر العمل (PO), العقارات, الإسناد, الرفع المساحي, إدارة المفاتيح, إدارة التعذرات |
| **التقييم العقاري** | طلبات التقييم, نموذج المعاين |
| **الإدارة والعمليات** | لوحة التحكم, المراسلة, مؤشرات الأداء, إدارة المستخدمين, التقارير المالية |

Different **roles** (مدير الإدارة, مشرف دراسة الحالة, أخصائي, مقيم, معاين, مالي, …) see different menu items and permissions. Screens are implemented; **business data is still mock** on the frontend while product and backend agree on core logic.

---

## What lives under `apps/`

```text
apps/
  shell/              ← host: login, layout, nav, not-yet-split pages (Next.js 16)
  mfe-case-study/     ← @case-study/mfe — PO + المعاملات النشطة (API-ready)
  mfe-failures/       ← @failures/mfe — إدارة التعذرات (localStorage until API)
  mfe-settings/       ← @settings/mfe — الإعدادات + جميع حقول النظام (API)
  mfe-dashboard/        ← @dashboard/mfe — لوحة التحكم (split from case-study)
  mfe-survey/           ← @survey/mfe — الرفع المساحي (/survey)
  mfe-keys/             ← @keys/mfe — إدارة المفاتيح
  mfe-financial/        ← @financial/mfe — التقارير المالية
  mfe-kpi/              ← @kpi/mfe — مؤشرات الأداء
  (future)
  mfe-valuation/        ← valuation-requests, field-form
```

**Architecture (platform domains — not implemented yet):** [MFE_PLATFORM_DOMAINS.md](./MFE_PLATFORM_DOMAINS.md)

### `shell` (host)

The **shell** is the application users open in the browser:

- **Login** and session (`/login`)
- **Layout**: sidebar, top bar, breadcrumbs, branding
- **All feature pages** under dynamic routes (e.g. `/dashboard`, `/properties`, `/users`)
- **Prototype helpers**: role switcher (demo) in `@platform/app-shared`; case-study libs in MFE packages

Shared UI and auth live in **`packages/`** at the repo root (not inside `apps/`):

| Package | Role |
|---------|------|
| `@platform/app-shared` | PrototypeContext, registration flows, shared nav/constants |
| `@platform/design-system` | Styles (`prototype.css`), badges, shared look-and-feel |
| `@platform/auth-client` | Session storage, auth gate |
| `@platform/api-client` | API base URL (placeholder for real services) |
| `@platform/types` | `PageId`, `RoleId`, navigation types, `CASE_STUDY_READY_NAV` |
| `@case-study/mfe` | API-ready PO + active-transaction views |
| `@failures/mfe` | إدارة التعذرات — repository + localStorage prototype |
| `@settings/mfe` | users, courts, info-roles, system-tools |

Run the shell from the **repository root**:

```bash
npm install
npm run dev
```

→ http://localhost:3000

---

## Microfrontend plan (not finished yet)

**Done:** phase **F0** — monorepo structure, one deploy.  
**Done:** phase **F3** — logical MFE packages; shell hosts routes and layout (single deploy). **Module Federation (F5)** deferred until independent deploy is needed.

| Package | Routes / features |
|---------|-------------------|
| **`@case-study/mfe`** | `/po/*`, `/active-primary-data`, `/bourse-inquiry`, `/active-distribution`, `/active-case-study` |
| **`@failures/mfe`** | `/failures`, PO property failure form — **localStorage** until backend exists |
| **`@settings/mfe`** | `/users`, `/courts`, `/case-study-info-roles`, `/system-tools` |

**Still in shell:** evaluator, messages, valuation-requests, field-form, and mock views until F4 move.

**Planned platform MFEs (architecture only — see [MFE_PLATFORM_DOMAINS.md](./MFE_PLATFORM_DOMAINS.md)):**

| Package | Route | Notes |
|---------|-------|-------|
| **`@dashboard/mfe`** | `/dashboard` | Move **out of** `@case-study/mfe`; PO stats via `api-client`, not case-study |
| **`@survey/mfe`** | `/survey` | Office-level survey admin — **not** `/active-survey` (party queue stays in case-study) |
| **`@keys/mfe`** | `/keys` | Key custody — separate from government-review in case-study |
| **`@financial/mfe`** | `/financial` | Financial reports |
| **`@kpi/mfe`** | `/kpi` | Performance indicators |

**Still to split later:**

| Future app | Routes / features |
|------------|-------------------|
| **mfe-valuation** | valuation-requests, field-form |
| **mfe-messages** (or platform) | messages |

The shell remains the **host** (login, nav). Separate deploy URLs come in phase F5.

---

## What is not in `apps/`

| Location | Purpose |
|----------|---------|
| `backend/` | ASP.NET API (Identity/JWT today; domain APIs later) |
| `infra/` | Docker Compose — databases, messaging, cache, observability |
| `requirements/` | Reference HTML — not runnable apps |
| `docs/` | Architecture, local infra, demo credentials, this guide |

---

## Platform stack (infra + backend — not inside `apps/`)

The **shell and future MFEs** talk to APIs; the **platform services** below run in Docker for local dev. Config: [`infra/docker-compose.yml`](../infra/docker-compose.yml). URLs: [LOCAL_INFRA.md](./LOCAL_INFRA.md).

```bash
# From repository root
docker compose -f infra/docker-compose.yml up -d
```

### At a glance

| Technology | Role in this project | In local Docker? | Wired in app code yet? |
|------------|----------------------|------------------|-------------------------|
| **PostgreSQL** | System of record (Identity today; per-service DBs later) | Yes (`5432`) | Yes — API uses it |
| **RabbitMQ** | Async events between microservices | Yes (`5672`, UI `15672`) | No — planned Phase B+ |
| **Redis** | Cache, locks, rate limits, hot dashboard reads | Yes (`6379`) | No — planned Phase A–B |
| **Prometheus** | Metrics (latency, errors, queue depth) | Yes (`9090`) | No — scrape targets TBD |
| **Grafana** | Dashboards on Prometheus (+ Jaeger) | Yes (`3001`) | Provisioned; empty until apps export metrics |
| **Jaeger** | Distributed tracing | Yes (UI `16686`, OTLP `4317`/`4318`) | No — OpenTelemetry not in apps yet |
| **Elasticsearch** | Log and search index store | Yes (`9200`) | No — via Fluent Bit |
| **Kibana** | Explore logs in Elasticsearch | Yes (`5601`) | Index pattern `fluentbit-*` |
| **Fluent Bit** | Log collector (Fluentd family) | Yes (`ree-fluent-bit`) | Sample → ES |
| **Fluentd** | Heavier log router (same family) | Not in compose | Use Fluent Bit locally |
| **Cassandra** | Massive append-only store | **No** | **Deferred** — Postgres for MVP |

### How they fit together

```text
Browser (shell / MFEs)
    → API Gateway / BFF (planned)
        → Microservices (.NET)
            → PostgreSQL (each service)
            → Redis (cache)
            → RabbitMQ (events)

Observability (planned):
    Services → OpenTelemetry → Jaeger + Prometheus
    Services → logs → Fluent Bit → Elasticsearch → Kibana
    Grafana ← Prometheus
```

Details: [ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md](./ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md) section 6.1.

---

## Remaining work (frontend)

- [ ] Per-role login (`@ejadah.dev` users) — role from server, not only the sidebar switcher
- [x] Create `mfe-case-study` + `@platform/app-shared` for API-ready flows (PO + primary data + bourse + distribution) — F3 complete (single deploy)
- [ ] Create remaining `mfe-*` apps and move mock-only routes (F2, F4)
- [ ] Module Federation + CI deploy per app (F5)
- [ ] Replace mock data with `@platform/api-client` calls
- [ ] PO/property detail; case study form (`requirements/case_study_form 2.html`); registration (`requirements/ejada-registration_1.html`) if in scope

Full checklist: [README.md](../README.md) · Architecture: [ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md](./ARCHITECTURE_MICROFRONTENDS_AND_MICROSERVICES.md)
