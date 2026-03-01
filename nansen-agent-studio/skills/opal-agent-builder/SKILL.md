---
name: opal-agent-builder
description: >
  Build, edit, validate, document, and export Optimizely Opal agent specs using
  Nansen's local-first Agent Studio repo. Use this skill whenever someone
  mentions Opal agents, agent specs, building agents for a client, creating a
  workflow, exporting for Opal, documenting a solution, or working with the
  Agent Studio repo. Also trigger when someone asks about Opal system
  tools, inference types, agent schemas, or the CLEAR prompt framework. Even
  casual references like "add a new agent", "set up a scraper for client X", or
  "document the pipeline" should activate this skill.
version: 0.2.0
---

# Opal Agent Builder Studio

You are helping a Nansen developer build Optimizely Opal agent specs. This repo
is the source of truth for all agent definitions across Nansen's client
engagements. Agents are authored as JSON files locally, version-controlled in
GitHub, and exported for import into Opal instances.

Your job: take what the developer describes and produce production-quality agent
JSON that will import cleanly into Opal and execute correctly on the first try.

## How This Repo Works

The repo lives at the root of the workspace folder. Start by reading `README.md`
for the full conventions, but here's what matters most:

```
opal-agents/
├── registry.json                  # Central index of every agent
├── schema/
│   └── agent-spec.schema.json     # JSON Schema for validation
├── templates/
│   └── agents/
│       └── _blank-agent.json      # CLEAR-structured starter template
├── clients/
│   └── <client-slug>/
│       ├── agents/                # Agent JSON specs
│       ├── docs/                  # Solution documentation (per feature request)
│       ├── files/                 # Reference files (PDFs, CSVs, etc.)
│       └── plans/                 # Architecture plans (build-phase, optional)
├── tools/
│   └── export-for-opal.py        # Strips _nansen, reorders fields for import
├── exports/
│   └── <client-slug>/            # Generated — do NOT edit these directly
└── Instructions/
    └── opal-system-tools/        # Saved HTML docs for every Opal tool category
```

Files in `clients/` are the source of truth. Files in `exports/` are generated
artifacts produced by the export script — never hand-edit them.

## Two Agent Types — Completely Different Schemas

Opal has two fundamentally different agent types. Their JSON schemas share almost
no fields beyond `schema_version`, `agent_type`, `name`, `agent_id`, and a few
boolean flags. Never mix them up.

### Specialized Agents

These do one thing well: scrape a page, write a CSV, parse data. They have a
prompt, parameters, tools, and an output schema.

Read `templates/agents/_blank-agent.json` for the starter template, then read
`schema/agent-spec.schema.json` for the full field reference.

Key fields:

| Field | What It Is | Notes |
|-------|-----------|-------|
| `agent_type` | Always `"specialized"` | |
| `agent_id` | `Solution_AgentName` in PascalCase | e.g., `ActivityNotes_PageScraper` |
| `prompt_template` | The full CLEAR-structured prompt | Uses `[[variable]]` placeholders |
| `parameters` | Array of input variable definitions | Each needs name, type, default, required, description |
| `output` | What the agent returns | type (json/text/file), schema object, description |
| `enabled_tools` | Array of Opal tool names | e.g., `["browse_web_html"]` |
| `inference_type` | `"simple"`, `"complex_with_thinking"`, `"standard"`, or `"advanced"` | See critical section below. Only `"simple"` and `"complex_with_thinking"` pass Opal's import validator. |
| `creativity` | 0.0 to 1.0 | Use 0.1 for deterministic extraction tasks |
| `is_enabled_in_chat` | Whether it appears in Opal chat | `false` for workflow-only agents |

### Workflow Agents

These orchestrate multiple specialized agents into a pipeline. They have steps,
triggers, and visual editor metadata — but NO prompt, NO parameters, NO tools.

Key fields:

| Field | What It Is |
|-------|-----------|
| `agent_type` | Always `"workflow"` |
| `steps` | Array of step objects (specialized, for_loop, conditional) |
| `triggers` | Array of trigger objects (message, scheduler) |
| `specialized_agents_required` | Array of agent_id strings this workflow uses |
| `agent_metadata` | Contains `edges` and `nodes` for the Opal visual editor |
| `objective` | Empty string (Opal uses this internally) |
| `plan` | Empty string (Opal uses this internally) |

Workflow agents do NOT have: `prompt_template`, `parameters`, `output`,
`enabled_tools`, `inference_type`, `creativity`, or `is_enabled_in_chat`.

## The inference_type Trap

This is the single most important thing to understand about Opal agents, and the
source of the most painful debugging sessions.

**`inference_type: "simple"` means the agent makes exactly ONE tool call per
execution.** Not one at a time — one total. If you give an agent two tools and
set `inference_type: "simple"`, it will call the first tool and then return its
response without ever calling the second tool. Worse, the agent will often
hallucinate a plausible-looking response for the second tool call, making the
bug extremely hard to spot.

This was discovered through repeated debugging. An early version of the
InventoryCsvReader agent had two tools (`cmp_retrieve_asset_from_library` +
`browse_web_html`). With `inference_type: "simple"`, it would call the first
tool, get a file ID back, and then fabricate a plausible-looking CSV response
instead of actually fetching the file with the second tool. Four redesign
iterations were needed before the root cause was identified. The fix: redesign
to use a single tool with a direct download URL passed as a parameter.

**Design rules:**

- `"simple"` → Design for exactly ONE tool call. All processing happens in the
  LLM's response after that single call. This is the default and preferred mode.
