/**
 * Fathom MCP Server - Cloudflare Workers (Remote)
 *
 * A remote MCP server that proxies Fathom.video API calls.
 * Uses McpAgent (Durable Objects) for stateful MCP sessions.
 *
 * Endpoint: /mcp (Streamable HTTP transport)
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const FATHOM_API_BASE = "https://api.fathom.ai/external/v1";

// -- Fathom API helper --

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

// -- MCP Agent (Durable Object) --

export class FathomMCP extends McpAgent {
  server = new McpServer({
    name: "fathom-mcp",
    version: "1.0.0",
  });

  async init() {
    // Tool: list_meetings
    this.server.tool(
      "list_meetings",
      "List recent Fathom meetings. Returns meeting ID, title, date, duration, and participants.",
      {
        api_key: z.string().describe("Your Fathom API key"),
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
      async ({
        api_key,
        created_after,
        created_before,
        include_transcript,
        limit,
      }) => {
        if (!api_key) {
          return {
            content: [
              {
                type: "text",
                text: "No Fathom API key provided. Please pass your api_key parameter.",
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

          const data = await fathomFetch(api_key, "/meetings", params);
          const meetings = Array.isArray(data)
            ? data
            : data.meetings || data.data || [];
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
    this.server.tool(
      "get_transcript",
      "Get the full transcript for a specific Fathom meeting. Returns speaker-attributed transcript text.",
      {
        api_key: z.string().describe("Your Fathom API key"),
        meeting_id: z.string().describe("The meeting ID (from list_meetings)"),
        recording_id: z
          .string()
          .optional()
          .describe(
            "Optional recording ID if the meeting has multiple recordings"
          ),
      },
      async ({ api_key, meeting_id, recording_id }) => {
        if (!api_key) {
          return {
            content: [
              {
                type: "text",
                text: "No Fathom API key provided. Please pass your api_key parameter.",
              },
            ],
            isError: true,
          };
        }

        try {
          let transcript;
          const rid = recording_id || meeting_id;

          try {
            transcript = await fathomFetch(
              api_key,
              `/recordings/${rid}/transcript`
            );
          } catch {
            transcript = await fathomFetch(api_key, `/meetings/${meeting_id}`, {
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
    this.server.tool(
      "get_meeting_details",
      "Get full details for a specific Fathom meeting including summary, action items, and metadata.",
      {
        api_key: z.string().describe("Your Fathom API key"),
        meeting_id: z.string().describe("The meeting ID (from list_meetings)"),
      },
      async ({ api_key, meeting_id }) => {
        if (!api_key) {
          return {
            content: [
              {
                type: "text",
                text: "No Fathom API key provided. Please pass your api_key parameter.",
              },
            ],
            isError: true,
          };
        }

        try {
          const data = await fathomFetch(api_key, `/meetings/${meeting_id}`);
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
  }
}

// -- Worker entry point --
// Use McpAgent.serve() to handle the MCP protocol via Durable Objects
const mcpWorker = FathomMCP.serve("/mcp", { binding: "MCP_OBJECT" });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          name: "fathom-mcp",
          version: "1.0.0",
          status: "ok",
          transport: "streamable-http",
          endpoint: "/mcp",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delegate MCP requests to the McpAgent serve handler
    return mcpWorker.fetch(request, env, ctx);
  },
};
