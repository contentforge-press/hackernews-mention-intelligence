#!/usr/bin/env node
// hackernews-mention-intelligence — remote MCP server installer helper
// The server itself is hosted (Streamable HTTP); this package only distributes
// the client config so `npx hackernews-mention-intelligence` prints ready-to-paste JSON.

const CONFIG = {
  mcpServers: {
    "hackernews-mention-intelligence": {
      type: "streamableHttp",
      url: "https://s-hn.pixharvest.com/mcp"
    }
  }
};

const HELP = `Hacker News Mention Intelligence — remote MCP server
(Who is talking about a topic/company on HN, before the market sees it; paid in USDC via x402 on Base)

Usage:
  npx hackernews-mention-intelligence            print MCP client config JSON
  npx hackernews-mention-intelligence --url      print the endpoint URL only
  npx hackernews-mention-intelligence --tools    list the MCP tools

Tools:
  mention_snapshot       free  - mentions 7d/30d, latest threads
  mention_changes        $0.05 - new discussions & hot-thread flags
  mention_intel_report   $0.50 - buzz momentum & top-story report
  mention_batch_scan     $0.03/keyword - up to 50 keywords in one call
  mention_landscape      $5    - mindshare ranking across up to 10 keywords
`;

const arg = process.argv[2];
if (arg === "--url") {
  console.log(CONFIG.mcpServers["hackernews-mention-intelligence"].url);
} else if (arg === "--tools") {
  console.log(HELP.split("\n").filter(l => l.startsWith("  mention_")).join("\n"));
} else if (arg === "--help" || arg === "-h") {
  console.log(HELP);
} else {
  console.log(JSON.stringify(CONFIG, null, 2));
}
