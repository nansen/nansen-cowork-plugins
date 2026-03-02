---
name: onboarding
description: >
  Developer onboarding flow for Nansen Agent Studio. Walks new team members
  through building a "hello world" agent pipeline — from a single specialized
  agent to a full workflow — using the same conversational patterns and tools
  as production work. ALWAYS use this skill when the user says: "onboarding",
  "/onboarding", "new developer setup", "hello world agent", "learn agent studio",
  "how do I build agents", "agent studio tutorial", "getting started with opal agents",
  "walk me through building an agent", or any variation asking about learning the
  agent development workflow. Also trigger when someone new joins the team and needs
  to learn Agent Studio conventions.
---

# Agent Studio Onboarding

Guide a new developer through building a complete "hello world" agent pipeline. By the end they'll have created three agents and a workflow using every core concept they'll need for production work.

The onboarding takes about 45 minutes and produces real, importable agent specs — not a tutorial with fake examples. It also includes a hands-on debugging exercise using the same workflow the team uses in production.

## Before Starting

1. Read the `opal-agent-builder` skill to establish full Agent Studio context
2. Read `references/conversational-patterns.md` from this skill directory — it contains the prompting patterns to teach
3. Read `references/hello-world-spec.md` — this is the expected final state (your answer key). Do not show it to the developer. Use it to guide them toward the right answers through conversation

## What the Developer Builds

A **URL Info Pipeline** — three agents that fetch web page metadata and write a summary:

| Agent | Type | inference_type | Tools |
|-------|------|---------------|-------|
| URL Reader | specialized | simple | `browse_web_html` |
| Summary Writer | specialized | standard | `write_content_to_file`, `write_file_to_library` |
| URL Info Workflow | workflow | n/a | n/a |

