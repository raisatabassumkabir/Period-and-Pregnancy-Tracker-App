# Architecture

Reproductive health and pregnancy tracker. Django API, Expo client, one repo.
Production on Hetzner, staging on Heroku credits.

**Status:** pre-alpha. Nothing here is load-bearing yet — challenge anything that looks wrong.

---

## 1. Context and goals

A cycle-tracking and pregnancy companion app with an AI assistant grounded in
clinical guidelines. Android first via Google Play, web later, iOS after that.

What the architecture has to support:

- **Sensitive health data** — cycles, symptoms, pregnancy, postpartum depression
  screening scores. Access control is the highest-priority correctness property in
  this codebase. Losing user trust here is not recoverable.
- **Retrieval-augmented AI** — answers come from retrieved WHO/ACOG text, never from
  model memory.
- **Partner sharing** — a second user sees a deliberately narrow slice.
- **Two people building it**, part time, on a budget near zero.

Non-goals for v1: HIPAA compliance, multi-region, offline-first sync, microservices.

---

## 2. Hosting: why Hetzner is production

We hold $13/month in Heroku credits for two years. The instinct is to run production
there, but two Heroku constraints shape the whole design badly:

- **30-second router timeout** — forces every LLM call onto an async job + poll path,
  no streaming.
- **No budget for Redis** — $3 add-on plus a $7 worker dyno puts us at $22, over the
  credit.

A hybrid that splits workers onto Hetzner while the database stays on Heroku is worse
than either option: the worker's hot path (fetch chat, embed, vector search returning
kilobytes of chunk text, write messages) becomes dozens of cross-internet round trips
at 25–30ms each. **Postgres and the code that talks to it live in the same
datacenter.** That rule is not negotiable.

So we flip it:

| | Production | Staging |
|---|---|---|
| Host | Hetzner CX22 or similar, Falkenstein | Heroku, paid by credits |
| Cost | €5–10/month | $13/month in credits |
| Stack | Caddy, Gunicorn/Uvicorn, Postgres 16 + pgvector, Redis, Celery | Eco dyno $5 + Postgres Essential-0 $5 + Key-Value Mini $3 |

What this buys:

- **No request timeout** — SSE streaming for the assistant becomes possible. We keep
  the Celery job path anyway for retries and push, but the response can stream.
- **Redis is free** — real Celery, plus caching and rate limiting in memory.
- **No 20-connection ceiling** — Gunicorn workers can actually scale.
- **EU data residency**, which for an app storing cycle and mental health data is a
  trust and GDPR story, not just an ops detail.

Heroku earns its keep as a genuinely useful always-on staging environment with a
managed database and automated backups — worth more to two developers with no budget
than a second production box would be. Guideline ingestion (batch, latency-tolerant)
runs there too, burning dyno hours instead of production CPU.

**Portability rule:** no host-specific APIs in application code. Everything through
`DATABASE_URL`, `REDIS_URL`, env vars, and S3-compatible storage. Moving hosts should
be a config change.

---

## 3. Repo layout

Polyglot monorepo. JavaScript side uses pnpm workspaces; Python side is a single
`uv`-managed project. They do not share a package manager and do not need to.

```
femtech-app/
├── apps/
│   ├── api/                  # from efazulkarim/django-backend-boilerplate
│   │   ├── config/           # settings/{base,dev,prod,test}.py, celery.py, asgi.py
│   │   ├── apps/
│   │   │   ├── core/         # base models, middleware, pagination, exceptions
│   │   │   ├── users/        # email-based User, auth
│   │   │   ├── cycles/       # cycles, daily logs, predictions
│   │   │   ├── pregnancy/    # pregnancies, kicks, contractions, measurements
│   │   │   ├── nutrition/    # meal plans
│   │   │   ├── assistant/    # RAG: chunks, retrieval, chat, red-flag screening
│   │   │   ├── screening/    # EPDS and other instruments
│   │   │   ├── sharing/      # partner links, shared status
│   │   │   ├── billing/      # entitlements, RevenueCat + Polar webhooks
│   │   │   └── telehealth/   # providers, slots, appointments
│   │   ├── tests/
│   │   └── nginx/            # replaced by Caddy, see §4
│   └── mobile/               # Expo, forked from chohra-med/expo_boilerplate
│       └── src/features/     # feature-first, mirrors the Django apps
├── packages/
│   ├── api-client/           # TS client generated from drf-spectacular schema
│   └── shared/               # constants only: trimester ranges, symptom taxonomy
├── infra/
│   ├── compose.dev.yml       # local Postgres + Redis
│   ├── compose.prod.yml      # Hetzner stack
│   ├── Caddyfile
│   └── backup/               # pg_dump → R2 cron
├── docs/{ARCHITECTURE,ONBOARDING}.md, adr/
└── .github/workflows/
```

