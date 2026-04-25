import type { Channel, ChannelModel, ConsumeMessage, Replies } from 'amqplib';
import {
  RABBITMQ_DLX_EXCHANGE,
  RABBITMQ_DLX_ROUTING_KEY,
  RABBITMQ_MAX_RETRIES,
  RABBITMQ_QUEUE,
  RABBITMQ_RETRY_DELAY_MS,
  RABBITMQ_RETRY_EXCHANGE,
  RABBITMQ_RETRY_ROUTING_KEY,
  REDIS_PREFIX_KEY,
} from '../config';
import { updateGameRecord } from '../services/game-record.service';
import type { GameEndMessagePayload } from '../types/game-record.types';
import { publishToExchange } from './producer';
import { assertGameTopology, closeRabbitMQ, connectRabbitMQ } from './utils/rabbitmq';
import {
  claimProcessingLock,
  deleteKey,
  hasKey,
  setCompletionMarker,
  type RedisClient,
} from './utils/redis';
import {
  buildDeadLetterHeaders,
  getAttemptNumber,
  getRetryCount,
  parseGameEndMessage,
} from './utils/message';

type ConsumerHandle = {
  stop: () => Promise<void>;
};

const COMPLETION_TTL_SECONDS = 300;
const PROCESSING_LOCK_TTL_SECONDS = Math.max(300, COMPLETION_TTL_SECONDS * 2);

function completionKey(matchID: string) {
  return `${REDIS_PREFIX_KEY}:${matchID}`;
}

function processingKey(matchID: string) {
  return `${completionKey(matchID)}:processing`;
}

function isFatalMessage(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('missing matchid')
    || message.includes('missing correlationid')
    || message.includes('must be a json object')
    || message.includes('not found')
  );
}

async function markMessageCompleted(redis: RedisClient, payload: GameEndMessagePayload) {
  await setCompletionMarker(
    redis,
    completionKey(payload.matchID),
    COMPLETION_TTL_SECONDS,
    JSON.stringify({
      correlationId: payload.correlationId,
      completedAt: new Date().toISOString(),
    }),
  );
}

async function tryAcquireMessageLock(redis: RedisClient, payload: GameEndMessagePayload, attempt: number) {
  return claimProcessingLock(
    redis,
    processingKey(payload.matchID),
    PROCESSING_LOCK_TTL_SECONDS,
    JSON.stringify({
      correlationId: payload.correlationId,
      attempt,
      lockedAt: new Date().toISOString(),
    }),
  );
}

