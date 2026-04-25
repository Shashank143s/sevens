import type { Channel, Options } from 'amqplib';

type PublishOptions = {
  headers?: Record<string, unknown>;
  correlationId?: string;
  messageId?: string;
  expiration?: string;
};

function toBuffer(payload: unknown) {
  return Buffer.from(JSON.stringify(payload));
}

function buildPublishOptions(options?: PublishOptions): Options.Publish {
  return {
    contentType: 'application/json',
    persistent: true,
    ...(options?.correlationId ? { correlationId: options.correlationId } : {}),
    ...(options?.messageId ? { messageId: options.messageId } : {}),
    ...(options?.expiration ? { expiration: options.expiration } : {}),
    ...(options?.headers ? { headers: options.headers } : {}),
  };
}

export async function publishToExchange(
  channel: Channel,
  exchange: string,
  routingKey: string,
  payload: unknown,
  options?: PublishOptions,
) {
  const ok = channel.publish(exchange, routingKey, toBuffer(payload), buildPublishOptions(options));
  if (!ok) {
    console.warn('[consumer:rabbit] publishToExchange returned false', { exchange, routingKey });
  }
  return ok;
}

export async function publishToQueue(
  channel: Channel,
  queueName: string,
  payload: unknown,
  options?: PublishOptions,
) {
  const ok = channel.publish('', queueName, toBuffer(payload), buildPublishOptions(options));
  if (!ok) {
    console.warn('[consumer:rabbit] publishToQueue returned false', { queueName });
  }
  return ok;
}
