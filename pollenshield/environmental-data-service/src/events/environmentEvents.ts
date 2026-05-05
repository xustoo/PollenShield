import { connect } from "amqplib";

const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
let connection: any = null;
let channel: any = null;
const rabbitTimeoutMs = 10000;

export interface EventPayload<T> {
  eventName: string;
  timestamp: string;
  data: T;
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
