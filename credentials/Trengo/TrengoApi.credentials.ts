import {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import { TRENGO_API_BASE_URL } from '../../nodes/Trengo/constants';

export class TrengoApi implements ICredentialType {
	name = 'trengoApi';
	displayName = 'Trengo API';
	icon: Icon = 'file:icons/trengo.svg';
	documentationUrl?: 'https://developers.trengo.com/docs/rate-limiting';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your Trengo API key',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: TRENGO_API_BASE_URL,
			url: '/webhooks',
			json: true,
		},
	};
}