- `"standard"` → Multiple sequential tool calls allowed. Use when the agent
  genuinely needs a multi-step tool workflow. **However**, Opal's import
  validator rejects `"standard"` — you cannot import a JSON with this value.
- `"complex_with_thinking"` → **The recommended multi-tool inference type.**
  Supports multiple sequential tool calls AND passes the Opal import validator.
  Use this instead of `"standard"` for any agent that needs 2+ tool calls (e.g.,
  the two-tool CMP writer pattern). Also works well for pure LLM agents doing
  deep analysis (e.g., cross-referencing multiple documents).
- `"advanced"` → Most capable, most expensive. Rarely needed. Also rejected by
  Opal's import validator.

When in doubt, use `"simple"` and design around the single-call constraint. It
produces cleaner agents, costs less to run, and is easier to debug. When you
need multi-tool, use `"complex_with_thinking"`.

**Quick decision tree:**

```
How many tools does this agent need?
├─ 0 tools (pure LLM, deep analysis) → "complex_with_thinking"
├─ 1 tool  → inference_type: "simple" (preferred)
├─ 2 tools → Can you redesign to use 1 tool?
│   ├─ Yes → Redesign and use "simple" (e.g., pass download URL directly
│   │         instead of first resolving a file ID)
│   └─ No  → inference_type: "complex_with_thinking"
└─ 3+ tools → inference_type: "complex_with_thinking"
```

**Import validator note:** Opal's import validator accepts `"simple"` and
`"complex_with_thinking"` but rejects `"standard"` and `"advanced"`. The export
script (`tools/export-for-opal.py`) will downgrade `"standard"` and `"advanced"`
to `"simple"` with a warning, but `"complex_with_thinking"` passes through
unchanged. Always prefer `"complex_with_thinking"` over `"standard"` in source
specs to avoid this issue entirely.

**Troubleshooting:** If an agent seems to succeed but produces fabricated data
for its second tool call, check `inference_type`. This is the #1 cause. The
JSON schema validation will NOT catch this — an agent with two tools and
`inference_type: "simple"` is valid JSON but broken at runtime.

## The Parameter Type Trap

Opal only accepts four parameter types on import: `string`, `number`, `boolean`,
and `object`. Using `"type": "array"` will cause Opal to reject the JSON with an
"Invalid JSON" error on import — even though the JSON is syntactically valid.

This was discovered when an agent with `"type": "array"` on a parameter passed
local JSON validation but failed on every import attempt into Opal. The fix: use
`"object"` for any complex/structured data, or `"string"` for serialized JSON.

**Valid parameter types:**

| Type | Use For | Example |
|------|---------|---------|
| `string` | Text, URLs, IDs, serialized JSON strings | `"13178"`, `"{\"key\": \"value\"}"` |
| `number` | Numeric values | `42`, `3.14` |
| `boolean` | True/false flags | `true`, `false` |
| `object` | Complex structured data (JSON objects, arrays, nested data) | `{"programs": [...]}`, `[{...}, {...}]` |

**When you have array data:** Use `"type": "object"` — Opal treats all complex
JSON inputs (including arrays) as objects at the parameter level. The prompt and
description should clarify that the value is actually an array. See the
`Inventory_CsvWriter` agent's `inventory_json` parameter for a working example.

**Alternative approach:** Use `"type": "string"` and document that the value is a
"JSON string containing an array of...". The prompt then parses it. See the
onboarding `URLInfo_SummaryWriter` agent's `page_info_array` parameter.

## The Conditional Step Trap

Workflow conditional steps require a real evaluator agent - you cannot use
`evaluator_agent_id: null`. Opal rejects the import with "Invalid JSON" if the
evaluator is null, because the conditional step needs to actually run an agent
and match its text output against the conditions.

This was discovered when a workflow tried to use a conditional step to check
whether an optional parameter (`email_recipient`) was provided, with
`evaluator_agent_id: null`. The import failed every time.

**Design rules for conditionals:**

- `evaluator_agent_id` must reference a real, importable specialized agent
- The evaluator agent runs first, produces text output, then conditions match
  against that text using `equals` or `not_equals`
- If you don't have an evaluator agent ready, skip the conditional step entirely
  and add it later via the Opal UI once the evaluator is designed and imported
- For simple "if parameter exists" logic, you're better off handling it inside
  the downstream agent's prompt (e.g., "If no email recipient is provided, skip
  sending email and return a status noting email was not sent")

**Quick decision tree:**

```
Do you need conditional routing in the workflow?
├─ Yes → Do you have a real evaluator agent built and ready?
│   ├─ Yes → Use a conditional step with that agent's ID
│   └─ No  → Skip the conditional for now, add via Opal UI later
└─ No  → Use direct next_step_id chaining
```

## The Template Variable Bloat Trap

Every occurrence of `[[variable]]` in the prompt is replaced with the full literal
value. If you reference `[[review_results]]` three times in a prompt (Context,
Logic, Expectations), and the value is a 5KB JSON array, the substituted prompt
contains 15KB of duplicate data. This causes two failures:

1. **Context overflow/corruption:** The LLM chokes on the bloated prompt and
   produces corrupted tool calls. In one production incident, an agent with 2
   programs of 3 findings each saw its findings arrays replaced with `[1, 1, 1]`
   (the LLM counted the findings instead of passing them through). The tool call
   looked valid but contained no actual data.

