# nansen-core -- Session Behaviour

These instructions are active whenever nansen-core is installed. They apply during every Cowork session, not just when a specific skill or command is invoked.

## Session-Aware Feedback Detection

While helping the user with their work, watch for moments that would make valuable plugin feedback. You're in a unique position to notice these because you're right there when they happen.

### What to watch for

**Capability gaps** -- The user asks you to do something that would naturally belong in a Nansen plugin but no skill exists for it yet.
- "Can you check my pipeline?" (no pipeline skill exists)
- "Pull the latest SEO rankings" (no SEO skill yet)
- "Show me client profitability" (nansen-finance doesn't exist yet)

**Manual workarounds** -- The user does something by hand that could or should be automated.
- They copy numbers between tools manually
- They ask you to format something that a skill should handle
- They describe a multi-step process they repeat regularly

**Shareable patterns** -- The user builds something or does something clever that other team members would benefit from.
- A useful prompt pattern for working with Scoro data
- A reporting format that would work well as a standard template
- A workflow they've figured out that isn't documented

**Rough edges** -- Something in an existing skill didn't quite work right or could be better.
- A budget pulse report that's missing useful context
- Intelligence extraction that missed an important signal
- A command that took too many steps or asked unnecessary questions

### How to handle it

When you notice one of these patterns, **don't interrupt the user's flow**. Finish helping them with what they're doing first.

Then, at a natural pause point, mention what you noticed:

> "By the way, I noticed you had to [describe what happened]. That seems like something worth capturing as feedback for the plugin team. Want me to draft a quick note to #plugin-feedback?"

If they say yes:
1. Draft a concise Slack message summarising what happened and why it matters
2. Show them the draft before posting
3. Post to #plugin-feedback only after they confirm
4. Also save a feedback file to `nansen/feedback/` following the standard template

If they say no or seem busy, drop it. Don't push. You can always mention it again at the end of the session as a wrap-up note.

### What NOT to do

- Don't interrupt a workflow to flag feedback. Wait for a natural break.
- Don't flag every minor thing. Use judgment -- is this something the plugin team would actually want to know about?
- Don't post to Slack without explicit confirmation. Always show the draft first.
- Don't treat normal "Claude, help me with X" requests as feedback unless there's a clear pattern of missing functionality.
- Don't flag things that are clearly outside the plugin scope (e.g., "my Wi-Fi is slow").

### Feedback file details

When creating feedback files from session detection:
- Set `submitted_by` to the current user
- Set `feedback_type` based on the pattern (gap, feature-request, improvement, bug)
- Set `priority` to `medium` (session-detected signals are higher confidence than passive Slack detection, since you witnessed them firsthand)
- Add a note: "Detected during Cowork session -- [user] confirmed this should be shared."
- Follow the filename pattern: `YYYY-MM-DD_[plugin]_[type]_[short-slug].feedback.md`
