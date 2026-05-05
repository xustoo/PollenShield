import { Router } from "express";
import { createSymptomReport, getByRegion, getByUser } from "../controllers/symptomController";

const router = Router();

router.post("/", createSymptomReport);
router.get("/user/:userId", getByUser);
router.get("/region/:regionId", getByRegion);

export default router;

