---
name: release-prep
description: Pre-release checklist. Runs check-all, security audit, full diff review, and drafts release notes. Use before tagging a new version or pushing to EAS.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# release-prep

## When to use

- "Prep a release"
- "Cut version `X.Y.Z`"
- "I'm about to run `eas build --profile production`"
- "I'm about to push a TestFlight / Play Console build"

## Steps

1. **Run `pnpm check-all`.** Lint + type-check + tests must all pass for
   the current branch. If any fail, fix first; release-prep does not
   ship broken builds.

2. **Run `pnpm mobile e2e-test`** against the dev client. All Maestro flows
   must pass.

3. **Hand off to `security-auditor`** for a full `main...HEAD` audit.
   Resolve every `blocker` before continuing.

4. **Hand off to `reviewer`** for a full diff review. Resolve every
   `blocker` and `major` before continuing. Log `minor` findings in
   the PR description.

5. **Verify EAS profile.** `cat eas.json` — confirm the
   `production` profile points to the right env file, channel, and
   distribution. Cross-check `app.config.ts` for the bundle identifier.

6. **Verify env.** Confirm `.env.production` is complete and that no
   production-only secret is missing. Do not commit `.env.production`
   even though it exists in the repo (see `app.config.ts` for how it's
   loaded — `EXPO_NO_DOTENV=1` is set in scripts, so env is read via
   `expo-constants` or `app.config.ts`).

7. **Bump version.** `pnpm run version` (per `package.json` — runs
   `prebuild` and `git add .`). Or use `pnpm run app-release` (uses
   `np` for a full release with changelog).

8. **Draft release notes.** Use `.claude/templates/pr-description.md`
   as a starting structure, then trim to the user-facing summary.

9. **Tag + push.** Only after the user has approved the release notes.
   `git tag vX.Y.Z` then `git push --tags`. The user (not Claude)
   should run the actual `eas build --profile production` and
   `eas submit`.

10. **Post-release smoke.** Watch Sentry / logs for the first hour.
    If a regression appears, the standard rollback is
    `eas update --branch production --revert`.

## Don't

- Don't run `eas build` / `eas submit` autonomously. These are
  external and irreversible. Wait for explicit user confirmation.
- Don't amend a release commit. Tag a fix instead.
- Don't ship with `blocker` audit findings or with `pnpm check-all`
  failing.
- Don't include the `react-native-iap` install or
  `expo-secure-store` migration in a release. Those are tracked
  separately (see top CLAUDE.md "What's intentionally not done").
