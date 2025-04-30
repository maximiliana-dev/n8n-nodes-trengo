import { IAuthenticateGeneric, Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class TrengoApi implements ICredentialType {
	name = 'trengoApi';
	displayName = 'Trengo API';
	icon: Icon = 'file:trengo.svg';
	documentationUrl?: 'https://developers.trengo.com/docs/rate-limiting';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your Trengo API key (will be sent as Bearer token)',
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
}
