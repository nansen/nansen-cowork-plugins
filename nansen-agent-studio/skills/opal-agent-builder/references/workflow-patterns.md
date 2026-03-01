# Opal Workflow Patterns Reference

Proven patterns extracted from production Opal agent workflows. Use these when designing new specialized agents and workflows.

---

## Pattern 1: CMP as Shared State (Write-then-Read-Back)

**Problem:** Passing large or complex data between workflow steps through the LLM context causes data loss. LLMs replace large structured objects with null, false, or truncated values when constructing tool calls.

**Solution:** Write data to CMP (tasks, files, or library assets) in an early step, then read it back from CMP in later steps using just the resource ID. The LLM only passes lightweight IDs between steps - never the full data payload.

**Flow:**
```
Agent A: Creates/writes data to CMP → returns resource_id
Agent B: Receives resource_id → calls get_cmp_resource(resource_id) → gets full data
```

**When to use:**
- Any workflow where findings, analysis results, or structured data exceeds ~500 tokens
- When the same data needs to be consumed by multiple downstream agents
- When you've observed LLM data passthrough failures (null/false/truncated values in tool calls)

**Example (from ES-CMP Task Creation pipeline):**
```
Create Tasks agent: calls create_task → returns {task_id, End Date}
Extract Step Info agent: receives task_id → calls get_cmp_resource(task_id) → extracts full workflow_details
```

The LLM never has to reproduce the workflow_details structure - it reads it fresh from CMP each time.

**CMP storage options:**
- `create_task` / `get_cmp_resource` - for structured CMP objects (tasks, campaigns)
- `write_content_to_file` + `write_file_to_library` / `cmp_retrieve_asset_from_library` - for files (JSON, CSV, documents)
- `write_content_to_file` / `read_content_from_file` - for Opal backend files (temporary, not persisted to CMP Library)

**Nansen application:** For the sustainability review pipeline, PolicyAnalyzer writes findings JSON to a file via `write_content_to_file`, returns the `opal_file_id`. Report Writer receives the ID and reads the file content via `read_content_from_file` before passing to the Worker. The LLM handles a file ID (tiny) instead of reproducing nested findings arrays (huge).

---

## Pattern 2: Pseudocode Prompt Style

**Problem:** Prose-based prompts leave room for LLM interpretation, leading to inconsistent behavior across runs.

**Solution:** Write prompts as structured pseudocode with explicit INPUT/PROCESS sections, variable assignments, and numbered steps.

**Format:**
```
**INPUT**
[[parameter_name]] is a list of objects containing:
1. field_a
2. field_b

**PROCESS**
1. for item in [[parameter_name]]:
   1. call `tool_name` with:
      1. param_x = item["field_a"]
      2. param_y = item["field_b"]
   2. let result_id = output["data"][0]["_id"]
   3. item["new_field"] = result_id
2. return processed [[parameter_name]]
```

**When to use (instead of CLEAR):**
- Deterministic agents that follow a fixed sequence of tool calls
- Data transformation agents (CSV processing, field mapping, date calculations)
- Any agent where the logic is procedural, not analytical

**When to stick with CLEAR:**
- Analytical agents that need reasoning (policy analysis, content evaluation)
- Agents with complex conditional branching that benefits from prose explanation
- Creative/generative agents
- Any agent where the LLM needs to interpret, evaluate, or make judgment calls

**Relationship to CLEAR:** CLEAR is the default prompt framework for Nansen agents.
Pseudocode is an alternative for the subset of agents that are purely procedural
(CRUD, data mapping, sequential tool calls with no analysis). Most agents benefit
from CLEAR's structured prose. Choose pseudocode only when there is genuinely
nothing for the LLM to reason about - just "call tool, extract field, pass to
next tool."

**Combines well with:** `inference_type: "simple_with_thinking"` for straightforward CRUD, `"code"` for maximum faithfulness on data passthrough.

---

## Pattern 3: Progressive Data Enrichment

**Problem:** A single agent trying to do too much leads to context bloat, errors, and hard-to-debug failures.

**Solution:** Chain narrow agents where each one takes a specific data shape, enriches it with one concern, and outputs a slightly evolved shape. The data schema morphs step by step through the pipeline.

**Example data shape evolution:**
```
Step 1 output: {task_id, End Date, workflow_id}
Step 2 output: {task_id, End Date}  (workflow_id consumed, dropped)
Step 3 output: {task_id, End Date, workflow_step_details[]}  (enriched from CMP)
Step 4 output: {task_id, End Date, workflow_step_details[] with due dates}  (calculated)
Step 5 output: {task_title, task_url, workflow_name, due_date}  (final shape for export)
```

**Rules:**
- Each agent adds or transforms ONE concern
- Drop fields that are no longer needed downstream (keeps payloads small)
- Output schema of Agent N should map cleanly to input parameters of Agent N+1
- Use strict JSON output schemas with `required` fields to enforce the contract

---

## Pattern 4: Internal Iteration vs. Workflow Loops

**Two approaches to processing multiple items:**

**A) Workflow `for_loop` step** (used in sustainability review pipeline):
- Each item gets its own agent execution with isolated context
- Better for items that need heavy processing (web scraping, multi-tool analysis)
- Supports parallel execution
- Higher overhead per item (separate LLM calls)

**B) Internal iteration in prompt** (used in ES-CMP pipeline):
- Agent loops over items within a single execution (`for item in task_items`)
- Better for lightweight operations (CRUD calls, field updates)
- Keeps workflow flat with no nesting
- Lower overhead but needs enough context window for all items
- Simpler debugging (single agent execution log)

**Rule of thumb:** Use workflow `for_loop` when each item needs >2 tool calls or independent analysis. Use internal iteration when each item needs 1-2 simple tool calls.

---

## Pattern 5: Inference Type Tiering

Match inference cost to task complexity:

| Inference Type | Use For | Examples |
|---|---|---|
| `simple_with_thinking` | Straightforward CRUD, data mapping, CSV processing | Create tasks, process CSV, send email, update fields |
| `complex_with_thinking` | Multi-step reasoning, date math, conditional logic | Calculate due dates with holiday/weekend rules, extract and restructure nested data |
| `code` | Maximum faithfulness on data passthrough, deterministic sequences | Report compilation, tool call chains where data integrity is critical |

---

## Pattern 6: Workflow Layout Conventions

**For the Opal workflow editor UI:**

- **Sequential steps**: Space horizontally with ~300px gaps between nodes
- **Looped child agents**: Space horizontally within the loop container with ~570px between them so they're clearly visible (not overlapping)
- **Post-loop agents**: Position after the loop container with adequate spacing (~150px+ gap from loop boundary)
- **All nodes at consistent y-positions** where possible for clean horizontal flow

**Example (ES-CMP pipeline):** All 7 sequential agents at y:150, spaced at x intervals of 300px. Clean horizontal line.

**Example (Sustainability Review pipeline):** Loop children at x:60 and x:630 (570px gap), post-loop Report Writer at x:1875.
