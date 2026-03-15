import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import screenerRouter from "./screener.js";
import sectorRouter from "./sector.js";
import stockRouter from "./stock.js";
import watchlistRouter from "./watchlist.js";
import generalRouter from "./general.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(screenerRouter);
router.use(sectorRouter);
router.use(stockRouter);
router.use(watchlistRouter);
router.use(generalRouter);

export default router;
