import {
  commercialControlBase,
  loadCommercialConfigForHost
} from '../src/commercial/client';

describe('commercial frontend client', () => {
  it('does not fetch when commercial features are disabled', async () => {
    const fetchImpl = jest.fn();
    await expect(loadCommercialConfigForHost('secure.example.com', {
      enabled: false,
      baseUrl: 'https://control.example',
      fetchImpl: fetchImpl as any
    })).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('loads and sanitizes public tenant config when explicitly enabled', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'tenant_1',
      slug: 'acme',
      planId: 'hosted_team',
      status: 'active',
      active: true,
      features: ['branding'],
      branding: {
        productName: 'Acme Secure',
        primaryColor: '#123abc',
        logoUrl: 'http://insecure/logo.png'
      }
    }), { status: 200 }));

    const config = await loadCommercialConfigForHost('secure.example.com', {
      enabled: true,
      baseUrl: 'https://control.example/',
      fetchImpl: fetchImpl as any
    });

    expect(fetchImpl).toHaveBeenCalledWith('https://control.example/api/tenant/by-host?host=secure.example.com', {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store'
    });
    expect(config?.branding).toEqual({
      productName: 'Acme Secure',
      primaryColor: '#123abc'
    });
  });

  it('normalizes explicit control base URLs', () => {
    expect(commercialControlBase('https://control.example/')).toBe('https://control.example');
  });
});
