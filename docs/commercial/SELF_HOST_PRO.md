# Self-host Pro

Self-host Pro sells operational confidence: repeatable deployment, update
guidance, monitoring, backups, and support. It should not weaken the open-source
self-host path.

## Local Status

- `src/commercial/license.ts` supports ECDSA P-256 signed offline licenses.
- `self_host_licenses` exists in the commercial control schema.
- The disabled control Worker can store signed licenses through:

```text
POST /api/self-host/licenses
```

## License Model

The signed payload includes:

```text
licenseId
customerName
planId
issuedAt
expiresAt
seats
features
deploymentFingerprint
```

The license can be verified offline with a public key baked into a self-host Pro
build or provided to a support tool.

## Launch Gate

Before launch, add:

1. Release signing and license issuance process.
2. Docker Compose/Helm/Terraform packaging.
3. Backup/restore scripts and tests.
4. Mandatory secret generation for `SIGNAL_IP_HASH_SECRET`, `ROOM_TOKEN_HASH_SECRET`, and `METRICS_READ_TOKEN`.
5. Prometheus metrics and alert templates.
6. Support SLA and update policy.
