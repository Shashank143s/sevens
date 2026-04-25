import type { Channel, ChannelModel } from 'amqplib';
import type { GameEndMessagePayload } from '../types/game-record.types';
import { publishToExchange } from '../consumer/producer';
import { assertGameTopology, closeRabbitMQ, connectRabbitMQ, type GameTopology } from '../consumer/utils/rabbitmq';

type PublisherState = {
  connection: ChannelModel;
  channel: Channel;
  topology: GameTopology;
};

let publisherState: PublisherState | null = null;
let publisherInitPromise: Promise<PublisherState> | null = null;

async function initPublisher(): Promise<PublisherState> {
  const connection = await connectRabbitMQ();
  const channel = await connection.createChannel();
  const topology = await assertGameTopology(channel);

  connection.on('error', (error: unknown) => {
    console.error('[publisher:rabbit] connection error', error);
  });

  connection.on('close', () => {
    console.warn('[publisher:rabbit] connection closed');
    publisherState = null;
    publisherInitPromise = null;
  });

  channel.on('error', (error: unknown) => {
    console.error('[publisher:rabbit] channel error', error);
  });

  publisherState = { connection, channel, topology };
  return publisherState;
}

async function getPublisherState() {
  if (publisherState) return publisherState;
  if (!publisherInitPromise) {
    publisherInitPromise = initPublisher().finally(() => {
      publisherInitPromise = null;
    });
  }
  return publisherInitPromise;
}

export async function publishGameEndMessage(payload: GameEndMessagePayload) {
  const state = await getPublisherState();
  const ok = await publishToExchange(
    state.channel,
    state.topology.mainExchange,
    state.topology.mainRoutingKey,
    payload,
    {
      correlationId: payload.correlationId,
      messageId: payload.matchID,
      headers: {
        'x-message-type': 'game-end',
      },
    },
  );

  if (!ok) {
    throw new Error(`RabbitMQ publish returned false for match ${payload.matchID}`);
  }
}

export async function closeGameEndPublisher() {
  if (!publisherState) return;
  const state = publisherState;
  publisherState = null;
  publisherInitPromise = null;
  await closeRabbitMQ(state.connection);
}
