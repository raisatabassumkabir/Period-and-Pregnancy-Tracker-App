#!/usr/bin/env python
"""
Standalone Python script to create the 3 clean-slate test accounts for Happy Women.
Can be executed from root, apps/api, or apps/backend/apps/api:
    python scripts/create_test_accounts_script.py
"""

import os
import sys
from pathlib import Path

# Add possible apps/api paths to python path
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
api_dir = project_root / "apps" / "api"
backend_api_dir = project_root / "apps" / "backend" / "apps" / "api"

if api_dir.exists():
    sys.path.insert(0, str(api_dir))
elif backend_api_dir.exists():
    sys.path.insert(0, str(backend_api_dir))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

try:
    import django
    django.setup()
except Exception as exc:
    print(f"Failed to configure Django environment: {exc}")
    print("If running with a specific virtual environment or uv, execute:")
    print("    python manage.py create_test_accounts")
    sys.exit(1)

from django.core.management import call_command

if __name__ == "__main__":
    call_command("create_test_accounts")
