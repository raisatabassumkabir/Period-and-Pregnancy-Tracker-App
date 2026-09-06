#!/usr/bin/env python
"""
CI lint for RULE 1: views never call `.objects.all()` or bare
`.objects.filter(...)` — everything goes through `.for_user(request.user)`.

Scans every views.py under apps/. A line can opt out with a trailing
`# rls: allow` comment plus a justification, which makes exceptions greppable
and reviewable.

Usage: uv run python scripts/lint_owned_queries.py
"""

import re
import sys
from pathlib import Path

FORBIDDEN = re.compile(r"\.objects\.(all|filter|get|exclude)\(")
OPT_OUT = "# rls: allow"

API_ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    violations = []
    for path in (API_ROOT / "apps").rglob("views.py"):
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if FORBIDDEN.search(line) and OPT_OUT not in line and ".objects.none()" not in line:
                # .for_user(...) on the same chain is the sanctioned pattern.
                if ".for_user(" in line:
                    continue
                violations.append(f"{path.relative_to(API_ROOT)}:{lineno}: {line.strip()}")
    if violations:
        print("Unscoped queryset access in views (use .for_user(request.user)):")
        print("\n".join(violations))
        return 1
    print("lint_owned_queries: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
