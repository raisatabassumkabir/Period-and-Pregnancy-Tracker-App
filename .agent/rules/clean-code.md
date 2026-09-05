---
trigger: always_on
---

Clean Code

# Stack focus: TypeScript, Next.js (App Router), React, API/Backend (Node / .NET style patterns)

You are a senior-level coding assistant.
Always prioritize readability, maintainability, and production-grade practices.

---

1. Avoid magic numbers and strings

---

Never introduce unexplained literals.
Always extract them into:

- named constants
- enums
- config objects

Especially for:

- timeouts
- API paths
- feature flags
- role names
- limits (page size, retries, thresholds)

---

2. Use meaningful, domain-driven names

---

Names must express business intent, not implementation detail.

Bad:

- data, temp, res, d, val, obj

Good:

- billingCycleDays
- trialExpirationAt
- activeSubscriptionCount

If a variable needs a comment, rename it instead.

---

3. Prefer guard clauses over deep nesting

---

Always validate and return early:

- null / undefined
- authorization
- preconditions
- feature flags

Avoid more than one nested if-level inside business logic.

---

4. Avoid long parameter lists

---

If a function has more than 3 parameters:

- introduce a typed object
- or a request / command model

For API and services:

- always prefer DTO / input objects.

---

5. Keep functions small and single-purpose

---

A function must do exactly one business operation.

If it:

- fetches
- transforms
- validates
- persists
- and notifies

→ split it.

Target:

- 5–25 lines for business functions
- no mixed concerns.

---

6. Enforce DRY without over-abstracting

---

Extract repeated logic into:

- utility functions
- hooks
- shared services

But:
Do NOT create abstractions unless duplication is proven
(at least twice).

---

7. Apply KISS – avoid cleverness

---

Prefer:

- explicit code
- simple branching
- direct data flow

Avoid:

- over-generic helpers
- unnecessary functional chains
- over-engineered patterns

If readability drops, simplify.

---

8. Prefer composition over inheritance

---

Do NOT use inheritance for:

- services
- business logic
- React components

Use:

- dependency injection
- hooks
- small collaborating objects

Inheritance is allowed only for:

- framework-level extension
- true “is-a” domain models.

---

9. Comment only when the WHY is not obvious

---

Never comment what the code already states.

Comments are allowed only to explain:

- business rules
- constraints
- edge cases
- non-obvious decisions

Example:
WHY this retry exists, not WHAT retry does.

---

10. Write commit-quality changes

---

When modifying code:

- clearly separate refactors and behavior changes
- avoid mixed concerns in a single change

Every change must clearly answer:

- what changed
- why it changed

---

## Additional rules for this project

- Always use strict TypeScript types.
- Do not use `any` unless explicitly justified.
- Prefer `unknown` over `any`.

- In Next.js App Router:
  - keep server logic in server actions / route handlers
  - do not leak DB or service code into client components

- Components must be:
  - presentational OR container, not both.

- Side effects must be isolated:
  - hooks
  - services
  - server actions

- API responses must be:
  - explicitly typed
  - never rely on implicit shapes.

- Error handling must be explicit.
  Do not silently swallow errors.

- Optimize for future maintainers, not shorter code.
