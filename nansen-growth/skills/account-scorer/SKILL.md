---
name: account-scorer
description: >
  Score client accounts on the 6 Client Development Playbook criteria (Growth Potential,
  Strategic Fit, Relationship Quality, Engagement Level, Budget & Profitability,
  Innovation Openness) and assign tiers (A/B/C). Reads intelligence files, Scoro data,
  and the _index.json to produce evidence-backed scoring recommendations.

  Outputs two views per client: a detailed Portfolio Scorecard (6 criteria x score +
  evidence) and a Growth Tracker summary row (tier, health, relationship score,
  strategic potential, expansion opportunities).

  ALWAYS use this skill when the user says anything like: "score accounts", "score
  [client]", "account scoring", "tier accounts", "which clients are Tier A",
  "rate our accounts", "playbook scoring", "update the scorecard", "client tiering",
  "re-score [client]", "how does [client] score", or any variation asking about
  evaluating client accounts against the playbook criteria.

  Also trigger when the user asks to update the Client Portfolio Scorecard or wants
  an evidence-based view of where a client stands.

allowed-tools: Read, Write, Edit, Bash(ls:*), Bash(python3:*), Bash(cat:*), Bash(find:*), Bash(wc:*), get_projects, get_tasks, get_time_entries, get_invoices, get_calendar_events, get_bookings, get_users, get_contacts, search, google_drive_search, google_drive_fetch
---

# Account Scorer -- Client Development Playbook Scoring Engine

You are scoring client accounts for Nansen using the Client Development Playbook's 6-criteria framework. Your job is to read all available intelligence and operational data for a client, produce a recommended score (1-5) on each criterion with specific evidence, and derive the Growth Tracker summary fields.

## Before You Start

1. Read the intelligence schema from `nansen-core/schema/intelligence-schema.yaml`
2. Read `intelligence/_index.json` to get the full file inventory
3. Determine scope: is the user asking to score one client, a subset, or all accounts?
4. Read the current Portfolio Scorecard data from Google Drive to understand existing scores

**Portfolio Scorecard URL:** `https://docs.google.com/spreadsheets/d/1WQ6hYX-ePQJx_eSNN2q43r2GzeJpEUsGEXRVarYRJjM/`
**Growth Tracker URL:** `https://docs.google.com/spreadsheets/d/1zJukA5jH4Vx5Gt23Xu42P2czl0Qqno96TM3YaaLYEzU/`

## Step 1 -- Gather Client Intelligence

For the target client(s):

### 1a. Intelligence files

Use `_index.json` to find all intelligence files for the client. Filter by the `client` field. Read each file fully -- don't just use the summary from the index. Pay close attention to:

- `scoring_signals` in the frontmatter (if present -- newer files will have these)
- `growth_tracker_signals` in the frontmatter (if present)
- The body content, especially the "Client and Engagement Intelligence" and "Strategic Implications" sections

**Count your coverage:** Note how many intelligence files exist for this client, the date range they span, and the source types represented. This directly affects your confidence level.

### 1b. Scoro data

Pull operational data from Scoro:

- **Projects:** `get_projects` filtered by company name. Look for active retainers, project count, budget types.
- **Time entries:** `get_time_entries` filtered by project IDs for the current year. Gives actual hours and billing data.
- **Invoices:** `get_invoices` filtered by client. Gives revenue figures.
- **Calendar events:** `get_calendar_events` to gauge meeting frequency. Look for QBR-tagged events.
- **Contacts:** Use `search` or `get_contacts` to resolve the client company and any contact persons.

### 1c. Current sheet data

If Google Drive is available, read the current Portfolio Scorecard and Growth Tracker to understand existing scores (for comparison) and EM owner assignments.

## Step 2 -- Score Each Criterion

For each of the 6 criteria, produce a score from 1-5 with evidence. Use the rubric below.

### Scoring Rubric

**Growth Potential (1-5)**

How much room is there to grow this account?

