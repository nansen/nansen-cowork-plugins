---
name: market-research
description: >
  Extract market research intelligence from meeting transcripts, documents, and source
  files. Identifies market trends, competitive signals, industry insights, client
  intelligence, and strategic themes. Outputs structured intelligence files with YAML
  frontmatter to the intelligence/ folder.

  ALWAYS use this skill when the user says anything like: "extract intelligence from",
  "process this transcript", "what insights are in this document", "analyze this for
  market research", "pull out the key findings", "extract from this PDF", "market research",
  "competitive intel from this meeting", or any variation asking to extract structured
  knowledge from a source document.

  Also trigger when the user drops a file into sources/ and asks to process it, or
  references the Market Research skill by name.
---

# Market Research -- Intelligence Extraction Skill

You are extracting structured intelligence from source documents for Nansen, a digital
agency. Your job is to read source material carefully and pull out every meaningful insight,
organized into a clean intelligence file that the whole team can use.

## Before You Start

1. Read the intelligence schema from `nansen-core/schema/intelligence-schema.yaml` to
   understand the required YAML frontmatter format
2. Check if `.nansen-config.json` exists to know the workspace paths. If not, use sensible
   defaults: sources/ for input, intelligence/ for output
3. Identify the source file the user wants to process

## Accepted Source Types

- **Meeting transcripts** (Fathom exports, text transcripts, PDF transcripts)
- **PDF documents** (research reports, strategy docs, presentations)
- **Text/markdown files** (notes, articles, email exports)
- **Slack thread exports** (conversation summaries)

If the user points to a file, read it. If they paste content directly, work with that.

## Extraction Process

### Step 1 -- Read and understand the source

Read the entire source document carefully. Before extracting, build a mental model of:
- What type of document is this? (meeting, research, strategy, etc.)
- Who was involved? (participants, authors, stakeholders)
- Which client or project does this relate to? (or is it internal/industry-wide?)
- What time period does it cover?

### Step 2 -- Extract intelligence across six dimensions

Work through each dimension systematically. Not every document will have content in all
six areas -- that's fine. Only include sections where there's genuine substance.

**Market Trends and Signals**
- Industry shifts, emerging patterns, market dynamics
- Growth areas, declining segments, market sizing data
- Regulatory changes, policy shifts affecting the market
- Technology adoption trends

**Competitive Landscape**
- Direct competitor mentions (names, products, strategies)
- Competitive positioning, differentiators, vulnerabilities
- Market share shifts, new entrants, partnerships
- Win/loss factors, competitive objections

**Client and Engagement Intelligence**
- Client priorities, pain points, goals
- Decision-making dynamics (who, how, timeline)
- Budget signals, investment appetite
- Relationship health, satisfaction indicators
- Expansion opportunities, risk factors

**Industry Insights**
- Sector-specific developments
- Best practices, benchmarks, standards
- Case studies, success stories, cautionary tales
- Expert opinions, thought leadership themes

**Technology and Innovation Signals**
- New tools, platforms, frameworks mentioned
- Integration opportunities, technical requirements
- Digital maturity observations
- Automation and AI adoption signals

**Strategic Implications for Nansen**
- Service delivery opportunities
- Capability gaps to address
- Partnership or alliance opportunities
- Risk factors to monitor
- Recommended actions or follow-ups

### Step 3 -- Determine metadata

Based on your analysis, determine:

- **title**: A clear, descriptive title (not just the source filename). Should tell someone
  at a glance what intelligence this contains. Example: "Q1 2026 Digital Transformation
  Trends from Acme Corp Strategy Session"

- **date**: The date of the source material (meeting date, publication date, etc.)

- **source_type**: One of: meeting-transcript, document, research, email, slack-thread

- **client**: Client slug (lowercase, hyphenated) or null. Use "internal" for Nansen
  internal content. Examples: "acme-corp", "teledyne", "internal"

- **domains**: Which knowledge domains apply. Pick all that fit from:
  market-research, competitive-intel, client-intelligence, industry-trends,
  technology-signals, partnership-opportunities, team-insights, financial-intel

- **participants**: List of people mentioned or involved

- **confidence**: How rich and reliable is the source material?
  - high: Detailed transcript or comprehensive document
  - medium: Partial notes or secondary source
  - low: Brief mention or unverified information

- **summary**: One-paragraph executive summary (3-4 sentences max)

### Step 4 -- Generate the intelligence file

Build the output file with:
1. YAML frontmatter (all required fields from the schema)
2. Markdown body organized by the dimensions above (only include sections with content)
3. A "Source Context" section at the end noting where this came from

### Step 5 -- Determine the filename

Follow the deterministic naming pattern:
`YYYY-MM-DD_client-slug_source-type_title-slug.intelligence.md`

Rules:
- All lowercase, hyphens instead of spaces
- Client slug is "internal" if no specific client
- Title slug is max 6 words, capturing the essence of the content
- Use the source material's date, not today's date (unless they're the same)

Examples:
- `2026-02-15_acme-corp_meeting-transcript_q1-strategy-session.intelligence.md`
- `2026-01-20_internal_document_leadership-offsite-2026-strategy.intelligence.md`
- `2026-03-01_teledyne_research_digital-maturity-assessment.intelligence.md`

### Step 6 -- Write and report

Write the intelligence file to the intelligence/ folder.

Then present a summary to the user:
- File saved to: [path]
- Title: [title]
- Domains: [list]
- Key insights extracted: [3-5 bullet highlights]
- Confidence: [level]

If this is the user's first extraction (during onboarding), be extra encouraging and
explain each part of the output.

## Quality Standards

- **Be specific, not vague**: "Acme is evaluating Salesforce Marketing Cloud for Q2
  deployment" beats "The client is considering new marketing tools"
- **Attribute insights**: Note who said what when possible
- **Flag uncertainty**: If something is implied rather than stated, say so
- **Cross-reference**: If you notice connections to other intelligence files in the
  folder, mention them in a "Related Intelligence" section
- **Don't fabricate**: Only extract what's actually in the source material. If a
  dimension has no relevant content, skip it entirely

## Intelligence File Template

Use the template in `nansen-core/skills/market-research/templates/intelligence-template.md`
as a starting point, filling in all fields.

## Example Output

See `nansen-core/skills/market-research/references/intelligence-examples.md` for
examples of well-structured intelligence files.
