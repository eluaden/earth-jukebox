import { describe, expect, it } from 'vitest';
import { chipValue, formatDate, formatTemp, longDate } from './format.js';

describe('formatDate', () => {
  it('shows abbreviated month and year per language', () => {
    expect(formatDate('2007-09-13T12:00Z', 'en')).toBe('SEP 2007');
    expect(formatDate('2007-09-13T12:00Z', 'pt')).toBe('SET 2007');
    expect(formatDate('2007-09-13T12:00Z', 'es')).toBe('SEP 2007');
    expect(formatDate('2008-01-02T03:44Z', 'es')).toBe('ENE 2008');
    expect(formatDate('2007-04-30T23:00Z', 'pt')).toBe('ABR 2007');
  });
  it('shows the year alone on tracks with one step per year', () => {
    expect(formatDate('2012-07-01T00:00Z', 'pt', 'year')).toBe('2012');
    expect(longDate('2012-07-01T00:00Z', 'es', 'year')).toBe('2012');
  });
});

describe('longDate', () => {
  it('spells the month out for screen readers and narration', () => {
    expect(longDate('2017-08-08T01:25Z', 'en')).toBe('August 2017');
    expect(longDate('2018-01-25T01:25Z', 'pt')).toBe('janeiro de 2018');
  });
});

describe('formatTemp', () => {
  it('uses a decimal point in English and a comma in Portuguese and Spanish', () => {
    expect(formatTemp(17.84, 'en')).toBe('17.8 °C');
    expect(formatTemp(17.84, 'pt')).toBe('17,8 °C');
    expect(formatTemp(0, 'es')).toBe('0,0 °C');
  });
  it('shows a dash when there is no value', () => {
    expect(formatTemp(NaN, 'es')).toBe('—');
  });
});

describe('chipValue', () => {
  it('formats each unit with its suffix', () => {
    expect(chipValue('°C', 17.84, 'pt')).toEqual({ value: '17,8', suffix: '°C' });
    expect(chipValue('share', 0.0242, 'en')).toEqual({ value: '2.4', suffix: '%' });
    expect(chipValue('brightness', 12.34, 'es')).toEqual({ value: '12,3', suffix: '/255' });
  });
  it('signs a change: minus for lights going out, plus for new lights, none at zero', () => {
    expect(chipValue('change', 0.04, 'en', -1)).toEqual({ value: '−4.0', suffix: '%' });
    expect(chipValue('change', 0.1, 'pt', 1)).toEqual({ value: '+10,0', suffix: '%' });
    expect(chipValue('change', 0, 'en', -1)).toEqual({ value: '0.0', suffix: '%' });
  });
  it('shows a dash and no suffix when there is no value', () => {
    expect(chipValue('share', NaN, 'en')).toEqual({ value: '—', suffix: '' });
  });
  it('never shows 0.0 for a share or change that is above zero', () => {
    expect(chipValue('share', 0.0003, 'pt')).toEqual({ value: '<0,1', suffix: '%' });
    expect(chipValue('change', 0.0002, 'en', -1)).toEqual({ value: '<0.1', suffix: '%' });
    expect(chipValue('share', 0, 'en')).toEqual({ value: '0.0', suffix: '%' });
  });
});

describe('a single instant and the units of the bonus records', () => {
  it('shows the day of a single instant', () => {
    expect(formatDate('2025-08-19T20:00Z', 'en', 'instant')).toBe('19 AUG 2025');
    expect(formatDate('2025-08-19T20:00Z', 'pt', 'instant')).toBe('19 AGO 2025');
    expect(longDate('2025-08-19T20:00Z', 'en', 'instant')).toBe('19 August 2025');
    expect(longDate('2025-08-19T20:00Z', 'pt', 'instant')).toBe('19 de agosto de 2025');
  });

  it('signs sea level in centimetres, whole when the value is whole', () => {
    expect(chipValue('cm', 6.37, 'en')).toEqual({ value: '+6.4', suffix: 'cm' });
    expect(chipValue('cm', 6.37, 'pt')).toEqual({ value: '+6,4', suffix: 'cm' });
    expect(chipValue('cm', 6, 'en')).toEqual({ value: '+6', suffix: 'cm' });
  });

  it('shows aerosol strength as a percentage of the strongest', () => {
    expect(chipValue('strength', 0.123, 'en')).toEqual({ value: '12', suffix: '%' });
    expect(chipValue('strength', 0.003, 'en')).toEqual({ value: '<1', suffix: '%' });
    expect(chipValue('strength', 0, 'en')).toEqual({ value: '0', suffix: '%' });
  });
});
