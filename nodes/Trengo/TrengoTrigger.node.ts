import {
	type IWebhookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookResponseData,
	type IDataObject,
	type IHookFunctions,
	NodeApiError,
	JsonObject,
} from 'n8n-workflow';

import * as crypto from 'crypto';
import { TRENGO_API_BASE_URL } from './constants';

export class TrengoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Trengo - Trigger',
		name: 'trengoTrigger',
		icon: 'file:icons/trengo.svg',
		group: ['trigger'],
		version: 1,
		description: 'Listens for Trengo webhook events',
		subtitle: '={{ $parameter["event"] }}',
		defaults: { name: 'On Trengo event' },
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'trengoApi', required: true }],
		properties: [
			{
				displayName: 'Events',
				name: 'event',
				type: 'options',
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{
						name: 'Inbound Message',
						value: 'INBOUND',
						description: 'When an inbound message is received',
					},
					{
						name: 'Outbound Message',
						value: 'OUTBOUND',
						description: 'When an outbound message is sent',
					},
					{
						name: 'Internal Note',
						value: 'NOTE',
						description: 'When an internal message is created',
					},
					{
						name: 'Label Added',
						value: 'TICKET_LABEL_ADDED',
						description: 'When a label is added to a ticket',
					},
					{
						name: 'Label Removed',
						value: 'TICKET_LABEL_DELETED',
						description: 'When a label is removed from a ticket',
					},
					{
						name: 'Ticket Assigned',
						value: 'TICKET_ASSIGNED',
						description: 'When a ticket is assigned to an agent',
					},
					{ name: 'Ticket Closed', value: 'TICKET_CLOSED', description: 'When a ticket is closed' },
					{
						name: 'Ticket Reopened',
						value: 'TICKET_REOPENED',
						description: 'When a ticket is reopened',
					},
					{
						name: 'Marked as Spam',
						value: 'TICKET_MARKED_AS_SPAM',
						description: 'When a ticket is marked as spam',
					},
					{
						name: 'Unmarked as Spam',
						value: 'TICKET_UNMARKED_AS_SPAM',
						description: 'When a ticket is unmarked as spam',
					},
					{
						name: 'Voice Call Started',
						value: 'VOICE_CALL_STARTED',
						description: 'When a voice call has started',
					},
					{
						name: 'Voice Call Ended',
						value: 'VOICE_CALL_ENDED',
						description: 'When a voice call has ended',
					},
					{
						name: 'Voice Call Recorded',
						value: 'VOICE_CALL_RECORDED',
						description: 'When a voice call has been recorded',
					},
					{
						name: 'Voice Call Missed',
						value: 'VOICE_CALL_MISSED',
						description: 'When a voice call is missed',
					},
					{
						name: 'IVR Action Sent',
						value: 'VOICE_CALL_ROUTE_NUMBER',
						description: 'When an IVR action is sent',
					},
				],
				default: 'INBOUND',
				required: true,
				description: 'Which Trengo events to subscribe to',
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (!webhookData.webhookId) {
					return false;
				}

				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'trengoApi', {
						method: 'GET',
						url: `${TRENGO_API_BASE_URL}/webhooks/${webhookData.webhookId}`,
						json: true,
					});
				} catch (error) {
					if (error.httpCode !== '404') {
						throw error;
					}

					delete webhookData.webhookId;
					delete webhookData.webhookEvents;
					delete webhookData.webhookSecret;

					return false;
				}

				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'trengoApi', {
					method: 'POST',
					url: `${TRENGO_API_BASE_URL}/webhooks`,
					json: true,
					body: {
						name: `On ${this.getNodeParameter('event')} - Created by n8n`,
						type: this.getNodeParameter('event'),
						url: this.getNodeWebhookUrl('default'),
					},
				});

				if (
					response.id === undefined ||
					response.signing_secret === undefined ||
					response.type === undefined
				) {
					throw new NodeApiError(this.getNode(), response as JsonObject, {
						message: 'Trengo webhook creation response did not contain the expected data.',
					});
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = response.id as number;
				webhookData.webhookEvent = response.type as string;
				webhookData.webhookSecret = response.signing_secret as string;

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (!webhookData.webhookId) {
					return true;
				}

				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'trengoApi', {
						method: 'DELETE',
						url: `${TRENGO_API_BASE_URL}/webhooks/${webhookData.webhookId}`,
						json: true,
					});
				} catch (error) {
					return false;
				}

				delete webhookData.webhookId;
				delete webhookData.webhookEvent;
				delete webhookData.webhookSecret;

				return true;
			},
		},
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
		const secret = this.getWorkflowStaticData('node').webhookSecret as string;

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
