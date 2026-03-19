import { Types } from 'mongoose';

export function createUserLookup(identifier: string) {
  return Types.ObjectId.isValid(identifier)
    ? ({ _id: new Types.ObjectId(identifier) } as Record<string, unknown>)
    : ({ email: identifier.toLowerCase() } as Record<string, unknown>);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeDate(value?: Date | number | string) {
  if (!value) {
    return new Date();
  }

  return new Date(value);
}