async function processMessage(channel: Channel, redis: RedisClient, message: ConsumeMessage) {
  let payload: GameEndMessagePayload;

  try {
    payload = parseGameEndMessage(message);
  } catch (error) {
    const parseError = error instanceof Error ? error : new Error(String(error));
    console.error('[consumer:game-end] invalid message payload', {
      error: parseError.message,
    });

    try {
      await publishToExchange(channel, RABBITMQ_DLX_EXCHANGE, RABBITMQ_DLX_ROUTING_KEY, {
        raw: message.content.toString('utf8'),
        reason: parseError.message,
        receivedAt: new Date().toISOString(),
      }, {
        correlationId: message.properties.correlationId ?? undefined,
        headers: buildDeadLetterHeaders({
          attempt: 1,
          correlationId: message.properties.correlationId ?? '',
          error: parseError,
          originalExchange: message.fields.exchange,
          originalRoutingKey: message.fields.routingKey,
        }),
      });
    } finally {
      channel.ack(message);
    }
    return;
  }

  const completed = await hasKey(redis, completionKey(payload.matchID));
  if (completed) {
    console.info('[consumer:game-end] duplicate completion skipped', {
      matchID: payload.matchID,
      correlationId: payload.correlationId,
    });
    channel.ack(message);
    return;
  }

  const attempt = getAttemptNumber(message);
  const lockAcquired = await tryAcquireMessageLock(redis, payload, attempt);
  if (!lockAcquired) {
    console.info('[consumer:game-end] processing lock already held, skipping duplicate', {
      matchID: payload.matchID,
      correlationId: payload.correlationId,
      attempt,
    });
    channel.ack(message);
    return;
  }

  console.info('[consumer:game-end] processing message', {
    matchID: payload.matchID,
    correlationId: payload.correlationId,
    attempt,
  });

  try {
    const updatedGame = await updateGameRecord(payload.matchID, payload);
    if (!updatedGame) {
      throw new Error(`Game record not found for match ${payload.matchID}`);
    }

    try {
      await markMessageCompleted(redis, payload);
    } catch (redisError) {
      console.error('[consumer:game-end] failed to persist completion marker', {
        matchID: payload.matchID,
        correlationId: payload.correlationId,
        error: redisError instanceof Error ? redisError.message : String(redisError),
      });
    }

    try {
      await deleteKey(redis, processingKey(payload.matchID));
    } catch (redisError) {
      console.error('[consumer:game-end] failed to clear processing lock', {
        matchID: payload.matchID,
        correlationId: payload.correlationId,
        error: redisError instanceof Error ? redisError.message : String(redisError),
      });
    }

    channel.ack(message);

    console.info('[consumer:game-end] processed successfully', {
      matchID: payload.matchID,
      correlationId: payload.correlationId,
    });
    return;
  } catch (error) {
    await deleteKey(redis, processingKey(payload.matchID));

    const processingError = error instanceof Error ? error : new Error(String(error));
    const shouldDeadLetter = isFatalMessage(processingError) || attempt >= RABBITMQ_MAX_RETRIES;

    console.error('[consumer:game-end] processing failed', {
      matchID: payload.matchID,
      correlationId: payload.correlationId,
      attempt,
      error: processingError.message,
      deadLetter: shouldDeadLetter,
    });

    if (shouldDeadLetter) {
      try {
        await publishToExchange(
          channel,
          RABBITMQ_DLX_EXCHANGE,
          RABBITMQ_DLX_ROUTING_KEY,
          payload,
          {
            correlationId: payload.correlationId,
            headers: buildDeadLetterHeaders({
              attempt,
              correlationId: payload.correlationId,
              error: processingError,
              originalExchange: message.fields.exchange,
              originalRoutingKey: message.fields.routingKey,
            }),
          },
        );
      } finally {
        channel.ack(message);
      }
      return;
    }

    await publishToExchange(
      channel,
      RABBITMQ_RETRY_EXCHANGE,
      RABBITMQ_RETRY_ROUTING_KEY,
      payload,
      {
        correlationId: payload.correlationId,
        expiration: String(RABBITMQ_RETRY_DELAY_MS),
        headers: {
          ...buildDeadLetterHeaders({
            attempt,
            correlationId: payload.correlationId,
            error: processingError,
            originalExchange: message.fields.exchange,
            originalRoutingKey: message.fields.routingKey,
          }),
          'x-retry-count': getRetryCount(message) + 1,
        },
      },
    );
  }
}

export async function startGameEndConsumer(redis: RedisClient): Promise<ConsumerHandle> {
  const connection: ChannelModel = await connectRabbitMQ();
  const channel = await connection.createChannel();
  const topology = await assertGameTopology(channel);
  await channel.prefetch(1);

  connection.on('error', (error: unknown) => {
    console.error('[consumer:rabbit] connection error', error);
  });

  connection.on('close', () => {
    console.warn('[consumer:rabbit] connection closed');
  });

  channel.on('error', (error: unknown) => {
    console.error('[consumer:rabbit] channel error', error);
  });

  const consumeResult: Replies.Consume = await channel.consume(
    topology.mainQueue ?? RABBITMQ_QUEUE,
    (message: ConsumeMessage | null) => {
      if (!message) return;
      void processMessage(channel, redis, message).catch((error) => {
        console.error('[consumer:game-end] unhandled message error', error);
        try {
          channel.nack(message, false, true);
        } catch (nackError: unknown) {
          console.error('[consumer:game-end] failed to nack message', nackError);
        }
      });
    },
    { noAck: false },
  );

  console.info('[consumer:game-end] consumer started', {
    queue: topology.mainQueue,
    exchange: topology.mainExchange,
    consumerTag: consumeResult.consumerTag,
  });

  let stopping = false;

  return {
    stop: async () => {
      if (stopping) return;
      stopping = true;
      try {
        await channel.cancel(consumeResult.consumerTag);
      } catch (error: unknown) {
        console.error('[consumer:game-end] failed to cancel consumer', error);
      }
      try {
        await channel.close();
      } catch (error: unknown) {
        console.error('[consumer:game-end] failed to close channel', error);
      }
      await closeRabbitMQ(connection);
    },
  };
}
