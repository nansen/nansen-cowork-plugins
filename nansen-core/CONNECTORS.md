# Connectors and Integrations

nansen-core integrates with several external services. Not all are required for the POC -- the minimum viable setup needs just the folder structure and Google Drive.

## Google Drive for Desktop (Required for team sync)

**Purpose**: Syncs the intelligence/ folder so extracted knowledge is available to the whole team.

**Setup**:
1. Install Google Drive for Desktop: https://www.google.com/drive/download/
2. Sign in with your Nansen Google Workspace account
3. Create or identify a Shared Drive folder for team intelligence
4. The `/setup` command helps configure the sync path

**How it works**: When a skill writes an intelligence file to the intelligence/ folder, Google Drive for Desktop automatically syncs it to the Shared Drive. Other team members see the file within seconds.

**Requirements**: Google Workspace account with Shared Drive access.

## Fathom (Optional -- meeting transcripts)

**Purpose**: Automatically fetches meeting transcripts for intelligence extraction.

**Type**: Stdio MCP server (bundled in `servers/fathom/`)

**API Documentation**: https://developers.fathom.ai/

**Setup**:
1. Sign up or log in at https://fathom.video
2. Generate an API key from your Fathom developer settings
3. Set the `FATHOM_API_KEY` environment variable (add `export FATHOM_API_KEY="your-key"` to your `~/.zshrc` or `~/.bashrc`)
4. Run `npm install` inside `servers/fathom/`
5. The `/setup` command will prompt for the key and validate it

**MCP Tools provided**:
- `list_meetings` -- List recent meetings with date filtering (created_after/created_before)
- `get_transcript` -- Fetch full speaker-attributed transcript for a specific meeting
- `get_meeting_details` -- Get meeting metadata, summary, and action items

**How it works**: The Fathom MCP server runs as a local stdio process. When Cowork starts a session with nansen-core, it spawns the server automatically. Skills can then call `list_meetings` and `get_transcript` to pull meeting data directly from Fathom's API, no manual file drops needed.

**Requirements**: Fathom account with API access. The `FATHOM_API_KEY` environment variable must be set. The domain `api.fathom.ai` must be accessible (check Cowork network allowlist settings).

**Fallback**: Users can also export transcripts from Fathom manually and drop them into sources/. The MCP integration is a convenience, not a requirement.

## Slack (Optional -- context and distribution)

**Purpose**: Search Slack workspace for additional context when extracting intelligence. Future: notify channels when new intelligence is available.

**Setup**: The Slack MCP connector should be configured in Cowork's connector settings. The `/setup` command checks if it's active.

**How it works**: During intelligence extraction, skills can search Slack for related conversations, giving richer context. In future phases, skills can post summaries to designated channels when new intelligence is published.

**Requirements**: Slack MCP connector enabled in Cowork.

## Scoro (Future -- Phase 2+)

**Purpose**: Pull project and financial data for the finance domain plugin.

**API**: Scoro REST API (already used by the budget-pulse skill).

**Status**: Not needed for Phase 1. Will be integrated when the finance domain plugin is built.
