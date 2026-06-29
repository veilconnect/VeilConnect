import { CommercialFeature, getCommercialPlan, planHasFeature } from './plans';
import { TenantRecord, isTenantActive } from './tenant';

export interface UsageSnapshot {
  day: string;
  roomCreates: number;
  pairSuccesses: number;
  monthlyBlobBytes: number;
}

export type UsageCounter = 'roomCreates' | 'pairSuccesses' | 'monthlyBlobBytes';

export type QuotaDecisionReason =
  | 'tenant-inactive'
  | 'feature-disabled'
  | 'quota-exceeded'
  | 'invalid-delta';

export interface QuotaDecision {
  allowed: boolean;
  reason?: QuotaDecisionReason;
  remaining?: number;
}

const COUNTER_TO_QUOTA: Record<UsageCounter, keyof ReturnType<typeof getCommercialPlan>['quotas']> = {
  roomCreates: 'dailyRoomCreates',
  pairSuccesses: 'dailyPairSuccesses',
  monthlyBlobBytes: 'monthlyBlobBytes'
};

export function checkFeatureAllowed(tenant: TenantRecord, feature: CommercialFeature): QuotaDecision {
  if (!isTenantActive(tenant.status)) return { allowed: false, reason: 'tenant-inactive' };
  if (!planHasFeature(tenant.planId, feature)) return { allowed: false, reason: 'feature-disabled' };
  return { allowed: true };
}

export function checkQuota(
  tenant: TenantRecord,
  usage: UsageSnapshot,
  counter: UsageCounter,
  delta: number
): QuotaDecision {
  if (!isTenantActive(tenant.status)) return { allowed: false, reason: 'tenant-inactive' };
  if (!Number.isFinite(delta) || delta < 0) return { allowed: false, reason: 'invalid-delta' };

  const quotaName = COUNTER_TO_QUOTA[counter];
  const limit = getCommercialPlan(tenant.planId).quotas[quotaName];
  const current = usage[counter];
  const remaining = Math.max(0, limit - current);

  if (current + delta > limit) {
    return { allowed: false, reason: 'quota-exceeded', remaining };
  }
  return { allowed: true, remaining: Math.max(0, remaining - delta) };
}

export function checkHostedBlobUpload(tenant: TenantRecord, usage: UsageSnapshot, encryptedBytes: number): QuotaDecision {
  const feature = checkFeatureAllowed(tenant, 'hosted_blob_quota');
  if (!feature.allowed) return feature;
  return checkQuota(tenant, usage, 'monthlyBlobBytes', encryptedBytes);
}

export function applyUsageDelta(
  usage: UsageSnapshot,
  counter: UsageCounter,
  delta: number
): UsageSnapshot {
  if (!Number.isFinite(delta) || delta < 0) throw new Error('invalid usage delta');
  return { ...usage, [counter]: usage[counter] + delta };
}
