# Conversational Patterns for Agent Studio

These patterns capture how experienced developers interact with Claude to build, iterate, and ship Opal agent specs. They've been extracted from production sessions and represent the workflow that produces the best results.

The core philosophy: Agent Studio is a conversation, not a code editor. You describe what you want, plan the approach, build iteratively, and validate at every step.

## Pattern 1: Start with Intent

Tell Claude what you need in plain English. Be specific about inputs, outputs, and the business context — but don't try to write the spec yourself. Let Claude translate your intent into the CLEAR framework.

**Examples that work well:**

> "I need an agent that takes a URL, scrapes the activity level page, and extracts the walking details into structured JSON."

> "Build an agent that reads a CSV of URLs and filters them by status. It should support running against only new items or all items."

> "I need a workflow that loops through a list of URLs, runs the scraper on each, and then writes the results to a CSV."

**Why this works:** You bring the domain knowledge (what the agent should do and why). Claude brings the Opal knowledge (which tools to use, how to structure the JSON, what inference_type to set). The conversation fills the gap between the two.

## Pattern 2: Plan Before Building

Before touching any JSON, ask Claude to generate a structured plan. This catches design issues early and creates a shared understanding of what's being built.

**Examples:**

> "Build a plan for this."

> "I need to make a new feature for the Activity Notes solution: have the audit skip previously processed entries. My thoughts are this should have the ability to run 'new' or 'all'. Build a plan for this."

> "Generate a plan for an onboarding flow for onboarding new developers."

**What a good plan includes:**
- Which agents need to change (with current → new version numbers)
- What specifically changes in each agent's prompt, parameters, or output
- Documentation updates required
- A validation checklist (what checks to run after implementation)
- Any open questions or decisions needed

**Why this works:** Plans are cheap. Fixing a design mistake after three agents have been built is expensive. A 5-minute plan saves 30 minutes of rework.

## Pattern 3: Iterative Refinement with Validation

After implementation, always validate programmatically. Don't eyeball JSON — run checks.

**Examples:**

> "Run the diff."

> "Validate everything."

> "Run the full validation checklist."

**What validation looks like:**
- JSON validity (can Python's `json.load` parse it?)
- Parameter/variable match (every `[[variable]]` in the prompt has a matching parameter entry)
- inference_type correctness (tool count matches inference mode)
- Export cleanliness (no `_nansen` block, all required fields present)
- Field count checks (if the agent produces structured output like CSV, verify column counts)
- Version bumps (did the version actually change?)
- Documentation sync (do the docs match the current agent state?)

**The pattern in practice:** After each implementation round, Claude runs 20-50 automated checks and reports pass/fail. This catches issues that are invisible to manual review — mismatched quotes, stale version numbers, missing fields.

## Pattern 4: Feature Requests with Context

When requesting a new feature or change, provide three things: what you want, your initial thinking on approach, and the trigger to plan.

**The formula:**

> "I need [feature description]. My thoughts are [your approach/preferences]. Build a plan for this."

**Examples:**

> "I need to add a program number column to the CSV output. The program number should be extracted from the URL. Build a plan for this."

> "The programs team says unfillable placeholders should be omitted from the summary instead of left as literal (X). Build a plan for this."

**Why this works:** Giving Claude your initial thinking provides direction without being prescriptive. The "build a plan" trigger ensures you get a reviewable plan before any code changes.

## Pattern 5: Deployment Awareness

After any implementation session, always ask what needs syncing to the live Opal instance.

**The prompt:**

> "Which agents do I need to update in Opal?"

**What you get back:** A clean list of agents with changed versions and their export file paths, ready for import.

**Why this matters:** It's easy to lose track of which agents changed during a multi-agent implementation session. This prompt gives you a deployment checklist.

## Pattern 6: Conversational Parameters

When an agent needs runtime configuration that varies per execution, pass it via the chat rather than hardcoding it.

**Example:**

> "This value should be passed into the agent via the chat."

**How it works in Opal:** Workflow agents can receive parameters through the chat interface. These values flow through the execution context to step agents. The workflow's `parameters_schema` stays empty — the runtime handles the plumbing.

**When to use this:** Mode switches ("new" vs "all"), file paths that change per run, configuration that operators should control without editing the agent spec.

## The Full Cycle

Putting it all together, a typical agent development session follows this loop:

```
1. Describe intent     → "I need an agent that..."
2. Plan                → "Build a plan for this"
3. Review plan         → Read, ask questions, approve
4. Build               → Claude creates/modifies agent JSON
5. Validate            → "Validate everything" → N/N checks pass
6. Export              → Run export-for-opal.py
7. Test in Opal        → Import, run, review output
8. Iterate             → "The output has [issue]. Fix it."
9. Re-validate         → Back to step 5
10. Deploy             → "Which agents do I need to update?"
```

Steps 4-9 repeat as many times as needed. The key insight is that this loop is fast — a round trip through steps 4-6 takes 2-3 minutes with programmatic JSON editing and automated validation. You can iterate 5 times in the time it would take to manually edit a JSON file once.
