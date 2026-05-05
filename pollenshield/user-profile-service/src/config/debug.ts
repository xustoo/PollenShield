import { databaseUrl } from "./database";

const safeHost = (value: string): string => {
  try {
    return new URL(value).host;
  } catch {
    return "unknown";
  }
};

export const debugConfig = {
  service: "user-profile-service",
  port: process.env.PORT || 3001,
  databaseHost: safeHost(databaseUrl),
  rabbitmqHost: safeHost(process.env.RABBITMQ_URL || "amqp://localhost:5672")
};

