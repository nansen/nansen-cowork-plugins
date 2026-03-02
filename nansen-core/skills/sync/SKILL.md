---
name: sync
description: >
  Pull content from connected sources (Slack, Fathom) and extract intelligence.
  Supports two modes: initial pull (past 7 days for onboarding) and daily sync
  (since last sync timestamp). Filters for substantive content, saves source files,
  and runs market-research extraction on high-signal material.

  This skill is invoked by /setup (initial pull) and by the nansen-daily-sync
  scheduled task (daily sync). It can also be run manually at any time.

allowed-tools: Read, Write, Edit, Bash(ls:*), Bash(mkdir:*), Bash(cat:*), Bash(date:*), Bash(python3:*), Bash(find:*), Bash(wc:*), slack_search_public, slack_search_public_and_private, slack_read_channel, slack_read_thread, slack_search_channels, slack_search_users, list_meetings, get_transcript, get_meeting_details
---

# Intelligence Sync Skill

You are the intelligence sync engine for Nansen. Your job is to pull content from all connected sources, filter it for signal, save source files, and extract intelligence from high-value content.

## Determine Sync Mode

Check how you were invoked:

- **Initial pull**: If the user or setup command says "initial pull", "initial sync", "first sync", or passes a lookback period of multiple days, use initial mode. Pull the past 7 days of content.
- **Daily sync**: If invoked by the scheduled task or the user says "daily sync" or "sync", pull content since the last sync timestamp.
- **Manual sync**: If the user asks to sync a specific time range, use their parameters.

## Step 1 -- Load Configuration

Read `.nansen-config.json` from the workspace root. Extract:

- `workspace_paths.sources` -- where to save source files
- `workspace_paths.intelligence` -- where intelligence files go
- `sync.last_full_sync` -- timestamp of last complete sync (null = never synced)
- `sync.last_slack_sync` -- object with per-channel timestamps
- `sync.last_fathom_sync` -- timestamp of last Fathom sync
- `sync.slack.channels` -- array of channels to monitor (each has `channel_id` and `channel_name`)
- `sync.fathom.min_duration_minutes` -- minimum meeting length to consider

If the config file doesn't exist, tell the user to run /setup first and stop.

Calculate the **sync window**:
- Initial mode: 7 days ago from now
- Daily mode: Use `sync.last_full_sync` timestamp, or if null, fall back to 24 hours ago
- Manual mode: Use the user's specified range

## Step 2 -- Check Connector Availability

Test each connector with a lightweight call. Handle failures gracefully -- if one connector is down, continue with the others.

**Slack check:**
Try calling `slack_search_public` with a simple query (e.g., search for "the" limited to 1 result). If it returns results or an empty set, Slack is available. If it throws an error about authentication or connection, mark Slack as unavailable for this run.

**Fathom check:**
Try calling `list_meetings` with `limit: 1`. If it returns (even with 0 meetings), Fathom is available. If it errors, mark Fathom as unavailable.

Log which connectors are active for this sync run.

## Step 3 -- Slack Collection

Skip this step if Slack is unavailable or `sync.slack.channels` is empty.

Read the filter heuristics from `nansen-core/skills/sync/references/filter-heuristics.md` before proceeding.

For each channel in `sync.slack.channels`:

### 3a. Fetch messages

Use `slack_read_channel` with:
- `channel_id`: from config
- `oldest`: the sync window start (Unix timestamp)
- `latest`: now (Unix timestamp)
- `limit`: 100 (paginate if needed)

### 3b. Stage 1 - Noise removal

Filter out messages that are:
- Emoji-only (no alphabetic characters in the text)
- Fewer than 3 words (after stripping @mentions and URLs)
- From bot users
- System messages (joins, leaves, topic changes)
- Bare URLs with no surrounding text

### 3c. Stage 2 - Thread grouping

Group remaining messages by thread:
- Messages with `thread_ts` that differs from their own `ts` are replies -- group them under the parent
- For each thread parent that passed filtering, call `slack_read_thread` to get the full conversation
- Standalone messages (no thread) stay as individual items

