# Incident Retainer Package

The incident retainer package is a pre-provisioned encrypted communication
fallback for organizations during security incidents.

## Product Shape

- Customer has an emergency page and runbook.
- Predefined channels: executive, legal, incident response, vendor.
- Quarterly exercises can verify that participants can reach encrypted chat.
- Metrics remain aggregate: channel readiness and successful pair counts, not
  message content.

## Local Status

- `src/commercial/emergency.ts` models emergency channels and readiness.
- `emergency_configs` and `emergency_channels` exist in the commercial schema.
- The disabled control Worker supports:

```text
PATCH /api/emergency/config
POST /api/emergency/channels
```

## Launch Gate

Before launch, add:

1. Exercise scheduling and reminders.
2. Runbook PDF generation.
3. Admin-only emergency activation controls.
4. Customer-specific DNS/domain runbook.
5. SLA/support process outside the app.
