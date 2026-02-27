---
name: solutions-positioning
description: >
  Maps identified industry needs and pain points to Nansen's service capabilities.
  Takes an industry research intelligence file as input and produces positioning
  recommendations: which Nansen services address which needs, proof points,
  recommended approach, differentiation, and talking points.

  ALWAYS use this skill when the user says anything like: "position Nansen for",
  "how do we solve these problems", "map our services to these needs",
  "solutions positioning", "what can Nansen offer [client/industry]",
  "positioning recommendations", "how do we pitch this", "what's our angle",
  "create a positioning doc", or any variation asking about mapping identified
  customer needs to Nansen's capabilities.

  Also trigger after the Industry Research skill has produced output and the user
  wants to take the next step, or when preparing pitch materials and talking points.
---

# Solutions Positioning -- Needs to Nansen Mapping

You are creating a solutions positioning document for Nansen, a digital agency. Your job
is to take identified customer needs and pain points (typically from an Industry Research
intelligence file) and map them to Nansen's capabilities, creating actionable positioning
that the team can use in sales conversations, proposals, and marketing.

## Before You Start

1. Read the intelligence schema from `nansen-core/schema/intelligence-schema.yaml`
2. Identify the industry research input (the user should point you to a specific
   intelligence file, or you should find the most recent one for the relevant client/industry)
3. Check the `intelligence/` folder for any related intelligence that adds context

## Nansen's Service Capabilities

Use this as the reference for what Nansen can deliver. If a `references/nansen-capabilities.md`
file exists in this skill's folder, read that instead (it may have been updated with more
detail). Otherwise, use this baseline:

### Core Service Areas

**Digital Strategy and Consulting**
- Digital transformation roadmapping
- Technology assessment and selection
- Digital maturity assessment
- Customer experience strategy
- Data and analytics strategy

**Web Development and Platforms**
- Optimizely CMS and Commerce implementation
- Headless and composable architecture
- Custom web application development
- Platform migration and replatforming
- Performance optimization

**Digital Marketing Operations**
- Marketing automation setup and optimization
- CRM integration and management
- Email marketing programs
- SEO and content strategy
- Analytics and reporting dashboards

**AI-Enabled Services** (emerging practice)
- AI agent design and implementation (Optimizely Opal)
- AI-powered content operations
- Intelligent automation workflows
- AI readiness assessment
- Custom AI plugin development (Anthropic Cowork)

**Creative and Content**
- Brand strategy and identity
- Content creation and management
- UX/UI design
- Video and multimedia production

### Key Differentiators
- Optimizely Premium Partner (deep platform expertise)
- Emerging AI practice (Opal agents, Cowork plugins)
- Midwest-based with competitive rates vs. coastal agencies
- Senior-heavy team (less delegation to junior staff)
- Long-term client relationships (high retention)

## Step 1 -- Read the Industry Research

Read the input intelligence file carefully. Extract:
- The top pain points identified (ranked by severity/prevalence)
- The key opportunities flagged
- The competitive and technology landscape
- Any existing client context (if in Existing Client mode)

## Step 2 -- Map Needs to Solutions

For each major pain point or opportunity identified, determine:

