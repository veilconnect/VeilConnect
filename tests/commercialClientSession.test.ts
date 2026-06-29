import {
  createClientSessionDraft,
  isClientSessionActive,
  publicClientSessionConfig,
  slugifySessionName
} from '../src/commercial/clientSession';

describe('commercial client sessions', () => {
  it('creates URL-safe legal/consulting session slugs', () => {
    expect(slugifySessionName(' ACME v. Example / privileged channel ')).toBe('acme-v-example-privileged-channel');
  });

  it('builds draft sessions with safe defaults', () => {
    const draft = createClientSessionDraft({
      tenantId: 'tenant_1',
      displayName: 'Acme Legal Secure Room',
      caseRef: 'Matter 42',
      expiresAt: '2026-07-01T00:00:00.000Z'
    });
    expect(draft.slug).toBe('acme-legal-secure-room-matter-42');
    expect(draft.requireDownloadPassword).toBe(true);
    expect(draft.fileQuotaBytes).toBe(1024 * 1024 * 1024);
  });

  it('publishes active state and branding without exposing case reference', () => {
    const config = publicClientSessionConfig({
      id: 'session_1',
      tenantId: 'tenant_1',
      slug: 'acme',
      caseRef: 'Privileged Matter',
      displayName: 'Acme Secure Room',
      status: 'active',
      expiresAt: '2026-07-01T00:00:00.000Z',
      fileQuotaBytes: 10,
      requireDownloadPassword: true,
      branding: { productName: 'Acme Legal', primaryColor: '#111111' }
    }, {
      productName: 'Fallback',
      primaryColor: '#667eea'
    });

    expect(isClientSessionActive({
      id: 'session_1',
      tenantId: 'tenant_1',
      slug: 'acme',
      displayName: 'Acme Secure Room',
      status: 'active',
      expiresAt: '2026-07-01T00:00:00.000Z',
      fileQuotaBytes: 10,
      requireDownloadPassword: true
    }, new Date('2026-06-26T00:00:00.000Z'))).toBe(true);
    expect(config).not.toHaveProperty('caseRef');
    expect(config.branding.productName).toBe('Acme Legal');
  });
});
