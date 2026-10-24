# Play Console declarations: Happy Women v1

Answers for **Policy → App content**, matching what v1 actually does: free, no ads, no analytics, no in-app purchases, assistant hidden, Sentry crash reporting on.

**Re-check these whenever a build changes data handling.** Turning on `FEATURES.monetization`, setting `AMPLITUDE_API_KEY`, or shipping the assistant all change the answers below.

Source of truth for each answer: the privacy policy served at `/legal/privacy/` (`apps/api/apps/core/templates/legal/privacy.html`). If an answer here and the policy disagree, fix one of them before submitting.

## Privacy policy

`https://<DOMAIN>/legal/privacy/`

## Ads

**No**, the app does not contain ads.

## App access

Everything except the sign-in screen needs an account. Give the reviewer a working test login (email + password) on a staging account that has some sample cycle data.

## Target audience and content

- Target age group: **18 and over** only.
- Not designed for children; no "Teacher Approved" opt-in.

## Health apps declaration

- Declare **menstrual / cycle tracking** and **pregnancy tracking** features.
- The app is **not** a regulated medical device and makes no diagnostic or contraceptive claims.
- Put the disclaimer in the store description as well, e.g.: _"Happy Women is not a medical device. Predictions are estimates and must not be used as contraception. Always consult a healthcare professional."_
- Health Connect: **not used**.

## Data safety

**Overview questions**

| Question                                                    | Answer                                                                                 |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Does the app collect or share any required user data types? | Yes                                                                                    |
| Is all user data encrypted in transit?                      | Yes (HTTPS only; cleartext blocked in production builds)                               |
| Do you provide a way for users to request deletion?         | Yes: in-app (Settings → Delete account) and `https://<DOMAIN>/legal/account-deletion/` |

**Data types.** "Shared" is **No** for every row: Sentry, Resend, Cloudflare and the host are service providers acting on our behalf, which Play does not count as sharing.

| Category → type                        | Collected | Optional? | Purposes                              | Notes                                                                                                                                        |
| -------------------------------------- | --------- | --------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Personal info → Email address          | Yes       | Required  | Account management, App functionality | Sign-in; password-reset emails via Resend                                                                                                    |
| Personal info → Other info             | Yes       | Optional  | App functionality, Personalization    | Date of birth, country, language, time zone, how you heard about the app                                                                     |
| Health and fitness → Health info       | Yes       | Optional  | App functionality, Personalization    | Cycles, flow, mood, symptoms, temperature, intercourse and contraception entries, notes, pregnancy dates, medical conditions, height, weight |
| App info and performance → Crash logs  | Yes       | Required  | Analytics                             | Sentry; no request bodies, no screenshots                                                                                                    |
| App info and performance → Diagnostics | Yes       | Required  | Analytics                             | Sentry device/OS/app version                                                                                                                 |
| Device or other IDs                    | Yes       | Required  | Analytics                             | Sentry's random installation identifier (declared conservatively)                                                                            |

**Not collected:** name (stays on the phone), location, contacts, messages, photos/videos, audio, files, calendar, web browsing, app activity/analytics, financial info or purchase history (no IAP in v1).

Data that never leaves the phone (display name, kick counts, discharge logs) does not count as "collected".

## Before submitting

- [ ] In the Sentry project, enable **Prevent Storing of IP Addresses** (the policy promises no IPs).
- [ ] `AMPLITUDE_API_KEY` is empty in the production EAS environment.
- [ ] `REVENUECAT_ANDROID_API_KEY` is empty and no subscription products are active in Play Console.
- [ ] The privacy policy's operator name, support email and effective date are set (`LEGAL_*`, `SUPPORT_EMAIL` env vars) and the text has been reviewed by you or your counsel.