2. **Loop amplification:** When the tool rejects the corrupted payload, the LLM
   retries with the same corrupted data. Without guardrails, this produces an
   infinite loop of identical failing calls.

**Design rules:**

- Reference `[[variable]]` exactly ONCE in the prompt, in the Context section.
  All subsequent sections should say "the review results data" or "the input
  data" rather than re-inserting the variable.
- For large structured data (arrays of objects), add explicit pass-through
  instructions: "Copy the findings array exactly as-is from the input. Each
  finding is an object with category, activity_description, activities, and
  considerations keys."
- Always pair with CRITICAL RULES (especially RULE 1 max tool calls, RULE 2
  no retries) to prevent loops if the tool call still fails.

**Quick check:** Count how many times `[[variable_name]]` appears in your prompt.
If it's more than once for any variable that holds structured data, reduce it
to one.

## The Template Variable Substitution Trap

`[[variable]]` placeholders are replaced with their literal values **before** the
LLM ever sees the prompt. This means the LLM never sees `[[audit_mode]]` — it
sees `23705,25490,25664` or `new` or `all` directly in the text.

**Why this matters:** If your prompt says "Check [[audit_mode]] and if it equals
'all', do X; if it equals 'new', do Y; otherwise treat it as a program list",
the LLM sees:

```
Check 23705,25490,25664 and if it equals 'all', do X; if it equals 'new', do Y;
otherwise treat it as a program list
```

The LLM can still misinterpret this — it sees the literal value but also sees
the abstract branch references and may non-deterministically choose the wrong
branch. This caused production bugs where an agent intermittently ignored a list
of program numbers and defaulted to the "all" branch instead.

**Fix:** Write the prompt so that the substituted value is explicit and the
conditional logic is sequential with early-exit stops:

```
The value is: `[[audit_mode]]`

Evaluate using these rules IN ORDER — apply the FIRST rule that matches:

Rule A — Does the value equal exactly the word `new`?
  If YES: [do X]. Stop here.

Rule B — Does the value equal exactly the word `all`, OR is it empty/blank?
  If YES: [do Y]. Stop here.

Rule C — CATCH-ALL: If neither Rule A nor Rule B matched, the value MUST be
  a comma-separated list. [do Z].
```

This pattern works because after substitution, the LLM sees the actual value
right next to explicit matching rules with stop gates. The sequential evaluation
with catch-all prevents non-deterministic branching.

## The CLEAR Prompt Framework

All prompts follow this five-section structure. Read `templates/agents/_blank-agent.json`
for the skeleton.

**Context** — Who the agent is and what it does. One paragraph. Set the role and
objective clearly so the LLM understands what success looks like.

**Logic** (or Steps) — Numbered, step-by-step instructions. This is the bulk of
the prompt. Be specific about what to extract, how to process it, and what to
return. For `inference_type: "simple"` agents, Step 1 is always the single tool
call, and all subsequent steps describe processing that happens in the LLM's
response text (not additional tool calls). For `"complex_with_thinking"` agents,
steps can include multiple tool calls.

**Expectations** — Quality constraints and guardrails. "Output must be valid
JSON matching the output schema." "NEVER fabricate data." "Process exactly ONE
URL per run." These prevent the most common LLM failure modes.

**Actions** — Concrete list of tool calls and operations. Partly redundant with
Logic but helps the LLM plan its execution strategy.

**Refinement** — Error handling and edge cases. What to do when the page returns
404. What to do when the expected element isn't found. Always specify returning
structured error objects rather than crashing or returning freeform text.

Variables use Opal's `[[double_bracket]]` syntax: `[[page_url]]`,
`[[filter_status]]`, etc. Every `[[variable]]` in the prompt must have a
matching entry in the `parameters` array, and vice versa. Mismatches cause
silent failures in Opal at runtime.

## LLM Guardrail Patterns

When an agent can receive empty or edge-case input, add **numbered CRITICAL
RULES** at the top of the prompt (after Context, before Logic). These rules act
as hard stops that the LLM evaluates before doing anything else.

**Pattern — use for any agent with `inference_type: "complex_with_thinking"` that writes files:**

```
### **CRITICAL RULES**

**RULE 1 — EMPTY INPUT EARLY EXIT:** If [[input_data]] is empty/null:
- Immediately respond with [specific JSON]. STOP. Make ZERO tool calls.

**RULE 2 — NEVER FABRICATE DATA:** Only use data from [[input_data]].
Never generate test data, sample data, or placeholder data.

**RULE 3 — MAXIMUM N TOOL CALLS:** You may make at most N tool calls total:
one `tool_a` and one `tool_b`. After the Nth call, STOP.

**RULE 4 — RESPONSE IS TEXT:** Your final JSON summary is your text response
to the workflow. Do NOT write it to a file.
```

**Why each rule exists (from production incidents):**

- **RULE 1** prevents the agent from fabricating data when input is empty.
  Without this, the LLM will invent test data to "be helpful."
- **RULE 2** reinforces anti-hallucination. Redundant with Rule 1 but catches
  cases where input exists but is partial.
- **RULE 3** prevents infinite loops. Without an explicit cap, agents using
  `write_content_to_file` have been observed looping 474+ times trying to
  "present" their response by repeatedly writing it to files.
- **RULE 4** prevents the LLM from interpreting "return a JSON response" as
  "write JSON to a file." This specific misinterpretation caused the 474-
  iteration infinite loop in production.

