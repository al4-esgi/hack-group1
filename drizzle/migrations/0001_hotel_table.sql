-- Drop old flat hotel table if it exists
DROP TABLE IF EXISTS hotel CASCADE;

-- Hotels table with FK to countries and cities
CREATE TABLE IF NOT EXISTS hotels (
  id serial PRIMARY KEY,
  object_id varchar(40) NOT NULL,
  name varchar(255) NOT NULL,
  slug varchar(255),
  original_slug varchar(255),
  canonical_url varchar(500),
  content text,
  address varchar(500),
  phone varchar(60),
  postal_code varchar(20),
  neighborhood varchar(120),
  currency varchar(10),
  city_id integer REFERENCES cities(id) ON DELETE SET NULL ON UPDATE CASCADE,
  country_id integer REFERENCES countries(id) ON DELETE SET NULL ON UPDATE CASCADE,
  region_name varchar(120),
  lat numeric(9,6),
  lng numeric(9,6),
  check_in_time real,
  check_out_time real,
  num_rooms integer,
  num_reviews integer,
  loved_count integer,
  commission_rate real,
  max_guests integer,
  max_children integer,
  bookable boolean,
  is_plus boolean,
  sustainable_hotel boolean,
  new_to_selection boolean,
  hotel_id varchar(40),
  booking_dot_com_hotel_id integer,
  main_image_url varchar(500),
  distinction varchar(60),
  criteria_atmosphere varchar(120),
  criteria_style varchar(120),
  app_clip_banner_url varchar(500),
  short_link varchar(500),
  michelin_guide_url varchar(500),
  url varchar(500),
  policy text,
  languages jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT hotels_object_id_unique UNIQUE (object_id)
);

CREATE INDEX IF NOT EXISTS hotels_city_id_idx ON hotels(city_id);
CREATE INDEX IF NOT EXISTS hotels_country_id_idx ON hotels(country_id);
CREATE INDEX IF NOT EXISTS hotels_name_idx ON hotels(name);
CREATE INDEX IF NOT EXISTS hotels_lat_lng_idx ON hotels(lat, lng);

-- Hotel amenities taxonomy table
CREATE TABLE IF NOT EXISTS hotel_amenities (
  id serial PRIMARY KEY,
  name varchar(120) NOT NULL,
  normalized_name varchar(140) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT hotel_amenities_normalized_name_unique UNIQUE (normalized_name)
);

-- Many-to-many join table
CREATE TABLE IF NOT EXISTS hotel_hotel_amenities (
  hotel_id integer NOT NULL REFERENCES hotels(id) ON DELETE CASCADE ON UPDATE CASCADE,
  amenity_id integer NOT NULL REFERENCES hotel_amenities(id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (hotel_id, amenity_id)
);

CREATE INDEX IF NOT EXISTS hotel_hotel_amenities_hotel_id_idx ON hotel_hotel_amenities(hotel_id);
CREATE INDEX IF NOT EXISTS hotel_hotel_amenities_amenity_id_idx ON hotel_hotel_amenities(amenity_id);
