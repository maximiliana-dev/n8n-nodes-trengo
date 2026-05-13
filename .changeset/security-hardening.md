---
'@maximiliana/n8n-nodes-trengo': minor
---

Security hardening:

- Remove deprecated `crypto` npm package from dependencies (Node's built-in module is used instead).
- Bump `n8n-workflow` to `~2.17.2`. Resolves all production-dependency advisories reported by `pnpm audit --prod`.
- Webhook signature verification now uses `crypto.timingSafeEqual` to prevent timing attacks against the signing secret.
- Webhook timestamp is now validated against a 5-minute tolerance window to prevent replay attacks. Stale or malformed `trengo-signature` headers are rejected with `401`.
- Bump minimum Node version to `>=20.0.0` (Node 18 reached EOL in April 2025).
- Remove broken/unused `index.js` (n8n loads nodes and credentials directly from `package.json#n8n`).
