---
paths: '**'
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# Clean code rules

Applies to the whole repo.

## 1. No magic numbers / strings

Pull every literal into a named constant. Especially:

- timeouts (e.g. `REQUEST_TIMEOUT_MS = 30_000`)
- API paths (`API_PATHS.VERIFY_PURCHASE`)
- feature flags, role names, retry counts, page sizes

## 2. Domain-driven names

Names must express **business intent**, not implementation detail.

- BAD: `data`, `temp`, `res`, `d`, `val`, `obj`
- GOOD: `billingCycleDays`, `trialExpirationAt`, `activeSubscriptionCount`

If a variable needs a comment, rename it.

## 3. Guard clauses over nesting

Validate and return early. At most one nested `if` inside business logic.

```ts
if (!isEligible(user)) return;
if (!hasQuota(user)) return;
doWork(user);
```

## 4. ≤ 3 params

If you have more, introduce a typed object / command / DTO.

## 5. Small, single-purpose functions

One function = one business operation. Fetch + transform + validate + persist +
notify in the same function = split it. Target 5–25 lines for business logic.

## 6. DRY without over-abstracting

Extract on the **second** occurrence. The first occurrence is fine to repeat.

## 7. KISS

Explicit > clever. No over-generic helpers. If readability drops, simplify.

## 8. Composition over inheritance

No inheritance for services, business logic, or React components. Use:

- dependency injection
- hooks
- small collaborating objects

Inheritance allowed only for framework-level extension and true "is-a" domain
models.

## 9. Comments only for WHY

Don't restate the code. Allowed:

- business rules
- constraints / non-obvious decisions
- edge cases

Disallowed: `// increment i`, `// loop over users`.

## 10. Commit-quality changes

- One concern per change. Don't mix refactor + behaviour.
- Answer "what" and "why" in the commit body.
- Conventional commits (enforced by `commitlint.config.js`).

## Project-specific addenda

- TypeScript strict — never `any`; prefer `unknown` and narrow.
- API responses always explicitly typed (see `api-response.md`).
- Side effects isolated in hooks / services.
- Error handling explicit. No silent catches.
- Optimise for the next maintainer, not for line count.
