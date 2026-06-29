import {
  COMMERCIAL_PLANS,
  getCommercialPlan,
  isPaidCommercialPlan,
  planHasFeature
} from '../src/commercial/plans';

describe('commercial plan definitions', () => {
  it('falls back to free for unknown plan ids', () => {
    expect(getCommercialPlan(undefined).id).toBe('free');
    expect(getCommercialPlan('missing').id).toBe('free');
  });

  it('keeps hosted pro in the intended low-price range', () => {
    expect(COMMERCIAL_PLANS.hosted_pro.monthlyUsdCents).toBe(900);
    expect(planHasFeature('hosted_pro', 'custom_domain')).toBe(true);
    expect(planHasFeature('hosted_pro', 'self_host_license')).toBe(false);
  });

  it('separates self-host and private deployment capabilities', () => {
    expect(planHasFeature('self_host_pro', 'self_host_license')).toBe(true);
    expect(planHasFeature('self_host_pro', 'private_deployment')).toBe(false);
    expect(planHasFeature('enterprise_private', 'security_audit_pack')).toBe(true);
  });

  it('treats quote-based plans as paid plans', () => {
    expect(isPaidCommercialPlan('free')).toBe(false);
    expect(isPaidCommercialPlan('hosted_team')).toBe(true);
    expect(isPaidCommercialPlan('incident_retainer')).toBe(true);
  });
});
