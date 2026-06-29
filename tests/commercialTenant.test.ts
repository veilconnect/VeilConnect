import {
  TenantRecord,
  normalizeHostname,
  publicTenantConfig,
  resolveTenantForHost,
  sanitizeBranding
} from '../src/commercial/tenant';

const tenant: TenantRecord = {
  id: 'tenant_1',
  slug: 'acme',
  planId: 'hosted_team',
  status: 'active',
  domains: [
    { hostname: 'secure.acme.example', status: 'active', primary: true },
    { hostname: 'pending.acme.example', status: 'pending' }
  ],
  branding: {
    productName: 'Acme Secure Room',
    primaryColor: '#123abc',
    logoUrl: 'https://cdn.example/logo.png',
    supportUrl: 'https://support.example'
  }
};

describe('commercial tenant helpers', () => {
  it('normalizes hosts from URLs, host headers, and trailing dots', () => {
    expect(normalizeHostname('https://Secure.Acme.Example/path')).toBe('secure.acme.example');
    expect(normalizeHostname('Secure.Acme.Example:443')).toBe('secure.acme.example');
    expect(normalizeHostname('secure.acme.example.')).toBe('secure.acme.example');
  });

  it('resolves only active tenant domains', () => {
    expect(resolveTenantForHost('secure.acme.example', [tenant])?.id).toBe('tenant_1');
    expect(resolveTenantForHost('pending.acme.example', [tenant])).toBeNull();
  });

  it('sanitizes public branding', () => {
    expect(sanitizeBranding({ productName: '  Legal Portal  ', primaryColor: '#abcdef' })).toEqual({
      productName: 'Legal Portal',
      primaryColor: '#abcdef'
    });
    expect(sanitizeBranding({ productName: '', primaryColor: 'javascript:bad', logoUrl: 'http://insecure/logo.png' })).toEqual({
      productName: 'VeilConnect',
      primaryColor: '#667eea'
    });
  });

  it('returns a public tenant config without pending domains', () => {
    const config = publicTenantConfig(tenant);
    expect(config.active).toBe(true);
    expect(config.features).toContain('white_label');
    expect(config.domains).toEqual([{ hostname: 'secure.acme.example', primary: true }]);
  });
});
