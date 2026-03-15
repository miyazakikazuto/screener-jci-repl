import { pgTable, text, real, integer, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ohlcTable = pgTable("ohlc", {
  code: text("code").notNull(),
  date: integer("date").notNull(),
  open: real("open"),
  high: real("high"),
  low: real("low"),
  close: real("close"),
  volume: real("volume"),
  value: real("value"),
  bidVolume: real("bid_volume"),
  offerVolume: real("offer_volume"),
  foreignBuy: real("foreign_buy"),
  foreignSell: real("foreign_sell"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.code, table.date] }),
}));

export const insertOhlcSchema = createInsertSchema(ohlcTable).omit({ updatedAt: true });
export type InsertOhlc = z.infer<typeof insertOhlcSchema>;
export type Ohlc = typeof ohlcTable.$inferSelect;
