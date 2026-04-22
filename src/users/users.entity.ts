import {
	pgEnum,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { UserRoleEnum } from "./_utils/user-role.enum";

export const timestamps = {
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
};

export const roleEnum = pgEnum("role", [UserRoleEnum.USER, UserRoleEnum.ADMIN]);

export const user = pgTable("user", {
	id: serial().primaryKey(),
	email: varchar().notNull(),
	firstname: varchar().notNull(),
	lastname: varchar().notNull(),
	google_id: varchar(),
	role: roleEnum().notNull().default(UserRoleEnum.USER),
	...timestamps,
});

export const getUserSchema = createSelectSchema(user);
export type GetUserType = z.infer<typeof getUserSchema>;
