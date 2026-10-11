# Product Feature Specification & Monetization Plan

**Application:** Happy Women (Period & Pregnancy Tracker)  
**Package Identifier:** `com.happywomen.app`  
**Target Release Platform:** Google Play Store (Android)  
**Author:** Product Engineering Team  
**Architecture:** Monorepo (`apps/mobile`, `apps/api`, `packages/api-contract`)

---

## 1. Executive Product Overview

**Happy Women** is a privacy-first, evidence-based FemTech mobile platform designed to accompany women through every stage of their reproductive health journey. The application features a **Dual-Mode Clinical Engine** that seamlessly transitions between **Menstrual Cycle & Fertility Tracking** and **Pregnancy & Fetal Development Tracking**.

### Core Value Propositions

1. **Dual-Mode Flexibility:** Instant, zero-friction toggle between cycle tracking, conception planning, and 40-week pregnancy tracking without data fragmentation.
2. **Zero-Knowledge Privacy Standard:** Sensitive health records (cycle dates, symptoms, sexual health, conception logs) are encrypted at rest on the client device using hardware-backed keystores (`expo-secure-store`) and multitenant PostgreSQL Row Level Security (RLS) in the cloud.
3. **Clinically Grounded Algorithms:** Rolling cycle averages that discard data noise (<15 or >60 days), retrograde 14-day luteal phase ovulation estimations, and specialized PCOS/Endometriosis clinical safeguards.
4. **Hybrid AI Health Assistant:** Dual-engine architecture combining sub-millisecond offline rule-based answers with deep contextual LLM guidance conditioned on the user's localized medical profile.
5. **Aesthetic Excellence:** OKLCH uniform lightness design system offering 7 distinct palettes (`happy`, `organic`, `teal`, `indigo`, `rose`, `amber`, `slate`) in both light and dark modes with fluid Reanimated micro-interactions.

---

## 2. Complete Feature-by-Feature Catalog

---

### Module 1: Onboarding & Progressive Profiling

The onboarding flow introduces the user to the app, gathers clinical baselines, and constructs the initial health profile across 6 interactive stages.

| Feature                               | Technical Implementation                                                                                                                                               | Description & User Experience                                                                                                                                                                                  |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal Selection**                    | [onboarding.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/onboarding.tsx)       | Multi-select goal picker: _Track menstrual cycle_, _Try to conceive (TTC)_, _Track pregnancy_, _Manage hormonal symptoms (PCOS/Endo)_, _Improve nutrition & fitness_. Adapts the default mode upon completion. |
| **Menstrual History Baselines**       | [onboarding.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/onboarding.tsx)       | Configures baseline cycle length (default: 28 days) and period duration (default: 5 days) using interactive steppers.                                                                                          |
| **Contraception & Fertility Logging** | [onboarding.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/onboarding.tsx)       | Captures active birth control methods (Hormonal Pill, IUD, Barrier, Natural Family Planning, None).                                                                                                            |
| **Chronic Condition Tagger**          | [onboarding.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/onboarding.tsx)       | Flags conditions: PCOS, PCOD, Endometriosis, Thyroid Disorders, Anemia, Diabetes, Fibroids, Hypertension. Automatically enables clinical alert triggers.                                                       |
| **Body Metrics & Unit Switcher**      | [onboarding.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/onboarding.tsx)       | Height and weight inputs with one-tap toggle between **Metric (`cm` / `kg`)** and **Imperial (`ft-in` / `lbs`)**. Powers the basal metabolic diet engine.                                                      |
| **Partner Sync Code Entry**           | [onboarding.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/onboarding.tsx)       | Optional partner code entry allowing partners to link devices for synchronized cycle updates and fertile window notifications.                                                                                 |
| **Graceful Onboarding Skip**          | [onboarding.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/onboarding.tsx)       | Users can tap "Skip" at any stage to enter the app shell immediately with sensible clinical defaults.                                                                                                          |
| **Progressive Profiling**             | [setup-profile.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/setup-profile.tsx) | Allows existing users to update their clinical parameters and goals incrementally from Settings.                                                                                                               |

---

### Module 2: Authentication & Identity Management

Enterprise-grade authentication built with Django SimpleJWT, RFC 9457 structured error handling, and strict mobile secure storage.

