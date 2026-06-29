import {
  defaultSelfHostLicenseFeatures,
  licensePayloadValid,
  signSelfHostLicense,
  verifySelfHostLicense
} from '../src/commercial/license';

describe('commercial self-host license helpers', () => {
  it('validates payload dates, seats, and required features', () => {
    const payload = {
      licenseId: 'lic_1',
      customerName: 'Acme',
      planId: 'self_host_pro' as const,
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2027-01-01T00:00:00.000Z',
      seats: 10,
      features: defaultSelfHostLicenseFeatures('self_host_pro')
    };

    expect(licensePayloadValid(payload, 'self_host_license', new Date('2026-06-26T00:00:00.000Z'))).toEqual({ valid: true });
    expect(licensePayloadValid({ ...payload, seats: 0 }, undefined, new Date('2026-06-26T00:00:00.000Z'))).toEqual({
      valid: false,
      reason: 'invalid-seats'
    });
  });

  it('signs and verifies offline licenses', async () => {
    const keys = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
    const payload = {
      licenseId: 'lic_1',
      customerName: 'Acme',
      planId: 'self_host_pro' as const,
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2027-01-01T00:00:00.000Z',
      seats: 10,
      features: defaultSelfHostLicenseFeatures('self_host_pro')
    };
    const signed = await signSelfHostLicense(payload, keys.privateKey);
    await expect(verifySelfHostLicense(signed, keys.publicKey, {
      requiredFeature: 'self_host_license',
      now: new Date('2026-06-26T00:00:00.000Z')
    })).resolves.toEqual({ valid: true });

    await expect(verifySelfHostLicense({
      ...signed,
      payload: { ...signed.payload, customerName: 'Tampered' }
    }, keys.publicKey, {
      now: new Date('2026-06-26T00:00:00.000Z')
    })).resolves.toEqual({ valid: false, reason: 'signature-invalid' });
  });
});
