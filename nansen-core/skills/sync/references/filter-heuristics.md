# Intelligence Sync - Filter Heuristics

This document defines the filtering rules used by the sync skill to separate signal from noise when pulling content from Slack and Fathom. The goal is aggressive noise removal so that the intelligence/ folder stays focused and high-quality.

## Slack Message Filtering

Slack is the noisiest source. Messages go through three stages before they reach the intelligence extraction pipeline.

### Stage 1 - Noise Removal

Remove messages that are obviously not intelligence-bearing. These never become source files.

Skip the message if ANY of these are true:
- Message body is only emoji (no alphabetic characters)
- Message body is fewer than 3 words (after stripping mentions and URLs)
- Message is from a bot user (check the `user_type` or bot indicator in Slack response)
- Message is a channel join/leave/topic-change system message
- Message body is a bare URL with no commentary (a link posted without explanation)
- Message is a Slack workflow or app notification (e.g., Polly polls, Standup bot prompts)

### Stage 2 - Thread Grouping

After noise removal, group remaining messages into logical conversations:

- **Threaded messages**: Messages sharing the same `thread_ts` belong together. Pull the full thread via `slack_read_thread`. The thread becomes one source unit.
- **Standalone messages**: Messages with no thread replies. Group these by channel and date. If multiple standalone messages in the same channel within a 30-minute window share a common topic, group them.

Each thread or standalone group becomes a candidate source file.

### Stage 3 - Signal Classification

For each thread/group, scan the full text and classify signal strength.

**HIGH signal** - Run full market-research extraction:
- Contains explicit decisions ("we decided", "the decision is", "agreed to", "going with")
- Contains action items ("action item", "TODO", "I'll handle", "can you", "@person please")
- References a client by name and discusses their business/project
- Contains budget/pricing/scope discussion (dollar amounts, "budget", "scope", "pricing", "proposal")
- Contains competitive intelligence ("competitor", "they're doing", "market share", comparison language)
- Contains strategic direction ("roadmap", "strategy", "Q1/Q2/Q3/Q4", "next quarter", "this year")
- References specific metrics or KPIs with numbers

**MEDIUM signal** - Run extraction with note about limited depth:
- Status updates that include new context or blockers (not just "all good")
- Client feedback being relayed ("client said", "they mentioned", "feedback from")
- Asks a substantive question that reveals a gap or need
- References a project milestone or deliverable with new information
- Contains a link to a shared document with contextual discussion

**LOW signal** - Save as archived source, do NOT extract:
- Standup/status updates with no new context ("working on X, no blockers")
- FYI-only messages with no discussion ("FYI - meeting moved to 3pm")
- Social/casual conversation in work channels
- Short acknowledgments ("thanks", "sounds good", "got it", "+1")
- Thread replies that are purely reactive (agreements, emoji-like responses with words)

**NO signal** - Do not save at all:
- Messages that were caught by Stage 1 but somehow made it through (safety net)
- Duplicate content (same thread already processed in this sync run)
- Messages in channels the user explicitly excluded

### Keyword Reference Lists

These lists support the signal classification. They're not exhaustive; use judgment alongside them.

**Decision language**: decided, decision, agreed, approved, go with, confirmed, signed off, greenlit, vetoed, rejected, postponed, escalated

**Action language**: action item, TODO, follow up, I'll handle, can you, please, by Friday, deadline, due date, assigned to, owner, responsible

**Business language**: budget, pricing, scope, proposal, contract, SOW, retainer, invoice, revenue, pipeline, forecast, margin, cost, quote

**Strategy language**: roadmap, strategy, OKR, KPI, quarterly, annual, initiative, priority, goal, milestone, phase, sprint, backlog

**Competitive language**: competitor, competition, market share, benchmark, alternative, they're doing, compared to, switching from, evaluated

## Fathom Meeting Filtering

Fathom meetings are higher-signal by default (someone scheduled a meeting), so filtering is lighter.

### Skip Conditions

Skip the meeting entirely if:
- Duration is less than 5 minutes AND no transcript content exists (likely a no-show or test call)
- Meeting title matches a skip pattern: "test call", "audio check", "tech check"
- Meeting status is "cancelled" or "declined" (if the API provides this)

### Signal Classification for Meetings

**HIGH signal** - Full extraction:
- Meeting has "client" or a known client name in the title or participants
- Meeting title suggests substance: "planning", "review", "strategy", "kickoff", "pitch", "demo", "workshop"
- Meeting has 3+ participants (multi-stakeholder discussions tend to be richer)
- Meeting duration is 30+ minutes

**MEDIUM signal** - Extract with lighter touch:
- Internal team meetings ("team sync", "weekly", "all-hands")
- 1:1 meetings with substantive content (check transcript length > 500 words)
- Meetings with external participants not matching known clients

**LOW signal** - Save transcript as source, skip extraction:
- Very short meetings (5-15 minutes) with minimal transcript
- Social or casual meetings ("coffee chat", "catch up", "happy hour")
- 1:1 meetings with very short transcripts (< 200 words)

## Tuning Parameters

These values can be adjusted based on experience:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `min_message_words` | 3 | Minimum words for a Slack message to pass Stage 1 |
| `min_meeting_duration_minutes` | 5 | Minimum meeting length to consider |
| `min_transcript_words_for_extraction` | 200 | Below this, meetings are LOW signal |
| `thread_grouping_window_minutes` | 30 | Window for grouping standalone messages |
| `lookback_days_initial` | 7 | Days of history for initial pull |
| `lookback_hours_daily` | 26 | Hours of lookback for daily sync (26h for timezone overlap) |

## Common False Positives

Watch for these patterns that look like signal but aren't:

- **Automated standup bots**: Messages that contain action language but are just form responses ("Working on: X. Blockers: none.")
- **CI/CD notifications**: Contain project names and technical language but are automated
- **Calendar/scheduling threads**: "Does 3pm work?" contains question marks but no intelligence
- **Forwarded marketing emails**: May contain business language but are inbound spam shared in a channel
- **Emoji reactions on messages**: The reaction may seem like engagement but the underlying message might be low-signal