`packages/shared` holds constants only — no logic, no clinical rules. Anything clinical
lives in the API so there is one place to fix it.

---

## 4. Backend base: django-backend-boilerplate

We adopt the boilerplate rather than starting from `django-admin startproject`.

**Kept as-is:** Django 6.0 + DRF, drf-spectacular for OpenAPI, split settings,
structured JSON logging with request-ID correlation across HTTP and Celery, Sentry,
health checks that verify DB / cache / broker, Prometheus at `/metrics`,
`TimestampedModel`, pytest + factories, the CI workflow, and the `.claude/` rules,
skills and hooks (ruff/mypy on write, secret guard, pytest smoke).

**Changes on adoption — do these in the first PR:**

| Change | Why |
|---|---|
| allauth session auth → **JWT** (`dj-rest-auth` + `simplejwt`, or allauth headless) | A mobile client can't use session cookies. Access ~15min, rotating refresh in `expo-secure-store`. |
| **Remove Temporal** (`temporal_app/`, `temporalio`) | Durable workflows are overkill for two devs. Celery covers everything we have. |
| Celery broker **RabbitMQ → Redis** | One less service on a 4 GB box. Redis is already there for cache. |
| **Restrict `SoftDeleteModel`** | Soft delete on health tables breaks "delete my data". Use it for providers and checklists; clinical tables get real deletes. |
| **Keep Channels, but SSE first** | Streaming the assistant over SSE needs no channel layer. Revisit websockets only if something genuinely needs bidirectional. |
| nginx → **Caddy** | Automatic TLS renewal. The boilerplate's `nginx/prod.conf` is a reference for headers. |
| **Add** `pgvector` + `django-storages[s3]` + `django-ratelimit` | Not in the boilerplate; all required. |

DRF, not django-ninja — that's what the boilerplate ships and it is not worth
rewriting. Schemas are DRF serializers; the OpenAPI document comes from
drf-spectacular and feeds `packages/api-client`.

---

## 5. Request flow

```
Expo app
  │  HTTPS, JWT bearer
  ▼
Caddy (auto TLS, Hetzner)
  │
  ▼
Gunicorn/Uvicorn → Django + DRF     ──► Postgres 16 + pgvector  (same host)
  │                                 ──► Redis (cache, rate limit, broker)
  │                                 ──► R2 (media)
  │  enqueue / stream
  ▼
Celery worker + beat                ──► LLM provider (embeddings, chat)
                                    ──► Expo Push
                                    ◄── RevenueCat / Polar webhooks
```

---

## 6. Authorization: defence in depth

Two layers. Django is the primary control; Postgres RLS is the backstop that catches
a forgotten filter.

### Layer 1 — application

1. Every user-owned model exposes `objects.for_user(user)` via `OwnedQuerySet` in
   `apps/core`. **Views never call `.objects.all()` or bare `.objects.filter()`.**
   A lint rule in CI enforces this.
2. Requesting another user's object returns **404, not 403**. Do not leak existence.
3. `tests/test_cross_user_access.py` walks every registered user-scoped route,
   authenticates as user B, requests user A's object, and asserts 404. New endpoints
   are registered there or CI fails. This is the most important test in the repo.
   `tests/e2e/` repeats the cross-user checks over real HTTP against the ASGI
   server under a non-superuser database role, so both layers are exercised end
   to end.
4. Serializers are explicit allowlists. No `fields = "__all__"` on anything holding
   health data.

### Layer 2 — Postgres RLS

RLS is a Postgres feature, not a Supabase one. Middleware sets a transaction-local
variable; policies read it.

