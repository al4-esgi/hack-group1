export const MICHELIN_STAR_CODE = 'MICHELIN_STAR' as const;
export const BIB_GOURMAND_CODE = 'BIB_GOURMAND' as const;
export const SELECTED_CODE = 'SELECTED' as const;
export const GREEN_STAR_CODE = 'GREEN_STAR' as const;

export const MAIN_AWARD_CODES = [MICHELIN_STAR_CODE, BIB_GOURMAND_CODE, SELECTED_CODE] as const;
export type MainAwardCode = (typeof MAIN_AWARD_CODES)[number];

export const AWARD_CODES = [...MAIN_AWARD_CODES, GREEN_STAR_CODE] as const;
export type AwardCode = (typeof AWARD_CODES)[number];
