// ============================================
// Health data: profiles, cycles, daily logs, pregnancies
// ============================================
//
// Mirrors the DRF serializers in `apps/backend/apps/api/apps/{users,cycles,pregnancy}`.
// Dates are `YYYY-MM-DD` strings; datetimes are RFC 3339 UTC strings.
// Every list endpoint returns a `PaginateQuery<T>` envelope.

export type ProfileMode =
  | 'cycle_tracking'
  | 'trying_to_conceive'
  | 'pregnancy'
  | 'postpartum';

export type DietPreference =
  | 'unspecified'
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'halal'
  | 'kosher';

export type BudgetTier = 'unspecified' | 'low' | 'medium' | 'high';

export type MedicalCondition =
  | 'pcos'
  | 'endometriosis'
  | 'fibroids'
  | 'thyroid_disorder'
  | 'diabetes'
  | 'gestational_diabetes'
  | 'hypertension'
  | 'anemia'
  | 'pcod';

export interface Profile {
  id: string;
  mode: ProfileMode;
  date_of_birth: string | null;
  /** ISO 3166-1 alpha-2, uppercased server-side; may be empty. */
  country: string;
  /** BCP 47 tag, e.g. `en`. */
  language: string;
  /** IANA name, e.g. `Asia/Dhaka`. */
  timezone: string;
  diet: DietPreference;
  budget_tier: BudgetTier;
  height: number | null;
  weight: number | null;
  goals: string[];
  source: string;
  medical_conditions: MedicalCondition[];
  created_at: string;
  updated_at: string;
}

export type ProfileWrite = Partial<
  Pick<
    Profile,
    | 'mode'
    | 'date_of_birth'
    | 'country'
    | 'language'
    | 'timezone'
    | 'diet'
    | 'budget_tier'
    | 'height'
    | 'weight'
    | 'goals'
    | 'source'
    | 'medical_conditions'
  >
>;

// --------------------------------------------
// Cycles
// --------------------------------------------

export interface Cycle {
  id: string;
  start_date: string;
  end_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** 409 `resource-conflict` on a duplicate `start_date` for the same user. */
export interface CycleWrite {
  start_date: string;
  end_date?: string | null;
  notes?: string;
}

// --------------------------------------------
// Daily logs (one per user per calendar day)
// --------------------------------------------

export type Flow = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export type Mood = 'unspecified' | 'great' | 'good' | 'neutral' | 'low' | 'bad';

export type Symptom =
  | 'cramps'
  | 'headache'
  | 'bloating'
  | 'breast_tenderness'
  | 'acne'
  | 'fatigue'
  | 'nausea'
  | 'back_pain'
  | 'mood_swings'
  | 'anxiety'
  | 'low_mood'
  | 'insomnia'
  | 'food_cravings'
  | 'dizziness'
  | 'constipation'
  | 'diarrhea'
  | 'hot_flashes'
  | 'spotting';

export interface DailyLog {
  id: string;
  date: string;
  flow: Flow;
  mood: Mood;
  symptoms: Symptom[];
  /** DRF decimal — serialized as a string, e.g. `"36.60"`. */
  temperature_celsius: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** 409 `resource-conflict` on a duplicate `date` — PATCH the existing log instead. */
export interface DailyLogWrite {
  date: string;
  flow?: Flow;
  mood?: Mood;
  symptoms?: Symptom[];
  temperature_celsius?: string | null;
  notes?: string;
}

// --------------------------------------------
// Pregnancies
// --------------------------------------------

export type PregnancyStatus = 'active' | 'completed' | 'ended';

export interface Pregnancy {
  id: string;
  /** First day of the last menstrual period. */
  lmp_date: string | null;
  due_date: string;
  status: PregnancyStatus;
  notes: string;
  /** Server-computed; null when the anchor date is in the future. */
  current_week: number | null;
  created_at: string;
  updated_at: string;
}

/** 409 `resource-conflict` when an `active` pregnancy already exists. */
export interface PregnancyWrite {
  due_date: string;
  lmp_date?: string | null;
  status?: PregnancyStatus;
  notes?: string;
}
