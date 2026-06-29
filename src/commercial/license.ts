import { CommercialFeature, CommercialPlanId, getCommercialPlan } from './plans';

export interface SelfHostLicensePayload {
  licenseId: string;
  customerName: string;
  planId: CommercialPlanId;
  issuedAt: string;
  expiresAt: string;
  seats: number;
  features: CommercialFeature[];
  deploymentFingerprint?: string;
}

export interface SignedSelfHostLicense {
  payload: SelfHostLicensePayload;
  signature: string;
  algorithm: 'ECDSA-P256-SHA256';
}

export type LicenseDecisionReason =
  | 'expired'
  | 'not-yet-valid'
  | 'invalid-seats'
  | 'feature-not-licensed'
  | 'signature-invalid';

export interface LicenseDecision {
  valid: boolean;
  reason?: LicenseDecisionReason;
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`).join(',')}}`;
}

export function toBase64Url(bytes: Uint8Array): string {
  let raw = '';
  for (const b of bytes) raw += String.fromCharCode(b);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function licensePayloadValid(payload: SelfHostLicensePayload, requiredFeature?: CommercialFeature, now: Date = new Date()): LicenseDecision {
  const issued = new Date(payload.issuedAt).getTime();
  const expires = new Date(payload.expiresAt).getTime();
  const current = now.getTime();
  if (!Number.isFinite(issued) || issued > current) return { valid: false, reason: 'not-yet-valid' };
  if (!Number.isFinite(expires) || expires <= current) return { valid: false, reason: 'expired' };
  if (!Number.isInteger(payload.seats) || payload.seats < 1) return { valid: false, reason: 'invalid-seats' };
  if (requiredFeature && !payload.features.includes(requiredFeature)) return { valid: false, reason: 'feature-not-licensed' };
  return { valid: true };
}

export async function signSelfHostLicense(payload: SelfHostLicensePayload, privateKey: CryptoKey): Promise<SignedSelfHostLicense> {
  const data = new TextEncoder().encode(canonicalJson(payload));
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data);
  return {
    payload,
    signature: toBase64Url(new Uint8Array(signature)),
    algorithm: 'ECDSA-P256-SHA256'
  };
}

export async function verifySelfHostLicense(
  license: SignedSelfHostLicense,
  publicKey: CryptoKey,
  opts: { requiredFeature?: CommercialFeature; now?: Date } = {}
): Promise<LicenseDecision> {
  const payloadDecision = licensePayloadValid(license.payload, opts.requiredFeature, opts.now);
  if (!payloadDecision.valid) return payloadDecision;
  const data = new TextEncoder().encode(canonicalJson(license.payload));
  const ok = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    fromBase64Url(license.signature),
    data
  );
  return ok ? { valid: true } : { valid: false, reason: 'signature-invalid' };
}

export function defaultSelfHostLicenseFeatures(planId: CommercialPlanId): CommercialFeature[] {
  return [...getCommercialPlan(planId).features];
}
