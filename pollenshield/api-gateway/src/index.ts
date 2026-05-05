import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { getHealth } from "./controllers/healthController";
import proxyRoutes from "./routes/proxyRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.get("/health", getHealth);
app.get("/debug/config", (_req, res) => {
  res.status(200).json({
    service: "api-gateway",
    port,
    routes: {
      users: process.env.USER_PROFILE_SERVICE_URL || "http://localhost:3001",
      environment: process.env.ENVIRONMENTAL_DATA_SERVICE_URL || "http://localhost:3002",
      symptoms: process.env.SYMPTOM_REPORT_SERVICE_URL || "http://localhost:3003",
      risk: process.env.ALLERGY_RISK_SERVICE_URL || "http://localhost:3004",
      routes: process.env.ROUTE_RECOMMENDATION_SERVICE_URL || "http://localhost:3005",
      notifications: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006"
    }
  });
});
app.get("/debug/routes", (_req, res) => {
  res.status(200).json([
    { prefix: "/api/users", target: process.env.USER_PROFILE_SERVICE_URL || "http://localhost:3001" },
    { prefix: "/api/environment", target: process.env.ENVIRONMENTAL_DATA_SERVICE_URL || "http://localhost:3002" },
    { prefix: "/api/symptoms", target: process.env.SYMPTOM_REPORT_SERVICE_URL || "http://localhost:3003" },
    { prefix: "/api/risk", target: process.env.ALLERGY_RISK_SERVICE_URL || "http://localhost:3004" },
    { prefix: "/api/routes", target: process.env.ROUTE_RECOMMENDATION_SERVICE_URL || "http://localhost:3005" },
    { prefix: "/api/notifications", target: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006" }
  ]);
});

app.use(proxyRoutes);

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
