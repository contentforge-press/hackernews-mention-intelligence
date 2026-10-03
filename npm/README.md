# ⭐ Hacker News Mention Intelligence

![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-7c3aed)
![x402](https://img.shields.io/badge/x402-v1%20%2B%20v2-6938ef)
![USDC](https://img.shields.io/badge/settle-USDC%20on%20Base-1f6feb)
![price](https://img.shields.io/badge/from-%240.05%2Fcall-2ea043)

Remote MCP server for **Hacker News mention intelligence** — who is talking about a company, product or keyword on HN, *before* the market sees it.

Agents pay **peer-to-peer in USDC on Base** using the native **x402** protocol — no platform account, no payment processor, **0% commission**. One access key works across the whole [Change Intelligence family](https://pixharvest.com).

- **Hosted service:** https://s-hn.pixharvest.com
- **MCP endpoint:** `https://s-hn.pixharvest.com/mcp`
- **MCP Registry:** `io.github.contentforge-press/hn-intel`

## Try it now

Free, no-key snapshot: https://s-hn.pixharvest.com/v1/snapshot?target=openai

Target format: `?target=<keyword|company|product>` (e.g. `openai`, `notion`, `pixharvest`)

## Tools

| Tool | Price | Returns |
|---|---|---|
| `mention_snapshot` | Free | Mentions 7d/30d, latest threads |
| `mention_changes` | $0.05 | New discussions & hot-thread flags since last check |
| `mention_intel_report` | $0.50 | Buzz momentum & top-story report |
| `mention_batch_scan` | $0.03 / keyword | Scan up to 50 keywords |
| `mention_landscape` | $5 | Mindshare ranking across up to 10 keywords |

## One-call install for MCP clients

```bash
npx -y hackernews-mention-intelligence
```

Or add the remote server manually to any MCP client (Claude Desktop, Cursor, Windsurf, …):

```json
{
  "mcpServers": {
    "hn-intel": {
      "url": "https://s-hn.pixharvest.com/mcp"
    }
  }
}
```

Anonymous `initialize` / `tools/list` are free; paid tool calls return an `x402` challenge.

## HTTP quick start

```bash
# free snapshot
curl "https://s-hn.pixharvest.com/v1/snapshot?target=openai"

# paid call — returns 402 with the x402 challenge
curl -i "https://s-hn.pixharvest.com/v1/cli?tool=changes&target=openai"
```

## License

MIT — self-host, modify and run it yourself. The hosted service and its data are provided as-is.
