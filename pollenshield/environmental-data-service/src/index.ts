import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { connectDatabase } from "./config/database";
import { debugConfig } from "./config/debug";
import environmentRoutes from "./routes/environmentRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ service: "environmental-data-service", status: "UP" });
});
app.get("/debug/config", (_req, res) => res.status(200).json(debugConfig));
app.get("/debug/routes", (_req, res) => {
  res.status(200).json([
    "GET /api/environment/location/:locationId",
    "POST /api/environment/report",
    "GET /api/environment/latest"
  ]);
});

app.use("/api/environment", environmentRoutes);

connectDatabase().catch((error) => {
  console.error("Environmental Data Service database setup failed", error);
});

app.listen(port, () => {
  console.log(`Environmental Data Service running on port ${port}`);
});
