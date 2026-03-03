---
name: weekly-update
description: >
  Generate weekly project status updates for Nansen's account planning meeting.
  Pulls budget data from Scoro, scans Slack and intelligence files for risks,
  client sentiment, and new business signals, then drafts a complete update per
  project in the exact format the team uses in the shared Google Doc.

  ALWAYS use this skill when the user says anything like: "weekly update",
  "account planning", "project updates", "prepare for the weekly meeting",
  "update the weekly doc", "status updates", "weekly status", "account review",
  "prep the planning meeting", "what's the status of my projects", or any
  variation asking about preparing project-level status updates for the team
  meeting. Also trigger when the user mentions the Weekly Project/Account
  Planning Meeting document or asks to update it.
allowed-tools:
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_me
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_projects
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_tasks
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_time_entries
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_users
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__search
  - mcp__baa1975a-f730-42ae-b498-0b8bac69b8e2__slack_search_public
  - mcp__baa1975a-f730-42ae-b498-0b8bac69b8e2__slack_search_channels
  - mcp__baa1975a-f730-42ae-b498-0b8bac69b8e2__slack_read_channel
  - mcp__c1fc4002-5f49-5f9d-a4e5-93c4ef5d6a75__google_drive_fetch
  - mcp__c1fc4002-5f49-5f9d-a4e5-93c4ef5d6a75__google_drive_search
---

# Weekly Update - Account Planning Meeting Prep

You are generating weekly project status updates for Nansen (nansen.com), a digital
agency. The team meets weekly to review every active project across four dimensions:
budget health, risks, client temperature, and new business opportunities. The output
goes into a shared Google Doc that the whole leadership team reads.

This skill works for any PM or client director on the team. The user might be preparing
updates for their own projects, or pulling updates for the whole meeting.

## The Google Doc

The weekly updates live in this document:
**https://docs.google.com/document/d/1IQjrVHmTL1yHFmKPsH2iXCH_39CuqK511QNBTSWKIyM/**

Each week gets a new section at the top, headed with "Week of [date]". The previous
week's entries are critical context because risks and opportunities carry forward -
the team expects to see "UPDATE:" prefixes when something has changed from last week,
and "NEW:" when something is being raised for the first time.

At the bottom of the doc there's a **Client/Project Assignments** section that maps
projects to PMs/EMs. Use this to determine which projects belong to which person.

## Output Format

The output must match the exact format the team uses. Here's the template for one project:

```
Project: [Project Name]
PM/EM: [Name]

* Budget  [emoji]
   * Hours spent: [X] hours
   * Hours remaining: [Y] hours
* Risks [emoji]
   * [Risk description]
* Client Temperature [emoji]
   * [Temperature description]
* New Biz Opportunities
   * [Opportunity description]
```

Emoji legend - use these to give a quick visual read:
- Green circle = healthy, no concerns
- Yellow circle = some concerns, watch this
- Red circle = needs attention, action required

The emoji should reflect the overall sentiment for that section, not just whether a
value exists. For example, a budget can be green even with only 8 hours remaining if
the month is almost over and spending has been on pace.

Important formatting details (these matter because the doc is read by busy people
who skim quickly):
- Budget type context is helpful when known (Monthly, Yearly, Fixed, Project)
- Risks should distinguish NEW vs OLD/UPDATE when carrying forward from last week
- Client Temperature should be specific and actionable, not just "Good"
- New Biz can include links (roadmaps, POCs, proposals) when available
- The New Biz emoji is optional - some entries have it, some don't

## Steps to Execute

### Step 1: Determine Scope

Figure out which projects to generate updates for based on what the user asks:

- **"weekly update"** or **"prep the meeting"** -> the user's own projects (default)
- **"weekly update for Jarrett"** -> a specific PM's projects
- **"weekly update all"** -> every active project for the whole meeting

If the user says a specific project name, just do that one project.

### Step 2: Get Previous Week's Entries

Fetch the Google Doc to read the most recent week's entries. Use `google_drive_fetch`
with document ID `1IQjrVHmTL1yHFmKPsH2iXCH_39CuqK511QNBTSWKIyM`.

Parse out:
1. The most recent week's section (everything under the latest "Week of..." heading)
2. The Client/Project Assignments list at the bottom
3. For each project in scope, extract last week's risks, client temp, and new biz text

This is essential context. The team expects continuity from week to week. A risk that
was flagged last week shouldn't just disappear - it should either be updated or
explicitly marked as resolved.

### Step 3: Get Budget Data from Scoro

This follows the same pattern as the budget-pulse skill. Nansen uses Scoro where:
- Each retainer project has monthly tasks named after the month ("March", "April", etc.)
- `durationPlanned` on the monthly task = the budget in seconds (divide by 3600 for hours)
- Time entries logged against the task = hours spent
- Hours remaining = planned minus actual

Steps:
1. Use `get_me` to identify the current user
2. Use `get_projects` to get active projects (status "inprogress"). If scoping to a
   specific PM, filter by `managerIds`. Use `includeBudget: true`.
