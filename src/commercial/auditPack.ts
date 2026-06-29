export type AuditPackItemStatus = 'missing' | 'draft' | 'ready' | 'external-reviewed';

export interface AuditPackItem {
  id: string;
  title: string;
  requiredForEnterprise: boolean;
  status: AuditPackItemStatus;
  path?: string;
}

export const DEFAULT_AUDIT_PACK_ITEMS: AuditPackItem[] = [
  { id: 'threat-model', title: 'STRIDE threat model', requiredForEnterprise: true, status: 'ready', path: 'docs/security/THREAT_MODEL.md' },
  { id: 'crypto-rationale', title: 'Cryptographic design rationale', requiredForEnterprise: true, status: 'ready', path: 'docs/security/CRYPTO_RATIONALE.md' },
  { id: 'reproducible-builds', title: 'Reproducible build guide', requiredForEnterprise: true, status: 'ready', path: 'docs/REPRODUCIBLE_BUILD.md' },
  { id: 'sbom', title: 'Software bill of materials', requiredForEnterprise: true, status: 'missing' },
  { id: 'pentest-report', title: 'Third-party penetration test report', requiredForEnterprise: true, status: 'missing' },
  { id: 'code-signing', title: 'Code signing and release provenance', requiredForEnterprise: true, status: 'ready', path: 'docs/security/CODE_SIGNING.md' },
  { id: 'deployment-runbook', title: 'Private deployment runbook', requiredForEnterprise: true, status: 'draft' },
  { id: 'incident-response', title: 'Incident response customer runbook', requiredForEnterprise: false, status: 'draft' }
];

export function auditPackReadiness(items: readonly AuditPackItem[] = DEFAULT_AUDIT_PACK_ITEMS) {
  const required = items.filter(item => item.requiredForEnterprise);
  const ready = required.filter(item => item.status === 'ready' || item.status === 'external-reviewed');
  return {
    required: required.length,
    ready: ready.length,
    complete: ready.length === required.length,
    missing: required.filter(item => item.status === 'missing').map(item => item.id)
  };
}
