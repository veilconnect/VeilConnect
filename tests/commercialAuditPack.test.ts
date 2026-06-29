import { DEFAULT_AUDIT_PACK_ITEMS, auditPackReadiness } from '../src/commercial/auditPack';

describe('commercial audit pack readiness', () => {
  it('reports missing enterprise evidence before external audit is complete', () => {
    const readiness = auditPackReadiness(DEFAULT_AUDIT_PACK_ITEMS);
    expect(readiness.complete).toBe(false);
    expect(readiness.missing).toContain('sbom');
    expect(readiness.missing).toContain('pentest-report');
  });

  it('marks the pack complete when required evidence is ready or reviewed', () => {
    const readiness = auditPackReadiness(DEFAULT_AUDIT_PACK_ITEMS.map(item => ({
      ...item,
      status: item.requiredForEnterprise ? 'external-reviewed' : item.status
    })));
    expect(readiness.complete).toBe(true);
    expect(readiness.missing).toEqual([]);
  });
});
