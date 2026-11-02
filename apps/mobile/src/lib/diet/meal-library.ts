import type { MealSlot } from './meal-plans';

/**
 * Hand-reviewed meal library the daily planner rotates through. Values are
 * typical single-serving estimates (kcal, protein in grams) for an adult
 * portion; the planner scales portions to her targets.
 *
 * Diet fit is derived from `contains`, so one tag list serves vegan,
 * vegetarian, pescatarian, halal and kosher filters. `pregnancyUnsafe` marks
 * foods NHS/ACOG advise avoiding in pregnancy (raw or cold-smoked fish, liver).
 * Names live in `src/translations/*.json` under `meal_library.meals.<id>`.
 */
export type Ingredient =
  | 'meat'
  | 'poultry'
  | 'fish'
  | 'shellfish'
  | 'dairy'
  | 'egg';

export type Nutrient =
  | 'iron'
  | 'folate'
  | 'omega3'
  | 'magnesium'
  | 'calcium'
  | 'fibre'
  | 'protein'
  | 'vitamin_c'
  | 'b6'
  | 'complex_carbs';

export interface LibraryMeal {
  id: MealId;
  slot: MealSlot;
  kcal: number;
  proteinG: number;
  contains: readonly Ingredient[];
  nutrients: readonly Nutrient[];
  pregnancyUnsafe?: true;
}

export const MEAL_IDS = [
  'b01',
  'b02',
  'b03',
  'b04',
  'b05',
  'b06',
  'b07',
  'b08',
  'b09',
  'b10',
  'b11',
  'b12',
  'b13',
  'b14',
  'b15',
  'b16',
  'b17',
  'b18',
  'b19',
  'b20',
  'l01',
  'l02',
  'l03',
  'l04',
  'l05',
  'l06',
  'l07',
  'l08',
  'l09',
  'l10',
  'l11',
  'l12',
  'l13',
  'l14',
  'l15',
  'l16',
  'l17',
  'l18',
  'l19',
  'l20',
  'd01',
  'd02',
  'd03',
  'd04',
  'd05',
  'd06',
  'd07',
  'd08',
  'd09',
  'd10',
  'd11',
  'd12',
  'd13',
  'd14',
  'd15',
  'd16',
  'd17',
  'd18',
  'd19',
  'd20',
  's01',
  's02',
  's03',
  's04',
  's05',
  's06',
  's07',
  's08',
  's09',
  's10',
  's11',
  's12',
  's13',
  's14',
  's15',
  's16',
  's17',
  's18',
  's19',
  's20',
] as const;

export type MealId = (typeof MEAL_IDS)[number];

type MealRow = [
  MealId,
  number,
  number,
  readonly Ingredient[],
  readonly Nutrient[],
  boolean?,
];

const SLOT_BY_PREFIX: Readonly<Record<string, MealSlot>> = {
  b: 'breakfast',
  l: 'lunch',
  d: 'dinner',
  s: 'snack',
};

