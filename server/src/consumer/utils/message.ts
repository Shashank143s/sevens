import type { ConsumeMessage } from 'amqplib';
import { RABBITMQ_RETRY_QUEUE } from '../../config';
import type { GameEndMessagePayload } from '../../types/game-record.types';

type XDeathEntry = {
  queue?: unknown;
  count?: unknown;
};

function toStringOrEmpty(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function toObject(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function normalizeMatchId(payload: Record<string, unknown>) {
  return toStringOrEmpty(payload.matchID ?? payload.matchId);
}

function normalizeCorrelationId(payload: Record<string, unknown>, message: ConsumeMessage) {
  const headerCorrelationId = toStringOrEmpty(message.properties.correlationId);
  return toStringOrEmpty(payload.correlationId ?? payload.correlationID ?? headerCorrelationId);
}

export function parseGameEndMessage(message: ConsumeMessage): GameEndMessagePayload {
  const rawBody = message.content.toString('utf8');
  const parsedBody = JSON.parse(rawBody) as unknown;
  const payload = toObject(parsedBody);
  if (!payload) {
    throw new Error('Game end message body must be a JSON object');
  }

  const matchID = normalizeMatchId(payload);
  if (!matchID) {
    throw new Error('Game end message is missing matchID');
  }

  const correlationId = normalizeCorrelationId(payload, message);
  if (!correlationId) {
    throw new Error('Game end message is missing correlationId');
  }

  const normalized: GameEndMessagePayload = {
    ...(payload as GameEndMessagePayload),
    matchID,
    correlationId,
  };

  return normalized;
}

export function getRetryCount(message: ConsumeMessage) {
  const headerRetryCount = message.properties.headers?.['x-retry-count'];
  if (typeof headerRetryCount === 'number') return headerRetryCount;
  if (typeof headerRetryCount === 'string') {
    const parsed = Number(headerRetryCount);
    if (Number.isFinite(parsed)) return parsed;
  }

  const deaths = message.properties.headers?.['x-death'];
  if (!Array.isArray(deaths)) return 0;

  const retryEntry = deaths.find((entry) => {
    const record = toObject(entry);
    return toStringOrEmpty(record?.queue) === RABBITMQ_RETRY_QUEUE;
  }) as XDeathEntry | undefined;

  const count = retryEntry?.count;
  if (typeof count === 'number') return count;
  if (typeof count === 'string') {
    const parsed = Number(count);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function getAttemptNumber(message: ConsumeMessage) {
  return getRetryCount(message) + 1;
}

export function getNextRetryCount(message: ConsumeMessage) {
  return getRetryCount(message) + 1;
}

export function buildDeadLetterHeaders(params: {
  attempt: number;
  correlationId: string;
  error: Error;
  originalExchange?: string;
  originalRoutingKey?: string;
}) {
  const error = params.error;
  return {
    'x-attempt': params.attempt,
    'x-correlation-id': params.correlationId,
    'x-error-message': error.message,
    'x-error-name': error.name,
    'x-error-stack': error.stack ?? '',
    'x-original-exchange': params.originalExchange ?? '',
    'x-original-routing-key': params.originalRoutingKey ?? '',
  };
}
