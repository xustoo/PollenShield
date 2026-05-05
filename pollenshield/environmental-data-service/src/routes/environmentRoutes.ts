import { Router } from "express";
import { getByLocation, getLatestEnvironment, reportEnvironment } from "../controllers/environmentController";

const router = Router();

router.get("/location/:locationId", getByLocation);
router.post("/report", reportEnvironment);
router.get("/latest", getLatestEnvironment);

export default router;