| Score | Definition |
|-------|-----------|
| 5 | Active expansion discussions, new project pipelines, budget growth confirmed |
| 4 | Strong signals of future work, client proactively requesting proposals |
| 3 | Steady engagement, some mentions of future needs but nothing concrete |
| 2 | Limited growth signals, engagement is maintenance-mode |
| 1 | Declining or at-risk, no expansion signals, possible churn indicators |

Evidence sources: `scoring_signals.growth_potential`, intelligence mentions of Phase 2 / expansion / new projects, Scoro project pipeline, invoice growth trend.

**Strategic Fit (1-5)**

How well does this client's needs match what Nansen does?

| Score | Definition |
|-------|-----------|
| 5 | Client needs map to 4+ Nansen core capabilities, strong platform alignment |
| 4 | Good overlap on 3+ capabilities, some alignment gaps |
| 3 | Moderate fit, 2 capabilities aligned, some work outside Nansen's sweet spot |
| 2 | Limited fit, mostly project-based with no strategic depth |
| 1 | Poor fit, client needs don't match Nansen services |

Evidence sources: `scoring_signals.strategic_fit`, solutions-positioning docs, industry research, Scoro project types (what services are being delivered).

**Relationship Quality (1-5)**

How strong is the relationship with key stakeholders?

| Score | Definition |
|-------|-----------|
| 5 | Direct exec access, active advocacy/referrals, deep trust |
| 4 | Good senior access, positive tone, collaborative relationship |
| 3 | Functional relationship, primary contact engaged but limited exec access |
| 2 | Transactional, limited to project-level contacts |
| 1 | Strained, escalation signals, at-risk relationship |

Evidence sources: `scoring_signals.relationship_quality`, `growth_tracker_signals.relationship_indicators`, meeting transcript tone, participant seniority, Fathom call frequency.

**Engagement Level (1-5)**

How actively is the client engaging with Nansen?

| Score | Definition |
|-------|-----------|
| 5 | Weekly+ touchpoints, proactive requests, deep collaboration |
| 4 | Regular meetings (bi-weekly+), responsive, good feedback loops |
| 3 | Monthly contact, engages when prompted but not proactive |
| 2 | Sporadic contact, slow to respond, minimal collaboration |
| 1 | Disengaged, hard to reach, meetings cancelled frequently |

Evidence sources: `scoring_signals.engagement_level`, Scoro calendar frequency, intelligence file density (more recent files = more engagement), Slack activity patterns.

**Budget & Profitability (1-5)**

What is the budget health and profitability of this account?

| Score | Definition |
|-------|-----------|
| 5 | Large retainer ($20k+/month), healthy margins, growing spend, value-pricing |
| 4 | Solid retainer ($10-20k/month), good margins, stable or growing |
| 3 | Moderate engagement ($5-10k/month), reasonable margins |
| 2 | Small engagement (<$5k/month) or margin pressure, scope creep |
| 1 | Unprofitable, chronic over-servicing, payment issues |

Evidence sources: `scoring_signals.budget_profitability`, Scoro invoices (YTD revenue), budget-pulse data (if available), time entries vs budget, `growth_tracker_signals.revenue_signals`.

**Innovation Openness (1-5)**

How open is the client to new ideas, AI, and experimentation?

| Score | Definition |
|-------|-----------|
| 5 | Early adopter, actively requesting AI/innovation, funds experimentation |
| 4 | Open and curious, engages with new proposals, willing to pilot |
| 3 | Cautiously interested, needs proof points before committing |
| 2 | Conservative, prefers proven approaches, resistant to change |
| 1 | Actively opposed to innovation, rigid processes, no appetite for new |

Evidence sources: `scoring_signals.innovation_openness`, meeting transcript discussions about AI/experimentation, Opal agent adoption, platform upgrade decisions.

## Step 3 -- Calculate Tier

Sum the 6 scores (max 30):

