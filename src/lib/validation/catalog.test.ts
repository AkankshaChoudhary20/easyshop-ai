import { describe, expect, it } from 'vitest';
import { normalizePriceRange } from './catalog';

describe('normalizePriceRange', () => {
  it.each([Infinity, -Infinity, NaN])('rejects non-finite bound %s', (value) => {
    expect(normalizePriceRange(value, 50)).toEqual([null, 50]);
    expect(normalizePriceRange(10, value)).toEqual([10, null]);
  });
  it('retains zero, swaps inverted finite bounds, and rejects negatives', () => {
    expect(normalizePriceRange(0, 50)).toEqual([0, 50]);
    expect(normalizePriceRange(50, 10)).toEqual([10, 50]);
    expect(normalizePriceRange(-1, null)).toEqual([null, null]);
  });
});
