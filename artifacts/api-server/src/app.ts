import express, { type Express } from "express";
import cors from "cors";
import router from "./routes/index.js";
import { loadSyncState, runFullSync } from "./lib/idxSync.js";
import { db, screenerTable } from "@workspace/db";
import { seedIfEmpty } from "./lib/seedData.js";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

async function bootstrap(): Promise<void> {
  await loadSyncState();
  await seedIfEmpty();
  const stocks = await db.select({ code: screenerTable.code }).from(screenerTable);
  console.log(`[bootstrap] ${stocks.length} stocks in database`);
}

bootstrap().catch(console.error);

export default app;