```python
# apps/core/middleware.py
class RLSMiddleware:
    def __call__(self, request):
        with transaction.atomic():
            uid = getattr(request.user, "id", None)
            with connection.cursor() as c:
                c.execute("SELECT set_config('app.user_id', %s, true)",
                          [str(uid) if uid else ""])
            return self.get_response(request)
```

```sql
ALTER TABLE cycles_dailylog ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles_dailylog FORCE  ROW LEVEL SECURITY;

CREATE POLICY owner ON cycles_dailylog
  USING      (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);
```

Unset variable → NULL comparison → zero rows. Deny by default: a forgotten middleware
breaks the request instead of leaking.

Four things that will bite you:

- **`FORCE` is mandatory.** Table owners bypass RLS, and our Django role owns the
  tables. Without `FORCE`, the policies silently do nothing.
- **Transaction-local `set_config(..., true)` only.** Session-level `SET` persists onto
  the next request reusing that pooled connection — one user's id handed to another
  user's request, a worse bug than the one being prevented.
- **Escape hatch for migrations, admin, and Celery.** A second policy
  `USING (current_setting('app.bypass', true) = 'on')` plus a context manager enabled
  only in management commands, the worker, and Django admin.
- **Scope it.** Apply to health tables only — `daily_logs`, `cycles`, `pregnancies`,
  `screenings`, `ai_messages`. Not `providers`, `slots`, or `kb_chunks`; they aren't
  user-owned and policies there are pure overhead.

RLS catches the forgotten filter. It does not catch an over-broad serializer or a
partner endpoint reading the wrong table. Both layers stay.

### Partner sharing

Partners never get a policy path to health tables. `sharing.SharedStatus` holds only
the derived, shareable view — pregnancy week, cycle phase, a support suggestion — kept
current by a signal on the source models. The partner endpoint reads that model and
nothing else. Links are revocable in one call, effective immediately.

If you find yourself adding a field to `SharedStatus` that reveals symptoms, mood, or
screening results, stop and raise it first.

---

## 7. Data model

| App | Models |
|---|---|
| users | `User` (email login), `Profile` (mode, locale, region, budget tier) |
| cycles | `Cycle`, `DailyLog` (unique per user/date), `Prediction` |
| pregnancy | `Pregnancy`, `KickSession` + `Kick`, `ContractionSession` + `Contraction`, `Measurement`, `Checklist` + `ChecklistItem` |
| nutrition | `MealPlan`, `MealPlanItem` |
| assistant | `KBDocument`, `KBChunk` (embedding `vector(1536)`), `Chat`, `Message`, `DailyUsage` |
| screening | `Screening` (instrument, item scores, total, flagged) |
| sharing | `PartnerLink`, `SharedStatus` |
| billing | `Entitlement`, `WebhookEvent` (idempotency) |
| telehealth | `Provider`, `Slot`, `Appointment` |

- `Measurement` is deliberately generic — blood pressure and glucose are coming.
- `DailyLog.symptoms` is JSONB against the taxonomy in `packages/shared`. Structured
  columns for anything we query or chart.
- `Slot` gets an exclusion constraint on `(provider, tstzrange)` so double-booking is
  impossible at the database level.
- Clinical tables do **not** inherit `SoftDeleteModel`.

---

## 8. AI assistant

Order of operations in `assistant/services.py`. Do not reorder.

1. **Red-flag screen** — deterministic patterns for emergencies (heavy bleeding,
   severe headache with vision changes, reduced fetal movement). On a hit, return the
   fixed escalation response and **never call the model**.
2. **Quota check** against `DailyUsage` — 3/day free tier, server-side only.
3. **Retrieve** — embed the query, nearest-neighbour over `KBChunk` with a cosine
   distance threshold.
4. **Refuse on empty** — "I don't have guidance on that, please ask your doctor." No
   fallback to model knowledge, ever.
5. **Generate constrained** — retrieved text only; system prompt forbids dosages,
   diagnoses, and any claim not in the context.
6. **Return with citations** (org, document version, URL) and the disclaimer.

Delivery: SSE stream from an async Django view, with the Celery job as the durable
record so a dropped connection doesn't lose the answer. On Heroku staging the stream
path is disabled — it falls back to job + poll, which keeps that environment honest
about the async path still working.

