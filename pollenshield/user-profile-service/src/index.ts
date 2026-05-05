import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { initializeDatabase } from "./config/database";
import { debugConfig } from "./config/debug";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ service: "user-profile-service", status: "UP" });
});
app.get("/debug/config", (_req, res) => res.status(200).json(debugConfig));
app.get("/debug/routes", (_req, res) => {
  res.status(200).json([
    "POST /api/users/register",
    "POST /api/users/login",
    "GET /api/users/:userId/profile",
    "PUT /api/users/:userId/preferences"
  ]);
});

app.use("/api/users", userRoutes);

initializeDatabase().catch((error) => {
  console.error("User Profile Service database setup failed", error);
});

app.listen(port, () => {
  console.log(`User Profile Service running on port ${port}`);
});
