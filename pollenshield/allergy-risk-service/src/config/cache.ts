import { createClient } from "redis";

export const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 10000
  }
});

redisClient.on("error", (error) => {
  console.error("Redis client error", error);
});

export const connectRedis = async (retries = 10): Promise<void> => {
  if (redisClient.isOpen) {
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await redisClient.connect();
      console.log("Allergy Risk Service connected to Redis");
      return;
    } catch (error) {
      console.error(`Redis connection failed, attempt ${attempt}/${retries}`, error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("Could not connect Allergy Risk Service to Redis");
};
