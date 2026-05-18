# @maximiliana/n8n-nodes-trengo

## 1.3.0

### Minor Changes

- e1d960a: Security hardening:
  - Remove deprecated `crypto` npm package from dependencies (Node's built-in module is used instead).
  - Bump `n8n-workflow` to `~2.17.2`. Resolves all production-dependency advisories reported by `pnpm audit --prod`.
  - Webhook signature verification now uses `crypto.timingSafeEqual` to prevent timing attacks against the signing secret.
  - Webhook timestamp is now validated against a 5-minute tolerance window to prevent replay attacks. Stale or malformed `trengo-signature` headers are rejected with `401`.
  - Rejected webhooks now return a real `HTTP 401` status with a plain-text body, instead of `HTTP 200` carrying `{responseCode: 401, ...}` as JSON body. The previous behaviour was a long-standing bug from before this hardening pass.
  - Bump minimum Node version to `>=20.0.0` (Node 18 reached EOL in April 2025).
  - Remove broken/unused `index.js` (n8n loads nodes and credentials directly from `package.json#n8n`).

## 1.2.2

### Patch Changes

- Update README

## 1.2.1

### Patch Changes

- Fix node name

## 1.2.0

### Minor Changes

- Process ids as integers

## 1.1.0

### Minor Changes

- API key auto-verification

## 1.0.0

### Major Changes

- Creates webhooks on Trengo side on its own

## 0.2.0

### Minor Changes

- 2598a7a: Auth check is resilient to missing headers
