---
name: new-agent
description: >
  Client briefing to agent spec pipeline for Nansen Agent Studio. Takes raw
  requirements from a client briefing (meeting notes, Fathom transcript, Slack
  thread, or conversational description) and turns them into a structured
  requirements document and ready-to-import Opal agent specs. ALWAYS use this
  skill when the user says: "new agent", "build an agent for [client]",
  "agent for [client]", "client wants an agent", "here are the requirements",
  "briefing notes", "agent intake", "scope an agent", "spec an agent",
  "new pipeline for [client]", "new solution for [client]", "client meeting notes",
  "build a pipeline", or any variation about taking client requirements and turning
  them into Opal agents. Also trigger when the user pastes meeting notes or a
  Fathom transcript and wants agents built from them.
version: 0.1.0
---
# /new-agent — Client Briefing → Agent Spec Pipeline
Turn a client briefing into production-ready Opal agent specs through a structured four-stage intake process. This skill bridges the gap between client language ("we want to check if our product descriptions match the website") and Opal implementation ("scraper agent + comparison agent + CSV writer + workflow, inference_type standard for the writer").
## Before Starting
1. Read the `opal-agent-builder` skill to establish full Agent Studio context - you'll need it for Stage 4
2. Read the requirements doc template from `templates/requirements-doc-template.md` in this skill directory - this is the structure you'll produce in Stage 3
## The Four Stages
### Stage 1 - Intake: Capture What the Client Wants
The user will provide requirements in one of these forms:
- **Meeting notes / Fathom transcript** - Messy, conversational, full of tangents. Your job is to extract signal from noise.
- **Slack thread** - Usually more focused but may lack context.
- **Freeform description** - Arnold or another developer describing what the client needs.
- **Conversational** - The user describes the need interactively.
Whatever the format, extract the **four core elements**:
| Element | What to look for | Example |
|---------|-----------------|---------|
| **Purpose** | What problem does the agent solve? What does the client currently do manually? | "We manually check 400+ trip pages to see if activity notes are filled in" |
| **Scope** | What content/pages/data does it cover? What's explicitly out of scope? | "All trip URLs from the sitemap, except online lectures" |
| **Inputs** | What data does the client provide? Sources? | "A CSV of URLs in CMP, plus the live sitemap" |
| **Outputs** | What deliverable does the client expect? Format? Destination? | "A CSV report in CMP with audit results, updated daily" |
**Present your extraction back to the user** in a clean summary before moving to Stage 2. Don't assume - if something is ambiguous, flag it. Example:
> Here's what I've extracted from the briefing:
>
> **Purpose:** Automate the activity notes audit that the programs team currently does manually across 400+ trip pages.
>
> **Scope:** All trip URLs from the Road Scholar sitemap. Online lectures excluded. New URLs detected automatically via sitemap diff.
>
> **Inputs:** Existing inventory CSV in CMP + live sitemap.
>
> **Outputs:** Audit CSV in CMP with per-page activity notes summary and analysis.
>
> Before I ask clarifying questions, does this capture the intent correctly?
### Stage 2 - Clarifying Questions: Fill the Gaps
Based on the extracted requirements AND your knowledge of Opal's constraints, ask targeted questions. These are developer questions - things you need answered to make design decisions - not general discovery questions.
**Always consider these Opal-specific design constraints when forming questions:**
- **Scale:** How many items? If 100+, data can't pass through LLM output as JSON - need direct file writes or batching.
- **Inference type:** How many tools will each agent need? This determines `simple` vs `standard` vs `advanced`.
- **Data flow:** Does data need to pass between agents? If so, what's the shape and size?
- **Scheduling:** On-demand, daily, weekly? Affects trigger configuration.
- **Idempotency:** Does the output overwrite or append? Date-stamped filenames or fixed?
- **Error handling:** What happens when a page is down, a tool times out, or data is malformed?
- **CMP write pattern:** If output goes to CMP, it needs the two-tool write pattern (`write_content_to_file` -> `write_file_to_library`), which forces `inference_type: "standard"` or higher.
**Example questions (adapt to the specific case):**
- "You mentioned a CSV of URLs as input - is this already in CMP, or will the client upload it fresh each run?"
- "The output should be a summary CSV. Does it overwrite each run or append? Does the client need a date-stamped filename?"
- "Are there pages that should be skipped? (e.g., online lectures, archived programs, draft pages)"
- "How often should this run - on demand, daily, weekly?"
- "How many items are we talking about? 10s, 100s, 1000s? (This affects the architecture significantly.)"
- "Does the client have an existing CMP folder structure we should write into, or do we create one?"
- "Are there any existing Opal agents or tools we should integrate with?"
**Ask questions in batches of 3-5.** Don't overwhelm with 15 questions at once. Prioritize the questions that are most likely to change the architecture.
**If the user says "I don't know" or "we haven't discussed that yet":** Record it as an assumption or open question in the requirements doc. Don't block progress.
### Stage 3 - Requirements Document: The Approval Artifact
Once the core questions are answered (or recorded as assumptions), produce a structured requirements document.
**Use the template** from `templates/requirements-doc-template.md` in this skill directory. Read it now if you haven't already.
**Save the document** to `clients/<client-slug>/plans/<solution-name>-requirements.md` in the opal-agents repo.
Key principles for the requirements doc:
- **Trace every design decision to a requirement.** If the architecture uses 3 agents, explain why - don't just list them.
- **Be explicit about scale constraints.** If the dataset is 400+ rows, call out that data can't flow through LLM output and explain the architectural consequence.
- **Separate facts from assumptions.** The "Assumptions" section is just as important as the confirmed requirements.
- **Keep open questions visible.** These are action items for the next client conversation.
**Present the document to the user** and ask: "Does this look right? Anything to add or change before I start building?"
### Stage 4 - Build: Create the Agent Specs
Once the requirements doc is approved (the user says some variation of "looks good" or "build it"), transition to building.
**Read the `opal-agent-builder` skill** - it has the schema reference, CLEAR prompt framework, naming conventions, and export pipeline you need.
**Follow the standard Agent Studio build workflow:**
1. **Create agent JSON specs** in `clients/<client-slug>/agents/` using the CLEAR prompt framework. Every agent maps to a row in the requirements doc's Agent Architecture table.
2. **Set `inference_type` correctly.** This is the #1 source of bugs:
   - 1 tool -> `"simple"`
   - 2+ tools -> `"standard"`
   - If in doubt, count the tools listed in the requirements doc
