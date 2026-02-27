---
description: Guided walkthrough of the Nansen intelligence ecosystem for new team members
allowed-tools: Read, Write, Bash(ls:*), Bash(find:*), Bash(cat:*)
---

Guide the user through understanding and using Nansen's intelligence ecosystem. This is NOT a technical setup (that's /setup) -- this is a hands-on tour designed for everyone, especially people who aren't deeply technical. Be warm, conversational, and encouraging. Use plain language. Avoid jargon.

Before starting, check that /setup has been run by looking for `.nansen-config.json` in the workspace. If it doesn't exist, tell the user: "Looks like we need to do the technical setup first. Run `/setup` and come back here when you're done -- it only takes a few minutes."

The onboarding has six parts. Work through them one at a time, checking in with the user between sections. Don't rush. Let them ask questions. The goal is for them to feel confident using the system by the end.

---

## Part 1 -- Welcome (3 minutes)

Start with a friendly welcome. Introduce yourself and what we're going to do:

"Hey! Welcome to Nansen's intelligence system. Over the next 20 minutes or so, I'm going to walk you through how it all works. By the end, you'll know how to:

- Turn meeting transcripts and documents into structured knowledge the whole team can use
- Find insights that other team members have already extracted
- Use AI skills to speed up your research and analysis work

Think of this as a shared brain for Nansen. When you have a client meeting and extract the key insights, those insights become available to everyone. When someone else does the same, you benefit too. The more we use it, the smarter it gets.

Sound good? Let's dive in."

Wait for acknowledgment before continuing.

## Part 2 -- The Three Zones (5 minutes)

Explain the folder structure using the "three zones" metaphor. Make it tangible by showing actual folders.

List the contents of the workspace to show the three folders, then explain:

**Sources (your raw material)**
"This is where you put the stuff you want to extract knowledge from. Meeting transcripts from Fathom, PDFs, research reports, interesting articles -- anything that contains insights worth capturing. Think of it as your inbox for raw material."

Show what's currently in sources/ (if anything). If the Leadership Offsite or Client Development Playbook PDFs are there, point them out as examples.

**Intelligence (the team knowledge base)**
"This is where the magic happens. When you run an extraction skill on a source file, the structured insights land here. Every file follows the same format so they're easy to search, filter, and build on. And because this folder syncs to Google Drive, anything you extract is instantly available to the whole team."

Show an example intelligence file if one exists (like the setup verification file). Explain the YAML frontmatter briefly: "See these fields at the top? Title, date, domains, participants -- they're like tags that make it easy to find things later. You don't need to write these yourself; the skills handle it."

**Outputs (your deliverables)**
"This is your personal workspace for things you create FROM intelligence. Client reports, analysis docs, presentation decks. These stay on your machine -- they're yours."

Check in: "Make sense so far? Any questions about the three zones?"

## Part 3 -- Your First Extraction (10 minutes)

This is the most important part. Walk the user through processing their first source file.

Check what's in sources/. If there are existing files (like the Leadership Offsite PDF or Client Development Playbook), suggest using one of those. If sources/ is empty, explain:

"To try this out, we need a source file. You can:
1. Drop a PDF into your sources/ folder
2. Paste a meeting transcript or document
3. If you have Fathom transcripts, drop one in

For now, any document with business content will work -- a meeting summary, a strategy doc, even a blog post you found interesting."

Once they have a file ready, explain what's about to happen:

"I'm going to use the Market Research skill to read this document and pull out the key insights. It'll look for things like market trends, competitive signals, client intelligence, and strategic themes. Then it'll create a structured intelligence file that the whole team can use."

Run the market-research skill on their chosen file. Read the schema from `nansen-core/schema/intelligence-schema.yaml` to ensure proper formatting.

After the intelligence file is created:
- Show them the output file
- Walk through each section: "See how it pulled out [specific insight]? And it tagged it under [domain] so anyone searching for that topic will find it."
- Point out the YAML frontmatter: "These tags at the top are what make it searchable. The skill filled these in automatically."
- Note where the file was saved: "It's in your intelligence/ folder, which means it's already syncing to Google Drive."

Check in: "How does that feel? Pretty cool, right? Any questions about what just happened?"

## Part 4 -- Finding Intelligence (3 minutes)

Show the user how to find insights that already exist in the intelligence/ folder.

"Now let's say a colleague already extracted intelligence from a client meeting last week, and you want to find it. Here's how."

List the intelligence/ folder contents. For each file, show how the filename tells you what it is: date, client, source type, topic.

Explain browsing strategies:
- "In Google Drive, you can search by keyword, client name, or date"
- "The domain tags in each file (like 'market-research' or 'competitive-intel') help you filter"
- "You can also just ask me: 'What intelligence do we have about [client]?' or 'Show me recent competitive intel' and I'll search for you"

If there are multiple intelligence files, demonstrate a search. If there's only the verification file, explain what it would look like with more content.

## Part 5 -- Day-to-Day Usage (4 minutes)

Paint a picture of how this fits into their work week:

"Here's what a typical week looks like with the intelligence system:

**After client meetings**: Drop your Fathom transcript into sources/ and ask me to extract intelligence. Takes about a minute. The insights are immediately available to the whole team.

**Before client meetings**: Ask me what intelligence we have about that client. I'll pull up everything the team has extracted -- past meeting insights, competitive context, industry trends.

**When doing research**: Found an interesting report or article? Drop it into sources/ and extract the key points. Now it's in the shared knowledge base instead of buried in your downloads folder.

**Weekly review**: Browse intelligence/ to see what your colleagues have been learning. You might spot connections or opportunities they didn't see from their angle."

Explain what's manual vs. automatic:
- "Right now, you trigger extractions manually -- you drop a file and ask me to process it"
- "Over time, we'll add more automation. But starting manual means you stay in control and learn how it works"

## Part 6 -- Getting Help (2 minutes)

Wrap up with a reference guide:

"Here's your cheat sheet:

**Commands you can use:**
- `/setup` -- Re-run the technical setup if you need to reconfigure anything
- `/onboarding` -- Come back to this walkthrough anytime

**Skills available:**
- Market Research -- Extract insights from any document or transcript

**Coming soon:**
- More extraction skills for different types of intelligence
- Client intelligence skill for deeper client-specific analysis
- Automatic Fathom transcript processing

**Need help?**
- Just ask me anything -- I can explain how things work, help you find intelligence, or process new source files
- For technical issues, check with your team lead
- Feedback is welcome -- if something doesn't work the way you'd expect, let us know so we can improve"

End on an encouraging note:

"You're all set! The best way to get comfortable is just to use it. Next time you have a meeting or come across an interesting document, drop it in sources/ and try extracting some intelligence. Every file you process makes the whole team smarter.

Want to try anything else right now, or are you good to go?"
