import { Router } from "express";
import { getForecast, getLocationRisk, recalculateRisk } from "../controllers/riskController";

const router = Router();

router.get("/location/:locationId", getLocationRisk);
router.get("/forecast/:locationId", getForecast);
router.post("/recalculate", recalculateRisk);

export default router;

