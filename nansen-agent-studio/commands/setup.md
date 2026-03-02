---
name: setup
description: Set up Agent Studio for a new team member
---

Walk the user through getting Agent Studio set up and ready to build their first Opal agent. Follow these steps in order, checking status at each stage before moving on. Be conversational and helpful -- the user may not be technical.

## Step 1 -- Check folder access

Check if a workspace folder is currently connected by listing the contents of the mounted directory. Look for the `nansen-working-agents/` folder, which is the working directory for Agent Studio. Also check for the plugin's architecture files (schema/, templates/, Instructions/) which are bundled with the plugin itself.

If no folder is connected:
- Tell the user they need to select a folder in Cowork. Explain: "You'll need to select the folder where your Nansen workspace lives. Click the folder icon in the sidebar to choose one."
- Wait for them to confirm they've selected a folder, then re-check.

## Step 2 -- Check for the working folder

Once a folder is connected, check if it contains the Agent Studio working folder. Look for these key indicators:
- `nansen-working-agents/` directory
- `nansen-working-agents/clients/` directory
- `nansen-working-agents/registry.json`

If the structure exists, skip to Step 4.

If the working folder doesn't exist:
- Ask: "It looks like this workspace doesn't have the Agent Studio working folder yet. Would you like me to set it up?"
- If they agree, create the folder structure:
  ```
  nansen-working-agents/
    registry.json
    clients/
    exports/
    tools/
  ```
- If they need to clone the working folder from an existing repo, help them with that instead

## Step 3 -- Verify working folder structure

After setup, verify the key directories exist:

```
nansen-working-agents/
  registry.json
  clients/
  exports/
  tools/
```

Also verify the plugin's architecture files are accessible (these ship with the nansen-agent-studio plugin):

```
schema/agent-spec.schema.json
templates/agents/_blank-agent.json
Instructions/
```

Report what's present and what might be missing. If anything critical is missing (schema, templates), warn the user.

## Step 4 -- Identify the user

Ask for:
- Their name (for the `[Owner]` prefix in agent names, e.g., `[Arnold]`)
- Their Nansen username (for the `_nansen.owner` field, e.g., `arnold.macauley`)

If they're not sure about their username, suggest using `firstname.lastname` format.

## Step 5 -- Check for existing client work

List the directories under `nansen-working-agents/clients/` to show what client projects already exist. For each client folder, count the number of agent JSON files.

Present this as a quick summary: "Here's what's already in the repo: [client] has [N] agents, etc."

## Step 6 -- Offer next steps

Tell the user they're all set, and present their options:

1. **Create a new agent** -- "Tell me about the task you want to automate and I'll build the agent spec for you. I know all the Opal system tools, the CLEAR prompt framework, and the inference_type rules."
2. **Create a new client folder** -- "If you're starting work for a new client, I can set up the folder structure (agents/, docs/, files/, plans/) and get you started."
3. **Explore existing agents** -- "I can walk you through any of the existing agent specs, explain how they work, or help you modify them."
4. **Export agents** -- "I can export any client's agents to Opal-ready JSON, stripped of internal metadata and ready for import."

End with: "Just tell me what you'd like to do and I'll take it from here."
