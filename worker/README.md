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

## Keep the place list in sync

The worker bundles `app/src/data/places.json` when it is deployed and
builds the assistant's instructions from that, so the browser can no longer
send its own text into the prompt. The catch: **after you change
`places.json`, run `wrangler deploy` again**, or the assistant keeps
answering from the old list. Deploy from the repo so the file is found.

## Before deploying

Edit `ALLOWED` in `index.js` to list the exact origins that may call this
worker. Anything not listed is refused, which is what stops someone else
pointing their own site at your quota.

## Abuse protection

- Only the origins in `ALLOWED` can call it from a browser. Scripts can fake
  that header, so it is not a security boundary on its own.
- Cloudflare's built-in rate limiter (`CHAT_LIMITER` in `wrangler.toml`)
  allows 12 requests per IP per minute per location.
- Request bodies over 16 KB, messages over 500 characters, and histories
  over 12 turns are refused or trimmed.
- The assistant is instructed to answer only campus-direction questions.

## Costs

Claude Haiku 4.5 is the cheapest current model and each reply here is
capped at 400 tokens, so casual campus use is inexpensive. Set a spend
limit in the Anthropic console anyway — a public endpoint is a public
endpoint, and the rate limit in this worker is best-effort rather than
airtight.
