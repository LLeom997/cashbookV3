import { describe, expect, it } from 'vitest';
import { parseCSVRow, parseDateString, parseTimeString } from './utils';

describe('utils parsing', () => {
  it('parses csv rows with quoted commas', () => {
    expect(parseCSVRow('a,"b,c",d')).toEqual(['a', 'b,c', 'd']);
  });

  it('parses dd-mmm-yy dates into iso format', () => {
    expect(parseDateString('7-Apr-26')).toBe('2026-04-07');
  });

  it('parses 12 hour time into 24 hour time', () => {
    expect(parseTimeString('2:05 PM')).toBe('14:05');
  });
});
