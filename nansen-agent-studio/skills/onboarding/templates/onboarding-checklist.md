# Agent Studio Onboarding — Progress Checklist

**Developer:** _____________
**Date:** _____________

## Stage 1: Setup
- [ ] Workspace folder created (`clients/onboarding-<name>/agents/` and `docs/`)
- [ ] Repo structure explained (clients → agents → exports)
- [ ] `_nansen` metadata concept understood

## Stage 2: Planning the URL Reader
- [ ] Described the agent's purpose in plain English
- [ ] Mapped description to CLEAR framework sections
- [ ] Identified the tool needed: `browse_web_html`
- [ ] Understood inference_type: 1 tool = `simple`

## Stage 3: Building the URL Reader
- [ ] Named the agent following conventions (agent_id, name, filename)
- [ ] Defined parameters: `url`
- [ ] Defined output schema with error handling fields
- [ ] Built the prompt using CLEAR framework
- [ ] Understood `[[variable]]` → parameter mapping
- [ ] Used Python programmatic JSON editing
- [ ] Validation passed: valid JSON
- [ ] Validation passed: variable/parameter match
- [ ] Validation passed: inference_type correct
- [ ] Validation passed: `_nansen` block present
- [ ] Exported with `export-for-opal.py`
- [ ] Export verified: no `_nansen`, all fields present

## Stage 4: Building the Summary Writer
- [ ] Understood the two-step CMP write pattern
- [ ] Correctly identified `inference_type: "standard"` (2 tools)
- [ ] Understood the inference_type trap (simple = 1 tool call total)
- [ ] Defined parameters: `page_info_array`, `output_filename`
- [ ] Defined output schema with partial failure handling
- [ ] Built the prompt with two-tool workflow
- [ ] Validation passed (all checks)
- [ ] Exported and verified

## Stage 5: Wiring the Workflow
- [ ] Understood workflow vs specialized agent difference
- [ ] Built workflow JSON with correct `agent_type: "workflow"`
- [ ] Created for_loop step with `items_source`
- [ ] Chained steps with `next_step_id`
- [ ] Listed agents in `specialized_agents_required`
- [ ] Validation passed (workflow-specific checks)
- [ ] Exported and verified

## Stage 6: Documentation
- [ ] Created solution doc with three sections
- [ ] Solution Overview complete
- [ ] Workflow Documentation complete
- [ ] Agent Reference complete

## Stage 7: Debugging
- [ ] Bug 1: Introduced parameter mismatch (`url` → `webpage_url`)
- [ ] Bug 1: Spotted literal `[[url]]` in Opal execution log tool call
- [ ] Bug 1: Practiced the paste-the-log debugging workflow
- [ ] Bug 1: Fixed the mismatch and re-exported
- [ ] Bug 2: Renamed `page_title` to `properties` (reserved keyword)
- [ ] Bug 2: Saw export script block the export with a clear error
- [ ] Bug 2: Understood why JSON Schema reserved keywords cause infinite loops
- [ ] Bug 2: Fixed the field name and re-exported
- [ ] Reviewed the debugging cheat sheet (failure signatures table)

## Stage 8: Review & Next Steps
- [ ] Reviewed mapping to production patterns (Road Scholar comparison)
- [ ] Received Opal sandbox import instructions
- [ ] Onboarding workspace cleaned up
- [ ] Read conversational patterns reference

## Concepts Mastered
- [ ] CLEAR prompt framework
- [ ] inference_type decision tree
- [ ] `[[variable]]` ↔ parameter matching
- [ ] Programmatic JSON editing with Python
- [ ] Export pipeline (`export-for-opal.py`)
- [ ] Validation checklist pattern
- [ ] Two-step CMP write (`write_content_to_file` → `write_file_to_library`)
- [ ] Workflow orchestration (steps, for_loop, next_step_id)
- [ ] Solution documentation template
- [ ] Conversational development workflow (plan → build → validate → iterate)
- [ ] Debugging workflow: grab log → paste into chat → describe expected behavior
- [ ] Recognizing common failure signatures in Opal execution logs
- [ ] Using the export script as a pre-import safety net
