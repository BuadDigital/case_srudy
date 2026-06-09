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
  shell/              ← host: login, layout, nav, not-ready pages (Next.js 16)
  mfe-case-study/     ← logical MFE package (@case-study/mfe) — API-ready flows
  (future)
  mfe-valuation/
  mfe-operations/
  mfe-financial/
  mfe-platform/
```

### `shell` (host)

The **shell** is the application users open in the browser:

- **Login** and session (`/login`)
- **Layout**: sidebar, top bar, breadcrumbs, branding
- **All feature pages** under dynamic routes (e.g. `/dashboard`, `/properties`, `/users`)
- **Prototype helpers**: role switcher (demo), mock lists in `shell/src/lib/prototype/`

Shared UI and auth live in **`packages/`** at the repo root (not inside `apps/`):

| Package | Role |
|---------|------|
| `@platform/app-shared` | PrototypeContext, registration flows, shared nav/constants |
| `@platform/design-system` | Styles (`prototype.css`), badges, shared look-and-feel |
| `@platform/auth-client` | Session storage, auth gate |
| `@platform/api-client` | API base URL (placeholder for real services) |
| `@platform/types` | `PageId`, `RoleId`, navigation types, `CASE_STUDY_READY_NAV` |
| `@case-study/mfe` | API-ready PO + active-transaction views (imported by shell routes) |

Run the shell from the **repository root**:

```bash
npm install
npm run dev
```

→ http://localhost:3000

---

## Microfrontend plan (not finished yet)

**Done:** phase **F0** — monorepo structure, one deploy.  
**Done:** phase **F3** — `@case-study/mfe` owns the **API-ready** case-study path (PO + المعاملات النشطة ready tabs). Shared host UI lives in `@platform/app-shared`. Shell still hosts routes and layout (single deploy). **Module Federation (F5)** deferred until you need independent deploys.

| Package | Routes / features moved out of `shell` |
|---------|--------------------------------------|
| **`@case-study/mfe`** | `/po/*`, `/active-primary-data`, `/bourse-inquiry`, `/active-distribution` |

**Still to do:** split remaining domains and enable independent deploys:

| Future app | Routes / features |
|------------|-------------------|
| **mfe-valuation** | valuation-requests, field-form |
| **mfe-operations** | survey, keys |
| **mfe-financial** | financial |
| **mfe-platform** | users, messages, kpi |

The shell will remain the **host** (login, nav, loading remotes). **Module Federation** and separate deploy URLs come in a later phase (F5). Until then, do not expect extra folders under `apps/` beyond `shell`.

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
