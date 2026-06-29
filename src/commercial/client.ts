import { commercialFeaturesEnabled } from './featureFlags';
import { TenantBranding, sanitizeBranding } from './tenant';

declare const __VC_COMMERCIAL_CONTROL_BASE__: string | undefined;

export interface PublicCommercialConfig {
  id: string;
  slug: string;
  planId: string;
  status: string;
  active: boolean;
  features: string[];
  branding: TenantBranding;
}

export function commercialControlBase(explicit?: string): string {
  if (explicit !== undefined) return explicit.replace(/\/$/, '');
  try {
    if (typeof __VC_COMMERCIAL_CONTROL_BASE__ === 'string') return __VC_COMMERCIAL_CONTROL_BASE__.replace(/\/$/, '');
  } catch { /* build constant not injected in tests */ }
  return '';
}

export async function loadCommercialConfigForHost(
  host: string,
  opts: { baseUrl?: string; enabled?: boolean; fetchImpl?: typeof fetch } = {}
): Promise<PublicCommercialConfig | null> {
  const enabled = opts.enabled ?? commercialFeaturesEnabled();
  if (!enabled) return null;
  const base = commercialControlBase(opts.baseUrl);
  if (!base) return null;
  const fetcher = opts.fetchImpl || fetch;
  const response = await fetcher(`${base}/api/tenant/by-host?host=${encodeURIComponent(host)}`, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store'
  });
  if (!response.ok) return null;
  const data = await response.json() as PublicCommercialConfig;
  return { ...data, branding: sanitizeBranding(data.branding) };
}

export function applyCommercialBrandingToDocument(config: PublicCommercialConfig | null, doc: Document = document): void {
  if (!config?.active) return;
  const branding = sanitizeBranding(config.branding);
  doc.documentElement.style.setProperty('--vc-brand-primary', branding.primaryColor);
  doc.title = branding.productName || 'VeilConnect';
}