### 3d. Stage 3 - Signal classification

For each thread or standalone message group, classify signal strength by scanning the content:

**HIGH signal** (at least 2 of these indicators):
- Decision language: "decided", "agreed", "approved", "going with", "confirmed"
- Action items: "action item", "TODO", "follow up", "I'll handle", "can you", "please [verb]"
- Client mentions with business context
- Budget/pricing/scope discussion
- Competitive intelligence
- Strategic direction language

**MEDIUM signal** (at least 1 indicator):
- Status update with new context or blockers
- Client feedback relay
- Substantive question that reveals a gap or need
- Project milestone reference with new info

**LOW signal** (none of the above but passed Stage 1):
- Routine status updates
- FYI messages
- Short acknowledgments that made it past the word filter

### 3e. Save source files

For HIGH and MEDIUM threads, create a source file:

**Filename**: `YYYY-MM-DD_slack_CHANNEL-NAME_THREAD-SUMMARY-SLUG.md`
- Date is today's date (when the sync ran)
- Channel name from config (lowercase, hyphens)
- Thread summary slug: 3-5 word summary of the thread topic (lowercase, hyphens)

**File format**:
```markdown
---
source_type: slack-thread
channel: #channel-name
channel_id: CXXXXXXXXX
thread_ts: XXXXXXXXXX.XXXXXX
date: YYYY-MM-DD
participants:
  - Person Name
  - Another Person
signal_level: HIGH|MEDIUM
synced_at: ISO-8601 timestamp
---

# Thread: [brief topic description]

**Channel**: #channel-name | **Date**: YYYY-MM-DD | **Messages**: N

---

[Speaker Name] (HH:MM):
Message content here.

[Another Speaker] (HH:MM):
Their reply here.

[...full thread conversation...]
```

For LOW signal threads, save to `sources/.archived/` with the same format.

### 3f. Track progress

Keep a running count of:
- Threads processed per channel
- Signal classification breakdown (HIGH / MEDIUM / LOW / skipped)
- Source files created

## Step 4 -- Fathom Collection

Skip this step if Fathom is unavailable.

### 4a. Fetch meetings

Call `list_meetings` with:
- `created_after`: sync window start (ISO-8601)
- `limit`: 50

### 4b. Filter meetings

Skip meetings where:
- Duration is less than `sync.fathom.min_duration_minutes` (default 5 minutes) AND the transcript would be very short
- Title matches skip patterns: "test call", "audio check", "tech check"

### 4c. Classify signal

For each remaining meeting:

**HIGH signal**:
- Client name in title or participants
- Title suggests substance: "planning", "review", "strategy", "kickoff", "pitch", "demo", "workshop"
- 3+ participants
- Duration 30+ minutes

**MEDIUM signal**:
- Internal team meetings: "team sync", "weekly", "all-hands"
- 1:1 meetings with substantive transcripts (500+ words)

**LOW signal**:
- Very short meetings (5-15 min) with minimal transcript
- Social or casual meetings

### 4d. Fetch transcripts and save

For HIGH and MEDIUM meetings, call `get_transcript` with the `meeting_id`.

**Filename**: `YYYY-MM-DD_fathom_MEETING-TITLE-SLUG.md`
- Date is the meeting date (from the API response)
- Title slug: sanitized meeting title (lowercase, hyphens, max 6 words)

**File format**:
```markdown
---
source_type: meeting-transcript
meeting_id: XXXXXXXX
date: YYYY-MM-DD
duration_minutes: NN
participants:
  - Person Name
  - Another Person
signal_level: HIGH|MEDIUM
synced_at: ISO-8601 timestamp
---

# Meeting: [Meeting Title]

**Date**: YYYY-MM-DD | **Duration**: NNm | **Participants**: N people

---

[Speaker Name]:
What they said...

[Another Speaker]:
What they said...

[...full transcript...]
```

For LOW signal meetings, save a brief summary file to `sources/.archived/` (no full transcript needed, just metadata and a 2-sentence summary).

## Step 5 -- Intelligence Extraction

Now process the newly created source files through the intelligence extraction pipeline.

### 5a. Gather new source files