**When to use this pattern:** Any agent with `inference_type: "complex_with_thinking"`
that writes files or calls external tools. The combination of multiple tool
access + empty input is the highest-risk scenario for infinite loops.

## The _nansen Block

Every source file includes a `_nansen` object for Nansen-internal metadata.
This is the ONLY non-Opal field in the JSON. The export script strips it
automatically.

```json
"_nansen": {
  "client": "road-scholar",
  "template_source": null,
  "status": "rc",
  "owner": "arnold.macauley",
  "tags": ["scraper", "browse-web"],
  "last_synced_to_opal": null,
  "notes": "v0.2.0: Fixed audit_mode branching with Rule A/B/C pattern.\nv0.1.0: Initial version.",
  "rc_date": "2026-02-25"
}
```

- `client` — kebab-case client slug, matches the folder name under `clients/`
- `template_source` — agent_id of the template it was derived from (null if original)
- `status` — one of: `draft`, `in-progress`, `rc` (release candidate), `review`, `production`, `deprecated`
- `owner` — Nansen team member's username (e.g., `arnold.macauley`)
- `tags` — freeform tags for searching and grouping agents
- `last_synced_to_opal` — ISO 8601 timestamp of last export, or null
- `notes` — version history in reverse chronological order (latest first)
- `rc_date` — date the agent entered RC status (YYYY-MM-DD format)

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Client folder | kebab-case | `road-scholar` |
| Agent filename | kebab-case matching purpose | `page-scraper.json` |
| `agent_id` | `Solution_AgentName` PascalCase | `ActivityNotes_PageScraper` |
| `name` field | `[Team - Solution] Human-Readable Name` | `[Programs - Activity Audit] Page Scraper` |
| `version` | Semantic versioning | `0.1.0` |

The `agent_id` pattern `<Solution>_<AgentName>` groups related agents under a
shared solution namespace (e.g., `ActivityNotes_*` for everything in the
activity notes audit pipeline). This lets the same agent pattern be reused
across clients while staying identifiable.

The `name` field prefix `[Team - Solution]` identifies which team owns the agent
and which solution it belongs to. This keeps the Opal UI organized when multiple
solutions coexist in one instance. The end-user team should only see workflow
agents in the chat — specialized agents are hidden via `is_enabled_in_chat: false`.

## is_enabled_in_chat

Controls whether the agent appears in Opal's chat interface for end users.

**Set to `false`** for all specialized agents that are only called by workflows.
The end-user team should only see workflow agents in the chat — not the
individual specialized agents that comprise them.

**Set to `true`** for workflow agents and any standalone agents that users
invoke directly.

Default in the blank template is `false` for safety. Explicitly set to `true`
only on agents the end-user team should interact with.

## Opal System Tools

The `Instructions/opal-system-tools/` folder contains saved documentation pages
for every Opal tool category. When building an agent that needs specific tools,
read the relevant HTML file to understand parameters and expected behavior.

For quick reference, see `references/opal-tools-quickref.md` which summarizes
the most commonly used tools.

## Workflow Design Patterns

See `references/workflow-patterns.md` for proven patterns from production
workflows. Key patterns to consider when designing new workflows:

- **CMP as Shared State**: Write data to CMP early, read it back by ID in later
  steps. Avoids LLM data passthrough failures where large payloads get corrupted.
  Always prefer passing lightweight IDs over large data structures.
- **Pseudocode Prompts**: For deterministic/CRUD agents, use structured
  INPUT/PROCESS pseudocode instead of prose. Pairs well with
  `simple_with_thinking` or `code` inference types.
- **Progressive Enrichment**: Each agent adds one concern to the data shape.
  Drop fields no longer needed downstream to keep payloads small.
- **Internal Iteration vs. Workflow Loops**: Use `for_loop` steps when each item
  needs heavy processing (>2 tool calls, web scraping). Use internal `for item
  in list` iteration when items need simple CRUD operations.
- **Inference Tiering**: `simple_with_thinking` for CRUD, `complex_with_thinking`
  for reasoning/date math, `code` for maximum data faithfulness.
- **Layout Spacing**: Looped child agents need ~570px horizontal gaps so they
  don't overlap in the Opal editor. Sequential steps use ~300px gaps.

## Workflow Step Types

Workflows use these step types inside the `steps` array:

### Specialized step

Runs one specialized agent:

```json
{
  "step_id": "<uuid>",
  "step_type": "specialized",
  "name": "[Team - Solution] Agent Display Name",
  "description": "What this step does in the pipeline",
  "agent_id": "Solution_AgentName",
  "parameters_schema": {},
  "next_step_id": "<uuid-of-next-step>",
  "timeout_seconds": 3600
}
```

### For_loop step

Iterates over a list, running child steps per item:

```json
{
  "step_id": "<uuid>",
  "step_type": "for_loop",
  "name": "Loop",
  "description": "Execute steps for each item in a collection",
  "items_source": "$WORKFLOW_INPUT.programs",
  "item_name": "program",
  "max_iterations": null,
  "parallel": false,
  "child_steps": [
    { /* specialized step nested here */ }
  ],
  "next_step_id": "<uuid-of-next-step>",
  "timeout_seconds": 3600
}
```

### Conditional step

Routes the workflow based on an evaluator agent's output. The evaluator agent
runs first, then its text response is matched against conditions to determine
which step executes next.

