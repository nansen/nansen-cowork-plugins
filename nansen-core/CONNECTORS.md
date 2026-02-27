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

**API Documentation**: https://developers.fathom.ai/

**Setup**:
1. Sign up or log in at https://fathom.video
2. Generate an API key from your Fathom developer settings
3. The `/setup` command will prompt for the key and validate it

**How it works**: When connected, skills can pull recent meeting transcripts directly from Fathom's API instead of requiring manual file drops into sources/.

**Requirements**: Fathom account with API access. Free tier may have limitations.

**POC note**: For the pilot, users can also just export transcripts from Fathom manually and drop them into sources/. API integration is a convenience, not a requirement.

## Slack (Optional -- context and distribution)

**Purpose**: Search Slack workspace for additional context when extracting intelligence. Future: notify channels when new intelligence is available.

**Setup**: The Slack MCP connector should be configured in Cowork's connector settings. The `/setup` command checks if it's active.

**How it works**: During intelligence extraction, skills can search Slack for related conversations, giving richer context. In future phases, skills can post summaries to designated channels when new intelligence is published.

**Requirements**: Slack MCP connector enabled in Cowork.

## Scoro (Future -- Phase 2+)

**Purpose**: Pull project and financial data for the finance domain plugin.

**API**: Scoro REST API (already used by the budget-pulse skill).

**Status**: Not needed for Phase 1. Will be integrated when the finance domain plugin is built.
