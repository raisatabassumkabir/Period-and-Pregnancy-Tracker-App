# Happy Women: Phase 1 Release Checklist

**Document Version:** 2.0.0
**Date:** October 25, 2026
**Branch:** `release/v1-readiness`
**Release Decision:** **NOT READY FOR PRODUCTION.** The code blockers from the production-readiness audit are fixed on this branch. The deploy, store and legal steps in §5 still have to be done by the owner before closed testing.

> Version 1.0.0 of this document (October 12) reported the paywall as truthful, local deletion as complete, and the release as ready for internal testing. The audit found the first two untrue and missed prod-only bugs. This version records only what was re-verified on October 25.

---

## 1. Scope of v1

| Area            | v1 decision                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monetization    | **Free.** `FEATURES.monetization = false`: RevenueCat is not configured; paywall entry points, plan pill and premium badge are hidden. No subscription products may be active in Play Console. |
| AI assistant    | **Hidden.** Tab removed, screen redirects home, backend stub endpoint deleted.                                                                                                                 |
| Crash reporting | Sentry on backend and mobile; no request bodies, screenshots, replay, console or touch breadcrumbs.                                                                                            |
| Analytics       | None. Amplitude stays off (empty key); Session Replay removed.                                                                                                                                 |
| Password reset  | Email link (Resend) → page on the API domain → all sessions revoked.                                                                                                                           |

---

## 2. Automated verification (October 25, 2026)

| Check                        | Result                                                                                          | Command                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Mobile Jest                  | **PASS**: 52 suites, 319 tests                                                                  | `pnpm --filter mobile test --forceExit`                                |
| Mobile type-check            | **PASS**: 0 errors                                                                              | `pnpm --filter mobile type-check` (now regenerates typed routes first) |
| Mobile ESLint                | **PASS**: 0 errors, 8 warnings (pre-existing)                                                   | `pnpm --filter mobile lint`                                            |
| Contract type-check          | **PASS**                                                                                        | `pnpm --filter @repo/api-contract type-check`                          |
| Backend pytest               | **PASS**: 104 tests, RLS tests **not** skipped (non-superuser role)                             | `uv run pytest` against a local `pgvector/pgvector:pg16` container     |
| Backend ruff                 | **PASS**                                                                                        | `uv run ruff check .`                                                  |
| Owned-queryset lint (RULE 1) | **PASS**                                                                                        | `uv run python scripts/lint_owned_queries.py`                          |
| Django deploy check          | **PASS**, expected warnings only (`SECURE_SSL_REDIRECT` left to Traefik; HSTS preload optional) | `manage.py check --deploy` with prod settings                          |
| Prod compose                 | **VALID**; fails fast on missing required vars                                                  | `docker compose -f docker-compose.prod.yml config`                     |
| Backup → restore drill       | **PASS**: rows, ownership, 10 RLS policies restored; app role sees 0 rows without context       | `infra/backup` image against the local container                       |
| Expo config                  | **PASS** with the Sentry plugin                                                                 | `npx expo config --type prebuild`                                      |
| CI                           | `api-ci.yml` (backend) and new `mobile-ci.yml` (lint, type-check, contract, Jest)               | GitHub Actions                                                         |

Not verified here: an EAS cloud build, a device run of the release build, and anything on the VPS (§5).

---

## 3. Audit blockers: status

| Audit finding                                                  | Status                                                                                                            | Commit               |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------- |
| Logout every 15 min in prod (`/api//auth/token/refresh/`)      | **Fixed.** Refresh URL joined by axios, first 401-refresh tests added                                             | `f3aebdb`            |
| AI assistant never reaches backend; backend is a stub          | **Resolved by scope.** Assistant hidden, stub removed                                                             | `e66fd57`, `7378869` |
| Paywall sells features nothing gates                           | **Resolved by scope.** v1 free, every entry point hidden                                                          | `e66fd57`            |
| RevenueCat webhook enqueued inside the uncommitted transaction | **Fixed.** `transaction.on_commit`, task retries a missing row                                                    | `7378869`            |
| API served over plain HTTP on the public IP                    | **Fixed.** Published port removed; HTTP→HTTPS redirect router                                                     | `f675e52`            |
| No rate limiting                                               | **Fixed.** Anon/user + scoped auth throttles, `NUM_PROXIES` for Traefik                                           | `7378869`            |
| 500s not logged; no crash reporting                            | **Fixed.** Console `LOGGING`, Sentry backend + mobile                                                             | `7378869`, `e66fd57` |
| No database backups                                            | **Fixed in code.** Encrypted (age) nightly dumps to R2, restore runbook. Owner must provision R2 and the key (§5) | `f675e52`            |
| RevenueCat secrets never reach containers                      | **Fixed.** Shared env anchor for api + worker                                                                     | `f675e52`            |
| No password reset                                              | **Fixed.**                                                                                                        | `3099253`            |
| EAS project not set up                                         | **Open: owner action** (§5)                                                                                       | —                    |
| Amplitude Session Replay records health screens                | **Fixed.** Removed                                                                                                | `e66fd57`            |
| Privacy / terms / web account-deletion pages not hosted        | **Fixed in code.** Served at `/legal/...`; text needs owner review                                                | `6498547`            |
| Store declarations, service account, 20 testers × 14 days      | **Open: owner action.** Answers drafted in `docs/PLAY_CONSOLE_DECLARATIONS.md`                                    | —                    |
| Medical disclaimers pending                                    | **Fixed.** First-run acknowledgement gate, Settings item, due-date dating notice                                  | `e66fd57`            |

