# Getting started

Goal: API running, mobile app talking to it, one test passing — inside an hour.

Read `ARCHITECTURE.md` first if you haven't. Section 5 (authorization) is the part
you must not get wrong.

---

## 1. Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.12 | `uv python install 3.12` |
| uv | latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Node | 22 LTS | fnm or nvm |
| pnpm | 9 | `corepack enable && corepack prepare pnpm@latest --activate` |
| Docker | any recent | for Postgres locally |
| Expo Go / dev client | latest | on your Android phone |

You do not need the Heroku CLI on day one. Install it when you first deploy.

---

## 2. Setup

```bash
git clone git@github.com:<org>/femtech-app.git
cd femtech-app

# Python side
cd apps/api
uv sync                      # creates .venv from uv.lock
cp .env.example .env.local   # then fill it in, see section 3

# JS side, from repo root
cd ../..
pnpm install
```

Start Postgres and Redis:

```bash
docker compose -f infra/compose.dev.yml up -d
```

That container has `pgvector` preinstalled. Plain `postgres:16` will not work — the
first migration will fail on `CREATE EXTENSION vector`.

Migrate and create yourself a superuser:

```bash
cd apps/api
uv run manage.py migrate
uv run manage.py createsuperuser
uv run manage.py seed_dev          # demo users, a few cycles, a pregnancy
```

Run it:

```bash
uv run manage.py runserver 0.0.0.0:8000
```

Check `http://localhost:8000/api/docs` for the generated OpenAPI page and
`http://localhost:8000/admin` for Django admin.

Background worker, in a second terminal:

```bash
uv run celery -A config worker -l info
```

---

## 3. Environment variables

`.env.local` — never commit it. Ask in the team chat for values marked **shared**.

```
DEBUG=1
SECRET_KEY=<anything for local>
DATABASE_URL=postgres://postgres:postgres@localhost:5432/femtech
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1,<your-LAN-IP>

LLM_API_KEY=              # shared — dev key, low rate limit, do not use in scripts
EMBEDDING_MODEL=
R2_ACCOUNT_ID=            # shared
R2_ACCESS_KEY_ID=         # shared
R2_SECRET_ACCESS_KEY=     # shared
R2_BUCKET=femtech-dev

REVENUECAT_WEBHOOK_SECRET=  # only if you're working on billing
POLAR_WEBHOOK_SECRET=
```

Rotate the LLM key separately from everything else if it ever leaks. It is the one
credential with a direct running cost attached.

---

## 4. Mobile app

```bash
cd apps/mobile
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000
pnpm start
```

