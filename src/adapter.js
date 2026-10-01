// HackerNews Mention Change Intelligence —— 适配器（HackerNews / Algolia）
// 监控某公司/产品/关键词在 HN 的新讨论、热度与趋势。
import { renderHome, renderPricing, renderDashboard, renderLegal, renderStatus } from './pages.js';

const ID = 'hn-intel';
const TITLE = 'HackerNews Mention Intelligence';
const VERSION = '1.0.0';

// ---- 安全 ----
function safeKw(h) {
    if (typeof h !== 'string') return '';
    const s = h.trim().toLowerCase();
    if (s.length < 1 || s.length > 60) return '';
    if (/[^a-z0-9 _\-.:+#]/.test(s)) return '';
    return s;
}
// 目标：关键词（如 vercel、openai、shopify）
function parseTarget(input) {
    const s = safeKw(input); if (!s) return null;
    return { platform: 'hn', handle: s };
}

// ---- 取数 ----
async function getJson(u) {
    const r = await fetch(u, { headers: { 'user-agent': 'intel-kernel/1.0' } });
    if (!r.ok) throw new Error('upstream_' + r.status);
    return r.json();
}

function normStory(h) {
    return {
        storyId: String(h.objectID),
        title: h.title || h.story_title || '',
        points: h.points ?? 0,
        comments: h.num_comments ?? 0,
        createdAt: h.created_at || '',
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        author: h.author || '',
    };
}

async function countSince(kw, sinceSec) {
    const u = new URL('https://hn.algolia.com/api/v1/search');
    u.searchParams.set('query', kw); u.searchParams.set('tags', 'story');
    u.searchParams.set('hitsPerPage', '0');
    if (sinceSec) u.searchParams.set('numericFilters', `created_at_i>${sinceSec}`);
    const d = await getJson(u.toString());
    return d.nbHits ?? 0;
}

async function fetchSnapshot({ handle }) {
    const kw = handle;
    const u = new URL('https://hn.algolia.com/api/v1/search_by_date');
    u.searchParams.set('query', kw); u.searchParams.set('tags', 'story');
    u.searchParams.set('hitsPerPage', '30');
    const d = await getJson(u.toString());
    const items = (d.hits || []).map(normStory);
    const now = Math.floor(Date.now() / 1000);
    const meta = {
        keyword: kw,
        totalMentions: d.nbHits ?? items.length,
        last7d: await countSince(kw, now - 604800).catch(() => 0),
        last30d: await countSince(kw, now - 2592000).catch(() => 0),
    };
    return { platform: 'hn', handle: kw, meta, items };
}

// ---- 差异 ----
function diff(prev, curr) {
    const out = [];
    const known = new Set(prev.map(x => x.storyId));
    for (const c of curr) {
        if (!known.has(c.storyId)) {
            const hot = c.points >= 50 || c.comments >= 50;
            out.push({ changeType: hot ? 'hot_new_mention' : 'new_mention', storyId: c.storyId, title: c.title, points: c.points, comments: c.comments, createdAt: c.createdAt });
        }
    }
    return out;
}

// ---- 汇总 ----
function buildReport(meta, items, changes) {
    const hot = changes.filter(c => c.changeType === 'hot_new_mention').length;
    const top = items.slice().sort((a, b) => b.points - a.points)[0] || null;
    const momentum = meta.last7d * 4 > meta.last30d ? 'rising' : 'steady';
    return {
        keyword: meta.keyword,
        totalMentions: meta.totalMentions, last7d: meta.last7d, last30d: meta.last30d,
        newMentions: changes.length, hotNew: hot, momentum,
        topStory: top ? { title: top.title, points: top.points, comments: top.comments } : null,
        takeaways: [
            hot > 0 ? `🔥 ${hot} hot new discussion(s) gaining traction` : 'No viral new discussion in latest sample',
            `${meta.last7d} mentions this week · ${meta.last30d} this month — momentum ${momentum}`,
            top ? `Top story: "${top.title}" (${top.points} pts)` : 'No stories returned',
        ],
    };
}

function kvKey(platform, handle) { return `snap-${platform}-${handle.replace(/\s+/g, '_')}`; }

export const adapter = {
    id: ID, title: TITLE, version: VERSION,
    safeHandle: safeKw, parseTarget, fetchSnapshot, diff, kvKey,
    async snapshot(t) {
        const s = await fetchSnapshot(t);
        return { platform: s.platform, target: s.handle, keyword: s.meta.keyword, totalMentions: s.meta.totalMentions, last7d: s.meta.last7d, last30d: s.meta.last30d, latest: s.items.slice(0, 8).map(x => ({ title: x.title, points: x.points, comments: x.comments })) };
    },
    planFeatures: {
        pro: ['Track up to 25 keywords', 'New mention alerts', 'Hot-discussion flag', 'All paid MCP tools', 'Email + webhook'],
        business: ['Track up to 150 keywords', '10 team seats', 'Higher API limits', 'Momentum & trend reports', 'Priority support'],
        enterprise: ['Unlimited keywords & seats', 'Custom signals & feeds', 'SLA & onboarding', 'SSO & advanced controls', 'Dedicated reports'],
    },
    mcpTools: [
        { name: 'mention_snapshot', description: 'FREE. Current HackerNews presence for a company, product or keyword: total mentions, mentions in last 7/30 days and most recent discussions. Use for "are people talking about X on HN", developer mindshare research, brand awareness, startup/competitor buzz.',
          inputSchema: { type: 'object', properties: { target: { type: 'string' } }, required: ['target'] },
          price: () => 0, run: async (a) => (await adapter.snapshot(parseTarget(a.target))) },
        { name: 'mention_changes', description: 'PAID ($0.05 USDC on Base via x402). Mention change detection vs history: new HN discussions and flags hot new ones (high points/comments). Use for "did X get posted on HN", discussion monitoring, launch buzz alerts, tracking new threads about a product.',
          inputSchema: { type: 'object', properties: { target: { type: 'string' } }, required: ['target'] },
          price: () => 0.05, run: async (a) => adapter._changes(a.target) },
        { name: 'mention_intel_report', description: 'PAID ($0.50 USDC on Base via x402). Highest-value buzz-intelligence report: mention counts, rising/steady momentum, top stories and hot-discussion takeaways. Use for developer-marketing, PR monitoring, competitive mindshare analysis, launch and reputation tracking.',
          inputSchema: { type: 'object', properties: { target: { type: 'string' } }, required: ['target'] },
          price: () => 0.50, run: async (a) => adapter._report(a.target) },
        { name: 'mention_batch_scan', description: 'PAID ($0.03 USDC per keyword via x402, max 50). Track a whole set of companies/terms on HN in one call: weekly/monthly mentions per keyword. Use for portfolio buzz tracking, market research across many startups, competitive scanning, trend discovery at scale.',
          inputSchema: { type: 'object', properties: { targets: { type: 'array', items: { type: 'string' } } }, required: ['targets'] },
          price: (a) => (a.targets || []).slice(0, 50).length * 0.03, run: async (a) => adapter._batch(a.targets) },
        { name: 'mention_landscape', description: 'PAID ($5 USDC on Base via x402, up to 10 keywords). Strategic mindshare landscape: ranks brands/projects by HN mentions and weekly momentum, flags who is rising. Use for competitive developer-mindshare mapping, market positioning, category buzz benchmarking.',
          inputSchema: { type: 'object', properties: { targets: { type: 'array', items: { type: 'string' } } }, required: ['targets'] },
          price: () => 5, run: async (a) => adapter._landscape(a.targets) },
    ],
    async _changes(targetStr) {
        const t = parseTarget(targetStr); const s = await fetchSnapshot(t);
        return { target: s.handle, keyword: s.meta.keyword, note: 'first_snapshot_baseline', latest: s.items.slice(0, 10) };
    },
    winEvidence(kind, args, result) {
        const d = result?.data ?? result;
        if (kind === 'changes') return `Checked HN discussions for "${args.target}": ${d.latest?.length || 0} recent threads fetched`;
        if (kind === 'intel') return `Buzz-intel report for "${args.target}"`;
        if (kind === 'batch') return `Scanned ${d.scanned ?? (args.targets || []).length} keywords`;
        if (kind === 'landscape') return `Mindshare landscape across ${(args.targets || []).length} keywords`;
        return `${kind} call`;
    },
    cliAttribution: `${TITLE} — free via x402 · remove attribution with Hobby $9/mo`,
    async _report(targetStr) {
        const t = parseTarget(targetStr); const s = await fetchSnapshot(t);
        return buildReport(s.meta, s.items, []);
    },
    async _batch(targets) {
        const list = Array.isArray(targets) ? targets.slice(0, 50) : [];
        const out = [];
        await Promise.all(list.map(async (raw) => {
            const t = parseTarget(raw); if (!t) return;
            try {
                const s = await fetchSnapshot(t);
                out.push({ target: s.handle, keyword: s.meta.keyword, totalMentions: s.meta.totalMentions, last7d: s.meta.last7d, last30d: s.meta.last30d });
            } catch (e) { out.push({ target: raw, error: String(e?.message || e) }); }
        }));
        return { scanned: out.length, keywords: out };
    },
    async _landscape(targets) {
        const list = Array.isArray(targets) ? targets.slice(0, 10) : [];
        const b = await adapter._batch(list);
        const ranked = b.keywords.filter(x => !x.error).sort((x, y) => (y.last30d || 0) - (x.last30d || 0));
        return {
            compared: ranked.length,
            ranking: ranked.map((x, i) => ({ rank: i + 1, keyword: x.keyword, last30d: x.last30d, last7d: x.last7d, total: x.totalMentions })),
            takeaways: ranked.length ? [
                `Most discussed: ${ranked[0].keyword} (${ranked[0].last30d} mentions/30d)`,
                ranked.filter(x => x.last7d * 4 > x.last30d).map(x => `📈 ${x.keyword} momentum is rising this week`).join('; ') || 'No keyword shows accelerating weekly momentum',
                ranked[ranked.length - 1] ? `Least buzz: ${ranked[ranked.length - 1].keyword}` : '',
            ].filter(Boolean) : [],
        };
    },
    llmsTxt: (c) => `# ${TITLE}\n\n> Track HackerNews mentions of companies/products/keywords: new discussions, hot threads and momentum. Free snapshot; paid intel in USDC via x402 on Base.\n\n- MCP: https://${c.HOST}/mcp\n- Free: https://${c.HOST}/v1/snapshot?target=openai\n- Docs: https://${c.HOST}/docs\n\n## When to use\n- An agent needs to know if a company, product or keyword just got new or trending HN discussions.\n- A team wants mindshare and buzz-momentum signals across many terms.\n\n## Tools\n- mention_snapshot: free\n- mention_changes: $0.05 — new discussions & hot-thread flags\n- mention_intel_report: $0.50 — buzz momentum & top-story report\n- mention_batch_scan: $0.03 per keyword (up to 50)\n- mention_landscape: $5 (up to 10 keywords)\n\n## Example asks\n- "Are there new HackerNews discussions about this company?"\n- "Is this product gaining buzz on HN?"\n- "Rank these keywords by HN mindshare."\n\nTarget syntax: keyword or company name. Paid calls settle USDC on Base with x402, or pay directly (no AI wallet required).\n`,
    docsMd: (c) => `# ${TITLE} — Documentation\n\nA paid change-intelligence API for HackerNews mentions, designed to be called by AI agents and automation.\n\n## Endpoints\n| Endpoint | Price | Returns |\n|---|---|---|\n| GET /v1/snapshot?target=<keyword> | free | mentions 7d/30d, latest threads |\n| mention_changes | $0.05 | new discussions vs history, hot-thread flags |\n| mention_intel_report | $0.50 | buzz momentum & top-story report |\n| mention_batch_scan | $0.03/keyword | up to 50 keywords in one call |\n| mention_landscape | $5 | mindshare ranking across up to 10 keywords, rising-buzz flags |\n\n## Target format\nA keyword, product or company name, for example \`openai\`.\n\n## Payment\n- Agents: unpaid calls return HTTP 402 with a base64 PAYMENT-REQUIRED header; settle USDC on Base via x402 and retry. P2P, 0% commission.\n- Humans: choose a plan on /pricing, send the exact USDC amount shown, and the access key is issued automatically — no card or AI wallet needed.\n- One access key works across the whole change-intelligence product family.\n\n## Subscriptions\nPro $99/month (25 keywords), Business $499/month (150), Enterprise $2000/month (unlimited). Continuous watch and change alerts.\n\nMCP endpoint (Streamable HTTP): https://${c.HOST}/mcp\n`,
    sitemapXml: (c) => `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${c.HOST}/</loc></url><url><loc>https://${c.HOST}/pricing</loc></url><url><loc>https://${c.HOST}/docs</loc></url><url><loc>https://${c.HOST}/dashboard</loc></url></urlset>`,
    wellKnown: (c) => ({
        x402Version: 1, network: c.NETWORK, chainId: c.CHAIN_ID, asset: c.USDC_BASE, payTo: c.PAY_TO, facilitator: c.FACILITATOR,
        pricing: { changes: c.PRICE_CHANGES_USD, intel: c.PRICE_INTEL_USD, batchPerKeyword: c.PRICE_PER_TARGET_USD, landscape: c.PRICE_LANDSCAPE_USD },
    }),

    STATUS_TARGET: 'openai',
    renderStatus, renderHome, renderPricing, renderDashboard, renderLegal,
};
