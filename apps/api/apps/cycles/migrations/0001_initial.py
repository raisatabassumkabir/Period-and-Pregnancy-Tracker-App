import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

# ---------------------------------------------------------------------------
# RLS for the two clinical tables this app creates, applied in the SAME
# migration as the tables themselves (RULE 2).
#
# Anatomy of each block (see apps/users/migrations/0001_initial.py for the
# full line-by-line commentary; identical pattern):
#
#   ENABLE + FORCE ROW LEVEL SECURITY
#       FORCE is the part people forget: our Django role OWNS these tables and
#       owners bypass RLS unless forced. Without FORCE, every policy below is
#       decorative.
#
#   POLICY owner
#       USING      gates SELECT/UPDATE/DELETE visibility,
#       WITH CHECK gates INSERT/UPDATE'd row values —
#       both require user_id = app.user_id (transaction-local, set by
#       RLSMiddleware). NULLIF('' , ...) + missing_ok=true mean an unset or
#       anonymous context compares against NULL → zero rows → deny by default.
#
#   POLICY bypass
#       OR'd escape hatch for seeds/admin/maintenance via app.bypass='on'
#       (apps.core.rls context managers only).
# ---------------------------------------------------------------------------
CYCLES_RLS_SQL = """
ALTER TABLE cycles_cycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles_cycle FORCE  ROW LEVEL SECURITY;

CREATE POLICY owner ON cycles_cycle
  USING      (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY bypass ON cycles_cycle
  USING      (current_setting('app.bypass', true) = 'on')
  WITH CHECK (current_setting('app.bypass', true) = 'on');

ALTER TABLE cycles_dailylog ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles_dailylog FORCE  ROW LEVEL SECURITY;

CREATE POLICY owner ON cycles_dailylog
  USING      (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY bypass ON cycles_dailylog
  USING      (current_setting('app.bypass', true) = 'on')
  WITH CHECK (current_setting('app.bypass', true) = 'on');
"""

CYCLES_RLS_REVERSE_SQL = """
DROP POLICY IF EXISTS bypass ON cycles_dailylog;
DROP POLICY IF EXISTS owner  ON cycles_dailylog;
ALTER TABLE cycles_dailylog NO FORCE ROW LEVEL SECURITY;
ALTER TABLE cycles_dailylog DISABLE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bypass ON cycles_cycle;
DROP POLICY IF EXISTS owner  ON cycles_cycle;
ALTER TABLE cycles_cycle NO FORCE ROW LEVEL SECURITY;
ALTER TABLE cycles_cycle DISABLE  ROW LEVEL SECURITY;
"""


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Cycle",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField(blank=True, null=True)),
                ("notes", models.TextField(blank=True, default="")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(app_label)s_%(class)s_set", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-start_date"],
            },
        ),
        migrations.CreateModel(
            name="DailyLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("date", models.DateField()),
                ("flow", models.CharField(choices=[("none", "None"), ("spotting", "Spotting"), ("light", "Light"), ("medium", "Medium"), ("heavy", "Heavy")], default="none", max_length=16)),
                ("mood", models.CharField(choices=[("unspecified", "Unspecified"), ("great", "Great"), ("good", "Good"), ("neutral", "Neutral"), ("low", "Low"), ("bad", "Bad")], default="unspecified", max_length=16)),
                ("symptoms", models.JSONField(blank=True, default=list)),
                ("temperature_celsius", models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ("notes", models.TextField(blank=True, default="")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(app_label)s_%(class)s_set", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-date"],
            },
        ),
        migrations.AddConstraint(
            model_name="cycle",
            constraint=models.UniqueConstraint(fields=("user", "start_date"), name="uniq_cycle_user_start"),
        ),
        migrations.AddConstraint(
            model_name="cycle",
            constraint=models.CheckConstraint(
                condition=models.Q(("end_date__isnull", True)) | models.Q(("end_date__gte", models.F("start_date"))),
                name="cycle_end_after_start",
            ),
        ),
        migrations.AddConstraint(
            model_name="dailylog",
            constraint=models.UniqueConstraint(fields=("user", "date"), name="uniq_dailylog_user_date"),
        ),
        # RLS in the same migration that creates the tables — never a follow-up.
        migrations.RunSQL(sql=CYCLES_RLS_SQL, reverse_sql=CYCLES_RLS_REVERSE_SQL),
    ]
