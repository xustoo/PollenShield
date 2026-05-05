import { databaseUrl } from "./database";

const safeHost = (value: string): string => {
  try {
    return new URL(value).host;
  } catch {
    return "unknown";
  }
};

export const debugConfig = {
  service: "symptom-report-service",
  port: process.env.PORT || 3003,
  databaseHost: safeHost(databaseUrl),
  rabbitmqHost: safeHost(process.env.RABBITMQ_URL || "amqp://localhost:5672")
};

