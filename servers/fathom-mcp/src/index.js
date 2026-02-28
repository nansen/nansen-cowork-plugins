/**
 * Fathom MCP Server - Cloudflare Workers (Remote)
 *
 * A remote MCP server that proxies Fathom.video API calls.
 * Users connect via Streamable HTTP and pass their own Fathom API key
 * as a Bearer token in the Authorization header.
 *
 * Endpoint: /mcp (Streamable HTTP transport)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
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

// -- MCP Handler (stateless, no Durable Objects needed) --

const mcpHandler = createMcpHandler(
  (server, _env, _ctx) => {
    // Tool: list_meetings
    server.tool(
      "list_meetings",
      "List recent Fathom meetings. Returns meeting ID, title, date, duration, and participants.",
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
        api_key: z
          .string()
          .describe("Your Fathom API key"),
      },
      async ({ created_after, created_before, include_transcript, limit, api_key }) => {
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
        api_key: z
          .string()
          .describe("Your Fathom API key"),
      },
      async ({ meeting_id, recording_id, api_key }) => {
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
    server.tool(
      "get_meeting_details",
      "Get full details for a specific Fathom meeting including summary, action items, and metadata.",
      {
        meeting_id: z.string().describe("The meeting ID (from list_meetings)"),
        api_key: z
          .string()
          .describe("Your Fathom API key"),
      },
      async ({ meeting_id, api_key }) => {
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
  },
  {
    name: "fathom-mcp",
    version: "1.0.0",
  },
  "/mcp"
);

// -- Worker entry point --

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

    // MCP endpoint
    if (url.pathname === "/mcp") {
      return mcpHandler(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
