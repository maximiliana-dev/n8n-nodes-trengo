import * as crypto from 'crypto';
import type { IDataObject } from 'n8n-workflow';

export type VerificationResult =
	| { ok: true; timestamp: number }
	| { ok: false; status: 401; message: string };

export interface VerifySignatureOptions {
	rawBody: string;
	signatureHeader: string | undefined;
	secret: string;
	nowSeconds: number;
	toleranceSeconds?: number;
}

export function verifyTrengoSignature(opts: VerifySignatureOptions): VerificationResult {
	const { rawBody, signatureHeader, secret, nowSeconds, toleranceSeconds = 300 } = opts;

	if (!signatureHeader) {
		return { ok: false, status: 401, message: 'Please provide a trengo-signature header' };
	}

	const parts = signatureHeader.split(';');
	if (parts.length !== 2) {
		return { ok: false, status: 401, message: 'Malformed trengo-signature header' };
	}
	const [timestamp, signatureHash] = parts;

	const timestampNum = Number(timestamp);
	if (
		!Number.isInteger(timestampNum) ||
		Math.abs(nowSeconds - timestampNum) > toleranceSeconds
	) {
		return { ok: false, status: 401, message: 'Stale or invalid timestamp' };
	}

	const expectedHash = crypto
		.createHmac('sha256', secret)
		.update(`${timestamp}.${rawBody}`)
		.digest('hex')
		.toLowerCase();

	const expectedBuffer = Buffer.from(expectedHash, 'hex');
	const providedBuffer = Buffer.from(signatureHash.toLowerCase(), 'hex');
	if (
		expectedBuffer.length === 0 ||
		expectedBuffer.length !== providedBuffer.length ||
		!crypto.timingSafeEqual(expectedBuffer, providedBuffer)
	) {
		return { ok: false, status: 401, message: 'Invalid signature' };
	}

	return { ok: true, timestamp: timestampNum };
}

export function normalizeWebhookBody(input: IDataObject): IDataObject {
	return Object.fromEntries(
		Object.entries(input).map(([key, value]) => [
			key,
			key.endsWith('_id') && typeof value === 'string' && /^\d+$/.test(value)
				? parseInt(value, 10)
				: value,
		]),
	);
}
