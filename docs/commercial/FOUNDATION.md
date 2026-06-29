# Commercial Foundation

This directory documents the commercial feature foundation. These features are
under development and are intentionally not deployed by the existing production
scripts.

## Safety Defaults

- `infra/cloudflare/commercial-control/` is not referenced by `scripts/deploy-pages.sh`.
- The control Worker returns `404` unless `COMMERCIAL_CONTROL_ENABLED=1`.
- No Stripe keys, DNS automation, or billing webhooks are active yet.
- The core TypeScript modules are pure logic only and are not imported by the
  current chat UI.

## Intended Control Plane

- `tenants`: customer account and plan state.
- `tenant_domains`: custom hostnames and verification state.
- `tenant_branding`: public logo/name/color settings.
- `tenant_usage_daily`: privacy-preserving aggregate usage counters.
- `team_members`: future admin/member access.
- `team_rooms`: branded team entry points and fixed secure-room links.
- `emergency_configs`: incident-response package configuration.

## First Launch Slice

1. Hosted Pro tenant records.
2. Public tenant lookup by hostname.
3. Branding config surfaced to the frontend behind a feature flag.
4. Blob quota checks before encrypted file uploads.
5. Stripe Checkout and webhook activation.

Do not deploy this control plane until billing, abuse controls, and admin
access control are complete.

## Local Modules

- `src/commercial/plans.ts`: plan catalog, features, quota limits.
- `src/commercial/tenant.ts`: domain lookup and public tenant config.
- `src/commercial/client.ts`: optional frontend config loader, disabled by default.
- `src/commercial/billing.ts`: Stripe Checkout params and webhook signature helpers.
- `src/commercial/clientSession.ts`: legal/consulting white-label session model.
- `src/commercial/emergency.ts`: incident-response channel model.
- `src/commercial/license.ts`: offline self-host license signing/verification.
- `src/commercial/auditPack.ts`: enterprise evidence checklist.

## Disabled Runtime Flags

Production remains unchanged unless all required flags are set explicitly:

```text
VC_COMMERCIAL_ENABLED=1
VC_COMMERCIAL_CONTROL_BASE=https://commercial-control.example
COMMERCIAL_CONTROL_ENABLED=1
ADMIN_API_TOKEN=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

The current `scripts/deploy-pages.sh` does not set these flags.

## Control Plane API Draft

Public:

```text
GET /api/tenant/by-host?host=secure.example.com
GET /api/client-sessions/:slug
GET /api/team-rooms/:slug
POST /api/billing/webhook
```

Admin-only (`Authorization: Bearer ADMIN_API_TOKEN`):

```text
POST /api/tenants
PATCH /api/tenants/branding
POST /api/domains
POST /api/team-rooms
POST /api/client-sessions
PATCH /api/emergency/config
POST /api/emergency/channels
GET /api/usage/daily?tenantId=...
POST /api/usage/increment
POST /api/billing/checkout
POST /api/self-host/licenses
GET /api/audit-pack?tenantId=...
PATCH /api/audit-pack
```
