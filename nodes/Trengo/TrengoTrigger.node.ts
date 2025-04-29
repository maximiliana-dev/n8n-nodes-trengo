import type {
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';

import * as crypto from 'crypto';

export class TrengoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Trengo - Trigger',
		name: 'trengoTrigger',
		icon: 'file:trengo.svg',
		group: ['trigger'],
		version: 1,
		description: 'Listens for Trengo webhook events',
		defaults: { name: 'On Trengo event' },
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Signing Secret',
				name: 'signingSecret',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Webhook secret',
			},
			{
				displayName: 'Webhook Path',
				name: 'webhookPath',
				type: 'string',
				default: 'webhook/trengo',
				description: 'Webhook path (no initial “/”)',
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: '={{$parameter["webhookPath"]}}',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();

		const raw = (req.rawBody as Buffer).toString('utf8');

		const signatureHeader = this.getHeaderData()['trengo-signature'] as string;

		if (!signatureHeader) {
			return {
				webhookResponse: {
					responseCode: 401,
					responseBody: 'Please provide a trengo-signature header',
				},
			};
		}

		const [timestamp, signatureHash] = signatureHeader.split(';');
		const secret = this.getNodeParameter('signingSecret') as string;

		const expectedHash = crypto
			.createHmac('sha256', secret)
			.update(`${timestamp}.${raw}`)
			.digest('hex')
			.toLowerCase();

		if (expectedHash !== signatureHash) {
			return {
				webhookResponse: {
					responseCode: 401,
					responseBody: 'Invalid signature',
				},
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(req.body as IDataObject)],
		};
	}
}