| Feature                          | Technical Implementation                                                                                                                                                                                                                                                                                                    | Description & User Experience                                                                                                      |
| :------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Email/Password Sign-Up**       | [register.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/register.tsx), `POST /api/v1/auth/register/`                                                                                                                                 | Account creation with real-time password criteria validation (min 8 chars, uppercase, lowercase, number, symbol).                  |
| **JWT Token Pair Exchange**      | [login.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/login.tsx), `POST /api/v1/auth/token/`                                                                                                                                          | Issues short-lived access tokens (15 mins) and long-lived refresh tokens (30 days) stored in hardware keystore.                    |
| **Silent Token Refresh**         | [client.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/api/common/client.tsx), `POST /api/v1/auth/token/refresh/`                                                                                                                         | Axios interceptor catches 401s, silently requests a fresh token, and replays failed requests without user interruption.            |
| **1-Tap Demo Account Bar**       | [login.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/login.tsx), [demo-users.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/auth/demo-users.ts) | Instant demo credentials for evaluation: Claire Bennett (Cycle Tracking), Maya Patel (Pregnancy Week 18), Elena Rostova (TTC).     |
| **Social Login UI**              | [google-button.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/auth/google-button.tsx)                                                                                                                                          | Google OAuth SSO entry point ready for Google Play Services integration.                                                           |
| **Google Play Account Deletion** | [delete-account-item.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/settings/delete-account-item.tsx), `DELETE /api/v1/me`                                                                                                     | Fully compliant Google Play Data Safety feature: permanently purges user account and cascades deletion across all database tables. |

---

### Module 3: Dual Health Mode Engine

A unified global health store ([useHealthStore.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/store/useHealthStore.ts)) powers immediate UI transitions between reproductive health contexts.

| Feature                   | Technical Implementation                                                                                                                                                                                | Description & User Experience                                                                                               |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| **Mode Switcher Modal**   | [mode-switcher-modal.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/dashboard/mode-switcher-modal.tsx)     | Accessible from top app bar. Allows instantaneous switching between Cycle Mode and Pregnancy Mode with animated transition. |
| **Contextual Header**     | [app-header.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/ui/app-header.tsx)                              | Displays active mode badge, quick switcher trigger, user avatar, and settings access.                                       |
| **State Synchronization** | [use-personalization-profile.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/use-personalization-profile.ts) | Keeps local Zustand state, React Query cache, and backend `users_profile.mode` synchronized.                                |

---

### Module 4: Menstrual Cycle & Ovulation Forecasting Engine

The core clinical cycle tracking system operates in **Cycle Tracking Mode**.

| Feature                               | Technical Implementation                                                                                                                                                                                                                                                                                                                | Description & User Experience                                                                                                                                       |
| :------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Interactive Cycle Dial**            | [index.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/index.tsx>), [cycle-phase.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/cycle-phase.ts) | Circular dial visually displaying cycle completion percentage, active cycle day (e.g., "Day 11"), and total cycle length (e.g., "29 Days").                         |
| **Phase Classification**              | [cycle-phase.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/cycle-phase.ts)                                                                                                                                                                 | Clinically partitions cycles into: **Menstrual Phase**, **Follicular Phase**, **Fertile Window**, **Ovulation Day**, and **Luteal Phase**.                          |
| **Fertility & Conception Predictor**  | [cycle-phase.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/cycle-phase.ts)                                                                                                                                                                 | Calculates pregnancy probability dynamically: **High** (Ovulation ± 1 day, fertile window), **Medium** (2 days before fertile window), **Low** (Follicular/Luteal). |
| **Rolling Cycle Length Average**      | [cycle-insights.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/cycle-insights.ts)                                                                                                                                                           | Averages intervals across past cycles while strictly filtering out implausible data-entry noise (<15 or >60 days).                                                  |
| **Future Period Projection**          | [cycle-phase.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/cycle-phase.ts)                                                                                                                                                                 | Projects upcoming menstrual dates and fertile windows forward by 3–6 months for calendar planning.                                                                  |
| **PCOS / Endometriosis Alert Engine** | [medical-insights.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/medical-insights.ts)                                                                                                                                                       | Detects when a period is overdue by ≥7 days in users with PCOS/Endometriosis profiles and renders a targeted clinical advice card.                                  |
| **Quick Log Period Modal**            | [initialize-cycle-modal.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/dashboard/initialize-cycle-modal.tsx)                                                                                                                               | Bottom modal for logging period start dates with full monthly calendar selector and immediate cache invalidation.                                                   |

