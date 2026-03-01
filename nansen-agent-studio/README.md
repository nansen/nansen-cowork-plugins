# Nansen Opal Agent Studio

Local-first repository for Optimizely Opal agent specs. Designed for reuse across clients, version control in GitHub, and direct import into Opal instances.

---

## Folder Structure

```
opal-agents/
├── registry.json                         # Central index of every agent
├── schema/
│   └── agent-spec.schema.json            # JSON Schema for validation
├── templates/
│   └── agents/
│       └── _blank-agent.json             # CLEAR-structured starter
├── clients/
│   └── <client-slug>/
│       └── agents/
│           └── <agent-name>.json         # Client-specific agent specs
└── Instructions/
    └── <reference documents>
```

## Conventions

### Naming

| Item | Convention | Example |
|---|---|---|
| Client folder | `kebab-case` slug | `road-scholar` |
| Agent file | `kebab-case` matching purpose | `inventory-builder.json` |
| `agent_id` field | `PascalCase_PascalCase` | `ActivityNotes_InventoryBuilder` |
| `version` field | Semantic versioning | `1.0.0` |

### Agent ID Pattern

```
<Solution>_<AgentName>
```

For namespaced client identification, the `_nansen.client` field tracks which client owns the instance. The `agent_id` stays solution-scoped so templates can be reused.

### Status Lifecycle

`draft` → `in-progress` → `review` → `production` → `deprecated`

Tracked in both the agent file (`_nansen.status`) and the registry.

### The `_nansen` Block

Every agent file includes a `_nansen` object for Nansen-internal metadata that is **not** sent to Opal:

- `client` — which client this belongs to
- `template_source` — agent_id of the template it was derived from (null if original)
- `status` — development lifecycle status
- `owner` — Nansen team member responsible
- `tags` — freeform tags for grouping and search
- `last_synced_to_opal` — ISO timestamp of last push to a live Opal instance

### Prompt Template Standard

All prompt templates use the **CLEAR** framework:

1. **Context** — Role and objective
2. **Logic** — Numbered step-by-step processing rules
3. **Expectations** — Quality constraints and schema requirements
4. **Actions** — Concrete tool calls and operations
5. **Refinement** — Error handling and edge case behavior

Variables use `[[double_bracket]]` syntax matching Opal's template engine.

## Workflows

### Adding a new client

1. Create `clients/<client-slug>/agents/`
2. Copy `templates/agents/_blank-agent.json` into the new folder
3. Fill in agent details, set `_nansen.client` to the client slug
4. Add an entry to `registry.json`

### Creating an agent from a template

1. Copy the template file to the target client folder
2. Rename to match the agent's purpose
3. Fill in all empty fields
4. Update `_nansen.template_source` with the source template's agent_id (if applicable)
5. Add to `registry.json`

### Promoting to production

1. Update `_nansen.status` to `production`
2. Bump `version` appropriately
3. Update `registry.json` to reflect the new status and version
4. Record `_nansen.last_synced_to_opal` after deploying to the live Opal instance

## Validation

Agent specs can be validated against `schema/agent-spec.schema.json` using any JSON Schema validator:

```bash
# Example with ajv-cli
npx ajv validate -s schema/agent-spec.schema.json -d clients/road-scholar/agents/inventory-builder.json
```

## Git Workflow

- Branch per agent or per client engagement
- PR reviews for `production` status changes
- Tag releases with `<client>/<agent-id>/v<version>`