```json
{
  "step_id": "<uuid>",
  "step_type": "conditional",
  "name": "[Team - Solution] Evaluator Name",
  "description": "Runs the evaluator and routes based on output",
  "evaluator_agent_id": "Solution_EvaluatorAgent",
  "parameters_schema": null,
  "conditions": [
    {
      "matching_condition": "\"total_count\": 0",
      "match_type": "not_equals",
      "target_step_id": "<uuid-step-when-has-data>",
      "priority": 0
    },
    {
      "matching_condition": "\"total_count\": 0",
      "match_type": "equals",
      "target_step_id": "<uuid-step-when-empty>",
      "priority": 0
    }
  ],
  "timeout_seconds": 3600
}
```

**How it works:**

1. Opal runs the `evaluator_agent_id` agent
2. The agent's text response is matched against each condition's
   `matching_condition` using the specified `match_type`
3. The first matching condition's `target_step_id` determines the next step
4. If no condition matches, the workflow stops (there is no `default_step_id`)

**Condition fields:**

- `matching_condition` — string pattern to match against the evaluator's
  response (e.g., `"\"total_count\": 0"`)
- `match_type` — comparison operator: `"equals"` or `"not_equals"`
- `target_step_id` — which step to execute if this condition matches
- `priority` — evaluation order (lower = first). Opal typically sets all to 0
  and relies on `match_type` to differentiate.

**Opal UI behavior:** When you create a conditional in the Opal visual editor,
it generates separate condition nodes with their own IDs (e.g.,
`step_id + "-condition-71w8qz"`) and edges routing through them. The
`agent_metadata.edges` and `agent_metadata.nodes` arrays will include these
condition nodes. When syncing from Opal back to local, preserve these.

**CRITICAL:** `evaluator_agent_id` must reference a real, importable specialized
agent. Setting it to `null` will cause "Invalid JSON" on import. If you don't
have the evaluator agent ready yet, omit the conditional step entirely and add
it later via the Opal UI.

**Design tips:**

- `parameters_schema` should be `null` (not `{}`) on conditional steps
- The evaluator agent should include the condition-relevant value in a
  predictable format in its output (e.g., always include `"total_count": N`)
- Use `not_equals` for the "has data" path and `equals` for the "empty" path
- Use conditionals to skip expensive downstream steps when upstream returns
  empty results (e.g., skip scraping loop + CSV writer when no URLs found)

### Data flow between steps

Opal handles passing outputs from one step to the next automatically at runtime.
In the JSON spec, you don't wire up explicit data bindings — you set
`next_step_id` to connect steps sequentially, and Opal's runtime passes the
previous step's output as context to the next step. For `for_loop` steps,
`items_source` (e.g., `"$WORKFLOW_INPUT.programs"`) tells Opal where to find the
iteration list. The child steps receive the current item automatically via the
`item_name` variable. IMPORTANT: The field name referenced in items_source must
NOT be a JSON Schema reserved keyword (e.g., never use `$WORKFLOW_INPUT.items`
because `items` is reserved). See the "JSON Schema reserved keywords" pitfall.

The `agent_metadata` block contains `edges` (connections between steps) and
`nodes` (positions on the visual canvas). These are cosmetic for the Opal visual
editor but expected to be present. Generate UUIDs (v4) for all step_id, edge id,
and node id values.

## Syncing with Opal

When you edit agents in the Opal UI (e.g., repositioning workflow nodes, adding
conditional branches), Opal may normalize the JSON in ways that differ from what
we authored locally:

- `internal_version` increments on every save in the Opal UI
- `parameters_schema: {}` may become `parameters_schema: null` on conditional steps
- Opal generates condition node IDs (e.g., `step_id + "-condition-71w8qz"`) for
  visual rendering of conditionals
- Opal creates edges routing through condition nodes rather than directly from
  evaluator to target
- Step ordering in the `steps` array may change
- Both conditions in a pair may get `priority: 0` (Opal relies on `match_type`)

**After editing in Opal:** Copy the full JSON from Opal back into the local
source file, preserving the `_nansen` block. Then re-export. This keeps local
and Opal in sync.

**Never hand-edit `internal_version`** — it's Opal's counter. Let it be whatever
Opal sets it to.

## Building a New Agent — Checklist

1. **Understand the task.** What does the agent need to do? What tools? What
   data goes in and comes out?

2. **Choose the type.** Single task → specialized. Orchestration → workflow.

3. **Copy the template.** Start from `templates/agents/_blank-agent.json`.

4. **Fill in the spec.** Set `agent_id`, `name`, `description`, `parameters`,
   `output`, `enabled_tools`, and write the `prompt_template` using CLEAR.

5. **Check parameter types.** Only `string`, `number`, `boolean`, `object` are
   valid. Never use `array` — use `object` instead.

6. **Check template variable references.** Count `[[variable]]` occurrences for
   each variable. If a variable holds structured data (arrays, objects), it must
   appear only ONCE. Duplicates cause context bloat and data corruption.

7. **Set inference_type carefully.** Count the tools. One tool → `"simple"`.
   Multiple tools that must run sequentially → `"complex_with_thinking"`.
   Never use `"standard"` or `"advanced"` in source specs (rejected by Opal import).

8. **If `inference_type: "complex_with_thinking"` and agent writes files or calls
   external tools,** add CRITICAL RULES to the prompt: max tool calls, no retries
   on error, never fabricate data, response is text. This prevents infinite loops.

9. **Set `is_enabled_in_chat`.** `false` for workflow-only agents. `true` for
   agents that end users invoke directly.

10. **Add the _nansen block.** Set client, owner, status (`"draft"`), tags, notes.

11. **Register it.** Add an entry to `registry.json`.

