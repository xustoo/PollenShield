import { connect, ConsumeMessage } from "amqplib";
import { createNotification } from "../services/notificationService";

const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
let connection: any = null;
let channel: any = null;

export const notificationEvents = {
  consumed: ["HighRiskAreaDetected", "NotificationRequested"]
};

interface EventPayload<T> {
  eventName: string;
  timestamp: string;
  data: T;
}

interface NotificationEventData {
  userId?: string;
  locationId?: string;
  level?: string;
  title?: string;
  message?: string;
}

const getChannel = async (): Promise<any> => {
  if (channel) {
    return channel;
  }

  connection = await connect(rabbitmqUrl);
  channel = await connection.createChannel();
  return channel;
};

const storeNotificationFromEvent = async (eventName: string, data: NotificationEventData): Promise<void> => {
  if (eventName === "HighRiskAreaDetected") {
    const locationId = data.locationId || "unknown-location";
    const riskLevel = data.level || "High";
    await createNotification({
      userId: data.userId || "broadcast",
      title: "High allergy risk detected",
      message: `High allergy risk detected in ${locationId}. Risk level: ${riskLevel}.`,
      locationId,
      riskLevel
    });
    return;
  }

  await createNotification({
    userId: data.userId || "broadcast",
    title: data.title || "PollenShield notification",
    message: data.message || "You have a new PollenShield notification.",
    locationId: data.locationId
  });
};

const handleMessage = async (message: ConsumeMessage | null): Promise<void> => {
  if (!message || !channel) {
    return;
  }

  try {
    const payload = JSON.parse(message.content.toString()) as EventPayload<NotificationEventData>;
    await storeNotificationFromEvent(payload.eventName, payload.data || {});
    channel.ack(message);
  } catch (error) {
    console.error("Failed to process notification event", error);
    channel.nack(message, false, false);
  }
};

export const startNotificationConsumers = async (retries = 10): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const activeChannel = await getChannel();
      for (const eventName of notificationEvents.consumed) {
        await activeChannel.assertQueue(eventName, { durable: true });
        await activeChannel.consume(eventName, handleMessage);
      }
      console.log("Notification Service RabbitMQ consumers started");
      return;
    } catch (error) {
      console.error(`RabbitMQ consumer startup failed, attempt ${attempt}/${retries}`, error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};