3. Use `get_tasks` filtered by `projectIds` and `name` matching the current month name
   to find the monthly budget tasks
4. Use `get_time_entries` filtered by `taskIds` (the monthly tasks) to get actual hours
5. Calculate hours spent (sum of time entry durations / 3600) and hours remaining

For the budget emoji, use this logic:
- Calculate pace: (% budget used) vs (% of month elapsed)
- Within 10% of expected pace -> green
- Spending faster than expected by >10% -> yellow or red depending on severity
- Significantly under pace -> yellow (could indicate stalled work)
- Very low hours remaining regardless of pace -> flag it

All Scoro durations are in seconds. Always divide by 3600 for hours. Round to nearest
whole number for the update (the team doesn't need decimal precision here).

### Step 4: Scan for Risk Signals

For each project, gather risk context from multiple sources:

**Previous week's risks** (from Step 2):
- Start here. Most risks carry forward. Flag each as OLD and note any updates.

**Slack signals** (last 7 days):
- Search Slack for the project/client name using `slack_search_public`
- Look for messages mentioning: blockers, delays, bugs, issues, concerns, scope creep,
  go-live problems, staffing changes, deadline pressure
- Also search for the client name to catch signals in non-project channels

**Intelligence files** (if available):
- Check the intelligence index at `nansen-working-folder/nansen/intelligence/_index.json`
  for recent files mentioning the client
- Recent meeting transcripts and standups often surface risks that haven't made it
  to Slack yet

When drafting risks, categorize as:
- **NEW:** Something flagged for the first time this week
- **OLD:** Carried from last week, no change
- **UPDATE:** Carried from last week with new information

If no significant risks are found, still include the section but keep it brief
(e.g., "No new risks this week").

### Step 5: Assess Client Temperature

Client temperature is about how the relationship feels right now. Sources:

**Previous week's temperature** (from Step 2):
- Use as a baseline. Temperature rarely swings dramatically week to week.

**Slack signals:**
- Look for recent client communications, feedback, complaints, praise
- Check for sentiment in internal discussions about the client
- Look for relationship signals: are meetings happening? Is the client responsive?
  Are they asking for more work (good) or going quiet (concerning)?

**Intelligence context:**
- Recent meeting notes can reveal how calls went
- Look for relationship-relevant signals: champion changes, budget discussions,
  competitor mentions

Draft a one or two line assessment. Good examples from the actual doc:
- "Assisting with FY 27 Budget" (green - proactive engagement)
- "HW disappointed that Christian/Erin forgot to email them" (yellow - minor friction)
- "Need to form better relationship with Haz" (yellow - relationship risk)
- "Client continues to lean on us heavily for urgent bugs" (could be green or yellow
  depending on context)

### Step 6: Identify New Business Opportunities

Look for expansion, upsell, and new project signals:

**Previous week's opportunities** (from Step 2):
- Carry forward active opportunities with any updates

**Slack signals:**
- Mentions of proposals, estimates, pitches, new budgets, RFPs, SOWs
- Client asking about new capabilities or additional work
- Internal discussions about growth potential

**Intelligence context:**
- Account scorer data if available (expansion opportunities field)
- Solutions positioning output (what services we could sell)

Include links when available - roadmaps, POCs, proposals. The team finds these useful
for context.

### Step 7: Compose the Draft

For each project, assemble the four sections into the exact format. A few guidelines
for tone and style:

- Write like a PM talking to peers, not a formal report. Keep it conversational
  but specific.
- Be direct about problems. The team values honesty over optimism.
- Include enough context that someone not on the project can follow along.
- When something changed from last week, make the change obvious.
- Don't pad with filler. If client temp is genuinely good and there's nothing
  notable to say, "Good" is fine.

### Step 8: Present for Review

Output the complete draft as formatted text that the user can paste into the Google Doc.
Present it with a brief summary of what you found:

- Which projects had budget concerns
- Any new risks you flagged
- Opportunities worth highlighting

Make it clear this is a draft - the user should review and adjust the qualitative
sections (risks, temperature, new biz) before pasting into the doc. The budget numbers
are from Scoro and should be accurate, but the narrative sections are your best
interpretation of the signals and the user knows their projects better than you do.

## Important Notes

- The document gets a new "Week of [date]" section each week, added at the top.
  Don't overwrite previous weeks.
- Some projects have budget types other than monthly retainer (yearly, fixed, project).
  The Scoro data model is the same but the context for the budget emoji is different -
  a fixed-price project at 93% spent is very different from a monthly retainer at 93%.
- When you can't find data for a section, say so honestly rather than guessing.
  "No Slack activity found in the last 7 days" is more useful than making something up.
- The Client/Project Assignments section at the bottom of the doc is the source of
  truth for who owns what. Scoro's project manager field may not always match.
- Some projects have both a PM and an EM (engagement manager). Include both when known.