12. **Export.** Run `python tools/export-for-opal.py --all --client <slug>`.

13. **Validate.** Verify exports are valid JSON, contain no `_nansen` key, have
    all required fields, that `enabled_tools` is non-empty for specialized agents,
    that no parameter uses `"type": "array"`, and that each `[[variable]]` holding
    structured data appears only once in the prompt.

14. **Document.** If this agent is part of a new solution, create a solution doc
    in `clients/<client-slug>/docs/`. If adding to an existing solution, update
    the existing doc. See the "Solution Documentation" section.

## Export Pipeline

```bash
# Export a single agent
python tools/export-for-opal.py clients/road-scholar/agents/page-scraper.json

# Export all agents for a client
python tools/export-for-opal.py --all --client road-scholar
```

The script strips `_nansen` and reorders fields to match Opal's native ordering
(which differs between specialized and workflow agents). Exports go to
`exports/<client-slug>/` and can be imported directly into Opal via the
"Import Agent" feature in the Opal UI.

## Custom Tools (Cloudflare Workers)

When Opal's built-in tools don't cover your use case, you can build custom tools
as Cloudflare Workers and register them via the Opal UI. The repo stores custom
tool source code under `tools/<tool-name>/`.

### The Opal Request Envelope Trap

**This is the single most important thing to know about custom tools.**

When Opal calls a custom tool, it does NOT send the tool parameters as top-level
JSON keys. Instead, it wraps them in an envelope:

```json
{
  "parameters": {
    "review_results": "...",
    "report_date": "2026-02-26"
  },
  "environment": { "...": "..." },
  "chat_metadata": { "...": "..." }
}
```

If your Worker does `body = await request.json()` and then reads
`body.review_results`, that value will be `undefined`. The actual data is at
`body.parameters.review_results`.

This was discovered during a multi-hour debugging session on the
`sustainability-review-docx` Worker. The Worker worked perfectly when tested
with curl (which sends parameters as top-level keys) but failed every time
when called from an Opal workflow. Debug diagnostics added to the error response
revealed `body_keys: ["parameters", "environment", "chat_metadata"]` with
`review_results_type: "undefined"`.

**The fix - always unwrap the envelope:**

```typescript
const rawBody = await request.json();

// Opal wraps tool parameters in a "parameters" envelope alongside
// "environment" and "chat_metadata". Unwrap if present, otherwise
// accept top-level keys for direct / curl calls.
if (
  rawBody &&
  typeof rawBody === "object" &&
  "parameters" in rawBody &&
  typeof (rawBody as Record<string, unknown>).parameters === "object"
) {
  body = (rawBody as Record<string, unknown>).parameters as YourRequestType;
} else {
  body = rawBody as YourRequestType;
}
```

This pattern handles both Opal calls (envelope present) and direct curl calls
(no envelope), so you can test with curl during development and deploy
confidently for Opal.

### Custom Tool Architecture

A custom tool needs two endpoints:

1. **`GET /discovery`** - Returns a JSON spec describing the tool's functions,
   parameters, and endpoints. Opal reads this to know what parameters to pass
   and how to call the tool. This is how you register input parameters.

2. **`POST /tools/<function_name>`** - The actual execution endpoint. Receives
   the Opal envelope (see above) and returns a JSON response.

Optional: `GET /health` for monitoring.

### Discovery Endpoint Pattern

```typescript
function handleDiscovery(): Response {
  return corsResponse(JSON.stringify({
    functions: [{
      name: "my_tool_v0",
      description: "What this tool does...",
      parameters: [
        {
          name: "input_data",
          type: "string",
          description: "JSON string containing the data to process",
          required: true,
        },
        {
          name: "report_date",
          type: "string",
          description: "ISO date string for the report header",
          required: false,
        },
      ],
      endpoint: "/tools/my_tool_v0",
      http_method: "POST",
    }],
  }, null, 2));
}
```

**After updating the discovery endpoint**, you must re-register the tool in the
Opal UI. Opal caches the discovery spec, so changes to parameters or endpoints
won't take effect until you re-register.

### The JSON Schema Collision Trap

When your discovery endpoint defines a parameter with the same name as a field
in the Opal agent's output schema (e.g., both the agent and the tool have a
field called `programs`), Opal may collide the values. The agent's LLM output
overwrites the tool parameter, or vice versa.

This was discovered when an agent had `programs` in both its output schema and
its tool's discovery parameters. The LLM fabricated a `programs` array in its
output, and that fabricated array overwrote the real data being passed to the
tool.

**Fix:** Use distinct names. If your tool processes review data, call the
parameter `review_results` rather than reusing a field name that already exists
in the agent's output schema or upstream context.

### The LLM Data Corruption Trap (Pass-Through Pattern)

When structured data (arrays of objects with nested fields) passes through an
LLM as part of a tool call, the LLM can corrupt it. In one production incident,
a findings array like `[{category: "Hiking", activities: "Day 3: Nature walk..."}]`
was replaced with `[1, 1, 1]` because the LLM counted the findings instead of
passing them through.

**The fix - use the pass-through pattern:** Instead of having the agent
restructure data before passing it to a tool, pass the raw data as a JSON
string parameter and let the tool handle parsing server-side.

In the agent prompt:
```
Pass the ENTIRE review_results value as a JSON string to the review_results
parameter. Do NOT restructure, summarize, or modify the data.
```

