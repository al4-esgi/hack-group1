import { customType } from 'drizzle-orm/pg-core';

export const geographyPoint = customType<{ data: string; driverParam: string }>({
  dataType: () => 'geography',
  toDriver: (value: string) => value,
  fromDriver: (value: string) => value,
});
