import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { initializeDatabase } from "./config/database";
import { debugConfig } from "./config/debug";
import symptomRoutes from "./routes/symptomRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ service: "symptom-report-service", status: "UP" });
});
app.get("/debug/config", (_req, res) => res.status(200).json(debugConfig));
app.get("/debug/routes", (_req, res) => {
  res.status(200).json([
    "POST /api/symptoms",
    "GET /api/symptoms/user/:userId",
    "GET /api/symptoms/region/:regionId"
  ]);
});

app.use("/api/symptoms", symptomRoutes);

initializeDatabase().catch((error) => {
  console.error("Symptom Report Service database setup failed", error);
});

app.listen(port, () => {
  console.log(`Symptom Report Service running on port ${port}`);
});
