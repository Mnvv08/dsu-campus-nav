# Chat proxy

Holds the Anthropic API key so the browser never sees it. A static site
cannot keep a secret; anything in the bundle is readable by anyone.

## Deploy

```bash
npm install -g wrangler
wrangler login
wrangler secret put ANTHROPIC_API_KEY   # paste the key when prompted
wrangler deploy
```

Wrangler prints a URL like `https://dsu-campus-chat.<subdomain>.workers.dev`.
Put that in `app/.env` as `VITE_CHAT_URL`, then rebuild the app.

## Before deploying

Edit `ALLOWED` in `index.js` to list the exact origins that may call this
worker. Anything not listed is refused, which is what stops someone else
pointing their own site at your quota.

## Costs

Claude Haiku 4.5 is the cheapest current model and each reply here is
capped at 400 tokens, so casual campus use is inexpensive. Set a spend
limit in the Anthropic console anyway — a public endpoint is a public
endpoint, and the rate limit in this worker is best-effort rather than
airtight.
