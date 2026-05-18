#!/usr/bin/env node
// Helper to sign a payload like Trengo does, so you can curl your local n8n
// webhook without needing real Trengo traffic.
//
// Usage:
//   node dev/sign-webhook.mjs <secret> [body-json] [--stale]
//
// Prints curl-ready headers + a sample command. The secret must match the
// webhookSecret stored by n8n in the workflow's static data (printed in
// n8n logs when the Trengo Trigger registers a webhook).

import crypto from 'node:crypto';

const [, , secret, bodyArg, ...rest] = process.argv;
if (!secret) {
	console.error('Usage: node dev/sign-webhook.mjs <secret> [body-json] [--stale]');
	process.exit(1);
}

const body = bodyArg ?? JSON.stringify({ ticket_id: '123', message: 'hello from dev' });
const stale = rest.includes('--stale');
const tampered = rest.includes('--tampered');

const ts = stale ? Math.floor(Date.now() / 1000) - 3600 : Math.floor(Date.now() / 1000);
let sig = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
if (tampered) sig = sig.slice(0, -1) + (sig.endsWith('0') ? '1' : '0');

const header = `${ts};${sig}`;

console.log('Body:        ', body);
console.log('Header value:', header);
console.log();
console.log('Example curl (replace <WEBHOOK_PATH>):');
console.log(
	`  curl -i -X POST http://localhost:5678/webhook/<WEBHOOK_PATH> \\
    -H "Content-Type: application/json" \\
    -H "trengo-signature: ${header}" \\
    -d '${body}'`,
);
