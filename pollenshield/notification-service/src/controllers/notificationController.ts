import { Request, Response } from "express";
import { getNotificationsForUser, markNotificationAsRead } from "../services/notificationService";

const errorDetails = (error: unknown): string => (error instanceof Error ? error.message : "Unknown error");
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, status: number, error: string, details?: string) => res.status(status).json({ success: false, error, ...(details ? { details } : {}) });

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await getNotificationsForUser(req.params.userId);
    return ok(res, notifications);
  } catch (error) {
    console.error("Get notifications failed", error);
    return fail(res, 500, "Could not get notifications", errorDetails(error));
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const notification = await markNotificationAsRead(req.params.notificationId);
    if (!notification) {
      return fail(res, 404, "Notification not found");
    }

    return ok(res, notification);
  } catch (error) {
    console.error("Mark notification read failed", error);
    return fail(res, 500, "Could not update notification", errorDetails(error));
  }
};
