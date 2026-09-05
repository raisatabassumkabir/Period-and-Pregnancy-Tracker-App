"""
Clinical taxonomies.

These are mirrored (values only, never logic) into packages/shared for the
mobile client when Phase 3 starts. The API copy is authoritative: anything
clinical lives here so there is one place to fix it (ARCHITECTURE §3).
"""

# DailyLog.symptoms JSONB values are validated against this allowlist.
SYMPTOM_TAXONOMY = frozenset(
    {
        "cramps",
        "headache",
        "bloating",
        "breast_tenderness",
        "acne",
        "fatigue",
        "nausea",
        "back_pain",
        "mood_swings",
        "anxiety",
        "low_mood",
        "insomnia",
        "food_cravings",
        "dizziness",
        "constipation",
        "diarrhea",
        "hot_flashes",
        "spotting",
    }
)

# Profile.medical_conditions values. Deliberately coarse for v1 — these feed
# localization of the AI assistant's context (e.g. PCOS-aware answers), not
# diagnosis logic.
CONDITION_TAXONOMY = frozenset(
    {
        "pcos",
        "endometriosis",
        "fibroids",
        "thyroid_disorder",
        "diabetes",
        "gestational_diabetes",
        "hypertension",
        "anemia",
        "pcod",
    }
)
