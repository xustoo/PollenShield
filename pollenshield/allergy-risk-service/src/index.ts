import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { connectRedis } from "./config/cache";
import { debugConfig } from "./config/debug";
import { startRiskConsumers } from "./events/riskEvents";
import riskRoutes from "./routes/riskRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ service: "allergy-risk-service", status: "UP" });
});
app.get("/debug/config", (_req, res) => res.status(200).json(debugConfig));
app.get("/debug/routes", (_req, res) => {
  res.status(200).json([
    "GET /api/risk/location/:locationId",
    "GET /api/risk/forecast/:locationId",
    "POST /api/risk/recalculate"
  ]);
});

app.use("/api/risk", riskRoutes);

connectRedis()
  .then(() => startRiskConsumers())
  .catch((error) => {
    console.error("Allergy Risk Service dependency setup failed", error);
  });

app.listen(port, () => {
  console.log(`Allergy Risk Prediction Service running on port ${port}`);
});