**Also fixed (should-fix list and findings made while fixing):**

- ASGI + persistent connections → threaded WSGI, DB health checks (`7378869`).
- Health check on `/api/schema/` → `/health/`; schema/docs off in prod; admin path from `ADMIN_URL` (`7378869`, `f675e52`).
- Errors now RFC 9457 Problem+JSON everywhere. A handled 500 now rolls back the request transaction instead of committing half a write (`7378869`).
- `MeView` no longer swallows every exception (`7378869`).
- Validation errors echoed submitted medical-condition codes → removed (`7378869`).
- Celery beat removed; worker health check added; client timeout 15s > server's 5s upstream (`f3aebdb`, `7378869`, `f675e52`).
- Dokploy routing: labels only; the Domains UI step was removed from the docs (`f675e52`).
- Stale `apps/backend` removed; tooling and docs point at `apps/api`; the ruff hook now actually lints the API (`9049040`).
- **Account deletion left health data on the phone** (MMKV store: local daily logs, kick counts, discharge logs, medical profile). Now wiped (`676d1e7`).
- A cycles test that never ran (wrong filename) used `force_authenticate`, bypassing RLS; rewritten with a real JWT (`9049040`).

---

## 4. Account deletion & local data (re-verified)

`apps/mobile/src/components/settings/delete-account-item.tsx`:

1. Native confirmation alert.
2. `DELETE me` runs **first**. On failure, nothing local is touched and the user stays signed in.
3. On success, **both** on-device stores are wiped: the AES-256-GCM health store (`EncryptedHealthStorage.purgeAllHealthData`, which also deletes keystore keys) **and** the MMKV preference store. Then the query cache is cleared and the user is signed out.
4. Server side, `user.delete()` cascades to profile, cycles, daily logs, pregnancies and subscription. Encrypted backups age out after `BACKUP_KEEP_DAYS` (30).
5. Plain sign-out does **not** wipe local data (offline records persist by design).

---

## 5. Owner actions before closed testing

**Accounts and identity**

- [ ] `cd apps/mobile && eas login && eas project:init`, then set `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` in `apps/mobile/env.js` (still the zero placeholder and owner `happywomen`).
- [ ] Production EAS env vars per `DEPLOYMENT.md` §3.2, plus `SENTRY_AUTH_TOKEN` as a secret.
- [ ] Create Sentry projects (Django + React Native); enable "Prevent Storing of IP Addresses".
- [ ] Resend: verify the sending domain (SPF/DKIM), create a sending-only key.
- [ ] Cloudflare R2: private bucket + bucket-scoped token; generate the age key pair **offline** and keep the private key in a password manager.

**Server**

- [ ] Deploy `docker-compose.prod.yml` in Dokploy with every required variable (`DEPLOYMENT.md` §2.3); no Domains-UI entry for the API.
- [ ] Move the Dokploy dashboard off public `:3000` (§2.7).
- [ ] Run the restore drill against the real R2 bucket (§2.6).
- [ ] Walk through the `DEPLOYMENT.md` §4 verification table.

**Repository files the secret-guard hook blocks Claude from editing (placeholder-only templates):**

- [ ] Replace root `.env.production.example` with the proposed version prepared during this session (adds `ADMIN_URL`, Sentry, Resend, legal and backup variables; removes `API_PORT`).
- [ ] Add `RESEND_API_KEY`, `DEFAULT_FROM_EMAIL`, `PUBLIC_BASE_URL`, `SUPPORT_EMAIL`, `LEGAL_OPERATOR_NAME`, `LEGAL_EFFECTIVE_DATE` to `apps/api/.env.example`.

**Store and legal**

- [ ] Review `/legal/privacy/`, `/legal/terms/`, `/legal/account-deletion/` (drafts, not legal advice).
- [ ] Native-speaker review of the Arabic disclaimer strings (`apps/mobile/src/translations/ar.json`, `medical_disclaimer.*`).
- [ ] Play Console: Data safety, Health apps, ads, audience per `docs/PLAY_CONSOLE_DECLARATIONS.md`.
- [ ] `play-service-account.json` as an EAS file secret (never committed). Upload the **first** AAB by hand.
- [ ] Recruit 20 testers and start the 14-day closed test as soon as the backend is live.

---

