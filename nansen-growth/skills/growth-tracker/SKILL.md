---
name: growth-tracker
description: >
  Populate the Client Growth Tracker spreadsheet by pulling data from Scoro, intelligence
  files, and account-scorer output. Fills in the operational fields (Last QBR, Revenue to
  date, Strategic Potential, Expansion Opportunities) that the team needs for day-to-day
  account management.

  ALWAYS use this skill when the user says anything like: "fill in the growth tracker",
  "populate the tracker", "update the growth tracker", "growth tracker", "what's missing
  in the tracker", "tracker status", "fill in the sheet", "update client data",
  "populate the spreadsheet", or any variation asking about filling in or updating
  the Client Growth Tracker.

  Also trigger when the user mentions the Mar 11 deadline for having the tracker ready,
  or asks about which client fields are still empty.

allowed-tools: Read, Write, Edit, Bash(ls:*), Bash(python3:*), Bash(cat:*), Bash(find:*), Bash(wc:*), get_projects, get_tasks, get_time_entries, get_invoices, get_calendar_events, get_bookings, get_users, get_contacts, search, google_drive_search, google_drive_fetch
---

# Growth Tracker -- Client Growth Tracker Population Skill

You are populating the Client Growth Tracker for Nansen's Client Development Playbook. Your job is to fill in the operational fields that are currently empty by pulling from connected data sources. This skill works hand-in-hand with the account-scorer -- the scorer handles the 6-criteria evaluation, while you fill in the concrete operational data.

## Before You Start

1. Read `intelligence/_index.json` to get the full intelligence inventory
2. Read the current Growth Tracker from Google Drive to see what's already filled in

**Growth Tracker URL:** `https://docs.google.com/spreadsheets/d/1zJukA5jH4Vx5Gt23Xu42P2czl0Qqno96TM3YaaLYEzU/`
**Portfolio Scorecard URL:** `https://docs.google.com/spreadsheets/d/1WQ6hYX-ePQJx_eSNN2q43r2GzeJpEUsGEXRVarYRJjM/`

## Growth Tracker Columns

| Column | Field | Auto-populate? | Source |
|--------|-------|---------------|--------|
| A | Client Name | Already populated | -- |
| B | EM Owner | Already populated | -- |
| C | Tier (A/B/C) | Yes | From account-scorer output or Portfolio Scorecard |
| D | Overall Health | Yes | Composite from budget pace + relationship score + engagement |
| E | Relationship Score (1-5) | Yes | From account-scorer Relationship Quality criterion |
| F | Last QBR | Yes | Scoro calendar or Fathom meeting search |
| G | Revenue to date | Yes | Scoro invoices for current year |
| H | Annual Revenue Goal | **No -- needs human input** | Strategic target, not derivable |
| I | Strategic potential | Yes | Derived from account-scorer Growth Potential + Strategic Fit |
| J | Expansion Opportunities | Yes | From intelligence files and account-scorer output |

## Step 1 -- Read Current State

Read the Growth Tracker from Google Drive. For each client row, note which fields are populated and which are empty. Build a gap report:

```
Client: [name]
  EM Owner: [filled/empty]
  Tier: [filled/empty] - current value: [X]
  Overall Health: [filled/empty] - current value: [X]
  Relationship Score: [filled/empty] - current value: [X]
  Last QBR: [filled/empty] - current value: [X]
  Revenue to date: [filled/empty] - current value: [X]
  Annual Revenue Goal: [filled/empty] - current value: [X]
  Strategic potential: [filled/empty] - current value: [X]
  Expansion Opportunities: [filled/empty] - current value: [X]
```

## Step 2 -- Pull Scoro Data

For each client, resolve the company in Scoro and pull:

### 2a. Revenue to date (Column G)

Use `get_invoices` filtered by client ID and current year date range:
- Filter: `clientIds: [company_id]`, `date: { from: "YYYY-01-01", to: "YYYY-12-31" }`
- Sum all invoice amounts (use the `sum` field from each invoice)
- Only count `status: "paid"` or `status: "unpaid"` (exclude voided)

Format as currency: "$XX,XXX"

### 2b. Last QBR date (Column F)

Search for QBR events. Try multiple approaches:

1. **Scoro calendar:** `get_calendar_events` filtered by company ID. Search for events with "QBR", "quarterly review", "quarterly business review", or "business review" in the name.
2. **Intelligence files:** Check `_index.json` for files with `growth_tracker_signals.qbr_mention: true` or files with "qbr" in the title.
3. **Fathom meetings:** Search intelligence files with source_type "meeting-transcript" for QBR mentions in the content.

Use the most recent date found. Format as "Month YYYY" (e.g., "January 2026").

