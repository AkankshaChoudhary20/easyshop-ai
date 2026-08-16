import { CATEGORIES } from "@/types/product";

export function isValidCategory(value: string | null | undefined): value is string {
  return !!value && (CATEGORIES as readonly string[]).includes(value);
}

/** Clamps/validates a price pair, swapping if inverted. Returns [min, max] with either possibly null. */
export function normalizePriceRange(
  minPrice: number | null,
  maxPrice: number | null,
): [number | null, number | null] {
  let min = typeof minPrice === "number" && minPrice >= 0 ? minPrice : null;
  let max = typeof maxPrice === "number" && maxPrice >= 0 ? maxPrice : null;
  if (min !== null && max !== null && min > max) {
    [min, max] = [max, min];
  }
  return [min, max];
}
