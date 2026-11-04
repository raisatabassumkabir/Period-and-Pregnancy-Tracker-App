import en from '@/translations/en.json';

import { babySizeKey, FIRST_SIZED_WEEK, LAST_SIZED_WEEK } from './baby-size';

describe('babySizeKey', () => {
  it('has nothing to compare before week 4', () => {
    expect(babySizeKey(null)).toBeNull();
    expect(babySizeKey(3)).toBeNull();
  });

  it('names a size for week 18', () => {
    expect(babySizeKey(18)).toBe('baby_sizes.w18');
  });

  it('stays at the full-term size past week 40', () => {
    expect(babySizeKey(42)).toBe('baby_sizes.w40');
  });

  it('has an English entry for every week it can return', () => {
    for (let week = FIRST_SIZED_WEEK; week <= LAST_SIZED_WEEK; week++) {
      const key = `w${week}` as keyof typeof en.baby_sizes;
      expect(en.baby_sizes[key]).toEqual(expect.any(String));
    }
  });
});
