# nansen-core

Shared intelligence foundation for Nansen's AI plugin ecosystem. This plugin provides the core infrastructure that all domain plugins (growth, marketing, delivery, finance) build on.

## What It Does

nansen-core turns raw source material (meeting transcripts, documents, research) into structured intelligence files that sync to a shared Google Drive. Think of it as the foundation layer: it defines how intelligence is formatted, stored, and shared across the team.

## Quick Start

1. Run `/setup` to create your folder structure and connect Google Drive
2. Run `/onboarding` for a guided tour of how everything works
3. Drop a PDF or transcript into `sources/` and ask to extract intelligence

## Commands

| Command | Purpose |
|---------|---------|
| `/setup` | Technical environment setup (folders, Drive, Fathom, Slack) |
| `/onboarding` | Guided walkthrough for new team members (~25 min) |

## Skills

| Skill | Purpose |
|-------|---------|
| Market Research | Extract market trends, competitive signals, and client intelligence from source documents |

## Folder Structure

```
nansen/
  sources/        Raw input (transcripts, PDFs, notes) -- local only
  intelligence/   Extracted knowledge -- syncs to Google Drive
  outputs/        Generated deliverables -- local only
```

## Intelligence File Format

All intelligence files use YAML frontmatter + markdown body. See `schema/intelligence-schema.yaml` for the full specification. Files follow a deterministic naming pattern:

```
YYYY-MM-DD_client-slug_source-type_title-slug.intelligence.md
```

## Version

0.1.0 (Phase 1 POC)

## Architecture

This plugin is Tier 1 in Nansen's three-tier plugin hierarchy:
- **Tier 1 (nansen-core)**: Shared utilities, schema, setup, onboarding
- **Tier 2 (domain plugins)**: Growth, marketing, delivery, finance
- **Tier 3 (personal plugins)**: Individual customizations (e.g., nansen-arnold)

See the full architecture document for details.
