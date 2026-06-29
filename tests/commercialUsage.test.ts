import { TenantRecord } from '../src/commercial/tenant';
import {
  UsageSnapshot,
  applyUsageDelta,
  checkFeatureAllowed,
  checkHostedBlobUpload,
  checkQuota
} from '../src/commercial/usage';

const activeTenant: TenantRecord = {
  id: 'tenant_1',
  slug: 'acme',
  planId: 'hosted_pro',
  status: 'active',
  domains: [{ hostname: 'secure.acme.example', status: 'active' }],
  branding: { productName: 'Acme', primaryColor: '#123abc' }
};

const usage: UsageSnapshot = {
  day: '2026-06-26',
  roomCreates: 10,
  pairSuccesses: 5,
  monthlyBlobBytes: 9 * 1024 * 1024 * 1024
};

describe('commercial usage checks', () => {
  it('allows hosted pro blob usage until the quota is exceeded', () => {
    expect(checkHostedBlobUpload(activeTenant, usage, 512 * 1024 * 1024)).toMatchObject({
      allowed: true
    });
    expect(checkHostedBlobUpload(activeTenant, usage, 2 * 1024 * 1024 * 1024)).toMatchObject({
      allowed: false,
      reason: 'quota-exceeded'
    });
  });

  it('blocks inactive tenants before quota checks', () => {
    expect(checkQuota({ ...activeTenant, status: 'past_due' }, usage, 'roomCreates', 1)).toEqual({
      allowed: false,
      reason: 'tenant-inactive'
    });
  });

  it('blocks features missing from the plan', () => {
    expect(checkFeatureAllowed(activeTenant, 'self_host_license')).toEqual({
      allowed: false,
      reason: 'feature-disabled'
    });
  });

  it('rejects invalid deltas and applies valid ones immutably', () => {
    expect(checkQuota(activeTenant, usage, 'roomCreates', -1)).toEqual({
      allowed: false,
      reason: 'invalid-delta'
    });
    expect(applyUsageDelta(usage, 'pairSuccesses', 2)).toEqual({
      ...usage,
      pairSuccesses: 7
    });
    expect(usage.pairSuccesses).toBe(5);
  });
});
