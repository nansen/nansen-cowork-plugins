/**
 * Fathom MCP Server - Cloudflare Workers (Remote)
 *
 * Remote MCP server with proper OAuth 2.1 authentication.
 * Users authenticate by entering their Fathom API key via the OAuth flow.
 * The key is stored securely in the OAuth token props and extracted
 * on each MCP request via getMcpAuthContext().
 *
 * v2.1.0 - Fixed createMcpHandler usage for agents 0.6.0
 */

import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler, getMcpAuthContext } from "agents/mcp";
import { z } from "zod";
import { WorkerEntrypoint } from "cloudflare:workers";

const FATHOM_API_BASE = "https://api.fathom.ai/external/v1";

// ─────────────────────────────────────────────
//  Fathom API helper
// ─────────────────────────────────────────────

async function fathomFetch(apiKey, path, params = {}) {
  const url = new URL(`${FATHOM_API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": apiKey,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Fathom API ${res.status}: ${body}`);
  }

  return res.json();
}

// Helper to get Fathom API key from auth context
function getFathomKey() {
  const ctx = getMcpAuthContext();
  return ctx?.props?.fathomApiKey || null;
}

// ─────────────────────────────────────────────
//  Build a fresh McpServer with tools registered
//  (must be new per request for stateless handlers)
// ─────────────────────────────────────────────