---

### Module 5: Pregnancy & Fetal Development Engine

Activated in **Pregnancy Mode**, providing comprehensive obstetrical tracking.

| Feature                                  | Technical Implementation                                                                                                                                                                                                                                                                                                                                                         | Description & User Experience                                                                                                    |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **40-Week Gestational Ring**             | [index.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/index.tsx>), [pregnancy-insights.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/pregnancy-insights.ts)                            | Displays current gestational age (e.g. "Week 18, Day 3") with radial completion sweep against 40-week term.                      |
| **Trimester Progress Indicator**         | [pregnancy-insights.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/pregnancy-insights.ts)                                                                                                                                                                                            | Automatically maps weeks to clinical trimesters: **1st Trimester (1–13)**, **2nd Trimester (14–27)**, **3rd Trimester (28–40)**. |
| **Baby Size Visualizer**                 | [useHealthStore.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/store/useHealthStore.ts)                                                                                                                                                                                                         | Compares fetal size to familiar items (e.g., Week 18 = "Bell Pepper" / ~190g, 14cm).                                             |
| **Due Date Countdown**                   | [pregnancy-insights.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/health/pregnancy-insights.ts)                                                                                                                                                                                            | Real-time countdown of remaining days until estimated delivery date (EDD).                                                       |
| **Fetal Kick Counter (Session Tracker)** | [fetal-activity-logger.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/symptoms/fetal-activity-logger.tsx), [useHealthStore.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/store/useHealthStore.ts) | 1-tap live kick counter with active session duration timer. Saves completed kick count sessions to local encrypted history.      |
| **Weekly Clinical Guides**               | [insights.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/insights.tsx>)                                                                                                                                                                                                             | Curated medical articles tailored to the active week (e.g., Week 18 fetal hearing development, anatomy scan readiness).          |

---

### Module 6: Daily Symptom, Mood & Biometric Logging

Full daily tracking engine supporting multivariable health correlation.

| Feature                             | Technical Implementation                                                                                                                                                                  | Description & User Experience                                                                                                                    |
| :---------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Menstrual Flow Logging**          | [tracking.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/tracking.tsx>), `DailyLog.flow`     | Log flow intensity: **None**, **Spotting**, **Light**, **Medium**, **Heavy**.                                                                    |
| **Emotional Mood Grid**             | [tracking.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/tracking.tsx>), `DailyLog.mood`     | 5-tier mood picker: **Great**, **Good**, **Neutral**, **Low**, **Bad** with expressive color indicators.                                         |
| **Physical & Digestive Symptoms**   | [symptoms.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/symptoms.tsx>), `DailyLog.symptoms` | Categorized symptom tags: Cramps, Headache, Bloating, Breast Tenderness, Acne, Fatigue, Nausea, Back Pain, Food Cravings, Insomnia, Hot Flashes. |
| **Basal Body Temperature (BBT)**    | `DailyLog.temperature_celsius`                                                                                                                                                            | Decimal precision temperature tracking for thermal shift / biphasic ovulation confirmation.                                                      |
| **Sexual Activity & Contraception** | `DailyLog.intercourse_logged`, `DailyLog.contraception_used`                                                                                                                              | Logs intimate activity and protection usage for conception and contraception tracking.                                                           |
| **Freeform Clinical Notes**         | `DailyLog.notes`                                                                                                                                                                          | Secure text field for journaling and logging medications.                                                                                        |
| **One-Tap Apply & Toast Feedback**  | [tracking.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/tracking.tsx>)                      | Saves daily log via `POST /api/v1/daily-logs/` with green confirmation toast banner.                                                             |

---

### Module 7: Master Calendar & Historical Timeline

Complete timeline overview of cycles, predictions, and logged health entries.

| Feature                                   | Technical Implementation                                                                                                                                                                                                                                                                                                                               | Description & User Experience                                                                                              |
| :---------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Monthly Grid Calendar**                 | [calendar.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/calendar.tsx>), [month-grid.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/calendar/month-grid.tsx) | High-performance monthly grid with horizontal gesture paging and year/month jump.                                          |
| **Multi-Phase Color Ring Indicators**     | [calendar.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/calendar.tsx>)                                                                                                                                                                                   | Distinct color rings for each date: Coral/Rose (Period), Lavender (Fertile Window), Deep Purple (Estimated Ovulation Day). |
| **Daily Symptom Badge Markers**           | [calendar.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/calendar.tsx>)                                                                                                                                                                                   | Visual marker indicating logged entries ("Oct 11: 2 logged").                                                              |
| **Selected Day Inspection Card**          | [calendar.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/calendar.tsx>)                                                                                                                                                                                   | Bottom detail card displaying all metrics, mood, flow, and notes recorded for the tapped date.                             |
| **Floating Action Button (+ Log Period)** | [calendar.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/calendar.tsx>)                                                                                                                                                                                   | Quick-access floating action button opens period initialization modal.                                                     |

