# Hosted Pro Implementation

Hosted Pro is the first commercial launch candidate. It adds tenant-specific
branding, custom domains, usage summaries, encrypted file quotas, and Stripe
subscriptions while preserving the existing privacy model.

## Current Local Status

- Plan and quota definitions exist in `src/commercial/plans.ts`.
- Tenant/domain/branding helpers exist in `src/commercial/tenant.ts`.
- Optional frontend branding fetch exists in `src/commercial/client.ts`.
- Team room config exists in `src/commercial/teamRoom.ts`.
- Stripe Checkout params and webhook signature helpers exist in
  `src/commercial/billing.ts`.
- D1 schema and a disabled control Worker draft exist in
  `infra/cloudflare/commercial-control/`.

## Not Yet Enabled

- `VC_COMMERCIAL_ENABLED` defaults to false.
- `COMMERCIAL_CONTROL_ENABLED` defaults to `0`.
- No Stripe price IDs are configured.
- No deploy script references the commercial control Worker.

## Launch Gate

Do not enable Hosted Pro until:

1. Admin auth is reviewed and rate-limited.
2. Stripe webhook idempotency is tested against real test-mode events.
3. Domain onboarding is either manual-runbook based or automated with a scoped
   Cloudflare token.
4. Blob quota checks are enforced in the upload Worker before accepting bytes.
5. Terms, privacy copy, and abuse controls are reviewed.
6. Team-room URLs are connected to the actual room creation/join UI behind the
   commercial feature flag.
