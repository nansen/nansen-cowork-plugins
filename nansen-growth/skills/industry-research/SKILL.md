---
name: industry-research
description: >
  Proactive industry research for customer verticals. Takes a client name or industry
  vertical as input and produces a comprehensive analysis of needs, pain points, and
  opportunities. Works in two modes: "existing client" (enriches with team intelligence)
  or "prospect" (pure industry research). Designed for business development, account
  management, and marketing.

  ALWAYS use this skill when the user says anything like: "research this industry",
  "what are the pain points in [industry]", "industry research for [client]",
  "research [client]'s industry", "what challenges does [industry] face",
  "prepare for a meeting with [client]", "prospect research for [client]",
  "industry analysis", "customer needs analysis", "what does [industry] need",
  or any variation asking about researching a customer's industry, identifying
  needs and pain points, or preparing industry context for sales or account work.

  Also trigger when the user mentions preparing for a new business pitch,
  deepening understanding of an existing client's vertical, or creating
  industry-focused marketing content.
---

# Industry Research -- Proactive Industry Intelligence

You are conducting industry research for Nansen, a digital agency specializing in
digital marketing, web development, and AI-enabled operations. Your job is to build a
comprehensive picture of a customer's industry, focusing on what they need, where they
hurt, and where the opportunities are.

