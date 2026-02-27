#!/usr/bin/env node

/**
 * Fathom MCP Server for Nansen
 *
 * Provides tools to list meetings and fetch transcripts from Fathom.video
 * via the official API. Designed as a stdio MCP server for Cowork plugins.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = "https://api.fathom.ai/external/v1";
const API_KEY = process.env.FATHOM_API_KEY;

if (!API_KEY) {
  console.error("FATHOM_API_KEY environment variable is required");
  process.exit(1);
}

// -- API helpers --

async function fathomFetch(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": API_KEY,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Fathom API ${res.status}: ${body}`);
  }

  return res.json();
}

// -- MCP Server --

const server = new McpServer({
  name: "fathom",
  version: "1.0.0",
});

// Tool: list_meetings
server.tool(
  "list_meetings",
  "List recent Fathom meetings. Returns meeting ID, title, date, duration, and participants. Use created_after/created_before for date filtering (ISO-8601 format, e.g. 2026-02-20T00:00:00Z).",
  {
    created_after: z.string().optional().describe("Only meetings created after this ISO-8601 datetime"),
    created_before: z.string().optional().describe("Only meetings created before this ISO-8601 datetime"),
    include_transcript: z.boolean().optional().default(false).describe("Include full transcript in response (default: false, use get_transcript for individual meetings)"),
    limit: z.number().optional().default(20).describe("Max meetings to return (default: 20)"),
  },
  async ({ created_after, created_before, include_transcript, limit }) => {
    try {
      const params = {};
      if (created_after) params.created_after = created_after;
      if (created_before) params.created_before = created_before;
      if (include_transcript) params.include_transcript = "true";

      const data = await fathomFetch("/meetings", params);

      // The API may return paginated results or a flat array
      const meetings = Array.isArray(data) ? data : (data.meetings || data.data || []);
      const sliced = meetings.slice(0, limit);

      const summary = sliced.map((m) => ({
        id: m.id,
        title: m.title || m.name || "Untitled meeting",
        date: m.created_at || m.date || m.recorded_at,
        duration_seconds: m.duration || m.duration_seconds,
        participants: m.participants || m.attendees || [],
        recording_id: m.recording_id || m.recordings?.[0]?.id,
        ...(include_transcript && m.transcript ? { transcript: m.transcript } : {}),
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ count: summary.length, meetings: summary }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error listing meetings: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: get_transcript
server.tool(
  "get_transcript",
  "Get the full transcript for a specific Fathom meeting or recording. Returns speaker-attributed transcript text.",
  {
    meeting_id: z.string().describe("The meeting ID (from list_meetings)"),
    recording_id: z.string().optional().describe("Optional recording ID if the meeting has multiple recordings"),
  },
  async ({ meeting_id, recording_id }) => {
    try {
      // Try to get transcript from recording endpoint first, fall back to meeting
      let transcript;
      const rid = recording_id || meeting_id;

      try {
        transcript = await fathomFetch(`/recordings/${rid}/transcript`);
      } catch {
        // Fall back to meeting-level transcript
        transcript = await fathomFetch(`/meetings/${meeting_id}`, {
          include_transcript: "true",
        });
      }

      // Normalize transcript format
      let text;
      if (typeof transcript === "string") {
        text = transcript;
      } else if (transcript.transcript) {
        // Could be an array of segments or a string
        if (Array.isArray(transcript.transcript)) {
          text = transcript.transcript
            .map((seg) => {
              const speaker = seg.speaker || seg.speaker_name || "Unknown";
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
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error fetching transcript: ${err.message}` }],
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
    try {
      const data = await fathomFetch(`/meetings/${meeting_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error fetching meeting details: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
