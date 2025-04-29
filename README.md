# n8n Trengo Webhook Trigger

**Trengo Webhook - Trigger** node for n8n. Listens for incoming Trengo webhook events, verifies their HMAC SHA256 signature, and forwards the parsed payload into your workflow.

---

## Features

- Receives `application/x-www-form-urlencoded` POST requests from Trengo
- Verifies the `Trengo-Signature` header using your signing secret
- Parses the URL-encoded body into JSON
- Emits a workflow item only if the signature is valid

---

## Installation

```bash
# Using npm
npm install n8n-nodes-trengo

# Using pnpm
pnpm add n8n-nodes-trengo
```

After installation, link the package in n8n:

```bash
# In your custom-nodes directory
npm link n8n-nodes-trengo
```

Restart n8n and your new node will appear under **Trigger → Trengo Webhook - Trengo**.

---

## Configuration

1. **Signing Secret** (string, required)
   - Your Trengo webhook signing secret (found in your Trengo account settings).
2. **Webhook Path** (string, default: `webhook/trengo`)
   - URL path (without leading slash) where n8n will listen, e.g. `webhook/trengo` → `https://your-domain/webhook/trengo`

---

## Usage

1. Create a new workflow in n8n.
2. Add the **Trengo Webhook - Trigger** trigger node.
3. Set your **Signing Secret** and **Webhook Path**.
4. Deploy the workflow.
5. Configure your Trengo webhook to point at:
   ```text
   https://<your-n8n-domain>/<your-webhook-path>
   ```
6. When Trengo sends an event, the node will verify the signature and emit the payload as JSON.

### Example Workflow

```text
[ Trengo Webhook -Trigger ] → [ Your next node ]
```

### Example cURL Test

```bash
timestamp=$(date +%s)
payload="type=OUTBOUND&message=Hello+World"
signature=$(printf "%s.%s" "$timestamp" "$payload" \
  | openssl dgst -sha256 -hmac "YOUR_SECRET" -hex \
  | sed 's/^.* //')

curl -X POST "http://localhost:5678/webhook/trengo" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Trengo-Signature: $timestamp;$signature" \
  --data-urlencode "$payload"
```

---

## Troubleshooting

- **Invalid signature**: Ensure you use the exact raw URL-encoded body and correct signing secret.
- **No data received**: Verify the webhook path matches your n8n node’s **Webhook Path** setting.

---

## License

MIT © Maximiliana

---

> **Disclaimer:**
> This integration is developed and maintained by Maximiliana (BUKIT APP, S.L.) and has no affiliation or endorsement by Trengo. Maximiliana is not responsible for Trengo’s API changes or availability.
