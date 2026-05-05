import { Router } from "express";
import { getUserNotifications, markNotificationRead } from "../controllers/notificationController";

const router = Router();

router.get("/user/:userId", getUserNotifications);
router.put("/:notificationId/read", markNotificationRead);

export default router;

