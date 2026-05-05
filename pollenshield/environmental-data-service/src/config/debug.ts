import { mongodbUri } from "./database";

const safeHost = (value: string): string => {
  try {
    return new URL(value).host;
  } catch {
    return "unknown";
  }
};

export const debugConfig = {
  service: "environmental-data-service",
  port: process.env.PORT || 3002,
  databaseHost: safeHost(mongodbUri),
  rabbitmqHost: safeHost(process.env.RABBITMQ_URL || "amqp://localhost:5672")
};

