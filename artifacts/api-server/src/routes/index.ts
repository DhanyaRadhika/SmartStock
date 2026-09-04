import { Router, type IRouter } from "express";
import healthRouter from "./health";
import smartstockRouter from "./smartstock";

const router: IRouter = Router();

router.use(healthRouter);
router.use(smartstockRouter);

export default router;
