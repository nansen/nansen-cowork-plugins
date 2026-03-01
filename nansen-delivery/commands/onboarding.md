---
description: Quick walkthrough of Budget Pulse for project managers and client directors
allowed-tools:
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_me
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_projects
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_tasks
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_time_entries
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__get_users
  - mcp__4cb04c56-dc02-4688-8928-71c00b4d73dd__search
  - mcp__baa1975a-f730-42ae-b498-0b8bac69b8e2__slack_search_channels
---

Guide the user through understanding and using Budget Pulse. This is a hands-on tour, not a technical setup -- there's nothing to configure. The goal is for them to see a real report on one of their projects and feel confident using it on their own.

Be warm, conversational, and encouraging. Use plain language. Keep it moving -- the whole thing should take under 10 minutes.

## Prerequisites

Before starting, verify Scoro is connected by calling `get_me`. If the call fails, tell the user:
"Looks like Scoro isn't connected yet. You'll need to have the Scoro connector enabled in your Cowork settings. If you've already run nansen-core's /setup, it should be good to go -- if not, run that first."

If `get_me` succeeds, note their name and userId. You'll need this.

---

## Part 1 -- Welcome (1 minute)

Start with a quick intro. Adapt based on who the user is:

"Hey [name]! I'm going to give you a quick tour of Budget Pulse -- it's a tool that shows you how your retainer projects are tracking against budget for the month. Takes about 5 minutes, and you'll see real data from your actual projects. Let's jump in."

Wait for acknowledgment before continuing.

## Part 2 -- Live Demo on One Project (5 minutes)

This is the core of the onboarding. Run a real budget pulse on one of their projects so they can see what it looks like.

**Step 1:** Get their active projects using `get_projects` with `managerId` set to their userId, status "inprogress", `includeBudget: true`.

If they have projects, pick the one that's most likely to have time entries this month (look for ones with recent activity or higher budgets). Say:

"You've got [N] active retainer projects. Let me pull the budget health for [Project Name] so you can see what the report looks like."

If they have NO managed projects, try getting all active projects and pick one they might recognise:

"I don't see any projects where you're listed as the manager in Scoro. No worries -- let me pull up [Project Name] so you can see how it works. You can check any project by name, even ones you don't manage."

**Step 2:** Run the budget pulse logic for that single project:
1. Get the current month's task (task named after the month)
2. Get time entries for that task
3. Resolve user names
4. Calculate budget health (pace ratio, status)
5. Present the report in the standard format

After showing the report, walk them through it:

"So here's what you're looking at:
- The status at the top tells you at a glance whether the project is on track, running hot, or running cool
- Budget line shows hours used vs the monthly allocation, and how far through the month we are
- The team breakdown shows who's been working on it and how their hours compare to their allocation
- And the weekly activity section shows what people actually worked on this week"

Pause and let them react. Answer any questions.

## Part 3 -- The Three Modes (2 minutes)

Now explain the different ways they can use it:

"There are three ways to use Budget Pulse:

**Just say 'budget pulse'** -- and you'll get a report on all the projects you manage. That's the one you'll probably use most.

**Name a specific project** -- like 'budget pulse for Teledyne' -- and you'll get just that one project, even if you're not the manager. Useful when you want to check on something specific.

**Say 'budget pulse all'** -- and you'll see every active retainer across the agency. Good for leadership check-ins or when you want the full picture."

If they're a client director (managing 4+ projects), mention:

"Since you've got quite a few projects, the default view will show you a summary for each one -- status and team breakdown without all the weekly detail. If you want the full detail on any project, just ask for it by name."

## Part 4 -- Slack Integration (1 minute)

"One more thing -- after any budget pulse report, I'll ask if you want to post it to #budget-pulse in Slack. That way the whole team can see it. It's optional, totally up to you each time."

Check if #budget-pulse exists by searching Slack. If it doesn't:

"Looks like the #budget-pulse channel doesn't exist yet in Slack. Someone will need to create it if you want to use that feature. Not a big deal -- the report works fine without it."

## Part 5 -- Wrap Up (1 minute)

"That's it! You're all set. Quick recap of what you can say:

- 'budget pulse' -- your projects
- 'budget pulse for [project name]' -- specific project
- 'budget pulse all' -- everything
- 'budget pulse summary' or 'budget pulse detailed' -- control how much detail you see

Any questions? Or want me to run a full budget pulse across all your projects right now?"

Let them decide what to do next. If they want the full run, go ahead and execute it.