This is NOT passive extraction from a document (that's the Market Research skill). This
is active research -- you go find the information, synthesize it, and produce actionable
intelligence.

## Before You Start

1. Read the intelligence schema from `nansen-core/schema/intelligence-schema.yaml`
2. Check the `intelligence/` folder for any existing intelligence about this client or industry
3. Determine the research mode (existing client or prospect)

## Step 1 -- Understand the Brief

Ask the user (or infer from context):

**Required:**
- What client or industry are we researching? (e.g., "Teledyne" or "aerospace manufacturing")
- What's the purpose? (preparing for a meeting, prospecting, marketing content, deepening account knowledge)

**Determine mode automatically:**
- If the user names a specific client, check intelligence/ for existing files about that client. If files exist, use **Existing Client mode**. If not, use **Prospect mode**.
- If the user names an industry vertical without a specific client, use **Prospect mode**.

Tell the user which mode you're using and why:
- "I can see we have existing intelligence on [client], so I'll build on that."
- "This is a new prospect, so I'll start with fresh industry research."

## Step 2 -- Gather Context (Existing Client Mode Only)

If in Existing Client mode, pull together what we already know:

1. **Intelligence files**: Read all `.intelligence.md` files in `intelligence/` that mention this client in the filename or YAML frontmatter
2. **Slack context**: Search Slack for recent conversations about this client (last 30 days)
3. **Source files**: Check `sources/` for any documents related to this client

Summarize what you found before proceeding: "Here's what we already know about [client]: [brief summary]. Now let me research their industry to fill in the gaps."

## Step 3 -- Industry Research

This is the core research phase. Use web search to build a comprehensive picture across five research areas. Be thorough -- run multiple searches per area to get diverse perspectives.

### 3.1 Industry Overview
Research the industry vertical to understand:
- Industry size, growth trajectory, and key segments
- Major players and market structure
- Regulatory environment and compliance landscape
- Geographic dynamics (where the industry is concentrated, regional differences)
- Recent history (what's changed in the last 2-3 years)

Search suggestions: "[industry] market overview 2026", "[industry] market size trends", "[industry] regulatory landscape"

### 3.2 Customer Needs and Pain Points
This is the most important section. Dig deep into what organizations in this industry struggle with:

**Digital and technology pain points:**
- Legacy system challenges, technical debt
- Data silos, integration complexity
- Digital customer experience gaps
- Cybersecurity and compliance burden
- Talent and skills shortages in digital roles

**Business and operational pain points:**
- Cost pressures, margin compression
- Supply chain complexity
- Customer acquisition and retention challenges
- Competitive pressure from digital-native disruptors
- Regulatory compliance costs

**Marketing and growth pain points:**
- Difficulty reaching and engaging customers digitally
- Content creation at scale
- Personalization challenges
- Attribution and ROI measurement
- Brand differentiation in a crowded market

Search suggestions: "[industry] digital transformation challenges", "[industry] marketing pain points", "[industry] CIO priorities 2026", "[industry] CMO challenges"

### 3.3 Market Opportunities
Identify where the opportunities lie:

- Digital transformation initiatives gaining momentum
- Emerging technology adoption (AI, automation, personalization)
- Customer experience improvement initiatives
- Data and analytics maturity progression
- New channels or market segments opening up
- Regulatory changes creating new requirements (and therefore new projects)

Search suggestions: "[industry] digital transformation opportunities", "[industry] technology investment priorities", "[industry] growth areas 2026"

### 3.4 Competitive and Technology Landscape
Map the technology ecosystem:

- Which marketing/technology platforms dominate in this industry?
- What CMS, CRM, CDP, and marketing automation tools are common?
- Which system integrators and agencies are active?
- What are the emerging technology bets (AI agents, composable architectures, etc.)?

Search suggestions: "[industry] martech stack", "[industry] technology partners", "[industry] digital agencies"

### 3.5 Industry-Specific Trends and Signals
Capture what's happening right now:

- Key themes from recent industry conferences or analyst reports
- Shifts in buying behavior or decision-making
- Emerging use cases for AI and automation
- Notable wins, losses, or pivots from major players

Search suggestions: "[industry] trends 2026", "[industry] conference highlights", "[industry] analyst reports"

## Step 4 -- Synthesize and Structure

Now bring everything together into a structured intelligence file. The output should be framed specifically for business development and account management use.

### Output Structure

```markdown
---
title: "[Industry] Industry Research: Needs, Pain Points, and Opportunities"
date: [today's date]
source_type: web-research
client: [client-slug or null]
industry: [industry-slug]
domains:
  - sales-intelligence
  - industry-trends
  - market-research
participants: []
version: 1
updated: "[ISO-8601 now]"
updated_by: "industry-research skill"
confidence: medium
summary: "[2-3 sentence executive summary of the most important findings]"
---

# [Industry] Industry Research

## Executive Summary
[3-4 paragraphs covering the big picture: what this industry looks like right now,
what the major pressures are, and where the opportunities lie for a digital agency
like Nansen. This should be useful standalone -- someone should be able to read just
this section and walk into a meeting prepared.]

## Industry Overview
[Market size, structure, key players, regulatory context, recent shifts]

## Customer Needs and Pain Points
[The heart of the research. Organized by category: digital/technology, business/operational,
marketing/growth. Be specific -- name actual challenges, not generic statements.
Where possible, quantify the pain (% of companies affected, cost of the problem, etc.)]

### Digital and Technology Pain Points
[Specific challenges with systems, data, digital capabilities]

### Business and Operational Pain Points
[Cost pressures, competitive dynamics, operational friction]

### Marketing and Growth Pain Points
[Customer acquisition, personalization, content, attribution]

## Opportunities for Digital Services
[Where a digital agency can add value. Map opportunities to specific pain points.
Think about: what projects would these companies fund? What RFPs are they likely
to issue? What problems would they pay to solve?]

## Competitive and Technology Landscape
[Who else is serving this industry? What tech platforms dominate?
Where are the gaps that Nansen could fill?]

## Trends and Signals
[What's happening right now that creates urgency or opportunity?]

## Existing Intelligence
[Only in Existing Client mode: summary of what we already knew, and how this
research adds to or updates that picture]

---

## Research Context
- **Researched on**: [today's date]
- **Mode**: [Existing Client / Prospect]
- **Researched by**: industry-research skill v0.1.0
- **Sources consulted**: [list key sources/URLs used]
```

## Step 5 -- Write and Report

Write the intelligence file to the `intelligence/` folder using the deterministic filename:
`YYYY-MM-DD_[client-slug]_web-research_[industry]-industry-research.intelligence.md`

If no specific client: `YYYY-MM-DD_internal_web-research_[industry]-industry-research.intelligence.md`

Present a summary to the user:
- File saved to: [path]
- Mode: [Existing Client / Prospect]
- Top 3 pain points identified
- Top 3 opportunities identified
- Suggested next step: "Run the Solutions Positioning skill on this to map these findings to Nansen's capabilities"

## Step 6 -- Offer Next Steps

After presenting results, offer:

1. **Deep dive** -- "Want me to dig deeper into any of these areas?"
2. **Solutions positioning** -- "I can map these findings to Nansen's services and create positioning recommendations. Want me to run the Solutions Positioning skill?"
3. **Save for meeting prep** -- "I can format the key points as talking points for your meeting"
4. **Share with the team** -- "This is already in the intelligence/ folder and syncing to Drive"

## Quality Standards

- **Be specific**: "73% of aerospace manufacturers cite legacy ERP integration as their top digital challenge" beats "companies in this industry have integration challenges"
- **Cite your sources**: Note where key findings came from so the team can dig deeper
- **Distinguish fact from inference**: If you're connecting dots rather than reporting direct findings, say so
- **Think like a seller**: Frame everything through the lens of "what would Nansen sell into this?" The reader is preparing for a business development conversation, not writing an academic paper
- **Stay current**: Prioritize recent information (last 12 months). Industry landscapes shift fast
- **Be honest about gaps**: If you couldn't find solid information on an area, say so rather than padding with vague statements
