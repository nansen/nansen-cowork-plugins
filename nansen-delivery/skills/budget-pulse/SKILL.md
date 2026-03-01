---
name: budget-pulse
description: >
  Monthly retainer budget health check for Nansen projects using Scoro data.
  Shows budget pace (hot/cool/on-track), per-person hour breakdowns with
  individual allocation comparisons, and weekly activity summaries. Can post
  results to the #budget-pulse Slack channel.

  ALWAYS use this skill when the user says anything like: "budget pulse",
  "budget check", "how are my projects doing", "project budgets",
  "retainer status", "are we on track", "budget health", "show me the burn",
  "how's the spend", or any variation asking about project budget tracking,
  spend pace, or retainer utilization. Also trigger when the user asks about
  a specific project's hours, burn rate, or team utilization for the current month.
allowed-tools:
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_me
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_projects
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_tasks
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_time_entries
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_users
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__search
  - mcp__baa1975a-f730-42ae-b498-0b8bac69b8e2__slack_search_channels
  - mcp__baa1975a-f730-42ae-b498-0b8bac69b8e2__slack_send_message
---

# Budget Pulse - Monthly Retainer Budget Health Check

You are generating a budget health report for a team member at Nansen (nansen.com),
a digital agency. This skill works for anyone with Scoro access: client directors,
project managers, or team leads.

## What This Skill Does

Budget Pulse pulls project and time entry data from Scoro, calculates monthly retainer
burn rates, and presents a health dashboard showing which projects are running hot, cool,
or on track -- plus per-person breakdowns and weekly activity summaries. It can optionally
post the report to the #budget-pulse Slack channel.

## Modes

Budget Pulse supports three modes based on what the user asks for:

1. **My Projects (default):** "budget pulse" or "how are my projects doing"
   - Shows all active retainer projects where the user is the project manager
   - This is the default when no project is specified

2. **Specific Project:** "budget pulse for Teledyne" or "how's the Symetra budget"
   - Looks up the project by name using `search` or `get_projects` with name filter
   - Shows that single project regardless of who manages it
   - Useful for checking on a project you're involved in but don't manage

3. **All Projects:** "budget pulse all" or "show me all project budgets"
   - Shows every active retainer project across the agency
   - Useful for leadership check-ins or org-wide visibility

Determine the mode from the user's request. If ambiguous, default to "My Projects".

## Data Model

Nansen uses Scoro with this structure for retainer projects. Understanding this is
important because the monthly budget isn't stored as a simple field -- it's derived
from how tasks are organized:

- Each retainer project has monthly tasks named after the month ("January", "February", etc.)
- Each monthly task has a `durationPlanned` field = the monthly retainer hours budget
- Each monthly task has a `durationBillable` field = the monthly retainer billable budget
- Time entries are logged against these monthly tasks
- Some monthly tasks have per-person `allocatedDuration` on the assignees array
- When `allocatedDuration` is 0, the budget is pool-based (shared across the whole team)

This means to find "how much budget is left this month", you need to find the task
named after the current month, then compare its `durationPlanned` against the sum
of time entries logged against it.

## Steps to Execute

### Step 1: Identify the User

Use the Scoro `get_me` tool to get the authenticated user's ID, name, and timezone.
Note their userId -- you will use it to filter projects in "My Projects" mode.

### Step 2: Get Projects

Depending on the mode:

**My Projects (default):**
Use `get_projects` with filter `managerId` set to the user's ID. Filter for active
projects only (status "inprogress"). Include budget info with `includeBudget: true`.

**Specific Project:**
Use `search` with `search_type: "projects"` and the project name as the query.
Then use `get_projects` with the matched project ID(s). Include budget info.

**All Projects:**
Use `get_projects` filtered for active projects (status "inprogress") with no
managerId filter. Include budget info with `includeBudget: true`. Paginate if
needed (perPage: 100).

### Step 3: For Each Project, Get the Current Month's Task

Determine the current month name (e.g., "February"). Use `get_tasks` filtered by
`projectIds` for all active projects at once, and filter by `name` matching the
current month name. This is more efficient than querying per-project.

From each matching task, extract:
- `durationPlanned` -- total monthly budget in seconds (divide by 3600 for hours)
- `durationActual` -- total hours spent so far this month
- `durationBillable` -- billable budget for the month
- `assignees` -- list of team members and their `allocatedDuration` (if > 0)

### Step 4: Get Time Entries for the Current Month

Use `get_time_entries` filtered by:
- `taskIds`: the current month's task IDs (you can batch all monthly task IDs together)

This gives you all time logged against this month's retainers across all projects.

Group time entries by:
- **userId** -- to calculate per-person hours
- **Week** -- to build the weekly activity summary (use Monday as week start)

