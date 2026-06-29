const PLAN_FEATURES = {
  free: [],
  hosted_pro: ['custom_domain', 'branding', 'hosted_blob_quota', 'usage_dashboard', 'client_sessions'],
  hosted_team: ['custom_domain', 'team_rooms', 'branding', 'hosted_blob_quota', 'usage_dashboard', 'client_sessions', 'white_label'],
  self_host_pro: ['self_host_license', 'usage_dashboard', 'branding', 'support_sla'],
  incident_retainer: ['custom_domain', 'team_rooms', 'branding', 'usage_dashboard', 'emergency_channels', 'support_sla'],
  enterprise_private: [
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
  ]
};

const STRIPE_STATUS_TO_TENANT = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'canceled',
  incomplete_expired: 'canceled'
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...headers
    }
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  if (allowed.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
  }
  return {};
}

function normalizeHostname(input) {
  const raw = (input || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.replace(/\.$/, '').toLowerCase();
  } catch {
    return raw.split('/')[0].replace(/\.$/, '').toLowerCase();
  }
}

function normalizeSlug(input) {
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function requireAdmin(request, env) {
  const token = env.ADMIN_API_TOKEN || '';
  if (!token) return false;
  return request.headers.get('Authorization') === `Bearer ${token}`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function sanitizeBranding(input = {}) {
  const productName = String(input.productName || input.product_name || 'VeilConnect').trim().slice(0, 80) || 'VeilConnect';
  const primaryColor = /^#[0-9a-f]{6}$/i.test(String(input.primaryColor || input.primary_color || ''))
    ? String(input.primaryColor || input.primary_color)
    : '#667eea';
  const branding = { productName, primaryColor };
  const logoUrl = String(input.logoUrl || input.logo_url || '');
  const supportUrl = String(input.supportUrl || input.support_url || '');
  if (/^https:\/\/[^\s]+$/i.test(logoUrl)) branding.logoUrl = logoUrl;
  if (/^https:\/\/[^\s]+$/i.test(supportUrl)) branding.supportUrl = supportUrl;
  return branding;
}

async function tenantByHost(env, host) {
  const hostname = normalizeHostname(host);
  if (!hostname) return null;
  return env.DB.prepare(`
    SELECT
      t.id, t.slug, t.plan_id, t.status,
      b.product_name, b.primary_color, b.logo_url, b.support_url
    FROM tenant_domains d
    JOIN tenants t ON t.id = d.tenant_id
    LEFT JOIN tenant_branding b ON b.tenant_id = t.id
    WHERE d.hostname = ? AND d.status = 'active'
    LIMIT 1
  `).bind(hostname).first();
}

async function publicTenantConfig(env, request) {
  const url = new URL(request.url);
  const host = url.searchParams.get('host') || request.headers.get('Host') || '';
  const tenant = await tenantByHost(env, host);
  if (!tenant) return json({ error: 'tenant-not-found' }, 404, corsHeaders(request, env));
  return json({
    id: tenant.id,
    slug: tenant.slug,
    planId: tenant.plan_id,
    status: tenant.status,
    active: tenant.status === 'active' || tenant.status === 'trialing',
    features: PLAN_FEATURES[tenant.plan_id] || [],
    branding: sanitizeBranding({
      product_name: tenant.product_name,
      primary_color: tenant.primary_color,
      logo_url: tenant.logo_url,
      support_url: tenant.support_url
    })
  }, 200, corsHeaders(request, env));
}

async function createTenant(env, request) {
  const body = await readJson(request);
  if (!body) return json({ error: 'invalid-json' }, 400, corsHeaders(request, env));
  const id = body.id || crypto.randomUUID();
  const slug = normalizeSlug(body.slug || body.name || id);
  const planId = PLAN_FEATURES[body.planId] ? body.planId : 'free';
  const status = body.status || 'trialing';
  await env.DB.prepare(`
    INSERT INTO tenants (id, slug, plan_id, status)
    VALUES (?, ?, ?, ?)
  `).bind(id, slug, planId, status).run();
  const branding = sanitizeBranding(body.branding || {});
  await env.DB.prepare(`
    INSERT INTO tenant_branding (tenant_id, product_name, primary_color, logo_url, support_url)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, branding.productName, branding.primaryColor, branding.logoUrl || null, branding.supportUrl || null).run();
  return json({ id, slug, planId, status }, 201, corsHeaders(request, env));
}

async function upsertBranding(env, request) {
  const body = await readJson(request);
  if (!body?.tenantId) return json({ error: 'missing-tenant-id' }, 400, corsHeaders(request, env));
  const branding = sanitizeBranding(body);
  await env.DB.prepare(`
    INSERT INTO tenant_branding (tenant_id, product_name, primary_color, logo_url, support_url, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(tenant_id) DO UPDATE SET
      product_name = excluded.product_name,
      primary_color = excluded.primary_color,
      logo_url = excluded.logo_url,
      support_url = excluded.support_url,
      updated_at = CURRENT_TIMESTAMP
  `).bind(body.tenantId, branding.productName, branding.primaryColor, branding.logoUrl || null, branding.supportUrl || null).run();
  return json({ tenantId: body.tenantId, branding }, 200, corsHeaders(request, env));
}

async function addDomain(env, request) {
  const body = await readJson(request);
  const hostname = normalizeHostname(body?.hostname || '');
  if (!body?.tenantId || !hostname) return json({ error: 'missing-domain-fields' }, 400, corsHeaders(request, env));
  const id = body.id || crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO tenant_domains (id, tenant_id, hostname, status, primary_domain, verification_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, body.tenantId, hostname, body.status || 'pending', body.primary ? 1 : 0, body.verificationStatus || 'pending').run();
  return json({ id, tenantId: body.tenantId, hostname, status: body.status || 'pending' }, 201, corsHeaders(request, env));
}

async function createClientSession(env, request) {
  const body = await readJson(request);
  if (!body?.tenantId || !body?.displayName || !body?.expiresAt) {
    return json({ error: 'missing-client-session-fields' }, 400, corsHeaders(request, env));
  }
  const id = body.id || crypto.randomUUID();
  const slug = normalizeSlug(body.slug || `${body.displayName}-${body.caseRef || id.slice(0, 8)}`);
  const branding = body.branding ? JSON.stringify(sanitizeBranding(body.branding)) : null;
  await env.DB.prepare(`
    INSERT INTO client_sessions (
      id, tenant_id, slug, case_ref, display_name, status, expires_at,
      file_quota_bytes, require_download_password, branding_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.tenantId,
    slug,
    body.caseRef || null,
    String(body.displayName).trim().slice(0, 120),
    body.status || 'active',
    new Date(body.expiresAt).toISOString(),
    Math.max(0, Math.floor(body.fileQuotaBytes ?? 1024 * 1024 * 1024)),
    body.requireDownloadPassword === false ? 0 : 1,
    branding
  ).run();
  return json({ id, tenantId: body.tenantId, slug }, 201, corsHeaders(request, env));
}

async function createTeamRoom(env, request) {
  const body = await readJson(request);
  if (!body?.tenantId || !body?.label) return json({ error: 'missing-team-room-fields' }, 400, corsHeaders(request, env));
  const id = body.id || crypto.randomUUID();
  const slug = normalizeSlug(body.slug || body.label);
  await env.DB.prepare(`
    INSERT INTO team_rooms (
      id, tenant_id, slug, label, status, max_participants,
      require_pairing_code, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.tenantId,
    slug,
    String(body.label).trim().slice(0, 120),
    body.status || 'active',
    2,
    body.requirePairingCode === false ? 0 : 1,
    body.expiresAt ? new Date(body.expiresAt).toISOString() : null
  ).run();
  return json({ id, tenantId: body.tenantId, slug }, 201, corsHeaders(request, env));
}

async function publicTeamRoom(env, request) {
  const url = new URL(request.url);
  const slug = normalizeSlug(url.pathname.replace('/api/team-rooms/', ''));
  const row = await env.DB.prepare(`
    SELECT slug, label, status, max_participants, require_pairing_code, expires_at
    FROM team_rooms
    WHERE slug = ?
    LIMIT 1
  `).bind(slug).first();
  if (!row) return json({ error: 'team-room-not-found' }, 404, corsHeaders(request, env));
  return json({
    slug: row.slug,
    label: row.label,
    active: row.status === 'active' && (!row.expires_at || new Date(row.expires_at).getTime() > Date.now()),
    maxParticipants: row.max_participants,
    requirePairingCode: !!row.require_pairing_code
  }, 200, corsHeaders(request, env));
}

async function publicClientSession(env, request) {
  const url = new URL(request.url);
  const slug = normalizeSlug(url.pathname.replace('/api/client-sessions/', ''));
  const row = await env.DB.prepare(`
    SELECT
      s.slug, s.display_name, s.status, s.expires_at, s.file_quota_bytes,
      s.require_download_password, s.branding_json,
      b.product_name, b.primary_color, b.logo_url, b.support_url
    FROM client_sessions s
    JOIN tenants t ON t.id = s.tenant_id
    LEFT JOIN tenant_branding b ON b.tenant_id = t.id
    WHERE s.slug = ?
    LIMIT 1
  `).bind(slug).first();
  if (!row) return json({ error: 'session-not-found' }, 404, corsHeaders(request, env));
  let override = {};
  try { override = row.branding_json ? JSON.parse(row.branding_json) : {}; } catch {}
  const branding = sanitizeBranding({
    product_name: row.product_name,
    primary_color: row.primary_color,
    logo_url: row.logo_url,
    support_url: row.support_url,
    ...override
  });
  return json({
    slug: row.slug,
    displayName: row.display_name,
    active: row.status === 'active' && new Date(row.expires_at).getTime() > Date.now(),
    expiresAt: row.expires_at,
    fileQuotaBytes: row.file_quota_bytes,
    requireDownloadPassword: !!row.require_download_password,
    branding
  }, 200, corsHeaders(request, env));
}

async function upsertEmergencyConfig(env, request) {
  const body = await readJson(request);
  if (!body?.tenantId) return json({ error: 'missing-tenant-id' }, 400, corsHeaders(request, env));
  const contacts = Array.isArray(body.contactEmails) ? body.contactEmails : [];
  await env.DB.prepare(`
    INSERT INTO emergency_configs (tenant_id, enabled, contact_emails_json, runbook_url, channel_limit, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(tenant_id) DO UPDATE SET
      enabled = excluded.enabled,
      contact_emails_json = excluded.contact_emails_json,
      runbook_url = excluded.runbook_url,
      channel_limit = excluded.channel_limit,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    body.tenantId,
    body.enabled ? 1 : 0,
    JSON.stringify(contacts),
    body.runbookUrl || null,
    Math.max(0, Math.floor(body.channelLimit ?? 0))
  ).run();
  return json({ tenantId: body.tenantId, enabled: !!body.enabled }, 200, corsHeaders(request, env));
}

async function createEmergencyChannel(env, request) {
  const body = await readJson(request);
  if (!body?.tenantId || !body?.label) return json({ error: 'missing-emergency-channel-fields' }, 400, corsHeaders(request, env));
  const id = body.id || crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO emergency_channels (id, tenant_id, label, audience, status, runbook_url, contact_emails_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.tenantId,
    String(body.label).trim().slice(0, 120),
    body.audience || 'custom',
    body.status || 'draft',
    body.runbookUrl || null,
    JSON.stringify(Array.isArray(body.contactEmails) ? body.contactEmails : [])
  ).run();
  return json({ id, tenantId: body.tenantId }, 201, corsHeaders(request, env));
}

async function usageSummary(env, request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) return json({ error: 'missing-tenant-id' }, 400, corsHeaders(request, env));
  const rows = await env.DB.prepare(`
    SELECT day, room_creates, pair_successes, blob_bytes
    FROM tenant_usage_daily
    WHERE tenant_id = ?
    ORDER BY day DESC
    LIMIT 31
  `).bind(tenantId).all();
  return json({ tenantId, days: rows.results || [] }, 200, corsHeaders(request, env));
}

async function incrementUsage(env, request) {
  const body = await readJson(request);
  if (!body?.tenantId) return json({ error: 'missing-tenant-id' }, 400, corsHeaders(request, env));
  const day = body.day || new Date().toISOString().slice(0, 10);
  const roomCreates = Math.max(0, Math.floor(body.roomCreates || 0));
  const pairSuccesses = Math.max(0, Math.floor(body.pairSuccesses || 0));
  const blobBytes = Math.max(0, Math.floor(body.blobBytes || 0));
  await env.DB.prepare(`
    INSERT INTO tenant_usage_daily (tenant_id, day, room_creates, pair_successes, blob_bytes)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(tenant_id, day) DO UPDATE SET
      room_creates = room_creates + excluded.room_creates,
      pair_successes = pair_successes + excluded.pair_successes,
      blob_bytes = blob_bytes + excluded.blob_bytes
  `).bind(body.tenantId, day, roomCreates, pairSuccesses, blobBytes).run();
  return json({ tenantId: body.tenantId, day }, 200, corsHeaders(request, env));
}

function stripePriceForPlan(env, planId) {
  if (planId === 'hosted_pro') return env.STRIPE_PRICE_HOSTED_PRO || '';
  if (planId === 'hosted_team') return env.STRIPE_PRICE_HOSTED_TEAM || '';
  if (planId === 'self_host_pro') return env.STRIPE_PRICE_SELF_HOST_PRO || '';
  return '';
}

async function createCheckout(env, request) {
  const body = await readJson(request);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'stripe-not-configured' }, 501, corsHeaders(request, env));
  if (!body?.tenantId || !body?.planId || !body?.successUrl || !body?.cancelUrl) {
    return json({ error: 'missing-checkout-fields' }, 400, corsHeaders(request, env));
  }
  const price = stripePriceForPlan(env, body.planId);
  if (!price) return json({ error: 'stripe-price-not-configured' }, 400, corsHeaders(request, env));
  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('success_url', body.successUrl);
  form.set('cancel_url', body.cancelUrl);
  form.set('line_items[0][price]', price);
  form.set('line_items[0][quantity]', '1');
  form.set('client_reference_id', body.tenantId);
  form.set('metadata[tenant_id]', body.tenantId);
  form.set('metadata[plan_id]', body.planId);
  if (body.customerEmail) form.set('customer_email', body.customerEmail);
  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form
  });
  const data = await stripeResponse.json();
  return json(data, stripeResponse.status, corsHeaders(request, env));
}