Use your machine's LAN IP, not `localhost` — the phone can't reach your loopback. Add
that IP to `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in the API too. This costs
everyone an afternoon exactly once; now you know.

Expo Go works for most screens. You need a dev build (`eas build --profile
development`) for Google sign-in, push notifications, and in-app purchases.

### Regenerating the API client

Any time you change an endpoint or schema:

```bash
pnpm --filter api-client generate
```

This reads the API's OpenAPI schema and rewrites `packages/api-client`. Commit the
generated output — CI checks it is current and fails the PR if you forgot.

---

## 5. Common tasks

**Add a model and endpoint**

1. Model in the right app, inheriting `common.models.OwnedModel` if it belongs to a
   user (gives you `user` FK + `OwnedQuerySet`).
2. `uv run manage.py makemigrations <app>` — review the generated file, don't just
   commit it.
3. Serializer + viewset in `<app>/{serializers,views}.py` using DRF. Always filter
   through `.for_user(request.user)` — never `.objects.all()`.
   If the model holds health data, add the RLS policy in the same migration.
4. Register the route in `tests/test_cross_user_access.py`, and add the resource to
   `RESOURCES` in `tests/e2e/test_isolation.py` so the cross-user check also runs
   over real HTTP.
5. `pnpm --filter api-client generate`.

**Ingest clinical guidelines**

```bash
uv run manage.py ingest_guidelines --source who --path ./corpus/who/
```

Chunks, embeds, and stores with source metadata. Run it locally against the staging
database, not in a request cycle. Costs real money per run — check with the other dev
before re-ingesting the whole corpus.

**Run the tests**

```bash
uv run pytest                          # everything, e2e included
uv run pytest tests/test_cross_user_access.py -v   # the one that matters
uv run pytest tests/e2e -v             # boots the real ASGI server, drives it over HTTP
uv run pytest -m "not e2e"             # skip the e2e suite while iterating
uv run ruff check . && uv run mypy .
```

The e2e suite needs nothing running beforehand: it starts uvicorn on a free port
against the pytest database and talks to it with `httpx`. It never touches the ORM.

Install the pre-commit hooks once: `uv run pre-commit install`.

---

## 6. Rules that are not style preferences

These exist because this app stores menstrual, pregnancy, and mental health data about
real people.

1. **Never `.objects.all()` or bare `.objects.filter()` in a view.** Always
   `.for_user()`. CI lints for this.
2. **404, not 403,** for another user's object.
3. **No `fields = "__all__"`** on any serializer touching health data.
4. **Never log or send health data to analytics.** Event names and counts only —
   never symptoms, screening scores, or cycle data. PostHog is configured to drop
   these fields, but don't rely on that.
5. **The assistant never answers from model knowledge.** If retrieval comes back
   empty, it refuses. Do not add a "helpful fallback."
6. **Nothing user-facing about dosages, diagnoses, or treatment decisions.** Every AI
   response carries the disclaimer.
7. **Migrations on a database with real user data are one-way.** Never `--fake` your
   way out of a mess. Ask first.
8. **The EPDS self-harm item has an escalation flow.** Don't modify `screening/`
   scoring or result screens without flagging it for review.

---

## 7. Working agreements

- Branches: `feat/`, `fix/`, `chore/` + short description.
- PRs to `main`, one review before merge. Small PRs — we are two people, not a
  release train.
- Migrations in their own PR when they're risky.
- Anything that changes the authorization model gets an explicit callout in the PR
  description, not just a diff.
- Architectural changes get an ADR in `docs/adr/`. Two paragraphs is enough.

---

## 8. Troubleshooting

| Symptom | Cause |
|---|---|
| `type "vector" does not exist` | Wrong Postgres image — use the compose file, not your system Postgres |
| Phone can't reach the API | Using `localhost` instead of LAN IP, or IP missing from `ALLOWED_HOSTS` |
| `DisallowedHost` in the log | Same thing, add the IP |
| API client types out of date | You forgot `pnpm --filter api-client generate` |
| Jobs never run | The Celery worker isn't running in a second terminal |
| Query returns zero rows in a shell | RLS is on and `app.user_id` isn't set — use the bypass context manager |
| Chat times out on Heroku staging | Streaming is disabled there by design; it must fall back to the job path |
| Migration conflict after a rebase | `uv run manage.py makemigrations --merge`, then read what it produced |
| e2e tests fail with `server exited during boot` | The message names the server log; usually an import or settings error, run `uv run manage.py check` |

---

## 9. Deploying

**Staging (Heroku)** deploys from `main` automatically.

```bash
heroku git:remote -a femtech-staging
git push heroku main
heroku logs --tail -a femtech-staging
heroku config:set KEY=value -a femtech-staging
```

Migrations run in the release phase. A failed release rolls back and the old dyno keeps
serving, which is what we want.

**Production (Hetzner)** is manual and deliberate.

```bash
ssh deploy@<host>
cd /srv/femtech && git pull
docker compose -f infra/compose.prod.yml build api
docker compose -f infra/compose.prod.yml run --rm api python manage.py migrate
docker compose -f infra/compose.prod.yml up -d
```

Check the nightly backup ran before any migration that drops or alters a column:
`ls -la /srv/backups/` or the R2 bucket. If it didn't, run `infra/backup/dump.sh`
by hand first.

Never put a secret in the repo, an Expo `EXPO_PUBLIC_` variable, or a screenshot.
