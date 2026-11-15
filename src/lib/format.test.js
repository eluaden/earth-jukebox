import { describe, expect, it } from 'vitest';
import { formatDate, formatTemp } from './format.js';

describe('formatDate', () => {
  it('shows abbreviated month and year per language', () => {
    expect(formatDate('2007-09-13T12:00Z', 'en')).toBe('SEP 2007');
    expect(formatDate('2007-09-13T12:00Z', 'pt')).toBe('SET 2007');
    expect(formatDate('2007-09-13T12:00Z', 'es')).toBe('SEP 2007');
    expect(formatDate('2008-01-02T03:44Z', 'es')).toBe('ENE 2008');
    expect(formatDate('2007-04-30T23:00Z', 'pt')).toBe('ABR 2007');
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
