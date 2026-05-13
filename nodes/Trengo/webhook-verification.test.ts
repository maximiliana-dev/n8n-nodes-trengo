import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'crypto';

import { normalizeWebhookBody, verifyTrengoSignature } from './webhook-verification';

const SECRET = 'super-secret-signing-key';
const NOW = 1_700_000_000;

function sign(rawBody: string, secret: string, timestamp: number): string {
	const hash = crypto
		.createHmac('sha256', secret)
		.update(`${timestamp}.${rawBody}`)
		.digest('hex');
	return `${timestamp};${hash}`;
}

describe('verifyTrengoSignature', () => {
	const rawBody = JSON.stringify({ ticket_id: '123', message: 'hello' });

	it('accepts a valid signature within the tolerance window', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: sign(rawBody, SECRET, NOW),
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.deepEqual(result, { ok: true, timestamp: NOW });
	});

	it('accepts uppercase hex signatures (case-insensitive)', () => {
		const header = sign(rawBody, SECRET, NOW).toUpperCase();
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: header,
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, true);
	});

	it('accepts a signature at the edge of the tolerance window', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: sign(rawBody, SECRET, NOW - 300),
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, true);
	});

	it('rejects a missing signature header', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: undefined,
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.deepEqual(result, {
			ok: false,
			status: 401,
			message: 'Please provide a trengo-signature header',
		});
	});

	it('rejects a malformed signature header (no separator)', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: 'just-a-hash-no-timestamp',
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Malformed trengo-signature header');
	});

	it('rejects a malformed signature header (extra separators)', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: `${NOW};hash;extra`,
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Malformed trengo-signature header');
	});

	it('rejects a stale timestamp (older than tolerance)', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: sign(rawBody, SECRET, NOW - 301),
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Stale or invalid timestamp');
	});

	it('rejects a future timestamp (more than tolerance ahead)', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: sign(rawBody, SECRET, NOW + 301),
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Stale or invalid timestamp');
	});

	it('rejects a non-numeric timestamp', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: `not-a-number;deadbeef`,
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Stale or invalid timestamp');
	});

	it('rejects a fractional timestamp', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: `${NOW}.5;deadbeef`,
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Stale or invalid timestamp');
	});

	it('rejects a signature computed with a different secret', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: sign(rawBody, 'wrong-secret', NOW),
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Invalid signature');
	});

	it('rejects a signature computed over a tampered body', () => {
		const tamperedHeader = sign('{"ticket_id":"999"}', SECRET, NOW);
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: tamperedHeader,
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Invalid signature');
	});

	it('rejects a signature with the wrong hash length', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: `${NOW};deadbeef`,
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Invalid signature');
	});

	it('rejects an empty hash', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: `${NOW};`,
			secret: SECRET,
			nowSeconds: NOW,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Invalid signature');
	});

	it('honours a custom tolerance window', () => {
		const result = verifyTrengoSignature({
			rawBody,
			signatureHeader: sign(rawBody, SECRET, NOW - 60),
			secret: SECRET,
			nowSeconds: NOW,
			toleranceSeconds: 30,
		});
		assert.equal(result.ok, false);
		assert.equal(!result.ok && result.message, 'Stale or invalid timestamp');
	});
});

describe('normalizeWebhookBody', () => {
	it('converts numeric string *_id fields to integers', () => {
		const result = normalizeWebhookBody({ ticket_id: '42', contact_id: '7' });
		assert.deepEqual(result, { ticket_id: 42, contact_id: 7 });
	});

	it('leaves non-numeric *_id strings untouched', () => {
		const result = normalizeWebhookBody({ ticket_id: 'abc123' });
		assert.deepEqual(result, { ticket_id: 'abc123' });
	});

	it('leaves already-numeric *_id values untouched', () => {
		const result = normalizeWebhookBody({ ticket_id: 42 });
		assert.deepEqual(result, { ticket_id: 42 });
	});

	it('does not touch keys that do not end in _id', () => {
		const result = normalizeWebhookBody({ identifier: '42', message: '123' });
		assert.deepEqual(result, { identifier: '42', message: '123' });
	});

	it('preserves non-string, non-id values as-is', () => {
		const nested = { foo: 'bar' };
		const result = normalizeWebhookBody({ ticket_id: '1', payload: nested, flag: true });
		assert.deepEqual(result, { ticket_id: 1, payload: nested, flag: true });
	});

	it('returns an empty object for an empty input', () => {
		assert.deepEqual(normalizeWebhookBody({}), {});
	});

	it('does not parse numeric strings with leading zeros as integers when stripping would lose info', () => {
		const result = normalizeWebhookBody({ ticket_id: '007' });
		assert.deepEqual(result, { ticket_id: 7 });
	});
});
