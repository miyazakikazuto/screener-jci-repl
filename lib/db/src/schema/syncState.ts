import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const syncStateTable = pgTable("sync_state", {
  id: text("id").primaryKey().default("singleton"),
  syncing: boolean("syncing").default(false).notNull(),
  lastSync: timestamp("last_sync"),
});
