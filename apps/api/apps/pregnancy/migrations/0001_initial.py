import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

# ---------------------------------------------------------------------------
# RLS for pregnancy_pregnancy, in the SAME migration that creates it (RULE 2).
# Same pattern as users/cycles — full line-by-line commentary lives in
# apps/users/migrations/0001_initial.py. The essentials:
#   FORCE      → binds our table-owning Django role (owners bypass otherwise).
#   owner      → rows visible/writable only when user_id matches the
#                transaction-local app.user_id set by RLSMiddleware; unset or
#                '' folds to NULL → zero rows → deny by default.
#   bypass     → OR'd escape hatch, app.bypass='on' via apps.core.rls only.
# ---------------------------------------------------------------------------
PREGNANCY_RLS_SQL = """
ALTER TABLE pregnancy_pregnancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_pregnancy FORCE  ROW LEVEL SECURITY;

CREATE POLICY owner ON pregnancy_pregnancy
  USING      (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY bypass ON pregnancy_pregnancy
  USING      (current_setting('app.bypass', true) = 'on')
  WITH CHECK (current_setting('app.bypass', true) = 'on');
"""

PREGNANCY_RLS_REVERSE_SQL = """
DROP POLICY IF EXISTS bypass ON pregnancy_pregnancy;
DROP POLICY IF EXISTS owner  ON pregnancy_pregnancy;
ALTER TABLE pregnancy_pregnancy NO FORCE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_pregnancy DISABLE  ROW LEVEL SECURITY;
"""


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Pregnancy",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("lmp_date", models.DateField(blank=True, help_text="First day of last menstrual period.", null=True)),
                ("due_date", models.DateField()),
                ("status", models.CharField(choices=[("active", "Active"), ("completed", "Completed"), ("ended", "Ended")], default="active", max_length=16)),
                ("notes", models.TextField(blank=True, default="")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(app_label)s_%(class)s_set", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "verbose_name_plural": "pregnancies",
            },
        ),
        migrations.AddConstraint(
            model_name="pregnancy",
            constraint=models.UniqueConstraint(
                condition=models.Q(("status", "active")),
                fields=("user",),
                name="uniq_active_pregnancy_per_user",
            ),
        ),
        # RLS in the same migration that creates the table — never a follow-up.
        migrations.RunSQL(sql=PREGNANCY_RLS_SQL, reverse_sql=PREGNANCY_RLS_REVERSE_SQL),
    ]