3. **Wire the workflow** if multiple agents are involved. Set `next_step_id` chains, `specialized_agents_required`, triggers.
4. **Validate** each agent:
   - Valid JSON
   - `[[variables]]` match parameter names
   - `inference_type` matches tool count
   - `_nansen` block is complete
   - Output schema is non-empty for specialized agents
5. **Export** via `export-for-opal.py` to `exports/<client-slug>/`
6. **Produce solution documentation** in `clients/<client-slug>/docs/` with the standard three sections: Solution Overview, Workflow Documentation, Specialized Agent Reference.
**IMPORTANT:** Every agent, parameter, tool choice, and output schema should trace back to something in the requirements document. If you're making a design decision that isn't covered by the requirements, flag it to the user before building.
## Handling Partial Information
Clients often don't have all the answers in the first meeting. The skill should handle incomplete information gracefully:
- **If purpose and scope are clear but inputs/outputs are vague:** Produce a requirements doc with assumptions and open questions. Don't try to build yet.
- **If everything is clear except scale:** Assume moderate scale (10-100 items) and note the assumption. Flag that architecture may change if scale is larger.
- **If the user just wants to "explore" without a specific client:** Create a draft requirements doc in `clients/sandbox/plans/` and iterate.
- **If the user says "just build it, I'll fill in details later":** Build with sensible defaults, document every assumption in `_nansen.notes`, and flag what needs client confirmation.
## Tone and Approach
This skill often runs right after (or during) a client conversation. Keep the tone:
- **Professional but not formal** - This is a working document, not a contract
- **Decisive** - Make recommendations, don't just list options. "I'd recommend 3 agents because..." not "You could use 2 or 3 or 4 agents..."
- **Honest about trade-offs** - "This approach is simpler but won't scale past 100 items" is better than "This approach is great"
- **Action-oriented** - Every stage ends with a clear next step
