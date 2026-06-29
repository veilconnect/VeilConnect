# VeilConnect Self-host Pro Template

This template is a local packaging draft for commercial self-host support. It is
not referenced by the default installer, CI, or Cloudflare deployment scripts.

## Components

- `veilconnect`: app container built from the repository root.
- `caddy`: TLS reverse proxy.
- `healthcheck.sh`: basic operational smoke check.

Production customers may replace blob storage and TURN with their own S3/R2 and
coturn infrastructure. The default open-source self-host path remains unchanged.

## Use

```bash
cp .env.example .env
docker compose up -d --build
./healthcheck.sh https://chat.example.com
```

Set `SIGNAL_IP_HASH_SECRET`, `ROOM_TOKEN_HASH_SECRET`, and `METRICS_READ_TOKEN`
to strong random values before any customer trial; the sample `.env.example`
placeholders are not safe. Persistent rooms keep only room entry metadata in the
`app_data` volume, not chat contents.

## Launch Gate

Before using this for paid customers:

1. Add tested backup/restore scripts.
2. Add Prometheus metrics and alert templates.
3. Add signed release image references instead of local builds.
4. Add license verification in the self-host management surface.
5. Run an install/upgrade matrix on fresh Linux hosts.
