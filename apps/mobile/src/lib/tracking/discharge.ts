/**
 * Vaginal discharge is part of the symptom logger's design but has no column
 * on the backend's `DailyLog` yet, so it is an app-only type persisted in the
 * encrypted on-device store (see `use-today-log.ts`). When the API grows a
 * `discharge` field, move this union into `packages/api-contract/src/health.ts`
 * and drop the local persistence — nothing else should need to change.
 */
export type Discharge =
  | 'unspecified'
  | 'none'
  | 'creamy'
  | 'sticky'
  | 'watery'
  | 'egg_white';

export const DISCHARGE_OPTIONS: readonly { value: Discharge; label: string }[] =
  [
    { value: 'none', label: 'No discharge' },
    { value: 'creamy', label: 'Creamy' },
    { value: 'sticky', label: 'Sticky' },
    { value: 'watery', label: 'Watery' },
    { value: 'egg_white', label: 'Egg white' },
  ];

/** `YYYY-MM-DD` -> discharge logged that day. */
export type DischargeLogs = Record<string, Discharge>;