This mirrors real production pipelines (like Road Scholar's Activity Notes Audit) at a fraction of the complexity. Every concept transfers directly.

## The Flow: 8 Stages

Guide the developer through each stage conversationally. Don't dump instructions — ask them questions, let them make decisions, and explain concepts as they become relevant. The goal is for them to *discover* the patterns through building, not memorize them from a lecture.

### Stage 1: Welcome & Setup (~2 min)

Start with a warm welcome and set expectations:

> "Welcome to Agent Studio! Over the next 30 or so minutes, you're going to build a real agent pipeline that you can import into Opal and run. We'll start simple — one agent — and work up to a multi-agent workflow. I'll guide you through the same process we use for client work. First, what's your name? I'll set up your workspace."

Then:
- Create `nansen-working-agents/clients/onboarding-<name>/agents/` and `docs/` folders
- Copy the progress checklist from `templates/onboarding-checklist.md` to their docs folder
- Briefly explain the repo structure: clients → agents → exports, and how `_nansen` metadata works

Keep this under 2 minutes. The developer is here to build, not read docs.

### Stage 2: Planning the First Agent (~5 min)

Ask the developer to describe — in their own words — what the URL Reader should do:

> "We're going to build an agent that takes a URL and pulls out some basic info about the page. How would you describe what this agent should do? Just plain English is fine."

Whatever they say, map it to the CLEAR framework:
- Their description of the task → **Context** section
- The steps they'd take manually → **Logic** section (numbered steps)
- "What should happen if the URL is broken?" → **Refinement** section
- Which Opal tool fetches web pages? → **Actions** section (introduce `browse_web_html`)

Then introduce inference_type with a simple question:

> "This agent needs one tool — `browse_web_html`. Opal has three inference types that control how many tool calls an agent can make. Since we need exactly one, we use `simple`. Remember this — it becomes important in a few minutes."

Key concepts to land in this stage: CLEAR framework structure, inference_type basics, thinking about errors upfront.

### Stage 3: Building the First Agent (~10 min)

Now build the JSON spec together. Walk through each field and let the developer make decisions:

**Naming:** Explain the conventions and let them choose:
- `agent_id`: `URLInfo_URLReader` (Solution_AgentName PascalCase)
- `name`: `[DevName] URL Reader` (human-readable with owner prefix)
- Filename: `url-reader.json` (kebab-case)

**Parameters:** Ask what inputs the agent needs. Guide them to:
- `url` (string, required) — the page to fetch

**Output schema:** Ask what should come back. Guide them toward:
- `page_title` (string)
- `meta_description` (string)
- `url` (string, echo back for traceability)
- `fetch_status` ("success" or "error")
- `error_message` (string, null on success)

**The prompt:** Build it section by section using CLEAR. Show how `[[url]]` in the prompt maps to the `url` parameter entry.

**Building the JSON:** Use Python programmatic JSON manipulation (json.load/json.dump) to create the file. Explain why:

> "Agent prompts live on a single JSON line, which makes text editors unreliable for editing them. We use Python to read and write the JSON programmatically — it handles escaping and formatting perfectly every time. This is the pattern you'll use constantly."

**Validation checkpoint** — run all of these and show the developer what's being checked:
1. Valid JSON (json.load succeeds)
2. `[[url]]` in prompt matches parameter name
3. `inference_type: "simple"` with exactly 1 tool in `enabled_tools`
4. `_nansen` block present with client, owner, status
5. Export with `export-for-opal.py`
6. Verify export: valid JSON, no `_nansen`, all required fields

Celebrate the first agent being complete. Update the checklist.

### Stage 4: Building the Second Agent — The inference_type Trap (~8 min)

Now build the Summary Writer. This agent takes the collected page info, formats a Markdown summary, and writes it to CMP.

Start by explaining the two-tool CMP write pattern:

> "Writing a file to Opal's CMP takes two steps: first `write_content_to_file` creates the file, then `write_file_to_library` registers it. That's two tool calls. What inference_type should we use?"

**If they say "simple"** — this is the teaching moment:

> "Good instinct to stick with what works, but here's the most important debugging lesson in Agent Studio: with `simple`, the agent makes exactly ONE tool call — total. It would call `write_content_to_file` and then *fabricate* a response for `write_file_to_library`. The file gets created but never registered, and the output looks completely normal. This is the #1 cause of bugs. Two tools means `standard`."

**If they say "standard"** — confirm and explain why:

> "Exactly right. Any time you need more than one tool call, you need `standard` or higher. The decision tree is simple: 1 tool → `simple`, 2+ tools → `standard`."

Walk through the same field-by-field process:
- Parameters: `page_info_array` (type: `string` — a JSON string containing an array of objects; Opal doesn't support `"type": "array"`, so we pass complex data as a string or use `"type": "object"`), `output_filename` (string, default)
- Output: `write_status`, `file_path`
- Two tools in `enabled_tools`

**Parameter type gotcha:** If the developer tries to use `"type": "array"`, this is a teaching moment:

> "Good thinking, but Opal's importer only accepts four parameter types: string, number, boolean, and object. If you use 'array', the import will fail with 'Invalid JSON' — even though it's valid JSON. For array data, use 'object' (Opal treats all complex JSON as objects) or 'string' (pass as a serialized JSON string and parse it in the prompt)."

Same validation checkpoint. Update the checklist.

### Stage 5: Wiring the Workflow (~5 min)

Explain that workflow agents are fundamentally different:

> "Everything we've built so far is a specialized agent — it has a prompt, parameters, and tools. Workflow agents are the opposite. They have no prompt, no tools, and no parameters. They just orchestrate: run this agent, then loop through this list, then run that agent."

Build the workflow JSON together:
- `agent_type: "workflow"` (not "specialized")
- Steps array with three entries:
  1. URL Reader step (specialized, processes first URL or a setup step)
  2. `for_loop` step iterating the URL list, calling URL Reader as child
  3. Summary Writer step
- `next_step_id` chaining
- `specialized_agents_required` array listing both agents
- Triggers (chat-based)

Show how the workflow connects to the specialized agents by `agent_id`.

Same validation checkpoint (different checks for workflows — no prompt, no tools). Update the checklist.

### Stage 6: Documentation (~3 min)

Create a solution doc in `docs/url-info-pipeline.md` following the standard template:

> "Every solution we ship gets documentation with three sections. Let's write yours — it's quick."

Guide them through:
1. **Solution Overview** — what it does, agent list, architecture
2. **Workflow Documentation** — steps, data flow
3. **Agent Reference** — parameters, outputs, key behaviors

Keep it concise. The point is teaching the template, not producing War and Peace.

### Stage 7: Debugging — Break It, Fix It (~8 min)

This is the most practically valuable stage. The developer is going to intentionally break their agents and learn the debugging workflow used in production: grab the error, paste it into chat, describe what you expected.

> "Your agents work. Let's break them. Seriously — the fastest way to learn debugging is to see what failures look like *before* you're under pressure on a client project. We're going to introduce two bugs, and you're going to fix them using the same workflow we use every day in production."

#### Bug 1: The Parameter Mismatch (runtime failure)

Walk the developer through introducing the bug:

> "Open your URL Reader agent. Rename the `url` parameter to `webpage_url` in the parameters block — but leave the prompt referencing `[[url]]`. Now export and re-import it."

The agent will import fine. It will even run without an error in the traditional sense. But when it executes, the prompt sends the literal string `[[url]]` to `browse_web_html` instead of the actual URL, because the parameter name no longer matches.

Have them run it in the sandbox and look at the Opal execution log. Ask:

> "Something went wrong. Open the execution log in Opal and find the tool call. What URL did the agent send to `browse_web_html`?"

They should see `[[url]]` as the literal URL in the tool call payload. Once they spot it:

> "This is one of the most common bugs — a mismatch between the parameter name in the spec and the `[[placeholder]]` in the prompt. The agent doesn't crash, it just silently sends garbage to the tool. The fix is simple: names have to match exactly. But the real lesson here is the debugging pattern."

Introduce the production debugging workflow:

> "Here's how debugging works day to day. When something goes wrong, you grab the relevant section of the execution log — not the whole thing, just the part that shows the failure. Paste it into chat with Claude and describe what you expected to happen. That's it. Claude reads the log, compares it to the agent spec, and identifies the issue. Let's try it now — copy the tool call section from the Opal log, paste it here, and tell me what you expected."

Let the developer do the paste-and-describe cycle. Walk them through how you'd read the log to spot the `[[url]]` literal. Then have them fix it (rename `webpage_url` back to `url`), re-export, and re-import.

#### Bug 2: The Reserved Keyword Trap (build-time failure)

This one teaches the export script's validation layer:

> "Now let's try something subtler. In your URL Reader's output schema, rename `page_title` to `properties`. Just that one field. Now try to export."

The export script will block the export with a hard error:

```
ERROR: URLInfo_URLReader uses JSON Schema reserved keyword "properties" as a field name in output.schema. This will cause an infinite validation loop in Opal. Rename the field before importing.
```

Ask the developer:

> "What just happened? The export script refused to create the file. Why would a field called `properties` cause problems?"

Explain the reserved keyword issue:

> "JSON Schema has reserved keywords like `properties`, `items`, `type`, `required` — words that mean something specific to a JSON Schema validator. If you use one as a field name in your output schema, Opal's validator interprets it as a schema directive instead of a data field. The agent produces correct output, but the validator rejects it every time, and the agent retries in an infinite loop. We learned this the hard way on a client project — twice. That's why the export script checks for it now."

Have them rename `properties` to `title`, re-export successfully, and confirm the validation passes.

> "This is why we always export through the script before importing into Opal. It's a safety net that catches issues the Opal importer won't warn you about."

#### The Debugging Cheat Sheet

After both bugs are fixed, summarize the debugging workflow as a reference:

> "Here's the pattern you'll use constantly. When something goes wrong:"

1. **Grab the error** — Opal execution log, Cloudflare Worker error, export script output, or Opal import failure message. Copy the relevant section, not the entire output.
2. **Paste it into chat** with a one-line description of what you expected. Example: *"This agent should return page metadata but the workflow is failing on step 2. Here's the log: [paste]"*
3. **Include context if you have it** — which agent, which step, what input you gave it. But the log alone is usually enough.
4. **Trust the log over the output** — if an agent's final response looks correct but something downstream broke, the execution log will show what actually happened (tool calls made, responses received, retry attempts).

Common failure signatures to recognize:

| What You See in the Log | Likely Cause |
|---|---|
| Tool receives literal `[[param_name]]` as input | Parameter name mismatch between spec and prompt |
| Agent retries same correct output 5-10 times | Reserved keyword in output schema (run export script to check) |
| Only 1 tool_use block when you expected 2+ | Wrong inference_type (`simple` instead of `standard`) |
| "Invalid JSON" on Opal import | Run `export-for-opal.py` first — it gives better error messages |
| Tool returns error/timeout | Check the tool itself (Cloudflare Worker logs, tool endpoint status) |
| Agent hallucinates a tool response | Tool not in `enabled_tools`, or inference_type too low for the number of tools needed |
| File content truncated or missing sections in downstream agent | File exceeds ~50KB LLM passthrough limit. Use KV intermediary pattern (see opal-agent-builder Common Patterns) |

Update the checklist. Celebrate — they've now built agents AND debugged them.

### Stage 8: Review, Cleanup & Next Steps (~2 min)

Walk through what they built and how it maps to real work:

| Hello World | Production Equivalent (Road Scholar) |
|---|---|
| URL Reader | PageScraper |
| Summary Writer | AuditCsvWriter |
| URL Info Workflow | Activity Audit Workflow |
| `browse_web_html` | Custom Cloudflare Worker |
| `write_content_to_file` + `write_file_to_library` | Same two-step CMP write |

**Import instructions:**
> "Your exported agents are ready to import into the Nansen Opal sandbox instance. Go to the sandbox, import each JSON from the `exports/onboarding-<name>/` folder, and run the workflow with a couple of test URLs. If you hit access issues with the sandbox, reach out to arnold.macauley@nansen.com."

**Cleanup:** Delete the `clients/onboarding-<name>/` folder and its exports — the skill's answer key serves as the lasting reference.

**Next steps to suggest:**
1. Import and run in the Opal sandbox with 2-3 test URLs
2. Try adding a feature: "Add a `max_urls` parameter to limit processing" — this teaches the iteration loop
3. Read the Road Scholar Activity Notes Audit docs (`nansen-working-agents/clients/road-scholar/docs/activity-notes-audit.md`) to see a production-scale example
4. Read `references/conversational-patterns.md` to internalize the prompting workflow

**Introduce the conversational patterns:**

> "The most important thing about Agent Studio isn't the JSON format — it's the workflow. Read through the conversational patterns doc I'll point you to. It shows you how to talk to Claude to build agents efficiently: start with intent, plan before building, validate everything programmatically, and always know what needs syncing to Opal."

Mark the checklist complete.

## Teaching Style Notes

Throughout the onboarding, maintain these principles:

**Ask, don't tell.** Always ask the developer a question before explaining a concept. "What inference_type should we use?" is better than "We need inference_type standard because..." — even if they get it wrong, the wrong answer creates a memorable teaching moment.

**Show real patterns.** Every command, every validation check, every file manipulation should use the exact same approach used in production. No simplified versions.

**Celebrate progress.** After each agent is complete and validated, acknowledge it explicitly. Building an agent from scratch is a real accomplishment.

**Keep it moving.** If the developer is clearly experienced and getting concepts quickly, don't over-explain. If they're struggling with something, slow down and use analogies. Match their pace.

## Reference Files

Read these files from this skill's directory as needed:

- `references/conversational-patterns.md` — The 6 prompting patterns extracted from production sessions. Read this before starting Stage 1
- `references/hello-world-spec.md` — Expected final state of all 3 agents + workflow. Your answer key — do not show to the developer
- `templates/onboarding-checklist.md` — Progress tracker template, copied to the developer's docs folder at the start
