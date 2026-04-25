import { connect, disconnect } from 'mongoose';
import { MONGODB_URI } from '../config';

let connectionPromise: Promise<typeof import('mongoose')> | null = null;

// Reuse a single connection promise so route handlers do not reconnect per request.
export function connectToDatabase() {
  if (!connectionPromise) {
    connectionPromise = connect(MONGODB_URI);
  }

  return connectionPromise;
}

export async function closeDatabaseConnection() {
  if (!connectionPromise) return;
  try {
    await disconnect();
  } finally {
    connectionPromise = null;
  }
}