For each time entry, capture:
- `userId`
- `duration` (in seconds, divide by 3600 for hours)
- `billableDuration`
- `description` -- what they worked on
- `title` -- the activity type name
- `timeEntryDate` -- to assign to the correct week

Note: The `durationActual` on the task may lag behind the sum of individual time
entries. When there's a discrepancy, use the sum of time entries as the more
accurate number.

### Step 5: Resolve User Names

Collect all unique userIds from time entries and task assignees. Use `get_users`
with `ids` filter to get first/last names for display. Do this in a single call
to be efficient.

### Step 6: Calculate Budget Health

**Project-level health:**
1. Calculate `pctMonthElapsed` = (current day of month) / (total days in month)
2. Calculate `pctBudgetUsed` = actual hours / planned hours
3. Calculate `paceRatio` = pctBudgetUsed / pctMonthElapsed
4. Apply thresholds (+/-10%):
   - paceRatio > 1.10 -> RED "Running hot"
   - paceRatio < 0.90 -> YELLOW "Running cool"
   - Otherwise -> GREEN "On track"

The +/-10% threshold was chosen to be tight enough to catch issues early without
generating too much noise. The idea is that a client director can glance at
the status indicators and immediately know which projects need attention.

**Person-level health (when allocatedDuration > 0):**
1. Calculate person's actual hours from their time entries
2. Calculate person's expected hours = (allocatedDuration / 3600) * pctMonthElapsed
3. Apply same +/-10% threshold logic
4. If allocatedDuration is 0 (pool-based), show actual hours without a pace indicator
   -- just note what they worked on

### Step 7: Present the Report

Start with a context line that adapts to the user and mode:

- **My Projects:** "You're managing [N] active retainers. Here's where they stand for [Month]."
- **Specific Project:** "Here's the [Month] budget status for [Project Name]."
- **All Projects:** "[N] active retainers across the agency for [Month]."

Then for EACH project, format the output as follows:

```
## [Project Name] - [Client Name]
[STATUS EMOJI] [Status Text] | Budget: [X]h of [Y]h ([Z]%) | Month [N]% elapsed

### Team Breakdown
| Person | Allocated | Actual | Pace | Status |
|--------|-----------|--------|------|--------|
| ...    | ...       | ...    | ...  | ...    |
```

**Detailed view (default for 3 or fewer projects, or when user asks for detail):**
Also include the weekly activity breakdown:

```
### This Week's Activity (Mon [date] - Sun [date])
**[Person Name]** - [X]h
  - [description from time entries, grouped/summarized]
```

**Summary view (default for 4+ projects, or when user asks for summary):**
Skip the weekly activity section. Just show the project status and team breakdown table.

The user can override either way: "budget pulse detailed" or "budget pulse summary".

Status emojis:
- GREEN on track: use checkmark
- YELLOW running cool: use warning
- RED running hot: use fire/alert

For projects that have no matching monthly task, list them at the bottom as
"[N] projects without a [Month] task (skipped): [names]".

### Step 8: Summary Line

After all projects, add a quick summary:
```
---
Budget Pulse: [N] projects checked | [X] on track | [Y] running cool | [Z] running hot
```

### Step 9: Offer to Post to Slack

After presenting the report in chat, ask the user:
"Would you like me to post this to #budget-pulse in Slack?"

If the user confirms:
1. Search for the #budget-pulse channel using the Slack `slack_search_channels` tool
   with query "budget-pulse"
2. Get the channel_id from the search results
3. Format the report for Slack using Slack markdown (mrkdwn):
   - Use *bold* (single asterisks) instead of **bold** (double asterisks)
   - Use `code` for numbers where helpful
   - Keep tables as-is (Slack renders simple pipe tables in messages)
   - Include the date in the header: "Budget Pulse - [Month] [Day], [Year]"
4. Post the formatted report using `slack_send_message` with the channel_id
5. Confirm to the user that it was posted with a link

If the channel is not found, tell the user they need to create #budget-pulse first.

## Important Notes

- All durations from Scoro are in SECONDS. Always divide by 3600 to convert to hours.
- Round hours to 1 decimal place for display.
- The monthly task name MUST match the current calendar month (e.g., "February").
  If no matching task is found, note it as "No monthly task found" and skip.
- For the weekly breakdown, use the current ISO week (Monday-Sunday).
- When time entry descriptions reference ticket numbers (e.g., "tel-81", "TEL-133"),
  include them as-is -- they provide useful context.
- If a project has no time entries for the current month yet, still show it with
  0h spent and flag appropriately based on how far into the month we are.
- This report is for the CURRENT month only. Historical months are out of scope.
- Efficiency tip: batch Scoro API calls where possible -- get all project tasks in
  one call, all time entries in one call, all users in one call.
