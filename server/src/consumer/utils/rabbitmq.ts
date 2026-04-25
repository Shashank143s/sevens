import amqp, { type Channel, type ChannelModel } from 'amqplib';
import {
  RABBITMQ_DLX_EXCHANGE,
  RABBITMQ_DLX_QUEUE,
  RABBITMQ_DLX_ROUTING_KEY,
  RABBITMQ_EXCHANGE,
  RABBITMQ_EXCHANGE_TYPE,
  RABBITMQ_MAIN_QUEUE_TTL_MS,
  RABBITMQ_QUEUE,
  RABBITMQ_RETRY_EXCHANGE,
  RABBITMQ_RETRY_QUEUE,
  RABBITMQ_RETRY_ROUTING_KEY,
  RABBITMQ_URL,
  RABBITMQ_ROUTING_KEY,
} from '../../config';

export type GameTopology = {
  mainExchange: string;
  mainQueue: string;
  mainRoutingKey: string;
  retryExchange: string;
  retryQueue: string;
  retryRoutingKey: string;
  dlxExchange: string;
  dlxQueue: string;
  dlxRoutingKey: string;
};

function assertDurableExchange(channel: Channel, exchange: string, type: string) {
  return channel.assertExchange(exchange, type, { durable: true });
}

function assertDurableQueue(channel: Channel, queue: string, options?: Parameters<Channel['assertQueue']>[1]) {
  return channel.assertQueue(queue, { durable: true, ...(options ?? {}) });
}

export async function connectRabbitMQ(): Promise<ChannelModel> {
  if (!RABBITMQ_URL) {
    throw new Error('RABBITMQ_URL is required for the consumer worker');
  }

  return amqp.connect(RABBITMQ_URL);
}

export async function assertGameTopology(channel: Channel): Promise<GameTopology> {
  await assertDurableExchange(channel, RABBITMQ_EXCHANGE, RABBITMQ_EXCHANGE_TYPE);
  await assertDurableExchange(channel, RABBITMQ_RETRY_EXCHANGE, 'topic');
  await assertDurableExchange(channel, RABBITMQ_DLX_EXCHANGE, 'topic');

  await assertDurableQueue(channel, RABBITMQ_QUEUE, {
    arguments: {
      'x-message-ttl': RABBITMQ_MAIN_QUEUE_TTL_MS,
      'x-dead-letter-exchange': RABBITMQ_RETRY_EXCHANGE,
      'x-dead-letter-routing-key': RABBITMQ_RETRY_ROUTING_KEY,
    },
  });

  await assertDurableQueue(channel, RABBITMQ_RETRY_QUEUE, {
    arguments: {
      'x-dead-letter-exchange': RABBITMQ_EXCHANGE,
      'x-dead-letter-routing-key': RABBITMQ_ROUTING_KEY,
    },
  });

  await assertDurableQueue(channel, RABBITMQ_DLX_QUEUE);

  await channel.bindQueue(RABBITMQ_QUEUE, RABBITMQ_EXCHANGE, RABBITMQ_ROUTING_KEY);
  await channel.bindQueue(RABBITMQ_RETRY_QUEUE, RABBITMQ_RETRY_EXCHANGE, RABBITMQ_RETRY_ROUTING_KEY);
  await channel.bindQueue(RABBITMQ_DLX_QUEUE, RABBITMQ_DLX_EXCHANGE, RABBITMQ_DLX_ROUTING_KEY);

  return {
    mainExchange: RABBITMQ_EXCHANGE,
    mainQueue: RABBITMQ_QUEUE,
    mainRoutingKey: RABBITMQ_ROUTING_KEY,
    retryExchange: RABBITMQ_RETRY_EXCHANGE,
    retryQueue: RABBITMQ_RETRY_QUEUE,
    retryRoutingKey: RABBITMQ_RETRY_ROUTING_KEY,
    dlxExchange: RABBITMQ_DLX_EXCHANGE,
    dlxQueue: RABBITMQ_DLX_QUEUE,
    dlxRoutingKey: RABBITMQ_DLX_ROUTING_KEY,
  };
}

export async function closeRabbitMQ(connection?: ChannelModel | null) {
  if (!connection) return;
  try {
    await connection.close();
  } catch (error) {
    console.error('[consumer:rabbit] failed to close connection', error);
  }
}
