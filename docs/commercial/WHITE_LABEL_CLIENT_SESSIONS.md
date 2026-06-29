# Legal and Consulting White Label

White-label client sessions are designed for professionals who invite external
clients without requiring the client to create a traditional account.

## Product Shape

- Tenant admin creates a client session.
- Session has a display name, optional case reference, expiration, encrypted
  file quota, and optional branding override.
- Public session config never returns `caseRef`.
- The client still uses local passphrase-based identity protection.

## Local Status

- `src/commercial/clientSession.ts` implements session drafts, active-state
  checks, slug generation, and public config shaping.
- `client_sessions` exists in the commercial D1 schema.
- The disabled control Worker supports:

```text
POST /api/client-sessions
GET /api/client-sessions/:slug
```

## Launch Gate

Before launch, add:

1. Tenant admin login and role checks.
2. Session revocation UI.
3. Exportable matter/session report that contains no message content.
4. File quota enforcement per session.
5. Optional branded custom domain path, such as `/c/:slug`.
