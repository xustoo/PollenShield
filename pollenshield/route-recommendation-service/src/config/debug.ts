import { allergyRiskServiceUrl, googleMapsApiKey } from "./services";

const safeHost = (value: string): string => {
  try {
    return new URL(value).host;
  } catch {
    return "unknown";
  }
};

export const debugConfig = {
  service: "route-recommendation-service",
  port: process.env.PORT || 3005,
  allergyRiskServiceHost: safeHost(allergyRiskServiceUrl),
  googleRoutesEnabled: Boolean(googleMapsApiKey)
};
