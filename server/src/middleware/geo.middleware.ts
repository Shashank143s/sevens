import { GEOLOOKUP_BASE_URL } from '../config';
import type { MiddlewareNext } from '../types/middleware.types';

type GeoInfo = {
  ipAddress?: string;
  countryCode?: string;
  countryName?: string;
  region?: string;
  source: 'header' | 'ip';
  capturedAt: Date;
};

type GeoContext = {
  method: string;
  path: string;
  get: (header: string) => string;
  request?: {
    req?: {
      socket?: {
        remoteAddress?: string;
      };
      headers?: Record<string, string | string[] | undefined>;
    };
  };
  state?: {
    geo?: GeoInfo;
  };
};

function normalizeIp(ip: string) {
  if (!ip) return '';
  return ip.replace(/^::ffff:/, '').trim();
}

function isPrivateIp(ip: string) {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

function getClientIp(ctx: GeoContext) {
  const forwarded = ctx.get('x-forwarded-for') || ctx.get('X-Forwarded-For');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return normalizeIp(first);
  }

  const realIp = ctx.get('x-real-ip') || ctx.get('X-Real-Ip');
  if (realIp) return normalizeIp(realIp);

  return normalizeIp(ctx.request?.req?.socket?.remoteAddress ?? '');
}

function getHeaderGeo(ctx: GeoContext): GeoInfo | null {
  const countryCode = (
    ctx.get('cf-ipcountry') ||
    ctx.get('CF-IPCountry') ||
    ctx.get('x-vercel-ip-country') ||
    ctx.get('X-Vercel-IP-Country')
  ).trim().toUpperCase();

  if (!countryCode || countryCode.length !== 2) return null;

  const countryName = (
    ctx.get('x-vercel-ip-country-name') ||
    ctx.get('X-Vercel-IP-Country-Name')
  ).trim();

  const region = (
    ctx.get('x-vercel-ip-country-region') ||
    ctx.get('X-Vercel-IP-Country-Region') ||
    ctx.get('x-appengine-region') ||
    ctx.get('X-Appengine-Region')
  ).trim();

  return {
    ipAddress: getClientIp(ctx) || undefined,
    countryCode,
    countryName: countryName || undefined,
    region: region || undefined,
    source: 'header',
    capturedAt: new Date(),
  };
}

async function lookupGeoByIp(ipAddress: string): Promise<GeoInfo | null> {
  if (!ipAddress || isPrivateIp(ipAddress)) return null;

  try {
    const response = await fetch(`${GEOLOOKUP_BASE_URL}/${encodeURIComponent(ipAddress)}`);
    if (!response.ok) return null;
    const data = await response.json() as {
      success?: boolean;
      country_code?: string;
      country?: string;
      region?: string;
    };
    if (data.success === false) return null;

    const countryCode = data.country_code?.trim().toUpperCase();
    if (!countryCode || countryCode.length !== 2) return null;

    return {
      ipAddress,
      countryCode,
      countryName: data.country?.trim() || undefined,
      region: data.region?.trim() || undefined,
      source: 'ip',
      capturedAt: new Date(),
    };
  } catch {
    return null;
  }
}

export async function geoMiddleware(ctx: GeoContext, next: MiddlewareNext): Promise<void> {
  if (!(ctx.method === 'POST' && /^\/api\/account\/[^/]+$/.test(ctx.path))) {
    return next();
  }
  const headerGeo = getHeaderGeo(ctx);
  if (headerGeo) {
    ctx.state = {
      ...(ctx.state ?? {}),
      geo: headerGeo,
    };
    return next();
  }

  const ipAddress = getClientIp(ctx);
  const resolvedGeo = await lookupGeoByIp(ipAddress);
  if (resolvedGeo) {
    ctx.state = {
      ...(ctx.state ?? {}),
      geo: resolvedGeo,
    };
  }
  console.log('geoMiddleware =>>>>>>>>>>>>>>>>>>>>>', resolvedGeo, ipAddress);

  await next();
}
