import { pgTable, text, real, integer, boolean, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const screenerTable = pgTable("screener", {
  code: text("code").primaryKey(),
  name: text("name"),
  sector: text("sector"),
  industry: text("industry"),
  subSector: text("sub_sector"),
  subIndustry: text("sub_industry"),
  subIndustryCode: text("sub_industry_code"),
  indexCode: text("index_code"),
  marketCapital: real("market_capital"),
  totalRevenue: real("total_revenue"),
  npm: real("npm"),
  per: real("per"),
  pbv: real("pbv"),
  roa: real("roa"),
  roe: real("roe"),
  der: real("der"),
  week4PC: real("week4_pc"),
  week13PC: real("week13_pc"),
  week26PC: real("week26_pc"),
  week52PC: real("week52_pc"),
  ytdpc: real("ytdpc"),
  mtdpc: real("mtdpc"),
  umaDate: text("uma_date"),
  notation: text("notation"),
  status: text("status"),
  corpAction: text("corp_action"),
  corpActionDate: text("corp_action_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScreenerSchema = createInsertSchema(screenerTable).omit({ updatedAt: true });
export type InsertScreener = z.infer<typeof insertScreenerSchema>;
export type Screener = typeof screenerTable.$inferSelect;
