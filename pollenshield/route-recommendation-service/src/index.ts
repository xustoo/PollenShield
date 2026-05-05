import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { debugConfig } from "./config/debug";
import routeRoutes from "./routes/routeRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ service: "route-recommendation-service", status: "UP" });
});
app.get("/debug/config", (_req, res) => res.status(200).json(debugConfig));
app.get("/debug/routes", (_req, res) => {
  res.status(200).json([
    "POST /api/routes/recommend",
    "GET /api/routes/:routeId/risk"
  ]);
});

app.use("/api/routes", routeRoutes);

app.listen(port, () => {
  console.log(`Route Recommendation Service running on port ${port}`);
});
