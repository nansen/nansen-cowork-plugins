# Intelligence File Examples

These examples show what well-structured intelligence files look like. Use these as reference when reviewing extraction quality.

---

## Example 1: Meeting Transcript Extraction

```markdown
---
title: "Q1 2026 Digital Strategy Priorities from Acme Corp Quarterly Review"
date: 2026-01-28
source_type: meeting-transcript
client: acme-corp
domains:
  - client-intelligence
  - technology-signals
  - market-research
participants:
  - "Arnold Macauley"
  - "Sarah Chen (Acme, VP Digital)"
  - "Marcus Webb (Acme, CTO)"
  - "Lisa Park (Nansen, Account Lead)"
version: 1
updated: "2026-01-28T16:30:00Z"
updated_by: "market-research skill"
confidence: high
summary: "Acme Corp is prioritizing AI-powered personalization for their e-commerce platform in Q1, with a $2M budget allocation. They're evaluating Optimizely and Adobe Experience Platform, with a decision expected by mid-February. Key concern is integration with their existing Salesforce stack."
---

# Q1 2026 Digital Strategy Priorities from Acme Corp Quarterly Review

## Client and Engagement Intelligence

Sarah Chen outlined three digital priorities for Q1 2026. First, AI-powered product recommendations on their e-commerce platform, which currently drives 40% of revenue. Second, a unified customer data platform to consolidate data from six separate systems. Third, improving mobile conversion rates, which lag desktop by 35%.

Budget allocation for Q1 digital initiatives is $2M, approved at board level. Marcus Webb confirmed the CTO office has authority to select vendors without additional approval up to $500K per contract.

Decision timeline: vendor shortlist by February 14, proof-of-concept phase through March, production rollout starting Q2.

## Technology and Innovation Signals

Acme is evaluating two platforms for their personalization initiative: Optimizely (specifically the content and commerce features) and Adobe Experience Platform. Marcus expressed concern about Adobe's implementation timeline based on a peer company's experience -- "They told us it took 9 months just to get basic personalization running."

Integration with Salesforce Marketing Cloud is a hard requirement. Both platforms need to sync customer segments bidirectionally. Marcus mentioned they've had challenges with their current Segment CDP setup and are open to replacing it.

## Strategic Implications for Nansen

Strong opportunity to lead the Optimizely implementation given Nansen's existing partnership. The Salesforce integration requirement aligns with our CRM practice capabilities. Recommend scheduling a technical deep-dive with Marcus before the February 14 shortlist deadline.

Risk factor: Acme's internal IT team is stretched thin with a SAP migration running in parallel. Implementation support expectations will be high.

---

## Source Context

- **Source file**: 2026-01-28_acme-quarterly-review.transcript.md
- **Extracted on**: 2026-01-28
- **Extracted by**: market-research skill v0.1.0
```

---

## Example 2: Research Document Extraction

```markdown
---
title: "AI Agent Market Landscape and Adoption Trends - January 2026"
date: 2026-01-15
source_type: research
client: null
domains:
  - market-research
  - technology-signals
  - competitive-intel
participants: []
version: 1
updated: "2026-01-20T10:00:00Z"
updated_by: "market-research skill"
confidence: medium
summary: "The AI agent market is projected to reach $47B by 2028. Enterprise adoption is accelerating, with 60% of Fortune 500 companies running agent pilots. Key battleground is agent orchestration platforms, where Anthropic, OpenAI, and Microsoft are competing directly."
---

# AI Agent Market Landscape and Adoption Trends - January 2026

## Market Trends and Signals

Enterprise AI agent adoption hit an inflection point in late 2025. According to the report, 60% of Fortune 500 companies now have at least one AI agent pilot in production, up from 15% a year ago. The total addressable market for AI agents is projected at $47B by 2028, growing at roughly 85% CAGR.

The shift from "chatbot" to "agent" framing is significant. Buyers are looking for autonomous task completion, not just conversational interfaces. This changes the sales motion from IT/innovation budgets to operational efficiency budgets.

## Competitive Landscape

Three platforms are emerging as agent orchestration leaders: Anthropic (Claude/Cowork), OpenAI (GPT Agents), and Microsoft (Copilot Studio). Each has a different go-to-market: Anthropic focuses on developer tools and enterprise partnerships, OpenAI leads in consumer awareness and API volume, Microsoft leverages its Office 365 installed base.

Smaller players gaining traction include Relevance AI (no-code agent builder), CrewAI (open-source multi-agent framework), and Langchain (developer infrastructure).

## Strategic Implications for Nansen

The agent market growth validates Nansen's investment in Optimizely Opal and the broader plugin architecture. Positioning recommendation: focus on "agent implementation services" rather than "AI consulting" -- clients want practitioners who can build and deploy, not just advise.

Opportunity to develop a repeatable agent assessment framework that helps clients evaluate where agents can replace or augment existing workflows.

---

## Source Context

- **Source file**: ai-agent-market-report-jan-2026.pdf
- **Extracted on**: 2026-01-20
- **Extracted by**: market-research skill v0.1.0
```

---

## Key Qualities of Good Intelligence Files

1. **Specific over vague** -- Names, numbers, dates, and direct quotes beat general statements
2. **Attributed** -- Note who said what and in what context
3. **Actionable** -- The "Strategic Implications" section should give someone a clear next step
4. **Honest about confidence** -- Flag when something is inferred vs. directly stated
5. **Cross-referenced** -- Mention related intelligence files when connections exist
6. **Scannable** -- Someone should get the gist from the summary and section headers alone
