import { createHmac, timingSafeEqual } from 'crypto';

type SignedSessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge?: number;
  domain?: string;
};

function base64UrlEncode(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge != null) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.path != null) parts.push(`Path=${options.path}`);
  if (options.domain != null) parts.push(`Domain=${options.domain}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) {
    const sameSite = options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1);
    parts.push(`SameSite=${sameSite}`);
  }
  return parts.join('; ');
}

export function createSignedSessionCookie(
  subject: string,
  secret: string,
  maxAgeSeconds: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SignedSessionPayload = {
    sub: subject,
    iat: now,
    exp: now + Math.max(1, Math.floor(maxAgeSeconds)),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return {
    value: `v1.${encodedPayload}.${signature}`,
    expiresAt: payload.exp * 1000,
  };
}

export function verifySignedSessionCookie(value: string, secret: string) {
  const [version, encodedPayload, signature] = value.split('.');
  if (version !== 'v1' || !encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload, secret);
  const actual = Buffer.from(signature, 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SignedSessionPayload;
    if (!payload.sub || !payload.exp || payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildSignedSessionCookieHeader(
  name: string,
  value: string,
  options: CookieOptions = {},
) {
  return serializeCookie(name, value, options);
}
