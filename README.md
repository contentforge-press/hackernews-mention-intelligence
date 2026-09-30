# HackerNews Mention Intelligence

AI-native monitoring of brand / product / keyword mentions on Hacker News — new discussions, points, comments and momentum. Sold as an MCP server with pay-per-result (x402 USDC on Base) and monthly subscriptions.

## Five result tiers
| Tool | Price | What it returns |
|---|---|---|
| `hn_snapshot` | free | Current mention metrics for one keyword |
| `hn_changes` | $0.05 | New HN discussions since last fetch |
| `hn_intel_report` | $0.50 | Summarized report with heat & momentum |
| `hn_batch_scan` | $0.03 / keyword | Up to 50 keywords |
| `hn_landscape` | $5 | Rank up to 10 keywords by buzz + momentum |

## Subscriptions
Pro $99/mo (25 keywords) · Business $499/mo (15) · Enterprise $2000/mo (unlimited).

## Service
https://hn-intel.contentforge-press.workers.dev

- `GET /llms.txt` · `GET /sitemap.xml` · `GET /.well-known/mcp.json`
- MCP endpoint: `/mcp` (Streamable HTTP)

Data sourced from the public Hacker News Algolia API.

## License
MIT
