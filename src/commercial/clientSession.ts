import { TenantBranding, sanitizeBranding } from './tenant';

export type ClientSessionStatus = 'draft' | 'active' | 'expired' | 'revoked';

export interface ClientSessionRecord {
  id: string;
  tenantId: string;
  slug: string;
  caseRef?: string;
  displayName: string;
  status: ClientSessionStatus;
  expiresAt: string;
  fileQuotaBytes: number;
  requireDownloadPassword: boolean;
  branding?: Partial<TenantBranding>;
}

export interface ClientSessionDraftInput {
  tenantId: string;
  displayName: string;
  caseRef?: string;
  expiresAt: string | Date;
  fileQuotaBytes?: number;
  requireDownloadPassword?: boolean;
  branding?: Partial<TenantBranding>;
}

export function slugifySessionName(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || 'client-session';
}

export function isClientSessionActive(session: ClientSessionRecord, now: Date = new Date()): boolean {
  return session.status === 'active' && new Date(session.expiresAt).getTime() > now.getTime();
}

export function createClientSessionDraft(input: ClientSessionDraftInput): Omit<ClientSessionRecord, 'id' | 'status'> {
  const displayName = input.displayName.trim().slice(0, 120);
  if (!displayName) throw new Error('display name is required');
  const expiresAt = input.expiresAt instanceof Date ? input.expiresAt.toISOString() : new Date(input.expiresAt).toISOString();
  if (Number.isNaN(new Date(expiresAt).getTime())) throw new Error('invalid expiration');
  return {
    tenantId: input.tenantId,
    slug: slugifySessionName(`${displayName}-${input.caseRef || ''}`),
    caseRef: input.caseRef?.trim().slice(0, 120) || undefined,
    displayName,
    expiresAt,
    fileQuotaBytes: Math.max(0, Math.floor(input.fileQuotaBytes ?? 1024 * 1024 * 1024)),
    requireDownloadPassword: input.requireDownloadPassword ?? true,
    branding: input.branding ? sanitizeBranding(input.branding) : undefined
  };
}

export function publicClientSessionConfig(session: ClientSessionRecord, fallbackBranding: TenantBranding) {
  return {
    slug: session.slug,
    displayName: session.displayName,
    active: isClientSessionActive(session),
    expiresAt: session.expiresAt,
    fileQuotaBytes: session.fileQuotaBytes,
    requireDownloadPassword: session.requireDownloadPassword,
    branding: sanitizeBranding({ ...fallbackBranding, ...session.branding })
  };
}
