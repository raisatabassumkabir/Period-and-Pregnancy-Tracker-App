import { cycleDietPhaseFor } from './cycle-meal-plans';

const STANDARD_CYCLE = 28;

describe('cycleDietPhaseFor', () => {
  it.each([
    [1, 'menstrual'],
    [5, 'menstrual'],
    [6, 'follicular'],
    [12, 'follicular'],
    [13, 'ovulation'],
    [14, 'ovulation'],
    [15, 'ovulation'],
    [16, 'luteal'],
    [28, 'luteal'],
  ])('day %i of a 28-day cycle is %s', (day, phase) => {
    expect(cycleDietPhaseFor(day, STANDARD_CYCLE)).toBe(phase);
  });

  it('moves ovulation later in a longer cycle', () => {
    expect(cycleDietPhaseFor(14, 35)).toBe('follicular');
    expect(cycleDietPhaseFor(21, 35)).toBe('ovulation');
  });
});
