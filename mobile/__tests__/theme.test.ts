import {
  DAY_STARTS_HOUR,
  isDaytime,
  nextMode,
  NIGHT_STARTS_HOUR,
  THEME_MODES,
} from '../src/utils/daylight';

function at(hour: number, minute = 0): Date {
  const date = new Date(2026, 7, 21, hour, minute, 0, 0);
  return date;
}

describe('isDaytime', () => {
  it('treats the start of the day window as daytime', () => {
    expect(isDaytime(at(DAY_STARTS_HOUR))).toBe(true);
  });

  it('treats the moment before the day window as night', () => {
    expect(isDaytime(at(DAY_STARTS_HOUR - 1, 59))).toBe(false);
  });

  it('treats the start of the night window as night', () => {
    expect(isDaytime(at(NIGHT_STARTS_HOUR))).toBe(false);
  });

  it('treats the moment before the night window as daytime', () => {
    expect(isDaytime(at(NIGHT_STARTS_HOUR - 1, 59))).toBe(true);
  });

  it.each([7, 9, 12, 15, 17])('is daytime at %i:00', (hour) => {
    expect(isDaytime(at(hour))).toBe(true);
  });

  it.each([0, 3, 5, 19, 22, 23])('is night at %i:00', (hour) => {
    expect(isDaytime(at(hour))).toBe(false);
  });
});

describe('theme modes', () => {
  it('offers auto, system, light and dark', () => {
    expect([...THEME_MODES]).toEqual(['auto', 'system', 'light', 'dark']);
  });

  it('cycles back to the first mode from the last', () => {
    expect(nextMode('auto')).toBe('system');
    expect(nextMode('system')).toBe('light');
    expect(nextMode('light')).toBe('dark');
    expect(nextMode('dark')).toBe('auto');
  });
});
