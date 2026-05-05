import { model, Schema } from "mongoose";

export interface NotificationDocument {
  userId: string;
  title: string;
  message: string;
  locationId?: string;
  riskLevel?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  locationId: { type: String },
  riskLevel: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const NotificationModel = model<NotificationDocument>("Notification", notificationSchema);