---

### Module 8: Clinical Nutrition & Trimester Diet Engine

Evidence-based nutritional guidance tailored to gestational stages and cycle phases.

| Feature                           | Technical Implementation                                                                                                                                                 | Description & User Experience                                                                                                                                         |
| :-------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trimester Nutrition Selector**  | [diet.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/diet.tsx>)             | 3-way tab bar switching meal plans between **1st Trimester**, **2nd Trimester**, and **3rd Trimester**.                                                               |
| **Clinical Recipe Cards**         | [diet.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/diet.tsx>)             | Detailed meal cards: Steel-Cut Oats (morning sickness relief), Lentil & Spinach Soup (iron/folate), Baked Wild Salmon (omega-3 DHA), Greek Yoghurt Parfait (calcium). |
| **Daily Meal Checklist**          | [nutrition.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/nutrition.tsx>)   | Interactive meal log (Breakfast, Lunch, Dinner, Snack) with calorie tallies and completion toggles.                                                                   |
| **Hydration Tracker**             | [useHealthStore.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/store/useHealthStore.ts) | 8-glass daily water intake counter.                                                                                                                                   |
| **Dietary Restriction Filtering** | [users/models.py](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/api/apps/users/models.py)             | Filters meals according to preferences: Omnivore, Vegetarian, Vegan, Pescatarian, Halal, Kosher.                                                                      |
| **Clinical Nutrition Disclaimer** | [diet.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/diet.tsx>)             | Prominent medical disclaimer clarifying guidance is for educational reference.                                                                                        |

---

### Module 9: AI Health Assistant (Hybrid Dual-Engine)

Conversational health assistant tailored to the user's localized medical context.

| Feature                          | Technical Implementation                                                                                                                                                                               | Description & User Experience                                                                                                                                                                                                          |
| :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local Offline Intent Engine**  | [local-guide.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/assistant/local-guide.ts)                             | Provides instantaneous answers (<5ms, zero network) to common questions: _When is my next period?_, _What cycle day am I on?_, _How far along am I?_, _When is my due date?_, _What symptoms have I logged?_, _How many kicks today?_. |
| **Cloud AI Clinical Engine**     | [assistant.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/assistant.tsx>), `POST /api/v1/assistant/chat/` | Server-side assistant for complex queries, synthesizing profile conditions, cycle history, and nutrition.                                                                                                                              |
| **Quick-Query Suggestion Chips** | [assistant.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/assistant.tsx>)                                 | Interactive pills enabling users to ask common questions with one tap.                                                                                                                                                                 |
| **Contextual Chat Bubbles**      | [assistant.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/assistant.tsx>)                                 | Chat interface with message timestamps, user/assistant distinction, and loading animations.                                                                                                                                            |
| **Clinical Disclaimer Banner**   | [assistant.tsx](<file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/app/(app)/assistant.tsx>)                                 | Fixed footer stating answers provide general health guidance and do not replace professional medical diagnosis.                                                                                                                        |

---

### Module 10: Personalization, Accessibility & Theme System

Tailored visual and regional adaptation without requiring app reloads.

