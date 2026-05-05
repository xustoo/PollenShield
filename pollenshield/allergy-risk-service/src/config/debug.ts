import { redisUrl } from "./cache";

const safeHost = (value: string): string => {
  try {
    return new URL(value).host;
  } catch {
    return "unknown";
  }
};

export const debugConfig = {
  service: "allergy-risk-service",
  port: process.env.PORT || 3004,
  redisHost: safeHost(redisUrl),
  rabbitmqHost: safeHost(process.env.RABBITMQ_URL || "amqp://localhost:5672")
};

