import { MAIN_AWARD_CODES, type MainAwardCode } from 'src/restaurants/_constants';

export type AwardNormalized = {
  code: MainAwardCode;
  starsCount: 1 | 2 | 3 | null;
};

export type LocationNormalized = { city: string; country: string | null };

export const normalizeLabel = (value: string | null | undefined): string =>
  (value ?? '').trim().replace(/\s+/g, ' ');

export const normalizeKey = (value: string | null | undefined): string => normalizeLabel(value).toLowerCase();

export const splitCommaList = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return [...new Set(value.split(',').map(normalizeLabel).filter(Boolean))];
};

/**
 * Splits a "City, Country" string. Returns `country: null` when the value has no separator
 * (caller decides whether to skip the row or fallback).
 */
export const normalizeLocation = (locationRaw: string | null | undefined): LocationNormalized => {
  const location = normalizeLabel(locationRaw);
  if (!location) {
    return { city: '', country: null };
  }
  const idx = location.lastIndexOf(',');
  if (idx < 0) {
    return { city: location, country: null };
  }
  const country = normalizeLabel(location.slice(idx + 1));
  return { city: normalizeLabel(location.slice(0, idx)), country: country || null };
};

const AWARD_BY_LABEL: Record<string, AwardNormalized> = {
  'Bib Gourmand': { code: 'BIB_GOURMAND', starsCount: null },
  'Selected Restaurants': { code: 'SELECTED', starsCount: null },
  '1 Star': { code: 'MICHELIN_STAR', starsCount: 1 },
  '2 Stars': { code: 'MICHELIN_STAR', starsCount: 2 },
  '3 Stars': { code: 'MICHELIN_STAR', starsCount: 3 },
};

export const normalizeAward = (awardRaw: string | null | undefined): AwardNormalized => {
  const mapped = AWARD_BY_LABEL[normalizeLabel(awardRaw)];
  if (!mapped) {
    throw new Error(`Unsupported award value: "${awardRaw ?? ''}"`);
  }
  return mapped;
};

export const isMainAwardCode = (value: string): value is MainAwardCode =>
  (MAIN_AWARD_CODES as readonly string[]).includes(value);

/**
 * Derives a 1–4 price level from the symbol count in the raw CSV value (e.g. "€€€" → 3).
 * Returns `null` when the cell is empty or unparseable: the `price_level` column is nullable.
 */
export const normalizePrice = (priceRaw: string | null | undefined): number | null => {
  const rawLabel = normalizeLabel(priceRaw);
  if (!rawLabel) {
    return null;
  }
  const count = [...rawLabel].filter(ch => ch.trim() !== '').length;
  if (count < 1 || count > 4) {
    return null;
  }
  return count;
};