List all source files created during this sync run (the ones you just wrote in Steps 3 and 4). Exclude anything saved to `.archived/`.

### 5b. Pre-filter scan

For each source file, read the first ~300 words and do a quick assessment:

- Does it contain client names, project references, or business-specific content?
- Does it have decision language, strategy discussion, or actionable insights?
- Is it substantive enough to warrant full extraction (at least 200 words of actual content)?

If the pre-filter says "no" on all three questions, reclassify as LOW signal and move to `.archived/`. This is a safety net for content that passed Stage 3 but turns out to be thin.

### 5c. Extract intelligence

For each remaining HIGH and MEDIUM source file:

1. Read the intelligence schema from `nansen-core/schema/intelligence-schema.yaml`
2. Read the full source file
3. Follow the market-research extraction process:
   - Identify the source type, participants, client, time period
   - Extract across the six dimensions (Market Trends, Competitive Landscape, Client Intel, Industry Insights, Technology Signals, Strategic Implications)
   - Only include dimensions with genuine substance
   - Be specific and attribute insights
4. **Extract playbook scoring signals** (see 5c-scoring below)
5. Generate the intelligence file with proper YAML frontmatter including `scoring_signals` and `growth_tracker_signals`
6. Use the deterministic filename: `YYYY-MM-DD_client-slug_source-type_title-slug.intelligence.md`
7. Write to the intelligence/ folder

**For MEDIUM signal sources**: Note in the extraction that the source had limited depth. Keep the intelligence file shorter and flag confidence as "medium" or "low".

### 5c-scoring. Playbook Scoring Signal Extraction

While processing each source file, look specifically for signals that map to the Client Development Playbook's six scoring criteria and Growth Tracker fields. This step runs alongside the normal six-dimension extraction -- it adds structured tags to the intelligence file, not a separate output.

**Scoring criteria signals to detect:**

| Criterion | What to look for | Example signals |
|-----------|-----------------|----------------|
| Growth Potential | Budget expansion talk, new project discussions, platform upgrades, multi-year planning language | "looking at a Phase 2", "next year's budget", "expanding the retainer" |
| Strategic Fit | Alignment with Nansen services, mentions of capabilities Nansen offers, discussions of shared goals | "need help with CMS migration", "looking for a partner on AI", "this maps to what you do" |
| Relationship Quality | Access to decision-makers, warmth/trust language, advocacy, referral mentions, executive involvement | "I'll introduce you to our VP", "you guys are great", "recommended you to..." |
| Engagement Level | Responsiveness, proactive requests, collaboration depth, meeting frequency signals | "can we set up a weekly?", "sent over the brief already", "looped in the whole team" |
| Budget & Profitability | Specific budget numbers, value perception, pricing discussion, scope changes, margin-affecting language | "budget is $X", "great ROI", "can we add more hours?", "need to reduce scope" |
| Innovation Openness | Reaction to new ideas, AI/experimentation appetite, willingness to try new platforms, early-adopter language | "let's pilot that", "interested in the AI approach", "we're open to testing" |

**Add to YAML frontmatter:**

```yaml
scoring_signals:
  growth_potential: ["Phase 2 discussion mentioned for Q2", "Client asked about retainer expansion"]
  strategic_fit: ["CMS 13 upgrade aligns with Nansen Optimizely practice"]
  relationship_quality: ["Direct access to VP Marketing, positive tone throughout"]
  engagement_level: []
  budget_profitability: ["Current retainer at $15k/month, client asked about increasing"]
  innovation_openness: ["Enthusiastic about AI content recommendations pilot"]
```

Only include criteria that have genuine signals. Empty arrays are fine -- they tell the scorer "no data here". Each signal should be a short, specific sentence citing what was actually said or observed, not generic summaries.

**Growth Tracker signals to detect:**

Also extract signals relevant to the Growth Tracker operational fields:

