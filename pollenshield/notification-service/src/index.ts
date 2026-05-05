import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { connectDatabase } from "./config/database";
import { debugConfig } from "./config/debug";
import { startNotificationConsumers } from "./events/notificationEvents";
import notificationRoutes from "./routes/notificationRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ service: "notification-service", status: "UP" });
});
app.get("/debug/config", (_req, res) => res.status(200).json(debugConfig));
app.get("/debug/routes", (_req, res) => {
  res.status(200).json([
    "GET /api/notifications/user/:userId",
    "PUT /api/notifications/:notificationId/read"
  ]);
});

app.use("/api/notifications", notificationRoutes);

connectDatabase()
  .then(() => startNotificationConsumers())
  .catch((error) => {
    console.error("Notification Service dependency setup failed", error);
  });

app.listen(port, () => {
  console.log(`Notification Service running on port ${port}`);
});