| Feature                              | Technical Implementation                                                                                                                                                                                                                                                                                                                               | Description & User Experience                                                                                           |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Profile Summary Card**             | [profile-header.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/settings/profile-header.tsx)                                                                                                                                                               | Displays user initial avatar, full name, age, and subscription status badge ("Free" vs "Premium").                      |
| **Date of Birth & Age Calculator**   | [date-of-birth-input.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/settings/date-of-birth-input.tsx)                                                                                                                                                     | Interactive Year/Month/Day selector with leap year calculations, calendar bounds checking, and instant age calculation. |
| **Health Condition Personalization** | [personalization-modal.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/settings/personalization-modal.tsx)                                                                                                                                                 | Bottom modal to toggle medical conditions, diet preferences, and tracking mode anytime.                                 |
| **Dark / Light Theme Engine**        | [theme-item.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/settings/theme-item.tsx)                                                                                                                                                                       | One-tap switch between System Default, Dark Mode, and Light Mode via NativeWind colorScheme.                            |
| **7 OKLCH Color Palettes**           | [palettes.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/theme/palettes.ts), [palette-item.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/settings/palette-item.tsx) | Live color swaps across 7 curated palettes: `happy`, `organic`, `teal`, `indigo`, `rose`, `amber`, `slate`.             |
| **Bilingual Localization (i18n)**    | [en.json](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/translations/en.json), [ar.json](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/translations/ar.json)                               | Complete English and Arabic translations with dynamic Right-to-Left (RTL) layout mirroring.                             |
| **Store & Legal Links**              | [settings-links.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/settings/settings-links.tsx)                                                                                                                                                               | In-app actions for Rate App, Share App, Email Support, Live Privacy Policy, Terms of Service.                           |

---

### Module 11: Security, Compliance & Zero-Knowledge Architecture

Built to satisfy healthcare privacy standards and Google Play Console compliance.