function buildMcpServer() {
  const server = new McpServer({
    name: "fathom-mcp",
    version: "2.1.0",
  });

  // Tool: list_meetings
  server.tool(
    "list_meetings",
    "List recent Fathom meetings. Returns meeting ID, title, date, duration, and participants. Use created_after/created_before for date filtering (ISO-8601 format, e.g. 2026-02-20T00:00:00Z).",
    {
      created_after: z
        .string()
        .optional()
        .describe("Only meetings created after this ISO-8601 datetime"),
      created_before: z
        .string()
        .optional()
        .describe("Only meetings created before this ISO-8601 datetime"),
      include_transcript: z
        .boolean()
        .optional()
        .default(false)
        .describe("Include full transcript in response"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Max meetings to return (default: 20)"),
    },
    async ({ created_after, created_before, include_transcript, limit }) => {
      const apiKey = getFathomKey();
      if (!apiKey) {
        return {
          content: [
            {
              type: "text",
              text: "Authentication required. Please reconnect and enter your Fathom API key.",
            },
          ],
          isError: true,
        };
      }

      try {
        const params = {};
        if (created_after) params.created_after = created_after;
        if (created_before) params.created_before = created_before;
        if (include_transcript) params.include_transcript = "true";

        const data = await fathomFetch(apiKey, "/meetings", params);
        console.log("[list_meetings] Raw Fathom API response keys:", Object.keys(data), "items count:", data.items?.length);
        const meetings = Array.isArray(data)
          ? data
          : data.items || data.meetings || data.data || [];
        const sliced = meetings.slice(0, limit);

        const summary = sliced.map((m) => ({
          id: m.id,
          title: m.title || m.name || "Untitled meeting",
          date: m.created_at || m.date || m.recorded_at,
          duration_seconds: m.duration || m.duration_seconds,
          participants: m.participants || m.attendees || [],
          recording_id: m.recording_id || m.recordings?.[0]?.id,
          ...(include_transcript && m.transcript
            ? { transcript: m.transcript }
            : {}),
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { count: summary.length, meetings: summary },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            { type: "text", text: `Error listing meetings: ${err.message}` },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: get_transcript
  server.tool(
    "get_transcript",
    "Get the full transcript for a specific Fathom meeting. Returns speaker-attributed transcript text.",
    {
      meeting_id: z.string().describe("The meeting ID (from list_meetings)"),
      recording_id: z
        .string()
        .optional()
        .describe(
          "Optional recording ID if the meeting has multiple recordings"
        ),
    },
    async ({ meeting_id, recording_id }) => {
      const apiKey = getFathomKey();
      if (!apiKey) {
        return {
          content: [{ type: "text", text: "Authentication required." }],
          isError: true,
        };
      }

      try {
        let transcript;
        const rid = recording_id || meeting_id;

        try {
          transcript = await fathomFetch(
            apiKey,
            `/recordings/${rid}/transcript`
          );
        } catch {
          transcript = await fathomFetch(apiKey, `/meetings/${meeting_id}`, {
            include_transcript: "true",
          });
        }

        let text;
        if (typeof transcript === "string") {
          text = transcript;
        } else if (transcript.transcript) {
          if (Array.isArray(transcript.transcript)) {
            text = transcript.transcript
              .map((seg) => {
                const speaker =
                  seg.speaker || seg.speaker_name || "Unknown";
                const content = seg.text || seg.content || "";
                return `[${speaker}]: ${content}`;
              })
              .join("\n");
          } else {
            text = String(transcript.transcript);
          }
        } else if (transcript.segments || transcript.utterances) {
          const segs = transcript.segments || transcript.utterances;
          text = segs
            .map((seg) => {
              const speaker = seg.speaker || seg.speaker_name || "Unknown";
              const content = seg.text || seg.content || "";
              return `[${speaker}]: ${content}`;
            })
            .join("\n");
        } else {
          text = JSON.stringify(transcript, null, 2);
        }

        return {
          content: [{ type: "text", text }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching transcript: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: get_meeting_details
  server.tool(
    "get_meeting_details",
    "Get full details for a specific Fathom meeting including summary, action items, and metadata.",
    {
      meeting_id: z.string().describe("The meeting ID (from list_meetings)"),
    },
    async ({ meeting_id }) => {
      const apiKey = getFathomKey();
      if (!apiKey) {
        return {
          content: [{ type: "text", text: "Authentication required." }],
          isError: true,
        };
      }

      try {
        const data = await fathomFetch(apiKey, `/meetings/${meeting_id}`);
        return {
          content: [
            { type: "text", text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching meeting details: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// ─────────────────────────────────────────────
//  API Handler (protected MCP endpoint)
//  Receives authenticated requests from OAuthProvider.
//  Creates a fresh McpServer + handler per request.
// ─────────────────────────────────────────────

export class FathomMCP extends WorkerEntrypoint {
  async fetch(request) {
    // Trace: log what the apiHandler receives
    const url = new URL(request.url);
    const bodyClone = await request.clone().text();
    console.log("[FathomMCP] Received request:", {
      method: request.method,
      pathname: url.pathname,
      hasAuth: request.headers.has("authorization"),
      bodyPreview: bodyClone.substring(0, 500),
      propsKeys: this.ctx?.props ? Object.keys(this.ctx.props) : "no-props",
    });

    // Build a fresh McpServer per request (required for stateless handlers -
    // createMcpHandler connects the server to a transport, and a connected
    // server cannot be reused).
    const server = buildMcpServer();
    const handler = createMcpHandler(server, { route: "/mcp" });

    // Re-create request from cloned body since we consumed it
    const freshRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: bodyClone,
    });

    const response = await handler(freshRequest, this.env, this.ctx);

    // Trace: log what the handler returned
    const respClone = response.clone();
    const respBody = await respClone.text();
    console.log("[FathomMCP] Response:", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      bodyPreview: respBody.substring(0, 500),
    });

    return response;
  }
}

// ─────────────────────────────────────────────
//  Authorization page HTML
// ─────────────────────────────────────────────

function renderAuthPage(oauthReqInfo) {
  const stateParam = encodeURIComponent(JSON.stringify(oauthReqInfo));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect Fathom - Nansen</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f7;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #1d1d1f;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #1d1d1f;
    }
    .subtitle {
      color: #86868b;
      font-size: 14px;
      margin-bottom: 32px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #1d1d1f;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #d2d2d7;
      border-radius: 10px;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="password"]:focus {
      border-color: #0071e3;
      box-shadow: 0 0 0 3px rgba(0,113,227,0.15);
    }
    button {
      width: 100%;
      padding: 12px;
      background: #0071e3;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      transition: background 0.2s;
    }
    button:hover { background: #0077ED; }
    .help {
      margin-top: 20px;
      font-size: 12px;
      color: #86868b;
      line-height: 1.5;
    }
    .help a { color: #0071e3; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Fathom + Nansen</div>
    <div class="subtitle">Connect your Fathom account to access meeting transcripts</div>
    <form method="POST" action="/authorize">
      <input type="hidden" name="oauth_state" value="${stateParam}" />
      <label for="api_key">Fathom API Key</label>
      <input
        type="password"
        id="api_key"
        name="api_key"
        placeholder="Enter your Fathom API key"
        required
        autocomplete="off"
      />
      <button type="submit">Connect Fathom</button>
    </form>
    <div class="help">
      To get your API key: log into
      <a href="https://fathom.video" target="_blank">fathom.video</a>,
      go to Settings, scroll to API Access, and generate a key.
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────
//  Default handler (public routes + auth UI)
// ─────────────────────────────────────────────

const defaultHandler = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // GET /authorize - Show the API key entry form
    if (url.pathname === "/authorize" && request.method === "GET") {
      const oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request);
      if (!oauthReqInfo.clientId) {
        return new Response("Invalid OAuth request", { status: 400 });
      }
      return new Response(renderAuthPage(oauthReqInfo), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // POST /authorize - User submitted their API key
    if (url.pathname === "/authorize" && request.method === "POST") {
      const formData = await request.formData();
      const fathomApiKey = formData.get("api_key");
      const oauthStateRaw = formData.get("oauth_state");

      if (!fathomApiKey) {
        return new Response("API key is required", { status: 400 });
      }

      let oauthReqInfo;
      try {
        oauthReqInfo = JSON.parse(decodeURIComponent(oauthStateRaw));
      } catch {
        return new Response("Invalid OAuth state", { status: 400 });
      }

      // Validate the API key
      try {
        await fathomFetch(fathomApiKey, "/meetings", {});
      } catch (err) {
        return new Response(
          renderAuthPage(oauthReqInfo).replace(
            "</form>",
            `<p style="color: #ff3b30; font-size: 13px; margin-top: 12px;">
              Invalid API key. Please check and try again.
            </p></form>`
          ),
          { headers: { "Content-Type": "text/html" } }
        );
      }

      // Complete OAuth flow - fathomApiKey stored in props
      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: oauthReqInfo,
        userId: `fathom-user-${Date.now()}`,
        scope: oauthReqInfo.scope || ["read"],
        props: {
          fathomApiKey,
        },
      });

      return Response.redirect(redirectTo, 302);
    }

    // Health check (GET / only)
    if (url.pathname === "/health" || (url.pathname === "/" && request.method === "GET")) {
      return new Response(
        JSON.stringify({
          name: "fathom-mcp",
          version: "2.1.0",
          status: "ok",
          transport: "streamable-http",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Not found", { status: 404 });
  },
};

// ─────────────────────────────────────────────
//  Export: OAuthProvider with URL rewrite
//
//  Cowork sends MCP traffic to POST / but our
//  apiRoute is "/mcp" (to avoid catching /authorize).
//  We wrap the provider and rewrite POST / -> POST /mcp
//  before it hits the router.
// ─────────────────────────────────────────────

const provider = new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: FathomMCP,
  defaultHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  scopesSupported: ["read"],
});

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Cowork sends MCP traffic to POST / but apiRoute is "/mcp".
    // Only rewrite when the request has an Authorization header
    // (i.e. post-OAuth MCP calls). Unauthenticated POST / hits
    // the defaultHandler health check, which returns 200 and
    // lets Cowork discover OAuth naturally.
    const hasAuth = request.headers.has("authorization");
    console.log("[Entrypoint]", request.method, url.pathname, { hasAuth });
    if (
      url.pathname === "/" &&
      request.method === "POST" &&
      hasAuth
    ) {
      console.log("[Entrypoint] Rewriting POST / -> POST /mcp");
      url.pathname = "/mcp";
      request = new Request(url.toString(), request);
    }

    return provider.fetch(request, env, ctx);
  },
};