If no QBR found, note "No QBR on record" -- this is valuable information for the team.

### 2c. Project data for context

Use `get_projects` filtered by company. Note:
- Number of active projects
- Active retainers vs one-off projects
- Budget types (simple, advanced, quote)

This feeds into the Overall Health assessment.

## Step 3 -- Pull Intelligence Data

For each client, use `_index.json` to find their intelligence files.

### 3a. Expansion Opportunities (Column J)

Scan all intelligence files for the client. Look for:
- `growth_tracker_signals.expansion_opportunities` in frontmatter (newer files)
- Mentions of: new projects, upsell, cross-sell, platform upgrades, additional services, Phase 2, new workstreams
- Specific items from the "Client and Engagement Intelligence" and "Strategic Implications" sections

Compile into a concise comma-separated list of specific opportunities. Be concrete:
- Good: "CMS 13 upgrade, Commerce 15 migration, AI content personalization"
- Bad: "Various growth opportunities identified"

### 3b. Health indicators

Aggregate `growth_tracker_signals.health_indicators` from recent intelligence files (last 3 months). If most are "positive", the base health signal is green. Mixed signals suggest yellow. Any "concerning" indicators warrant investigation.

### 3c. Relationship indicators

Aggregate `growth_tracker_signals.relationship_indicators` and `scoring_signals.relationship_quality` from intelligence files. These feed into the Overall Health calculation.

## Step 4 -- Derive Computed Fields

### Tier (Column C)

If the account-scorer has been run, use the tier from its output. Otherwise, check the Portfolio Scorecard for existing tier assignments.

If neither exists, flag as "Needs scoring" rather than guessing.

### Overall Health (Column D)

Composite signal from:
1. Budget health (from Scoro or budget-pulse): on track = positive, overspent = concerning
2. Relationship quality: from intelligence health indicators
3. Engagement recency: when was the last intelligence file created for this client?
4. Any red flags from intelligence (escalations, churn signals, dissatisfaction)

Map to traffic light:
- **Green**: Budget on track, positive relationship signals, recent engagement (file in last 30 days)
- **Yellow**: One area concerning, or data is thin, or engagement gap (no file in 30-60 days)
- **Red**: Multiple concerning signals, or no engagement in 60+ days, or active escalation

### Relationship Score (Column E)

If account-scorer has been run, use the Relationship Quality criterion score (1-5).

Otherwise, derive from intelligence:
- 5: Multiple files show exec access, advocacy signals
- 4: Positive relationship language, regular senior-level meetings
- 3: Functional, project-level contacts, standard engagement
- 2: Limited signals, transactional tone
- 1: Concerning signals, escalation mentions

### Strategic Potential (Column I)

If account-scorer has been run, use its derivation (Growth Potential + Strategic Fit average).

Otherwise, derive from intelligence:
- **High**: Solutions positioning doc exists, industry research shows strong fit, 3+ Nansen capabilities in use
- **Medium**: Some service alignment, moderate fit
- **Low**: Limited fit, niche engagement

## Step 5 -- Present Results

Show the complete Growth Tracker table with proposed values:

| Client | EM | Tier | Health | Rel. | Last QBR | Rev YTD | Goal | Strat. Pot. | Expansion Opps |
|--------|-----|------|--------|------|----------|---------|------|------------|----------------|
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

For each row, use these markers:
- **Bold** = newly populated value (was previously empty)
- *Italic* = updated value (changed from previous)
- Normal = unchanged
- `[needs input]` = requires human input (Annual Revenue Goal)
- `[needs scoring]` = requires account-scorer to be run first

After the table, list a brief evidence trail for each populated field:
```
Atwoods:
  Revenue YTD: $45,000 from 3 paid invoices (Scoro)
  Last QBR: January 2026 (found in Scoro calendar: "Atwoods Q1 QBR")
  Expansion: CMS upgrade, SEO audit (from 2026-01-15 meeting transcript)
```

## Step 6 -- Flag Gaps

After populating what you can, report:
1. Which clients have data gaps that need manual input
2. Which clients need account-scorer to run first (for tier, health, relationship score)
3. Which clients have no intelligence files at all (and therefore limited data)
4. The overall completion percentage of the Growth Tracker

## Output Format for Sheet Transfer

Since v1 uses manual transfer to Google Sheets, format a clean copy-paste block at the end:

```
CLIENT | TIER | HEALTH | REL SCORE | LAST QBR | REV YTD | GOAL | STRAT POT | EXPANSION
Atwoods | A | Green | 4 | Jan 2026 | $45,000 | [needs input] | High | CMS upgrade, SEO audit
...
```

Tab-separated so it can paste directly into the spreadsheet.