| Feature                                  | Technical Implementation                                                                                                                                                                                                                                                                                  | Description & User Experience                                                                                                                               |
| :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hardware-Backed Encryption at Rest**   | [encrypted-storage.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/storage/encrypted-storage.ts)                                                                                                                      | Local health data encrypted before writing to disk using keys stored in Android KeyStore (`expo-secure-store`).                                             |
| **Zero-Knowledge Panic Purge**           | [encrypted-storage.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/storage/encrypted-storage.ts)                                                                                                                      | Instant wipe of all encrypted local health records on device logout or account deletion.                                                                    |
| **PostgreSQL Kernel Row Level Security** | [rls.py](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/api/apps/core/rls.py), [init.sh](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/infra/initdb/01-init.sh)           | Enforces multi-tenant isolation at the database kernel level: every query sets `SET LOCAL app.user_id = '<uuid>'`. Non-superusers have `BYPASSRLS` revoked. |
| **HTTPS Only in Production**             | [app.config.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/app.config.ts#L84), [env.js](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/env.js#L101) | Android cleartext traffic blocked in production builds; all API communications encrypted via TLS in transit.                                                |
| **Privacy Policy & In-App Deletion**     | [CONTRACT.md](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/packages/api-contract/CONTRACT.md#L96)                                                                                                                                          | Satisfies Google Play Health Data & Account Deletion policies with complete database record wiping.                                                         |

---

### Module 12: Backend Infrastructure & Asynchronous Automation

Production containerized stack orchestrated via Docker Compose for Dokploy VPS deployment.

| Feature                              | Technical Implementation                                                                                                                                          | Description & User Experience                                                                   |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **API Web Workers**                  | [Dockerfile](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/api/Dockerfile), Gunicorn + Uvicorn | High-concurrency ASGI workers serving DRF endpoints.                                            |
| **Asynchronous Celery Workers**      | [docker-entrypoint.sh](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/api/docker-entrypoint.sh) | Offloads heavy computations (rolling cycle projections, AI LLM streaming, email notifications). |
| **Periodic Scheduler (Celery Beat)** | [docker-compose.prod.yml](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/docker-compose.prod.yml)    | Runs recurring daily tasks (push reminders, overdue period checks, pregnancy week increments).  |
| **Redis 7 Cache & Broker**           | `redis:7-alpine`                                                                                                                                                  | High-throughput distributed cache, session store, and Celery broker.                            |
| **Traefik Reverse Proxy & SSL**      | Dokploy integration labels                                                                                                                                        | Automatic Let's Encrypt TLS certificate provisioning and reverse proxy routing.                 |

---

## 3. Monetization & Premium Feature Plan

The monetization model follows a **Freemium Subscription Strategy** designed to drive high conversion while maintaining an ethical, fully functional free baseline for essential health tracking.

```mermaid
graph TD
    User["Free User"] --> FreeUsage["Core Tracking: Period logging, basic cycle calendar, standard kick counter"]
    FreeUsage --> Trigger{"Paywall Trigger Hit?"}
    Trigger -->|AI Query Quota / Advanced Feature| Gate["RFC 9457 HTTP 402 Payment Required"]
    Gate --> Sheet["UpgradeSheet (Reanimated Bottom Sheet)"]
    Sheet --> TierChoice{"Select Plan"}
    TierChoice -->|Monthly $9.99/mo| Billing["Google Play Billing (Play Store)"]
    TierChoice -->|Annual $59.99/yr (50% Off)| Billing
    Billing --> Verify["POST /api/v1/payments/google-play/verify-purchase/"]
    Verify --> PremiumActive["Unlock Premium Tier (Status: Active)"]
```

---

### 3.1. Free vs. Premium Tier Comparison Matrix

| Feature                                |          Free Tier           |                    Premium Tier                     | Gating Mechanism                    |
| :------------------------------------- | :--------------------------: | :-------------------------------------------------: | :---------------------------------- |
| **Menstrual Period Logging**           |          Unlimited           |                      Unlimited                      | Free Core                           |
| **Cycle Day Counter & Wheel**          |           Included           |                      Included                       | Free Core                           |
| **Pregnancy Mode & Week Tracker**      |           Included           |                      Included                       | Free Core                           |
| **Symptom & Mood Logging**             |       Standard (top 5)       |            Full Taxonomy (18+ symptoms)             | UI Gate                             |
| **Fetal Kick Counter**                 |       Standard Session       |             Unlimited History & Export              | UI Gate                             |
| **Calendar View**                      |   Current & Previous Month   |      Unlimited Historical & 12-Mo Projections       | API 402 Gate                        |
| **Cycle & Ovulation Projections**      |        1 Month Ahead         |                  6–12 Months Ahead                  | API 402 Gate                        |
| **AI Health Assistant**                |      5 Queries / Month       |                **Unlimited Queries**                | `402 Payment Required` (`limit: 5`) |
| **Hormonal Nutrition & Recipes**       |      Sample Meal Ideas       |   **Full Trimester Meal Plans & Macro Breakdown**   | UI Gate                             |
| **PCOS & Endometriosis Deep Insights** |     Basic Overdue Alert      | **Clinical Irregularity Tracking & Anomaly Alerts** | UI Gate                             |
| **Partner Device Sync**                |           1 Device           |          **Real-Time Bi-Directional Sync**          | API 402 Gate                        |
| **Doctor Export (PDF Report)**         |              —               |     **Comprehensive Health Summary for OB/GYN**     | UI Gate                             |
| **Visual Themes & Palettes**           | 2 Palettes (`happy`, `rose`) |      **All 7 OKLCH Palettes + Custom Accents**      | UI Gate                             |
| **Customer Support**                   |     Community / Standard     |             **Priority Email Support**              | Support Queue                       |

---

### 3.2. Subscription Pricing Models

| Plan                                 |    Price (USD)    | Effective Monthly | Value Proposition & Promotion                                      | Google Play Product ID |
| :----------------------------------- | :---------------: | :---------------: | :----------------------------------------------------------------- | :--------------------- |
| **Monthly Subscription**             | **$9.99 / month** |    $9.99 / mo     | Flexible, cancel anytime, 3-day free trial.                        | `premium_monthly`      |
| **Annual Subscription** _(Featured)_ | **$59.99 / year** |  **$4.99 / mo**   | **Save 50%**, 7-day free trial, best value for pregnancy duration. | `premium_annual`       |

---

### 3.3. Paywall Architecture & Technical Implementation

The application implements an **RFC 9457 HTTP 402 Payment Required** architecture:

1. **Backend Trigger**: When a free user exceeds their quota (e.g., 5 AI queries) or accesses a gated resource, the server raises `PaymentRequiredProblem`:
   ```json
   {
     "type": "https://apiguide.dev/status-codes/402/",
     "title": "Payment Required",
     "status": 402,
     "detail": "You've used all 5 of your free AI assistant queries this month.",
     "feature": "premium",
     "current_usage": 5,
     "limit": 5,
     "resets_at": "2026-11-01T00:00:00Z"
   }
   ```
2. **Client Global Interceptor**: [client.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/api/common/client.tsx) intercepts the 402 response and triggers [useUpgrade](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/upgrade/index.ts).
3. **Upgrade Modal ([upgrade-sheet.tsx](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/components/billing/upgrade-sheet.tsx))**:
   - Renders a `@gorhom/bottom-sheet` modal with animated Reanimated sparkles.
   - Shows user-facing feature bullets: _Unlimited AI chat_, _Advanced cycle predictions_, _Trimester meal plans_, _Cancel anytime_.
   - Displays plan toggle between Monthly ($9.99) and Annual ($59.99).
4. **Google Play Purchase Execution ([use-purchase-premium.ts](file:///c:/Users/salma/Desktop/enthusiast/Mobile%20Apps%20-%20Play%20Store/Period-and-Pregnancy-Tracker-App/apps/mobile/src/lib/billing/use-purchase-premium.ts))**:
   - Invokes `expo-iap-client.ts` (`requestSubscription`).
   - Obtains signed `purchaseToken` from Google Play.
   - Posts token to `POST /api/v1/payments/google-play/verify-purchase/`.
   - On success, refetches `GET /api/v1/payments/subscription-status/` and invalidates query caches to unlock premium UI across all screens immediately.

---

## 4. Technical File & Component Map

| Feature Area               | Mobile Frontend Files                                                                                                                                             | Backend API Endpoints                                                                                  | Database Models                     |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :---------------------------------- |
| **Authentication & Users** | `apps/mobile/src/app/login.tsx`<br>`apps/mobile/src/app/register.tsx`<br>`apps/mobile/src/components/auth/*`                                                      | `POST /api/v1/auth/token/`<br>`POST /api/v1/auth/register/`<br>`GET /api/v1/me`<br>`DELETE /api/v1/me` | `users.User`<br>`users.Profile`     |
| **Onboarding & Profile**   | `apps/mobile/src/app/onboarding.tsx`<br>`apps/mobile/src/app/setup-profile.tsx`<br>`apps/mobile/src/components/settings/date-of-birth-input.tsx`                  | `GET /api/v1/profiles/`<br>`PATCH /api/v1/profiles/{id}/`                                              | `users.Profile`                     |
| **Cycle & Ovulation**      | `apps/mobile/src/app/(app)/index.tsx`<br>`apps/mobile/src/components/dashboard/*`<br>`apps/mobile/src/lib/health/cycle-phase.ts`                                  | `GET /api/v1/cycles/`<br>`POST /api/v1/cycles/`<br>`DELETE /api/v1/cycles/{id}/`                       | `cycles.Cycle`                      |
| **Pregnancy Tracking**     | `apps/mobile/src/app/(app)/insights.tsx`<br>`apps/mobile/src/components/symptoms/fetal-activity-logger.tsx`<br>`apps/mobile/src/lib/health/pregnancy-insights.ts` | `GET /api/v1/pregnancies/`<br>`POST /api/v1/pregnancies/`                                              | `pregnancy.Pregnancy`               |
| **Daily Health Logs**      | `apps/mobile/src/app/(app)/tracking.tsx`<br>`apps/mobile/src/app/(app)/symptoms.tsx`                                                                              | `GET /api/v1/daily-logs/`<br>`POST /api/v1/daily-logs/`<br>`PATCH /api/v1/daily-logs/{id}/`            | `cycles.DailyLog`                   |
| **Calendar Timeline**      | `apps/mobile/src/app/(app)/calendar.tsx`<br>`apps/mobile/src/components/calendar/*`                                                                               | `GET /api/v1/cycles/`<br>`GET /api/v1/daily-logs/`                                                     | `cycles.Cycle`<br>`cycles.DailyLog` |
| **Clinical Nutrition**     | `apps/mobile/src/app/(app)/diet.tsx`<br>`apps/mobile/src/app/(app)/nutrition.tsx`                                                                                 | `GET /api/v1/profiles/`                                                                                | `users.Profile`                     |
| **AI Assistant**           | `apps/mobile/src/app/(app)/assistant.tsx`<br>`apps/mobile/src/lib/assistant/local-guide.ts`                                                                       | `POST /api/v1/assistant/chat/`                                                                         | `users.Profile`                     |
| **Billing & Paywall**      | `apps/mobile/src/components/billing/upgrade-sheet.tsx`<br>`apps/mobile/src/lib/billing/*`                                                                         | `GET /api/v1/payments/subscription-status/`<br>`POST /api/v1/payments/google-play/verify-purchase/`    | `users.Profile`                     |
| **Themes & Settings**      | `apps/mobile/src/app/(app)/settings.tsx`<br>`apps/mobile/src/lib/theme/palettes.ts`                                                                               | Local Storage & `PATCH /api/v1/profiles/{id}/`                                                         | `users.Profile`                     |