In the tool's Worker code:
```typescript
if (body.review_results) {
  const raw = typeof body.review_results === "string"
    ? JSON.parse(body.review_results)
    : body.review_results;
  // Tool handles parsing and validation server-side
}
```

This eliminates the LLM as a data corruption vector for structured payloads.

### Debugging Custom Tools

When a custom tool fails in an Opal workflow, the error messages can be opaque.
Use this debugging workflow:

1. **Test with curl first.** Send parameters as top-level JSON keys to verify
   the tool logic works independently:
   ```bash
   curl -X POST https://your-worker.workers.dev/tools/my_tool_v0 \
     -H "Content-Type: application/json" \
     -d '{"input_data": "test", "report_date": "2026-02-26"}'
   ```

2. **If curl works but Opal fails,** the issue is likely the request envelope.
   Add temporary debug diagnostics to your error response:
   ```typescript
   const err = {
     status: "error",
     error_message: "Missing required field",
     _debug: {
       body_keys: Object.keys(body),
       field_type: typeof body.your_field,
       field_truthy: !!body.your_field,
     },
   };
   ```

3. **Check Cloudflare logs.** Look at `cpuTimeMs` and `wallTimeMs`. If both
   are near zero, the Worker rejected the request very early (likely a
   validation failure, not a processing error).

4. **Compare Cloudflare version IDs.** After `wrangler deploy`, the version ID
   in the deploy output should eventually match `scriptVersion.id` in the
   Cloudflare trace logs. If they don't match, the new code may not be live yet.

5. **Remove debug diagnostics** once the issue is resolved. They leak internal
   implementation details.

### Existing Custom Tool Examples

- `tools/sustainability-review-docx/` - Cloudflare Worker that generates
  formatted Word documents (.docx) from structured review data. Demonstrates
  the envelope unwrap pattern, discovery endpoint, pass-through pattern for
  large structured data, and CORS handling. Uses the `docx` npm package for
  server-side document generation.

### When to Build a Custom Tool vs. Use Opal's Built-in Tools

Build a custom tool when you need to:
- Generate files in formats Opal doesn't support natively (e.g., .docx, .xlsx)
- Process data server-side to avoid LLM corruption of structured payloads
- Call external APIs that Opal's built-in tools don't cover
- Run compute-intensive operations that would be unreliable in an LLM context

Stick with built-in tools when:
- Opal has a tool that covers your use case (check `references/opal-tools-quickref.md`)
- The data transformation is simple enough for the LLM to handle reliably
- You're writing to CMP (use the two-tool `write_content_to_file` + `write_file_to_library` pattern)

## Common Patterns and Pitfalls

**Anti-hallucination prompting.** For data extraction agents, always include
explicit guardrails: "NEVER fabricate, invent, or guess data. If you cannot
extract a value, set it to null." LLMs will confidently generate plausible data
rather than admitting failure. Make the consequences clear in the prompt.

**Two-tool CMP writer pattern.** Writing files to CMP requires two sequential
calls: `write_content_to_file` (creates the file, returns `opal_file_id`) →
`write_file_to_library` (persists at a CMP path). This requires
`inference_type: "complex_with_thinking"`, not `"simple"`. Always add RULE 3
(max 2 tool calls) and RULE 4 (response is text) from the LLM Guardrail
Patterns section.

**One URL per agent execution.** For scraping pipelines, design the scraper to
process exactly one URL per invocation. The workflow's for_loop step handles
iteration. This keeps agents single-purpose, independently testable, and
resilient to individual URL failures without breaking the batch.

**Structured error returns.** Agents should never crash on bad input. Return the
normal output schema with a status field like `scrape_status: "error"` and a
descriptive `error_message`. This lets downstream agents (and the team reviewing
the CSV) see exactly what failed and why.

**Default parameter values for known URLs.** When a workflow always passes the
same URL (e.g., a CMP download link), set it as the parameter's `default` value
with `required: false`. This prevents failures if the workflow passes a malformed
URL (e.g., missing hash suffix). The agent falls back to the known-good default.

**Sequential rule evaluation for branching.** When an agent needs conditional
behavior based on a parameter value, use the Rule A/B/C catch-all pattern from
the Template Variable Substitution Trap section. Never rely on abstract if/else
branching after template substitution — it's non-deterministic.

**Template variable matching.** Every `[[variable]]` in the prompt must have a
corresponding entry in `parameters`, and every parameter must appear as
`[[parameter_name]]` somewhere in the prompt. Orphaned variables or parameters
cause silent failures at runtime.

**JSON Schema reserved keywords in output schemas.** Never use JSON Schema
reserved keywords as field names in an agent's `output.schema`. The most common
offender is `items` (which JSON Schema uses to define array element schemas),
but `properties`, `type`, `required`, `default`, `enum`, `format`, and others
are also reserved. When Opal validates the agent's output, it interprets the
field name as a schema directive instead of a property name, causing the
validator to reject perfectly valid JSON. The agent then retries with the same
correct output, creating an infinite retry loop. This bug bit us twice on the
sustainability review pipeline (v0.2.1 and v0.6.0) before we added a check to
the export script. Use domain-specific names instead: `programs` not `items`,
`fields` not `properties`, `status` not `type`. The export script
(`tools/export-for-opal.py`) now blocks export if reserved keywords are detected
in output schemas.

**Workflow conditionals for empty results.** Use conditional steps to skip
expensive downstream agents when an upstream agent returns empty results. This
saves inference credits and prevents agents like CSV writers from receiving empty
input (which can trigger fabrication or infinite loops).

