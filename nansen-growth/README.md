# nansen-growth

Growth domain plugin for Nansen's AI plugin ecosystem. Provides proactive industry research and solutions positioning capabilities for business development, account management, and marketing.

## What It Does

nansen-growth helps you research customer industries and position Nansen's services against identified needs. It's designed for three use cases: deepening understanding of existing accounts, fueling marketing content with industry insights, and researching prospects for net new sales.

## Skills

| Skill | Purpose |
|-------|---------|
| Industry Research | Research a customer's industry to identify needs, pain points, and opportunities |
| Solutions Positioning | Map identified needs to Nansen's capabilities with positioning recommendations |

## How the Skills Chain Together

```
Industry Research                    Solutions Positioning
(input: client or industry)    ->    (input: industry research output)
(output: needs, pain points,         (output: which Nansen services
 opportunities, trends)               address which needs, proof points,
                                      recommended approach)
```

## Two Modes

**Existing client** - Enriches research with your team's existing intelligence about that client (past meeting insights, project history, relationship context from the intelligence/ folder).

**Prospect / net new** - Pure industry research starting from scratch. Useful for preparing for a first meeting or building marketing content.

## Prerequisites

Requires nansen-core to be installed (provides the intelligence file schema, folder structure, and extraction foundation).

## Architecture

This is a Tier 2 domain plugin in Nansen's three-tier hierarchy:
- Tier 1: nansen-core (shared foundation)
- **Tier 2: nansen-growth** (this plugin - growth and business development)
- Tier 3: Personal plugins (individual customizations)
