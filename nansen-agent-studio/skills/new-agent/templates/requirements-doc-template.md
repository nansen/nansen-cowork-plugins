# {{Solution Name}} - Requirements Document

**Client:** {{Client Name}}
**Date:** {{Date}}
**Author:** {{Author}}
**Status:** Draft | Approved | In Build

## Summary

One-paragraph description of what this solution does and why the client needs it.

## Requirements

### Purpose

What problem does the agent solve? What does the client currently do manually?

### Scope

- **In scope:** What content, pages, data, or workflows are covered.
- **Out of scope:** What is explicitly excluded from this solution.

### Inputs

| Input | Source | Format | Notes |
|-------|--------|--------|-------|
| e.g. URL inventory | CMP library | CSV | Uploaded by client monthly |
| e.g. Live sitemap | Client website | XML | Pulled automatically |

### Outputs

| Output | Destination | Format | Frequency | Notes |
|--------|------------|--------|-----------|-------|
| e.g. Audit report | CMP library | CSV | Daily | Overwrites previous |

### Scheduling

How often does this run? On-demand, daily, weekly? Any trigger conditions?

## Architecture

### Agent Architecture

| Agent | Role | Inference Type | Tools | Input | Output |
|-------|------|---------------|-------|-------|--------|
| e.g. sitemap-scanner | Fetch and parse sitemap | simple | fetch_url | Sitemap URL | URL list |
| e.g. page-auditor | Audit each page | standard | fetch_url, write_content_to_file | URL list | Audit CSV |

### Data Flow

Describe how data moves between agents. Include scale considerations.

```
[Agent 1] -> (URL list, ~400 items) -> [Agent 2] -> (CSV, ~400 rows) -> [CMP]
```

### Design Decisions

For each non-obvious architectural choice, explain the reasoning:

- **Why X agents instead of Y:** ...
- **Why inference_type is set to Z:** ...
- **Why data flows through files instead of LLM output:** ...

## Assumptions

Things assumed to be true but not confirmed with the client. Each should be flagged for confirmation.

- [ ] e.g. The sitemap includes all active trip pages
- [ ] e.g. The client wants the report to overwrite (not append) each run

## Open Questions

Things that need answers before build can proceed, or that may change the architecture.

- [ ] e.g. Does the client need historical comparison between runs?
- [ ] e.g. What should happen when a page returns a 404?

## Acceptance Criteria

How do we know this is done and working?

- [ ] e.g. All trip pages from sitemap are audited
- [ ] e.g. Output CSV matches expected format
- [ ] e.g. Runs complete within 30 minutes
