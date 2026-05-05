import { Router } from "express";
import { getUserProfile, loginUser, registerUser, updatePreferences } from "../controllers/userController";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:userId/profile", getUserProfile);
router.put("/:userId/preferences", updatePreferences);

export default router;

