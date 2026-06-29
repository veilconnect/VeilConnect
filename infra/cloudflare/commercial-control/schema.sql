-- Commercial control plane schema.
-- This is not used by the current production deployment. Apply it only to a
-- separate D1 database when commercial features are explicitly enabled.

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_domains (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  primary_domain INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_branding (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL DEFAULT 'VeilConnect',
  primary_color TEXT NOT NULL DEFAULT '#667eea',
  logo_url TEXT,
  support_url TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS team_rooms (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  max_participants INTEGER NOT NULL DEFAULT 2,
  require_pairing_code INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_usage_daily (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  room_creates INTEGER NOT NULL DEFAULT 0,
  pair_successes INTEGER NOT NULL DEFAULT 0,
  blob_bytes INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, day)
);

CREATE TABLE IF NOT EXISTS emergency_configs (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0,
  contact_emails_json TEXT NOT NULL DEFAULT '[]',
  runbook_url TEXT,
  channel_limit INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_channels (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'custom',
  status TEXT NOT NULL DEFAULT 'draft',
  runbook_url TEXT,
  contact_emails_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  case_ref TEXT,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  expires_at TEXT NOT NULL,
  file_quota_bytes INTEGER NOT NULL DEFAULT 1073741824,
  require_download_password INTEGER NOT NULL DEFAULT 1,
  branding_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  tenant_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS self_host_licenses (
  license_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  signed_license_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_pack_items (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'missing',
  artifact_url TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_domains_hostname ON tenant_domains(hostname);
CREATE INDEX IF NOT EXISTS idx_usage_day ON tenant_usage_daily(day);
CREATE INDEX IF NOT EXISTS idx_client_sessions_tenant ON client_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emergency_channels_tenant ON emergency_channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_rooms_tenant ON team_rooms(tenant_id);
