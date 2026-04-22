import { type MainAwardCode } from "src/restaurants/_constants";
import {
  normalizeAward,
  normalizeKey,
  normalizeLabel,
  normalizeLocation,
  normalizePrice,
  splitCommaList,
} from "./normalizers";

export type RestaurantRowMapped = {
  name: string;
  address: string;
  location: { city: string; country: string | null };
  priceLevel: number | null;
  cuisines: string[];
  longitude: string;
  latitude: string;
  phoneNumber: string | null;
  sourceUrl: string;
  websiteUrl: string | null;
  award: { code: MainAwardCode; starsCount: 1 | 2 | 3 | null };
  greenStar: boolean;
  facilities: string[];
  description: string;
  normalizedCuisineKeys: string[];
};

const GREEN_STAR_TRUE_VALUES = new Set(["1", "true", "yes", "y", "oui"]);

export const mapRestaurantRow = (
  row: Record<string, string>,
): RestaurantRowMapped => {
  const cuisines = splitCommaList(row.Cuisine);
  return {
    name: normalizeLabel(row.Name),
    address: normalizeLabel(row.Address),
    location: normalizeLocation(row.Location),
    priceLevel: normalizePrice(row.Price),
    cuisines,
    longitude: normalizeLabel(row.Longitude),
    latitude: normalizeLabel(row.Latitude),
    phoneNumber: row.PhoneNumber ? normalizeLabel(row.PhoneNumber) : null,
    sourceUrl: normalizeLabel(row.Url),
    websiteUrl: row.WebsiteUrl ? normalizeLabel(row.WebsiteUrl) : null,
    award: normalizeAward(row.Award),
    greenStar: GREEN_STAR_TRUE_VALUES.has(
      normalizeLabel(row.GreenStar).toLowerCase(),
    ),
    facilities: splitCommaList(row.FacilitiesAndServices),
    description: row.Description?.trim() ?? "",
    normalizedCuisineKeys: cuisines.map(normalizeKey),
  };
};