**Large file delivery via KV + direct CMP upload.** Files above ~50KB get
truncated or corrupted when passed through LLM tool calls. The LLM silently
drops content, replaces arrays with nulls, or breaks structured data into
fragments. For large outputs (reports, exports, generated documents), use the
KV intermediary pattern: (1) the generating Worker stores the file in Cloudflare
KV and returns a lightweight storage key string, (2) a second Worker endpoint
(`upload_to_cmp_v0`) reads from KV and uploads directly to CMP via the REST API
(OAuth client_credentials flow, pre-signed URL, asset registration). The LLM
only ever handles small string keys, never the file content. This pattern was
proven on the Road Scholar sustainability review pipeline (480KB RTF documents,
40+ programs). See `tools/road-scholar/sustainability-review-tools/` for the
reference implementation. Key lesson: if an agent's output looks correct but
downstream content is missing or corrupted, the ~50KB LLM passthrough limit is
almost certainly the cause.

## Solution Documentation

Every solution (group of agents serving one feature request) should have a
documentation file in `clients/<client-slug>/docs/`. The doc filename matches the
solution namespace in kebab-case (e.g., `activity-notes-audit.md` for the
`ActivityNotes_*` agents).

### When to Generate Docs

Generate or update solution documentation when:
- A new solution (set of related agents) is created
- An agent's parameters, output schema, or behavior changes significantly
- A developer asks to "document" a solution, agents, or pipeline
- A workflow is added or restructured

### Document Structure

Each solution doc has three sections:

**Section 1 — Solution Overview**
- Problem being solved and who uses the output
- List of all agents in the solution (agent_id, type, one-line purpose)
- Pipeline architecture diagram (ASCII art showing the data flow)
- Output description (final deliverable format, columns, where it's saved)
- Key design decisions and their rationale

**Section 2 — Workflow Documentation** (for each workflow agent)
- Agent ID, version, status, trigger type
- Steps table: step number, type, agent, next step
- Data flow table: context variables written and read by each step
- How to run the workflow (prerequisites, trigger instructions)
- Error handling strategy

**Section 3 — Specialized Agent Reference** (for each specialized agent)
- Agent ID, version, status, inference type, creativity, tools, file path
- Purpose (one paragraph)
- Parameters table: name, type, required, default, description
- Output description
- Key behaviors and design notes
- Known risks or limitations (e.g., inference_type mismatches)

End with a **Version History** table tracking significant changes.

### How to Generate Docs from Agent Specs

To generate docs, read all agent JSON files that share the same solution
namespace (matching `agent_id` prefix pattern, e.g., `ActivityNotes_*`). Also
check `registry.json` for agents tagged with the solution name.

For each specialized agent, extract:
- From the JSON: `agent_id`, `version`, `description`, `parameters`, `output`,
  `enabled_tools`, `inference_type`, `creativity`
- From `_nansen`: `status`, `owner`, `tags`
- From the file path: `clients/<client>/agents/<filename>.json`

For each workflow agent, extract:
- From the JSON: `agent_id`, `description`, `steps`, `triggers`,
  `specialized_agents_required`
- Map `step_id` → `next_step_id` chains to build the step flow
- For `for_loop` steps, document `items_source`, `item_name`, and `child_steps`
- For `conditional` steps, document `evaluator_agent_id` and all conditions

### Existing Example

See `clients/road-scholar/docs/activity-notes-audit.md` for a complete example
covering the Activity Notes Audit solution.

## Existing Examples

The `clients/road-scholar/agents/` folder contains working examples of every
pattern you'll encounter. When building new agents, read these for reference:

- `inventory-csv-reader.json` — Single-tool agent redesigned to avoid the
  inference_type trap (uses browse_web_html with a direct download URL). Also
  demonstrates the Rule A/B/C template variable substitution pattern for
  conditional branching.
- `page-scraper.json` — Complex single-tool agent with heavy prompt-side
  processing (HTML extraction, distance calculation, template-filling, and
  gap analysis — all in one browse_web_html call)
- `audit-csv-writer.json` — Two-tool CMP writer pattern with full LLM Guardrail
  Rules (RULE 1-4) preventing infinite loops on empty input. Requires
  `inference_type: "complex_with_thinking"`.
- `csv-writer.json` — Another two-tool CMP writer variant (requires
  `"complex_with_thinking"`)
- `inventory-status-updater.json` — Default parameter value pattern for known
  CMP download URLs with hash suffix
- `completion-notifier.json` — Email notification agent with graceful handling
  of missing upstream data
- `activity-audit-workflow.json` — Full workflow: trigger → conditional reader →
  for_loop(scraper) → writer → status updater → notifier. Demonstrates
  conditional routing to skip the loop when no URLs are found.
- `inventory-sync-workflow.json` — Simpler workflow for inventory management

The solution documentation at `clients/road-scholar/docs/activity-notes-audit.md`
documents the complete Activity Notes Audit solution with all three tiers
(overview, workflow, agent reference). The architecture plan at
`clients/road-scholar/plans/activity-level-audit-pipeline.md` is the original
build-phase plan that preceded the implementation.

For custom tool development, see `tools/sustainability-review-docx/` for a
complete Cloudflare Worker implementation including envelope unwrapping,
discovery endpoint, pass-through data parsing, and CORS handling. The agent
spec at `clients/road-scholar/agents/sustainability-report-writer.json` (v0.3.0)
shows how to configure an Opal agent to call a custom tool with the
pass-through pattern.
