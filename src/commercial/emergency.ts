export type EmergencyChannelStatus = 'draft' | 'ready' | 'active' | 'closed';

export interface EmergencyChannel {
  id: string;
  tenantId: string;
  label: string;
  audience: 'executive' | 'legal' | 'incident_response' | 'vendor' | 'custom';
  status: EmergencyChannelStatus;
  runbookUrl?: string;
  contactEmails: string[];
}

export interface EmergencyConfig {
  tenantId: string;
  enabled: boolean;
  runbookUrl?: string;
  contactEmails: string[];
  channels: EmergencyChannel[];
}

export function normalizeEmailList(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const email = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

export function emergencyConfigReady(config: EmergencyConfig): boolean {
  return config.enabled
    && normalizeEmailList(config.contactEmails).length > 0
    && config.channels.some(channel => channel.status === 'ready' || channel.status === 'active');
}

export function defaultEmergencyChannels(tenantId: string): Omit<EmergencyChannel, 'id'>[] {
  return [
    { tenantId, label: 'Executive bridge', audience: 'executive', status: 'draft', contactEmails: [] },
    { tenantId, label: 'Legal and counsel', audience: 'legal', status: 'draft', contactEmails: [] },
    { tenantId, label: 'Incident response', audience: 'incident_response', status: 'draft', contactEmails: [] },
    { tenantId, label: 'External vendor bridge', audience: 'vendor', status: 'draft', contactEmails: [] }
  ];
}

export function activateEmergencyChannel(channel: EmergencyChannel): EmergencyChannel {
  if (channel.status !== 'ready') throw new Error('emergency channel must be ready before activation');
  return { ...channel, status: 'active' };
}