// [id, kcal, proteinG, contains, nutrients, pregnancyUnsafe]
const ROWS: readonly MealRow[] = [
  ['b01', 420, 15, [], ['complex_carbs', 'magnesium', 'b6', 'fibre']],
  ['b02', 400, 26, ['egg', 'dairy'], ['iron', 'folate', 'calcium', 'protein']],
  ['b03', 330, 22, ['dairy'], ['calcium', 'omega3', 'vitamin_c', 'protein']],
  ['b04', 450, 24, ['egg'], ['iron', 'fibre', 'folate', 'protein']],
  ['b05', 420, 21, ['egg'], ['vitamin_c', 'iron', 'protein']],
  ['b06', 380, 22, [], ['iron', 'calcium', 'protein', 'vitamin_c']],
  [
    'b07',
    440,
    14,
    ['dairy'],
    ['complex_carbs', 'magnesium', 'omega3', 'fibre'],
  ],
  ['b08', 390, 20, ['dairy'], ['iron', 'folate', 'protein', 'fibre']],
  ['b09', 480, 20, ['egg'], ['protein', 'b6']],
  ['b10', 410, 23, ['fish'], ['omega3', 'protein'], true],
  ['b11', 360, 17, [], ['iron', 'folate', 'fibre']],
  ['b12', 360, 15, ['dairy'], ['calcium', 'vitamin_c']],
  ['b13', 380, 13, [], ['magnesium', 'vitamin_c', 'fibre', 'complex_carbs']],
  ['b14', 390, 20, ['egg'], ['protein', 'vitamin_c', 'folate']],
  ['b15', 430, 19, [], ['b6', 'magnesium', 'complex_carbs']],
  ['b16', 320, 25, ['dairy'], ['protein', 'magnesium', 'calcium']],
  ['b17', 430, 19, ['egg'], ['protein', 'complex_carbs', 'iron']],
  ['b18', 400, 16, ['dairy'], ['fibre', 'omega3', 'vitamin_c', 'calcium']],
  ['b19', 420, 19, ['egg'], ['b6', 'complex_carbs', 'vitamin_c']],
  ['b20', 380, 14, [], ['fibre', 'iron', 'folate']],

  ['l01', 450, 22, [], ['iron', 'folate', 'fibre']],
  ['l02', 520, 40, ['poultry'], ['protein', 'folate', 'vitamin_c']],
  ['l03', 560, 20, [], ['iron', 'folate', 'fibre', 'complex_carbs']],
  ['l04', 480, 32, ['fish'], ['protein', 'omega3']],
  ['l05', 580, 35, ['meat'], ['iron', 'protein', 'b6']],
  ['l06', 540, 21, [], ['iron', 'fibre', 'magnesium', 'complex_carbs']],
  ['l07', 590, 32, ['fish'], ['omega3', 'protein'], true],
  ['l08', 560, 19, [], ['fibre', 'iron', 'vitamin_c']],
  ['l09', 600, 38, ['poultry', 'dairy'], ['protein', 'b6']],
  ['l10', 560, 26, ['dairy'], ['calcium', 'protein']],
  ['l11', 500, 19, ['egg'], ['protein', 'b6', 'complex_carbs']],
  ['l12', 500, 24, [], ['calcium', 'iron', 'protein']],
  ['l13', 540, 20, ['dairy'], ['iron', 'fibre', 'complex_carbs']],
  ['l14', 500, 32, ['poultry'], ['protein', 'b6']],
  ['l15', 560, 34, ['fish'], ['protein', 'omega3', 'iron']],
  ['l16', 490, 18, [], ['fibre', 'magnesium', 'folate']],
  ['l17', 460, 32, ['poultry'], ['protein', 'fibre', 'b6']],
  ['l18', 520, 21, [], ['iron', 'folate', 'magnesium']],
  ['l19', 450, 28, ['fish'], ['omega3', 'calcium', 'protein']],
  ['l20', 560, 24, ['dairy'], ['calcium', 'vitamin_c']],

  ['d01', 580, 38, ['fish'], ['omega3', 'b6', 'vitamin_c', 'calcium']],
  ['d02', 600, 40, ['poultry'], ['protein', 'b6', 'iron']],
  ['d03', 560, 40, ['meat'], ['iron', 'protein', 'fibre']],
  ['d04', 520, 26, [], ['calcium', 'magnesium', 'vitamin_c']],
  ['d05', 520, 38, ['fish'], ['omega3', 'protein', 'folate']],
  ['d06', 580, 27, ['dairy'], ['calcium', 'folate', 'iron']],
  ['d07', 500, 17, [], ['fibre', 'b6', 'magnesium']],
  ['d08', 620, 34, ['meat'], ['iron', 'protein']],
  ['d09', 540, 25, ['egg', 'dairy'], ['protein', 'b6', 'calcium']],
  ['d10', 510, 32, ['shellfish'], ['protein', 'omega3']],
  ['d11', 540, 22, [], ['fibre', 'iron', 'magnesium']],
  ['d12', 600, 42, ['poultry'], ['protein', 'b6']],
  ['d13', 540, 34, ['poultry'], ['vitamin_c', 'protein']],
  ['d14', 520, 22, [], ['iron', 'fibre', 'complex_carbs']],
  ['d15', 580, 34, ['fish'], ['omega3', 'iron', 'b6']],
  ['d16', 570, 30, ['dairy'], ['calcium', 'protein']],
  ['d17', 520, 36, ['poultry'], ['iron', 'folate'], true],
  ['d18', 520, 20, ['dairy'], ['fibre', 'magnesium', 'calcium']],
  ['d19', 590, 38, ['meat'], ['iron', 'protein', 'vitamin_c']],
  ['d20', 560, 28, [], ['protein', 'magnesium', 'b6']],

  ['s01', 220, 4, [], ['magnesium', 'omega3', 'complex_carbs']],
  ['s02', 180, 15, ['dairy'], ['calcium', 'protein']],
  ['s03', 230, 7, [], ['fibre', 'magnesium']],
  ['s04', 150, 13, ['egg'], ['protein', 'b6']],
  ['s05', 200, 10, [], ['iron', 'fibre', 'folate']],
  ['s06', 220, 6, [], ['magnesium', 'iron']],
  ['s07', 180, 7, [], ['fibre', 'vitamin_c']],
  ['s08', 150, 16, ['dairy'], ['protein', 'calcium']],
  ['s09', 190, 17, [], ['protein', 'folate', 'iron']],
  ['s10', 230, 9, ['dairy'], ['b6', 'calcium']],
  ['s11', 200, 8, [], ['vitamin_c', 'magnesium', 'iron']],
  ['s12', 240, 7, [], ['magnesium', 'iron']],
  ['s13', 220, 11, ['dairy'], ['calcium', 'complex_carbs']],
  ['s14', 190, 9, ['dairy'], ['calcium', 'protein']],
  ['s15', 200, 10, [], ['vitamin_c', 'calcium']],
  ['s16', 180, 18, ['fish'], ['protein', 'omega3']],
  ['s17', 210, 10, [], ['iron', 'fibre', 'vitamin_c']],
  ['s18', 210, 6, [], ['vitamin_c', 'magnesium']],
  ['s19', 260, 18, ['dairy'], ['protein', 'calcium', 'fibre']],
  ['s20', 250, 10, [], ['magnesium', 'b6', 'complex_carbs']],
];

export const MEAL_LIBRARY: readonly LibraryMeal[] = ROWS.map(
  ([id, kcal, proteinG, contains, nutrients, unsafe]) => ({
    id,
    slot: SLOT_BY_PREFIX[id[0]],
    kcal,
    proteinG,
    contains,
    nutrients,
    ...(unsafe ? { pregnancyUnsafe: true as const } : {}),
  })
);
