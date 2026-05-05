import { Router } from "express";
import { getRouteRisk, recommendRoute } from "../controllers/routeController";

const router = Router();

router.post("/recommend", recommendRoute);
router.get("/:routeId/risk", getRouteRisk);

export default router;