function hex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return hex(new Uint8Array(sig));
}

async function verifyStripeSignature(rawBody, header, secret) {
  if (!secret || !header) return false;
  const parts = header.split(',').map(v => v.trim());
  const timestamp = parts.find(v => v.startsWith('t='))?.slice(2);
  const signatures = parts.filter(v => v.startsWith('v1=')).map(v => v.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() - Number(timestamp) * 1000) > 300000) return false;
  const expected = await hmacSha256(`${timestamp}.${rawBody}`, secret);
  return signatures.includes(expected);
}

async function stripeWebhook(env, request) {
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'stripe-webhook-not-configured' }, 501);
  const rawBody = await request.text();
  const verified = await verifyStripeSignature(rawBody, request.headers.get('Stripe-Signature') || '', env.STRIPE_WEBHOOK_SECRET);
  if (!verified) return json({ error: 'invalid-signature' }, 400);
  const event = JSON.parse(rawBody);
  const object = event.data?.object || {};
  const metadata = object.metadata || {};
  const tenantId = metadata.tenant_id || object.client_reference_id || '';
  const planId = metadata.plan_id || null;
  const stripeCustomerId = typeof object.customer === 'string' ? object.customer : null;
  const stripeSubscriptionId = typeof object.subscription === 'string' ? object.subscription : (typeof object.id === 'string' && event.type.startsWith('customer.subscription') ? object.id : null);
  const stripeStatus = STRIPE_STATUS_TO_TENANT[object.status] || 'active';

  await env.DB.prepare(`
    INSERT OR IGNORE INTO billing_events (id, event_type, tenant_id, stripe_customer_id, stripe_subscription_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(event.id, event.type, tenantId || null, stripeCustomerId, stripeSubscriptionId).run();

  if (tenantId && (event.type === 'checkout.session.completed' || event.type.startsWith('customer.subscription.'))) {
    await env.DB.prepare(`
      UPDATE tenants SET
        plan_id = COALESCE(?, plan_id),
        status = ?,
        stripe_customer_id = COALESCE(?, stripe_customer_id),
        stripe_subscription_id = COALESCE(?, stripe_subscription_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(planId, stripeStatus, stripeCustomerId, stripeSubscriptionId, tenantId).run();
  }
  return json({ ok: true });
}