```yaml
growth_tracker_signals:
  expansion_opportunities: ["CMS 13 migration", "Commerce 15 evaluation", "AI content personalization"]
  health_indicators: ["positive" | "neutral" | "concerning"]
  health_notes: "Strong engagement, proactive on new initiatives"
  relationship_indicators: ["direct-exec-access", "advocacy", "referral"]
  qbr_mention: false
  revenue_signals: ["$15k/month retainer", "discussing Phase 2 at $X"]
```

These signals feed directly into the account-scorer and growth-tracker skills downstream. The more specific and evidence-based they are, the better the scoring quality.

**Important:** Not every source file will contain scoring signals. Internal team discussions, industry research, and technical documents may have none -- that's fine. The signals are most likely to appear in client-facing meeting transcripts and touchbase conversations.

**For HIGH signal sources**: Full extraction. Confidence should reflect the richness of the source.

### 5d. Track extraction results

Keep count of:
- Intelligence files created
- Sources that were reclassified to LOW during pre-filter
- Any extraction errors

### 5e. Update the intelligence index

After all intelligence files have been written, regenerate the `_index.json` file in the intelligence/ folder. This index provides fast metadata lookups without reading every file.

Run the index generator script:

```bash
python3 /path/to/workspace/nansen-core/tools/build_intelligence_index.py --intelligence-dir /path/to/intelligence/
```

If the script is not available, you can rebuild the index inline by:

1. Reading every `.intelligence.md` file in the intelligence/ folder
2. Extracting the YAML frontmatter from each file
3. Building a JSON entry per file with: `file`, `title`, `date`, `client`, `source_type`, `domains`, `confidence`, `participants`, `summary` (truncated to 200 chars)
4. Writing `_index.json` with structure: `{ version, generated_at, total_files, stats, entries }`

The index should normalize:
- Confidence values to "high", "medium", or "low" (numeric values: >=0.85 = high, >=0.6 = medium, else low)
- Domains and participants to flat arrays of lowercase strings
- Inline JSON arrays in YAML (e.g. `["item1", "item2"]`) to proper lists

This step should not block the sync if it fails -- log a warning and continue.

## Step 6 -- Update Sync State

Update `.nansen-config.json` with new timestamps:

```json
{
  "sync": {
    "last_full_sync": "[current ISO-8601 timestamp]",
    "last_slack_sync": {
      "CXXXXXXX": "[current ISO-8601 timestamp]",
      "CYYYYYYY": "[current ISO-8601 timestamp]"
    },
    "last_fathom_sync": "[current ISO-8601 timestamp]"
  }
}
```

Use the `Edit` tool to update only the sync fields, preserving the rest of the config.

## Step 7 -- Generate Summary Report

Produce a clear summary of what happened:

```
--- Nansen Intelligence Sync Complete ---
Mode: [Initial Pull / Daily Sync / Manual]
Time window: [start] to [end]

Connectors:
  Slack: [Active / Unavailable]
  Fathom: [Active / Unavailable]

Slack:
  Channels scanned: N
  Threads found: N
  HIGH signal: N (extracted)
  MEDIUM signal: N (extracted)
  LOW signal: N (archived)
  Noise filtered: N

Fathom:
  Meetings found: N
  HIGH signal: N (extracted)
  MEDIUM signal: N (extracted)
  LOW signal: N (archived)
  Skipped (too short / test): N

Intelligence:
  New source files: N
  Intelligence files created: N
  Sources reclassified during pre-filter: N

Next sync: [scheduled time or "run manually"]
```

If there were any errors (connector failures, extraction problems), list them at the end.

## Error Handling

- If a connector fails mid-sync, log the error and continue with other connectors. Don't let one failure kill the whole sync.
- If an individual thread or meeting fails to process, skip it and note the error. Process everything else.
- If the intelligence extraction fails on a source file, keep the source file (it's already saved) and note that extraction needs to be retried.
- If the config file can't be updated, log a warning. The source files and intelligence files are already saved, so no work is lost.

## Filesystem Hygiene

- Always create the `sources/.archived/` directory if it doesn't exist
- Use the `Bash(mkdir -p ...)` tool to create directories as needed
- Use absolute paths from the config for all file operations
- Check if a source file already exists before writing (deduplication). If a file with the same name exists, skip it (it was already synced).