| Total | Tier |
|-------|------|
| 24-30 | **A** -- Strategic priority accounts, maximum investment |
| 16-23 | **B** -- Growth accounts, targeted investment |
| Below 16 | **C** -- Maintenance accounts, efficient delivery |

## Step 4 -- Derive Growth Tracker Fields

From your scoring analysis, derive these Growth Tracker fields:

- **Overall Health**: Map to traffic light based on composite signals:
  - **Green**: No criteria below 3, average score 3.5+, no concerning health indicators
  - **Yellow**: One or two criteria at 2, or mixed health indicators, or data gaps
  - **Red**: Multiple criteria at 1-2, concerning health indicators, or declining trend
- **Relationship Score**: Use the Relationship Quality score directly (1-5)
- **Strategic Potential**: Derive from Growth Potential + Strategic Fit average:
  - Average 4.0+ = High
  - Average 2.5-3.9 = Medium
  - Average below 2.5 = Low
- **Expansion Opportunities**: Compile from `growth_tracker_signals.expansion_opportunities` across all intelligence files, plus any you identified during scoring. Be specific: name services, platforms, or project types.

## Step 5 -- Assess Confidence

For each criterion, rate your confidence:

- **High**: 5+ intelligence files spanning 3+ months, Scoro data available, recent meeting transcripts
- **Medium**: 2-4 intelligence files, some Scoro data, or data is more than 2 months old
- **Low**: 0-1 intelligence files, no Scoro data, or client is new/unfamiliar

If confidence is Low on 3+ criteria, flag the client as "Insufficient data to score reliably" and recommend what intelligence to gather next.

## Step 6 -- Present Results

### For a single client, present:

**Portfolio Scorecard Output:**

| Criterion | Score | Confidence | Key Evidence |
|-----------|-------|-----------|--------------|
| Growth Potential | X | High/Med/Low | 2-3 sentence evidence summary citing specific files |
| Strategic Fit | X | High/Med/Low | ... |
| Relationship Quality | X | High/Med/Low | ... |
| Engagement Level | X | High/Med/Low | ... |
| Budget & Profitability | X | High/Med/Low | ... |
| Innovation Openness | X | High/Med/Low | ... |
| **TOTAL** | **XX** | | **Tier: X** |

**Growth Tracker Output:**

| Field | Value | Source |
|-------|-------|--------|
| Tier | A/B/C | Derived from scorecard total |
| Overall Health | Green/Yellow/Red | [brief explanation] |
| Relationship Score | X | From Relationship Quality criterion |
| Strategic Potential | High/Med/Low | Growth Potential (X) + Strategic Fit (X) avg |
| Expansion Opportunities | [specific items] | From intelligence files |

**Data coverage:** X intelligence files from [date range], Scoro data [available/unavailable]

**Comparison to previous score:** If existing scores are in the Scorecard, note what changed and why.

### For multiple clients ("score all"), present:

A summary table first:

| Client | Total | Tier | Health | Confidence | Change |
|--------|-------|------|--------|-----------|--------|
| Client A | 27 | A | Green | High | +2 from last score |
| Client B | 19 | B | Yellow | Medium | New score |
| ... | ... | ... | ... | ... | ... |

Then offer to show the detailed breakdown for any client the user wants to drill into.

### For both outputs, format for easy transfer:

Since v1 uses manual transfer to Google Sheets, format the output so the user can copy-paste values directly. Use tab-separated values or clearly labeled fields that match the spreadsheet column order.

## Edge Cases

- **Client with no intelligence files**: Flag as "No intelligence available". Score as N/A rather than guessing. Recommend running a sync or creating intelligence from known sources.
- **Client with only old data (3+ months)**: Score with what's available but note "Data is stale, last intelligence from [date]" and downgrade confidence.
- **New client not in the sheets**: Create the row from scratch. All fields will be new, no comparison needed.
- **Disagreement with previous scores**: If your analysis suggests a significantly different score than what's currently in the sheet, call this out explicitly. Explain what evidence changed.
