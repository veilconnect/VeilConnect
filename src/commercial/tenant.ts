import { CommercialPlanId, getCommercialPlan } from './plans';

export type TenantStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'canceled';

export interface TenantBranding {
  productName: string;
  primaryColor: string;
  logoUrl?: string;
  supportUrl?: string;
}

export interface TenantDomain {
  hostname: string;
  status: 'pending' | 'active' | 'failed';
  primary?: boolean;
}

export interface TenantRecord {
  id: string;
  slug: string;
  planId: CommercialPlanId;
  status: TenantStatus;
  domains: TenantDomain[];
  branding: TenantBranding;
}

const FALLBACK_BRANDING: TenantBranding = {
  productName: 'VeilConnect',
  primaryColor: '#667eea'
};

export function normalizeHostname(input: string): string {
  const raw = input.trim();
  if (!raw) return '';
  let host = raw;
  try {
    host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname;
  } catch {
    host = raw.split('/')[0] || '';
  }
  return host
    .replace(/\.$/, '')
    .replace(/:\d+$/, '')
    .toLowerCase();
}

export function isTenantActive(status: TenantStatus): boolean {
  return status === 'active' || status === 'trialing';
}

export function sanitizeBranding(input: Partial<TenantBranding> | null | undefined): TenantBranding {
  const productName = (input?.productName || FALLBACK_BRANDING.productName).trim().slice(0, 80) || FALLBACK_BRANDING.productName;
  const primaryColor = /^#[0-9a-f]{6}$/i.test(input?.primaryColor || '')
    ? input!.primaryColor!
    : FALLBACK_BRANDING.primaryColor;

  const out: TenantBranding = { productName, primaryColor };
  if (input?.logoUrl && /^https:\/\/[^\s]+$/i.test(input.logoUrl)) out.logoUrl = input.logoUrl;
  if (input?.supportUrl && /^https:\/\/[^\s]+$/i.test(input.supportUrl)) out.supportUrl = input.supportUrl;
  return out;
}

export function publicTenantConfig(tenant: TenantRecord) {
  const plan = getCommercialPlan(tenant.planId);
  return {
    id: tenant.id,
    slug: tenant.slug,
    planId: plan.id,
    status: tenant.status,
    active: isTenantActive(tenant.status),
    features: plan.features,
    quotas: plan.quotas,
    branding: sanitizeBranding(tenant.branding),
    domains: tenant.domains
      .filter(domain => domain.status === 'active')
      .map(domain => ({ hostname: normalizeHostname(domain.hostname), primary: !!domain.primary }))
  };
}

export function resolveTenantForHost(host: string, tenants: readonly TenantRecord[]): TenantRecord | null {
  const normalized = normalizeHostname(host);
  if (!normalized) return null;
  return tenants.find(tenant =>
    tenant.domains.some(domain => domain.status === 'active' && normalizeHostname(domain.hostname) === normalized)
  ) || null;
}
