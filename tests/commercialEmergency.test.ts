import {
  activateEmergencyChannel,
  defaultEmergencyChannels,
  emergencyConfigReady,
  normalizeEmailList
} from '../src/commercial/emergency';

describe('commercial emergency package helpers', () => {
  it('deduplicates valid emergency contacts', () => {
    expect(normalizeEmailList(['A@example.com', 'bad', 'a@example.com', 'b@example.com'])).toEqual([
      'a@example.com',
      'b@example.com'
    ]);
  });

  it('requires enabled config, contacts, and ready channels', () => {
    const channels = defaultEmergencyChannels('tenant_1').map((channel, index) => ({
      ...channel,
      id: `ch_${index}`,
      status: index === 0 ? 'ready' as const : channel.status
    }));
    expect(emergencyConfigReady({
      tenantId: 'tenant_1',
      enabled: true,
      contactEmails: ['ir@example.com'],
      channels
    })).toBe(true);
  });

  it('activates only ready channels', () => {
    const ready = {
      id: 'ch_1',
      tenantId: 'tenant_1',
      label: 'IR bridge',
      audience: 'incident_response' as const,
      status: 'ready' as const,
      contactEmails: []
    };
    expect(activateEmergencyChannel(ready).status).toBe('active');
    expect(() => activateEmergencyChannel({ ...ready, status: 'draft' })).toThrow('ready');
  });
});
