import { Router } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { serviceUrls } from "../config/services";

const router = Router();

const preservePath = (prefix: string) => (path: string) => `${prefix}${path}`;
const requestTimeoutMs = 10000;

const serviceProxy = (name: string, prefix: string, target: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: preservePath(prefix),
    timeout: requestTimeoutMs,
    proxyTimeout: requestTimeoutMs,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        const request = req as any;
        console.log(`[gateway] ${request.method} ${request.originalUrl || request.url} -> ${name} ${proxyRes.statusCode}`);
      },
      error: (error, req, res) => {
        const response = res as any;
        if (response.headersSent) {
          return;
        }

        const isTimeout = ["ECONNRESET", "ETIMEDOUT", "ESOCKETTIMEDOUT"].includes((error as NodeJS.ErrnoException).code || "");
        const payload = JSON.stringify({
          error: isTimeout ? "Service timeout" : "Proxy error",
          service: name,
          details: error.message
        });
        response.writeHead(isTimeout ? 504 : 502, { "Content-Type": "application/json" });
        response.end(payload);
      }
    }
  });

router.use("/api/users", serviceProxy("user-profile-service", "/api/users", serviceUrls.userProfile));
router.use("/api/environment", serviceProxy("environmental-data-service", "/api/environment", serviceUrls.environmentalData));
router.use("/api/symptoms", serviceProxy("symptom-report-service", "/api/symptoms", serviceUrls.symptomReport));
router.use("/api/risk", serviceProxy("allergy-risk-service", "/api/risk", serviceUrls.allergyRisk));
router.use("/api/routes", serviceProxy("route-recommendation-service", "/api/routes", serviceUrls.routeRecommendation));
router.use("/api/notifications", serviceProxy("notification-service", "/api/notifications", serviceUrls.notification));

export default router;