async function saveSelfHostLicense(env, request) {
  const body = await readJson(request);
  if (!body?.tenantId || !body?.license?.payload?.licenseId) return json({ error: 'missing-license-fields' }, 400, corsHeaders(request, env));
  await env.DB.prepare(`
    INSERT INTO self_host_licenses (license_id, tenant_id, signed_license_json, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(
    body.license.payload.licenseId,
    body.tenantId,
    JSON.stringify(body.license),
    body.license.payload.expiresAt
  ).run();
  return json({ licenseId: body.license.payload.licenseId }, 201, corsHeaders(request, env));
}

async function auditPackStatus(env, request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) return json({ error: 'missing-tenant-id' }, 400, corsHeaders(request, env));
  const rows = await env.DB.prepare(`
    SELECT item_id, status, artifact_url, updated_at
    FROM audit_pack_items
    WHERE tenant_id = ?
    ORDER BY item_id ASC
  `).bind(tenantId).all();
  return json({ tenantId, items: rows.results || [] }, 200, corsHeaders(request, env));
}

async function upsertAuditPackItem(env, request) {
  const body = await readJson(request);
  if (!body?.tenantId || !body?.itemId || !body?.status) {
    return json({ error: 'missing-audit-pack-fields' }, 400, corsHeaders(request, env));
  }
  await env.DB.prepare(`
    INSERT INTO audit_pack_items (tenant_id, item_id, status, artifact_url, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(tenant_id, item_id) DO UPDATE SET
      status = excluded.status,
      artifact_url = excluded.artifact_url,
      updated_at = CURRENT_TIMESTAMP
  `).bind(body.tenantId, body.itemId, body.status, body.artifactUrl || null).run();
  return json({ tenantId: body.tenantId, itemId: body.itemId, status: body.status }, 200, corsHeaders(request, env));
}

export default {
  async fetch(request, env) {
    if (env.COMMERCIAL_CONTROL_ENABLED !== '1') {
      return new Response('Not found', { status: 404 });
    }
    if (!env.DB) return json({ error: 'missing-db-binding' }, 500);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const admin = requireAdmin(request, env);

    if (path === '/health') return json({ ok: true }, 200, corsHeaders(request, env));
    if (request.method === 'GET' && path === '/api/tenant/by-host') return publicTenantConfig(env, request);
    if (request.method === 'GET' && path.startsWith('/api/client-sessions/')) return publicClientSession(env, request);
    if (request.method === 'GET' && path.startsWith('/api/team-rooms/')) return publicTeamRoom(env, request);
    if (request.method === 'POST' && path === '/api/billing/webhook') return stripeWebhook(env, request);

    if (!admin) return json({ error: 'unauthorized' }, 401, corsHeaders(request, env));

    if (request.method === 'POST' && path === '/api/tenants') return createTenant(env, request);
    if (request.method === 'PATCH' && path === '/api/tenants/branding') return upsertBranding(env, request);
    if (request.method === 'POST' && path === '/api/domains') return addDomain(env, request);
    if (request.method === 'POST' && path === '/api/team-rooms') return createTeamRoom(env, request);
    if (request.method === 'POST' && path === '/api/client-sessions') return createClientSession(env, request);
    if (request.method === 'PATCH' && path === '/api/emergency/config') return upsertEmergencyConfig(env, request);
    if (request.method === 'POST' && path === '/api/emergency/channels') return createEmergencyChannel(env, request);
    if (request.method === 'GET' && path === '/api/usage/daily') return usageSummary(env, request);
    if (request.method === 'POST' && path === '/api/usage/increment') return incrementUsage(env, request);
    if (request.method === 'POST' && path === '/api/billing/checkout') return createCheckout(env, request);
    if (request.method === 'POST' && path === '/api/self-host/licenses') return saveSelfHostLicense(env, request);
    if (request.method === 'GET' && path === '/api/audit-pack') return auditPackStatus(env, request);
    if (request.method === 'PATCH' && path === '/api/audit-pack') return upsertAuditPackItem(env, request);

    return json({ error: 'not-found' }, 404, corsHeaders(request, env));
  }
};
