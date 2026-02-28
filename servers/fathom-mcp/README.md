# Fathom MCP Server (Remote - Cloudflare Workers)

A remote MCP server that gives Claude/Cowork access to Fathom meeting transcripts via the Fathom API. Deployed on Cloudflare Workers using Streamable HTTP transport.

## How it works

- Hosted on Cloudflare Workers (global edge network, near-zero latency)
- Each user provides their own Fathom API key when connecting
- The server proxies requests to Fathom's API on behalf of the user
- No local Node.js, npm, or environment variables needed on the user's machine

## Tools provided

| Tool | Description |
|------|-------------|
| `list_meetings` | List recent meetings with date filtering |
| `get_transcript` | Get full speaker-attributed transcript |
| `get_meeting_details` | Get meeting metadata, summary, and action items |

## Deployment

### Prerequisites

- Cloudflare account (free tier works)
- Node.js 18+ (for local development only)
- Wrangler CLI (`npm install -g wrangler`)

### Deploy

```bash
cd servers/fathom-remote
npm install
wrangler login        # One-time auth with Cloudflare
wrangler deploy       # Deploy to production
```

After deployment, Wrangler will print your server URL, something like:
`https://fathom-mcp.<your-subdomain>.workers.dev`

### Local development

```bash
npm run dev
# Server runs at http://localhost:8787/mcp
```

## Connecting in Cowork

Once deployed, team members add it as a connector in Cowork:

1. Open Claude Desktop / Cowork
2. Go to **Settings > Connectors**
3. Add a new custom MCP connector
4. Enter the server URL: `https://fathom-mcp.<your-subdomain>.workers.dev/mcp`
5. For authentication, set the Authorization header to: `Bearer <your-fathom-api-key>`

That's it. No Node.js install, no npm, no terminal commands for end users.

## Authentication

Each user's Fathom API key is passed as a Bearer token in the Authorization header. The key never gets stored on the server - it's forwarded to Fathom's API on each request. Fathom keys are user-scoped, so each person only sees their own meetings.

### Getting a Fathom API key

1. Log into Fathom at https://fathom.video
2. Go to **Settings** (top right corner)
3. Scroll down to **My Settings** and find **API Access**
4. Click **Add**, then **Generate API Key**
5. Give the key a name (e.g., "Nansen Intelligence")
6. Click **Create API Client**
7. Copy the API key

## Architecture

```
User (Cowork) ---> Cloudflare Worker ---> Fathom API
                   (Streamable HTTP)      (proxied requests)
                   /mcp endpoint          api.fathom.ai
```

The server uses Cloudflare's Durable Objects (via the `agents` SDK) to handle MCP sessions. Each connected client gets its own Durable Object instance, which maintains the MCP session state.
