const { TrengoWebhookTrigger } = require('nodes/Trengo/TrengoTrigger.node.ts');
const { TrengoApi } = require('credentials/Trengo/TrengoApi.credentials.ts');
module.exports = {
	nodes: [TrengoWebhookTrigger],
	credentials: [TrengoApi],
};
