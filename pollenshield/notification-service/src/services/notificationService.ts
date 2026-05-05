import type { Notification } from "@pollenshield/shared";
import { NotificationModel } from "../models/NotificationModel";

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  locationId?: string;
  riskLevel?: string;
}

const toIsoString = (value: Date | string): string => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

const mapNotification = (document: any): Notification => ({
  id: String(document._id),
  userId: document.userId,
  title: document.title,
  message: document.message,
  locationId: document.locationId,
  riskLevel: document.riskLevel,
  read: document.read,
  createdAt: toIsoString(document.createdAt)
});

export const createNotification = async (input: CreateNotificationInput): Promise<Notification> => {
  const notification = await NotificationModel.create({
    ...input,
    read: false,
    createdAt: new Date()
  });
  return mapNotification(notification);
};

export const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  const notifications = await NotificationModel.find({ userId: { $in: [userId, "broadcast"] } }).sort({ createdAt: -1 });
  return notifications.map(mapNotification);
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification | null> => {
  const notification = await NotificationModel.findByIdAndUpdate(notificationId, { read: true }, { new: true });
  return notification ? mapNotification(notification) : null;
};
