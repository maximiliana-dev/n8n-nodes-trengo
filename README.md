# 🚀 n8n-nodes-trengo

Unofficial node to integrate [Trengo](https://trengo.com/) webhook events into n8n workflows.

## 📖 About

This node allows you to receive (Trengo events)[https://developers.trengo.com/docs/configuration] in real-time within your n8n workflows. It automatically verifies HMAC signatures and parses payloads so you can start automating your customer service processes.

## ✨ Supported Events

Webhooks will be created and deleted automatically using the Trengo REST API.

| Event                   | Description               | Supported |
| ----------------------- | ------------------------- | --------- |
| INBOUND                 | Inbound message received  | ✅        |
| OUTBOUND                | Outbound message sent     | ✅        |
| NOTE                    | Internal note created     | ✅        |
| TICKET_LABEL_ADDED      | Label added to ticket     | ✅        |
| TICKET_LABEL_DELETED    | Label removed from ticket | ✅        |
| TICKET_ASSIGNED         | Ticket assigned           | ✅        |
| TICKET_CLOSED           | Ticket closed             | ✅        |
| TICKET_REOPENED         | Ticket reopened           | ✅        |
| TICKET_MARKED_AS_SPAM   | Ticket marked as spam     | ✅        |
| TICKET_UNMARKED_AS_SPAM | Ticket unmarked as spam   | ✅        |
| VOICE_CALL_STARTED      | Voice call started        | ✅        |
| VOICE_CALL_ENDED        | Voice call ended          | ✅        |
| VOICE_CALL_RECORDED     | Voice call recorded       | ✅        |
| VOICE_CALL_MISSED       | Voice call missed         | ✅        |
| VOICE_CALL_ROUTE_NUMBER | IVR action sent           | ✅        |

## 🔧 Installation

1. Open your n8n instance
2. Go to Settings > Community Nodes
3. Search for "@maximiliana/n8n-nodes-trengo"
4. Click Install
5. Restart n8n

## 🗺️ Roadmap

- [ ] Support for Trengo API actions
- [ ] Extended documentation

## 🤝 Contributing

Contributions are welcome! If you have any ideas or improvements, feel free to open a PR.

## ⚖️ Legal Disclaimer

This node is developed and maintained by Maximiliana (BUKIT APP, S.L.) and has no affiliation with Trengo. We are not responsible for any Trengo API changes or availability.

The Trengo logo and "Trengo" trademark are registered trademarks owned by Trengo B.V.

## 📝 License

MIT © Maximiliana (BUKIT APP, S.L.)
