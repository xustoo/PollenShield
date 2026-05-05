export const serviceUrls = {
  userProfile: process.env.USER_PROFILE_SERVICE_URL || "http://localhost:3001",
  environmentalData: process.env.ENVIRONMENTAL_DATA_SERVICE_URL || "http://localhost:3002",
  symptomReport: process.env.SYMPTOM_REPORT_SERVICE_URL || "http://localhost:3003",
  allergyRisk: process.env.ALLERGY_RISK_SERVICE_URL || "http://localhost:3004",
  routeRecommendation: process.env.ROUTE_RECOMMENDATION_SERVICE_URL || "http://localhost:3005",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006"
};

