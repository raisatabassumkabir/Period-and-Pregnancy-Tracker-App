# Commit message

Conventional commits (enforced by `commitlint.config.js`).

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Rules

- **Subject:** ≤ 72 chars, no trailing period, imperative mood
  ("Add" not "Added").
- **Body:** wrap at 72 chars. Explain *why*, not *what*. The diff
  shows the *what*.
- **Footer:** `Refs: <issue-link>` for related issues.
  `BREAKING CHANGE: <note>` for breaking changes.

## Types

| Type       | Use for                                              |
|------------|------------------------------------------------------|
| `feat`     | New user-facing feature                              |
| `fix`      | Bug fix                                              |
| `chore`    | Tooling, deps, config (no user-facing change)        |
| `refactor` | Internal change, no behaviour delta                  |
| `test`     | Add or fix tests only                                |
| `docs`     | Documentation only                                   |
| `style`    | Formatting (Prettier, lint auto-fix)                 |
| `perf`     | Performance improvement                              |
| `build`    | Build system / native / EAS changes                  |
| `ci`       | CI pipeline changes                                  |
| `revert`   | Reverts a previous commit                            |

## Examples

```
feat(api): add useListItems hook for /items

Refs: VCR-123
```

```
fix(billing): acknowledge purchase on 409 to clear Play refund window

The verify endpoint returns 409 when the purchase token is owned by a
different account. We were silently failing the ack, leaving a 3-day
window where the user could be refunded but our store still showed
premium.

Refs: VCR-456
```

```
refactor(api): drop legacy useSubscriptionStatus hook

All call sites migrated to usePaymentSubscriptionStatus. The legacy
hook hit /webhooks/... and returned a different shape.

BREAKING CHANGE: removes useSubscriptionStatus from the public API.
```

## Scopes (preferred)

`api`, `app`, `screen`, `billing`, `auth`, `component`, `hook`,
`e2e`, `lint`, `release`, `infra`, `docs`.
