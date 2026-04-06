import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { GOOGLE_AUTH_CLIENT_IDS } from '../config';
import type { AccountGeoPayload, AccountPayload } from '../types/account.types';
import { normalizeDate } from '../utils/user.util';
import { upsertAccountWithGeo } from './account.service';

const googleClient = new OAuth2Client();

function assertGoogleAudienceConfigured() {
  if (GOOGLE_AUTH_CLIENT_IDS.length > 0) return;
  throw new Error('GOOGLE_AUTH_CLIENT_IDS is not configured');
}

function assertGooglePayload(payload?: TokenPayload) {
  if (!payload?.email) throw new Error('Google token is missing an email address');
  return payload;
}

function buildAccountPayloadFromGoogleClaims(
  payload: TokenPayload,
  legalAcceptedAt?: string | number | Date,
): AccountPayload {
  const fullName = payload.name?.trim() || payload.email!;
  const givenName = payload.given_name?.trim() || fullName;
  const familyName = payload.family_name?.trim() || 'Unknown';
  const acceptedAt = legalAcceptedAt ? normalizeDate(legalAcceptedAt) : undefined;

  return {
    email: payload.email!,
    first_name: givenName,
    last_name: familyName,
    full_name: fullName,
    profile_image_url: payload.picture ?? undefined,
    avatar_emoji: '🐶',
    last_login_at: new Date(),
    legal_consent: acceptedAt
      ? {
          privacy_policy_accepted_at: acceptedAt,
          terms_accepted_at: acceptedAt,
        }
      : undefined,
  };
}

export async function verifyGoogleIdToken(credential: string) {
  assertGoogleAudienceConfigured();
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_AUTH_CLIENT_IDS,
  });

  return assertGooglePayload(ticket.getPayload());
}

export async function signInWithGoogleIdToken(
  credential: string,
  legalAcceptedAt?: string | number | Date,
  geo?: AccountGeoPayload,
) {
  const googlePayload = await verifyGoogleIdToken(credential);
  const accountPayload = buildAccountPayloadFromGoogleClaims(googlePayload, legalAcceptedAt);
  return upsertAccountWithGeo(googlePayload.email!, accountPayload, geo);
}
