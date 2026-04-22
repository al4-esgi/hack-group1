import { hotels } from 'src/hotels/hotels.entity';
import { hotelAmenities } from 'src/hotels/hotel-amenities.entity';
import { hotelHotelAmenities } from 'src/hotels/hotel-hotel-amenities.entity';
import { awardTypes } from "src/restaurants/entities/award-types.entity";
import { cities } from "src/restaurants/entities/cities.entity";
import { countries } from "src/restaurants/entities/countries.entity";
import { cuisines } from "src/restaurants/entities/cuisines.entity";
import { facilities } from "src/restaurants/entities/facilities.entity";
import { ingestionLogs } from "src/restaurants/entities/ingestion-logs.entity";
import { restaurantAwards } from "src/restaurants/entities/restaurant-awards.entity";
import { restaurantCuisines } from "src/restaurants/entities/restaurant-cuisines.entity";
import { restaurantFacilities } from "src/restaurants/entities/restaurant-facilities.entity";
import { restaurants } from "src/restaurants/entities/restaurants.entity";
import { user } from "src/users/users.entity";

export const schema = {
  user,
  countries,
  cities,
  restaurants,
  cuisines,
  restaurantCuisines,
  facilities,
  restaurantFacilities,
  awardTypes,
  restaurantAwards,
  ingestionLogs,
  hotel: hotels,
  hotelAmenities,
  hotelHotelAmenities,
};

export type { GetUserType } from "src/users/users.entity";

export type Schema = typeof schema;
export type SchemaName = keyof Schema;

export type { SelectHotel } from 'src/hotels/hotels.entity';
