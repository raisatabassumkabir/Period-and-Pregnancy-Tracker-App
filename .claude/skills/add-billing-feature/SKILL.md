---
name: add-billing-feature
description: Add a new 402-gated premium feature end-to-end. Extends the PremiumFeature union, adds upgrade-sheet copy, wires the hook, and writes the 402-propagation test.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# add-billing-feature

## When to use

- "Add a paywalled `<feature>`"
- "Put `<feature>` behind premium"
- "Add a 402-gated `<feature>`"

## Steps

1. **Read the rules.** Load `.claude/rules/billing-402.md` and the
   top-level `CLAUDE.md` "The 402 contract" section. Internalise the body
   shape and the single-point-of-truth rule.

2. **Confirm the `feature` key.** The backend must send a stable string.
   Coordinate with the backend owner. Add it to the `PremiumFeature`
   union in `src/api/billing/types.ts`.

3. **Add the sheet title.** In `src/components/billing/upgrade-sheet.tsx`,
   add a feature-specific title. Fall back to "Upgrade to Premium" if
   not mapped.

4. **Wire the hook.** Hand off to `api-builder` for the hook. The hook
   just calls `client`; the interceptor handles 402. Do not add a 402
   branch to the hook.

5. **Wire the consuming surface.** Hand off to `screen-builder` for the
   screen / component.

6. **Tests.** Hand off to `test-runner` for the 402 propagation test.
   Pattern:
   ```ts
   // Arrange: client returns 402 with the new feature key
   mockedClient.post.mockRejectedValue({ response: { status: 402, data: { detail: { feature: 'new_key', message: '...' } } } });
   // Act + Assert: useUpgrade store shows the sheet with the new key
   expect(useUpgrade.getState().visible).toBe(true);
   expect(useUpgrade.getState().detail?.feature).toBe('new_key');
   ```

7. **Acknowledge-purchase flow.** The orchestrator
   `use-purchase-premium.ts` already invalidates `['payments',
   'subscription-status']` + `['me']` on success. Reuse it. Don't
   reimplement.

8. **Verification.** `pnpm test` (full suite — 402 changes are
   contract-breaking). Then `pnpm mobile exec eslint` + `pnpm type-check`.
   Hand off to `security-auditor` for a 402 contract check, then
   `reviewer` for the diff.

9. **Commit.** `/commit`. Prefix: `feat(billing):` or `fix(billing):`.

## Don't

- Don't add a 402 handler in the hook. The interceptor does it.
- Don't reuse the catch-all `'premium'` key. Prefer a specific key so
  copy can be tailored.
- Don't acknowledge the purchase twice.
- Don't ship without a 402 test.