Ingestion is a management command (`manage.py ingest_guidelines`), run deliberately
against staging, never at request time. The source manifest is committed so we can tell
which guideline version produced a given answer.

### Screening safety

The EPDS includes an item about self-harm. A positive response triggers the escalation
flow — local crisis resources and a clear prompt to contact a clinician — not just a
number on a results screen. Clinician review before this ships. Not ordinary product
work.

---

## 9. Mobile client

Forked from `chohra-med/expo_boilerplate` (Expo SDK 55, RN 0.83, React 19, New
Architecture). We keep the feature-first `src/features/*` layout, Restyle theming,
i18next, expo-secure-store, MMKV, Reanimated, FlashList, RevenueCat, and the store
screenshot scripts.

**Stripped on fork — first PR, before any feature work:**

- **Wire AI** (`@wireai/activation`, `wireai-rn`) — threaded through onboarding, home,
  paywall funnel, coachmarks, permission screens and analytics, roughly 20 files. It's
  a third-party growth SDK sitting in exactly the flows we need to control.
- **Firebase Analytics + Crashlytics** — screen-level analytics over cycle and mental
  health screens is the liability we least want. Sentry for crashes, PostHog for
  product events with health fields excluded.

Open decisions: React Navigation v6 (as shipped) vs Expo Router, and whether Redux
Toolkit earns its place over a server-state library given how API-driven this app is.
Both fine to defer; neither blocks feature work.

Local health data at rest goes in encrypted MMKV, never plain AsyncStorage.

---

## 10. Billing

`Entitlement` is the single source of truth. RevenueCat (Play Billing) and Polar (web,
cards) both POST to webhook endpoints that verify signatures, deduplicate via
`WebhookEvent`, and upsert. The client reads entitlement state from our API and never
inspects a receipt. Feature gates check `tier`, never store state.

---

## 11. Operations

Owning the box is the price of Hetzner. Make it boring on day one.

- **Backups** — nightly `pg_dump` to R2, 30-day retention, in `infra/backup/`. Monthly
  restore drill into a scratch container. An untested backup is not a backup.
- **Monitoring** — Sentry for errors, Uptime Kuma or Better Stack pinging `/health/`
  (the boilerplate's health check already verifies DB, cache and broker).
- **Metrics** — `/metrics` is already exposed; scrape it when there's reason to.
- **Migrations** — never `--fake` your way out of a problem on a database holding real
  user cycles.
- **Secrets** — env file outside the repo. Rotate the LLM key independently.
- Single box means single point of failure. Acceptable pre-revenue. Move Postgres to
  managed hosting before scaling anything else.

---

## 12. Key decisions

| Decision | Why | Trade-off accepted |
|---|---|---|
| Django over a BaaS | Vector search, relational queries and scoped sharing in one place; admin manages providers and corpus free | We own auth and permissions, and their bugs |
| Postgres + pgvector over a separate vector DB | One database to back up and reason about | Lower performance ceiling; fine at our corpus size |
| Hetzner production, Heroku staging | Removes the 30s timeout and the Redis budget problem; EU residency; credits still fully used | Backups, patching and uptime are ours |
| RLS as a second layer | Catches the forgotten filter that application code misses | Migration complexity, an escape hatch to maintain |
| Adopt the Django boilerplate | Logging, health checks, CI, test setup and Claude rules already done | Inherits choices we must actively strip (Temporal, RabbitMQ, session auth) |
| Fork the Expo boilerplate rather than use it | Feature-first structure and theming are worth having | A day of removal work before feature one |
| SSE streaming with a job record | Better perceived latency without losing durability | Two code paths to keep working |
| Monorepo | Generated client stays in sync with the API | Polyglot tooling, slightly awkward |

Anything overturned here gets an ADR in `docs/adr/`.

---

## 13. Open questions

- Cycle prediction stays rule-based with an explicit confidence interval until we have
  enough logged cycles for a model to beat the average. Do not start with ML.
- Payment rails beyond Play Billing and Polar are undecided.
- Telehealth is last. It needs providers on the platform, which is a business problem
  before it is an engineering one.
