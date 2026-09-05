import uuid

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models

import apps.users.managers

# ---------------------------------------------------------------------------
# RLS for users_profile (holds medical_conditions → health data → RLS applies,
# in the SAME migration that creates the table, per RULE 2).
#
# Line by line:
#   ENABLE ROW LEVEL SECURITY  — turns RLS on for the table.
#   FORCE  ROW LEVEL SECURITY  — MANDATORY: table owners bypass RLS by default,
#                                and our Django role owns its tables. Without
#                                FORCE these policies silently do nothing.
#   POLICY owner               — the row is visible (USING) and writable
#                                (WITH CHECK) only when its user_id equals the
#                                transaction-local variable app.user_id.
#     current_setting('app.user_id', true)
#                              — second arg `true` = missing_ok: returns NULL
#                                instead of erroring when the variable was never
#                                set (e.g. a shell session).
#     NULLIF(..., '')          — RLSMiddleware sets '' for anonymous requests;
#                                NULLIF folds that to NULL too.
#     ... ::uuid = user_id     — NULL compared to anything is NULL → row NOT
#                                visible. Deny by default: forgotten middleware
#                                breaks the request instead of leaking rows.
#   POLICY bypass              — escape hatch for admin/seeds/maintenance, only
#                                when app.bypass='on' (set via apps.core.rls
#                                context managers or the admin path in the
#                                middleware). Permissive policies are OR'd.
# ---------------------------------------------------------------------------
PROFILE_RLS_SQL = """
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile FORCE  ROW LEVEL SECURITY;

CREATE POLICY owner ON users_profile
  USING      (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY bypass ON users_profile
  USING      (current_setting('app.bypass', true) = 'on')
  WITH CHECK (current_setting('app.bypass', true) = 'on');
"""

PROFILE_RLS_REVERSE_SQL = """
DROP POLICY IF EXISTS bypass ON users_profile;
DROP POLICY IF EXISTS owner  ON users_profile;
ALTER TABLE users_profile NO FORCE ROW LEVEL SECURITY;
ALTER TABLE users_profile DISABLE  ROW LEVEL SECURITY;
"""


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False, help_text="Designates that this user has all permissions without explicitly assigning them.", verbose_name="superuser status")),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("is_staff", models.BooleanField(default=False)),
                ("is_active", models.BooleanField(default=True)),
                ("date_joined", models.DateTimeField(default=django.utils.timezone.now)),
                ("groups", models.ManyToManyField(blank=True, help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.", related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups")),
                ("user_permissions", models.ManyToManyField(blank=True, help_text="Specific permissions for this user.", related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions")),
            ],
            options={
                "swappable": "AUTH_USER_MODEL",
            },
            managers=[
                ("objects", apps.users.managers.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name="Profile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("mode", models.CharField(choices=[("cycle_tracking", "Cycle tracking"), ("trying_to_conceive", "Trying to conceive"), ("pregnancy", "Pregnancy"), ("postpartum", "Postpartum")], default="cycle_tracking", max_length=32)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                ("country", models.CharField(blank=True, default="", max_length=2)),
                ("language", models.CharField(default="en", max_length=12)),
                ("timezone", models.CharField(default="UTC", max_length=64)),
                ("diet", models.CharField(choices=[("unspecified", "Unspecified"), ("omnivore", "Omnivore"), ("vegetarian", "Vegetarian"), ("vegan", "Vegan"), ("pescatarian", "Pescatarian"), ("halal", "Halal"), ("kosher", "Kosher")], default="unspecified", max_length=16)),
                ("budget_tier", models.CharField(choices=[("unspecified", "Unspecified"), ("low", "Low"), ("medium", "Medium"), ("high", "High")], default="unspecified", max_length=16)),
                ("medical_conditions", models.JSONField(blank=True, default=list)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "users_profile",
            },
        ),
        # RLS in the same migration that creates the table — never a follow-up.
        migrations.RunSQL(sql=PROFILE_RLS_SQL, reverse_sql=PROFILE_RLS_REVERSE_SQL),
    ]
