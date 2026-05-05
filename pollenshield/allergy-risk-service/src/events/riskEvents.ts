import { connect, ConsumeMessage } from "amqplib";
import type { RiskScore } from "@pollenshield/shared";
import { cacheRiskScore, calculateRiskScore } from "../services/riskService";

const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
let connection: any = null;
let channel: any = null;
const rabbitTimeoutMs = 10000;

export const riskEvents = {
  consumed: ["EnvironmentalDataUpdated", "SymptomReportCreated"],
  published: ["RiskScoreUpdated", "HighRiskAreaDetected"]
};

interface EventPayload<T> {
  eventName: string;
  timestamp: string;
  data: T;
}

interface RiskEventData {
  locationId: string;
  humidity?: number;
  windSpeed?: number;
  pollenIndex?: number;
  intensity?: number;
}

const getChannel = async (): Promise<any> => {
  if (channel) {
    return channel;
  }

  connection = await connect(rabbitmqUrl);
  channel = await connection.createChannel();
  return channel;
};

const withTimeout = async <T>(promise: Promise<T>, message: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error(message)), rabbitTimeoutMs))
  ]);

export const publishEvent = async <T>(eventName: string, data: T): Promise<EventPayload<T>> => {
  const payload = {
    eventName,
    timestamp: new Date().toISOString(),
    data
  };

  try {
    await withTimeout(
      (async () => {
        const activeChannel = await getChannel();
        await activeChannel.assertQueue(eventName, { durable: true });
        activeChannel.sendToQueue(eventName, Buffer.from(JSON.stringify(payload)), { persistent: true });
      })(),
      `RabbitMQ publish timeout for ${eventName}`
    );
  } catch (error) {
    console.error(`Failed to publish ${eventName}`, error);
  }

  return payload;
};

export const processRiskInput = async (data: RiskEventData): Promise<RiskScore> => {
  const riskScore = calculateRiskScore({
    locationId: data.locationId,
    pollenIndex: data.pollenIndex ?? 0,
    humidity: data.humidity ?? 45,
    windSpeed: data.windSpeed ?? 10,
    averageSymptomIntensity: data.intensity
  });

  await cacheRiskScore(riskScore);
  await publishEvent("RiskScoreUpdated", riskScore);

  if (riskScore.level === "High" || riskScore.level === "Critical") {
    await publishEvent("HighRiskAreaDetected", riskScore);
  }

  return riskScore;
};

const handleMessage = async (message: ConsumeMessage | null): Promise<void> => {
  if (!message || !channel) {
    return;
  }

  try {
    const payload = JSON.parse(message.content.toString()) as EventPayload<RiskEventData>;
    if (payload.data?.locationId) {
      await processRiskInput(payload.data);
    }
    channel.ack(message);
  } catch (error) {
    console.error("Failed to process risk event", error);
    channel.nack(message, false, false);
  }
};

export const startRiskConsumers = async (retries = 10): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const activeChannel = await getChannel();
      for (const eventName of riskEvents.consumed) {
        await activeChannel.assertQueue(eventName, { durable: true });
        await activeChannel.consume(eventName, handleMessage);
      }
      console.log("Allergy Risk Service RabbitMQ consumers started");
      return;
    } catch (error) {
      console.error(`RabbitMQ consumer startup failed, attempt ${attempt}/${retries}`, error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};