## 6. Manual QA matrix (physical Android device, staging build, `JWT_ACCESS_MINUTES=1`)

### Suite A: Auth, sessions, deletion

- [ ] **A1 Register** a new account → onboarding → medical disclaimer gate → home.
- [ ] **A2 Session survives expiry:** stay in the app > 2 minutes, keep navigating; still signed in (refresh works).
- [ ] **A3 Forgot password:** login → "Forgot password?" → email arrives → set a new password in the browser → the app's old session is signed out on its next refresh → sign in with the new password.
- [ ] **A4 Reset link reuse:** open the same link again → "This link has expired".
- [ ] **A5 Rate limit:** 11 wrong passwords within a minute → the 11th shows the throttling message.
- [ ] **A6 Delete account:** cancel first, then confirm → signed out; reinstall-free check: sign up again with a new email and confirm no old kick counts, discharge logs or profile data appear.

### Suite B: Health data and disclaimers

- [ ] **B1** Log period, symptoms and temperature; kill and reopen the app; data is still there.
- [ ] **B2** Cycle cards show the contraception notice; pregnancy cards show the ultrasound dating notice.
- [ ] **B3** Settings → Medical disclaimer opens the full text.

### Suite C: v1 scope

- [ ] **C1** No Assistant tab; no Google buttons; no subscription card, plan pill or premium badge.
- [ ] **C2** A Sentry test event arrives from the staging build without request bodies or breadcrumbs from console or touches.

### Suite D: Purchases (v1.1, skipped while monetization is off)

---

## 7. Clinical safety, regulatory & legal

| Area                                     | Status                                                                    | Remaining                                      |
| ---------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------- |
| Cycle & ovulation estimation             | Contraception notice on cycle cards; first-run disclaimer; terms          | OB/GYN review before marketing claims          |
| Gestational age                          | Ultrasound dating notice under the due-date card; disclaimer              | —                                              |
| Fetal kick counter                       | In-app warning to seek care for decreased movement; disclaimer repeats it | —                                              |
| PCOS / endometriosis guidance            | Educational notices in onboarding and symptom tracker                     | Licensed OB/GYN review before public marketing |
| Privacy policy & Play health disclosures | Served at `/legal/privacy/`; declares non-sale, processors, retention     | Owner/legal review; fill `LEGAL_*` vars        |
| Account deletion                         | In-app + web page; server and **both** local stores wiped                 | —                                              |

---

## 8. RevenueCat & Google Play configuration (dormant in v1)

Kept for v1.1. Do not activate these products in Play Console while `FEATURES.monetization` is off.

| Parameter                         | Value                                                             | Verification Source                            |
| --------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| **RevenueCat Project ID**         | `proj102779d4`                                                    | RevenueCat MCP (`list-projects`)               |
| **Android Application ID (Prod)** | `com.happywomen.app`                                              | `app.config.ts`, `env.js`, RevenueCat App      |
| **Android Application ID (Dev)**  | `com.happywomen.app.development`                                  | `env.js` (`withEnvSuffix`)                     |
| **RevenueCat App ID**             | `app8daeeaafbf` (`Happy Women Android`)                           | RevenueCat MCP (`create-app` / `list-apps`)    |
| **Public Android SDK Key**        | `goog_QtdtnTYtAYDeyjAkpHgJmnERuKX`                                | RevenueCat MCP (`list-app-public-api-keys`)    |
| **Canonical Entitlement**         | `premium` (`entle71d46a91d`)                                      | RevenueCat MCP (`list-entitlements`)           |
| **Store Product (Monthly)**       | `premium_monthly:monthly` (`prodb8c1400497`)                      | RevenueCat MCP (`create-product`)              |
| **Store Product (Annual)**        | `premium_annual:annual` (`prod96ac40f72b`)                        | RevenueCat MCP (`create-product`)              |
| **Test Store Products**           | `prod10d13294be`, `prodffc461cd49`                                | RevenueCat MCP (Test Store `app94980d7fca`)    |
| **Default Offering Packages**     | `$rc_monthly` (`pkgefcc28d688a`), `$rc_annual` (`pkge8cdb91fbea`) | RevenueCat MCP (`attach-products-to-package`)  |
| **Secret RevenueCat API Key**     | `REVENUECAT_SECRET_API_KEY`                                       | Backend environment only (`settings/base.py`)  |
| **Webhook Authorization Header**  | `REVENUECAT_WEBHOOK_AUTHORIZATION`                                | Backend environment only (constant-time check) |

---

## 9. Deferred to v1.1

- A real premium tier, gated on the backend with `PaymentRequired` 402s, and paywall copy listing only gated features.
- An LLM assistant (safety prompt, quotas, Data safety update).
- Google sign-in.
- `subscription-sync` returning 200 on upstream errors (should be a problem response).
- Dropping the duplicate `/api/` mount in favour of `/api/v1/`.
- Amplitude analytics behind explicit consent.
- Paywall copy in i18n.
- iOS.
