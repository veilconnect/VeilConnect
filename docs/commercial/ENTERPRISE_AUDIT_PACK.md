# Enterprise Private Deployment and Audit Pack

Enterprise private deployments require evidence, not just features.

## Local Status

- `src/commercial/auditPack.ts` defines the default readiness checklist.
- `audit_pack_items` exists in the commercial D1 schema.
- The disabled control Worker can read audit status through:

```text
GET /api/audit-pack?tenantId=...
PATCH /api/audit-pack
```

## Required Evidence

- STRIDE threat model.
- Cryptographic rationale.
- Reproducible build guide.
- Code signing/release provenance.
- SBOM.
- Third-party penetration test report.
- Private deployment runbook.

## Launch Gate

Before selling enterprise private deployments:

1. Generate and publish SBOMs per release.
2. Complete an external penetration test.
3. Freeze deployment runbooks.
4. Decide support scope and emergency escalation.
5. Use separate contracts and security addenda.