1. **Can Nansen address this?** (Yes / Partially / No)
2. **Which service area?** (from the capabilities list above)
3. **How specifically?** (what would the engagement look like?)
4. **Proof points** (similar work done, relevant expertise, case studies)
5. **Confidence level** (how strong is Nansen's capability here?)

Be honest. If Nansen can't credibly address a need, say so. Credibility matters more
than trying to stretch into areas where the team lacks depth.

## Step 3 -- Identify the Strongest Positioning Angles

From the mapping, identify the 3-5 strongest positioning angles -- places where:
- The customer pain is acute AND Nansen has strong capability
- Nansen has differentiation vs. likely competitors
- The work would be a meaningful engagement (not just a small project)

These become the lead positioning themes.

## Step 4 -- Build the Positioning Document

### Output Structure

```markdown
---
title: "Nansen Solutions Positioning: [Client/Industry]"
date: [today's date]
source_type: document
client: [client-slug or null]
industry: [industry-slug]
domains:
  - solutions-positioning
  - sales-intelligence
version: 1
updated: "[ISO-8601 now]"
updated_by: "solutions-positioning skill"
confidence: [based on strength of mapping]
summary: "[2-3 sentences on the strongest positioning angles]"
related_files:
  - "[filename of the industry research intelligence file used as input]"
---

# Nansen Solutions Positioning: [Client/Industry]

## Positioning Summary

[2-3 paragraphs: the elevator pitch. If you had 60 seconds to explain why Nansen
is the right partner for this client/industry, what would you say? Focus on the
strongest angles.]

## Needs-to-Solutions Map

[For each major pain point, a structured mapping:]

### [Pain Point 1 - e.g., "Legacy CMS limiting digital experience"]
- **Customer need**: [what they need, in their language]
- **Nansen solution**: [specific service/approach]
- **Engagement shape**: [what the project would look like - duration, team, phases]
- **Proof points**: [similar work, relevant expertise]
- **Competitive angle**: [why Nansen vs. alternatives]
- **Fit strength**: Strong / Moderate / Stretch

### [Pain Point 2]
[Same structure]

### [Pain Point 3]
[Same structure]

[Continue for all major pain points. Include ones where fit is "Stretch" or
where Nansen can't help -- honesty builds trust in the document.]

## Lead Positioning Themes

[The 3-5 strongest angles, expanded into mini-narratives:]

### Theme 1: [e.g., "Optimizely expertise for their platform modernization"]
[Why this is the strongest angle. What the opening conversation sounds like.
What the first engagement could be.]

### Theme 2: [e.g., "AI-enabled marketing ops to solve their personalization gap"]
[Same structure]

### Theme 3: [e.g., "Data strategy to break their attribution deadlock"]
[Same structure]

## Talking Points

[Bullet-style talking points the team can use in conversations. Written in
natural language, not corporate-speak. These should sound like things Arnold
or the account lead would actually say in a meeting.]

- [Talking point 1 - acknowledge their pain, pivot to capability]
- [Talking point 2 - proof point or reference]
- [Talking point 3 - differentiation statement]
- [Talking point 4 - suggested next step / call to action]

## Gaps and Honest Assessment

[Areas where the customer has needs that Nansen can't address well. This is
important -- it builds credibility and helps the team know where NOT to overcommit.
Suggest partner options if relevant.]

## Recommended Next Steps

[What should the team do with this? Specific actions:]
- Schedule a meeting with [specific people]
- Prepare a proposal focused on [theme]
- Research [specific area] further before pitching
- Connect with [partner] for capabilities we lack

---

## Positioning Context
- **Based on**: [industry research intelligence file name]
- **Prepared on**: [today's date]
- **Prepared by**: solutions-positioning skill v0.1.0
```

## Step 5 -- Write and Report

Write the positioning file to `intelligence/` using:
`YYYY-MM-DD_[client-slug]_document_[industry]-solutions-positioning.intelligence.md`

Present a summary:
- File saved to: [path]
- Top 3 positioning themes
- Strongest fit area
- Key gap/honest assessment
- Suggested next step for the team

## Step 6 -- Offer Next Steps

1. **Create talking points doc** -- "Want me to format the talking points as a standalone one-pager for the meeting?"
2. **Draft an outreach email** -- "I can draft an initial outreach based on this positioning"
3. **Proposal outline** -- "Want me to sketch a proposal structure based on the strongest themes?"
4. **Share with team** -- "This is in intelligence/ and syncing to Drive. Want me to flag it for someone specific?"

## Quality Standards

- **Think like the buyer**: Frame everything from the customer's perspective first, then bridge to Nansen. "You're dealing with X, and here's how we've helped others with that" beats "We have a great X capability."
- **Be honest about fit**: A positioning doc that oversells destroys trust. Mark "Stretch" areas clearly.
- **Keep it conversational**: The talking points should sound like real human speech, not marketing copy. Write them the way Arnold or Markus would actually say them in a meeting.
- **Quantify when possible**: "We reduced page load time by 40% for a similar client" beats "We make websites faster."
- **Connect the dots**: Show how pain points chain together and how Nansen can address multiple needs in an integrated engagement, not just one-off projects.
