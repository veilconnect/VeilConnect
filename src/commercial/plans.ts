export type CommercialPlanId =
  | 'free'
  | 'hosted_pro'
  | 'hosted_team'
  | 'self_host_pro'
  | 'incident_retainer'
  | 'enterprise_private';

export type CommercialFeature =
  | 'custom_domain'
  | 'team_rooms'
  | 'branding'
  | 'hosted_blob_quota'
  | 'usage_dashboard'
  | 'client_sessions'
  | 'self_host_license'
  | 'emergency_channels'
  | 'white_label'
  | 'private_deployment'
  | 'security_audit_pack'
  | 'support_sla';

export interface CommercialQuotas {
  monthlyBlobBytes: number;
  dailyRoomCreates: number;
  dailyPairSuccesses: number;
  customDomains: number;
  teamMembers: number;
  emergencyChannels: number;
  activeClientSessions: number;
}

export interface CommercialPlanDefinition {
  id: CommercialPlanId;
  displayName: string;
  monthlyUsdCents: number | null;
  features: readonly CommercialFeature[];
  quotas: CommercialQuotas;
}

export const FREE_QUOTAS: CommercialQuotas = {
  monthlyBlobBytes: 0,
  dailyRoomCreates: 20,
  dailyPairSuccesses: 20,
  customDomains: 0,
  teamMembers: 1,
  emergencyChannels: 0,
  activeClientSessions: 0
};

export const COMMERCIAL_PLANS: Record<CommercialPlanId, CommercialPlanDefinition> = {
  free: {
    id: 'free',
    displayName: 'Free',
    monthlyUsdCents: 0,
    features: [],
    quotas: FREE_QUOTAS
  },
  hosted_pro: {
    id: 'hosted_pro',
    displayName: 'Hosted Pro',
    monthlyUsdCents: 900,
    features: ['custom_domain', 'branding', 'hosted_blob_quota', 'usage_dashboard', 'client_sessions'],
    quotas: {
      monthlyBlobBytes: 10 * 1024 * 1024 * 1024,
      dailyRoomCreates: 200,
      dailyPairSuccesses: 200,
      customDomains: 1,
      teamMembers: 3,
      emergencyChannels: 0,
      activeClientSessions: 25
    }
  },
  hosted_team: {
    id: 'hosted_team',
    displayName: 'Hosted Team',
    monthlyUsdCents: 4900,
    features: ['custom_domain', 'team_rooms', 'branding', 'hosted_blob_quota', 'usage_dashboard', 'client_sessions', 'white_label'],
    quotas: {
      monthlyBlobBytes: 100 * 1024 * 1024 * 1024,
      dailyRoomCreates: 1000,
      dailyPairSuccesses: 1000,
      customDomains: 5,
      teamMembers: 25,
      emergencyChannels: 0,
      activeClientSessions: 250
    }
  },
  self_host_pro: {
    id: 'self_host_pro',
    displayName: 'Self-host Pro',
    monthlyUsdCents: 19900,
    features: ['self_host_license', 'usage_dashboard', 'branding', 'support_sla'],
    quotas: {
      monthlyBlobBytes: Number.MAX_SAFE_INTEGER,
      dailyRoomCreates: Number.MAX_SAFE_INTEGER,
      dailyPairSuccesses: Number.MAX_SAFE_INTEGER,
      customDomains: 0,
      teamMembers: 25,
      emergencyChannels: 0,
      activeClientSessions: Number.MAX_SAFE_INTEGER
    }
  },
  incident_retainer: {
    id: 'incident_retainer',
    displayName: 'Incident Retainer',
    monthlyUsdCents: null,
    features: ['custom_domain', 'team_rooms', 'branding', 'usage_dashboard', 'emergency_channels', 'support_sla'],
    quotas: {
      monthlyBlobBytes: 25 * 1024 * 1024 * 1024,
      dailyRoomCreates: 500,
      dailyPairSuccesses: 500,
      customDomains: 3,
      teamMembers: 50,
      emergencyChannels: 8,
      activeClientSessions: 50
    }
  },
  enterprise_private: {
    id: 'enterprise_private',
    displayName: 'Enterprise Private',
    monthlyUsdCents: null,
    features: [
      'custom_domain',
      'team_rooms',
      'branding',
      'hosted_blob_quota',
      'usage_dashboard',
      'client_sessions',
      'self_host_license',
      'emergency_channels',
      'white_label',
      'private_deployment',
      'security_audit_pack',
      'support_sla'
    ],
    quotas: {
      monthlyBlobBytes: Number.MAX_SAFE_INTEGER,
      dailyRoomCreates: Number.MAX_SAFE_INTEGER,
      dailyPairSuccesses: Number.MAX_SAFE_INTEGER,
      customDomains: 25,
      teamMembers: Number.MAX_SAFE_INTEGER,
      emergencyChannels: Number.MAX_SAFE_INTEGER,
      activeClientSessions: Number.MAX_SAFE_INTEGER
    }
  }
};

export function isCommercialPlanId(value: string): value is CommercialPlanId {
  return Object.prototype.hasOwnProperty.call(COMMERCIAL_PLANS, value);
}

export function getCommercialPlan(id: string | null | undefined): CommercialPlanDefinition {
  if (id && isCommercialPlanId(id)) return COMMERCIAL_PLANS[id];
  return COMMERCIAL_PLANS.free;
}

export function planHasFeature(planId: string | null | undefined, feature: CommercialFeature): boolean {
  return getCommercialPlan(planId).features.includes(feature);
}

export function isPaidCommercialPlan(planId: string | null | undefined): boolean {
  const price = getCommercialPlan(planId).monthlyUsdCents;
  return price === null || price > 0;
}
