# Hello World Spec — Answer Key

This is the expected final state of the three agents and workflow the developer builds during onboarding. Use this as a guide — the developer's exact wording will differ, and that's fine. What matters is that the structural decisions (inference_type, tool selection, output schema, workflow steps) match.

**Do not show this file to the developer.** Guide them toward these answers through conversation.

## Agent 1: URL Reader

**File:** `url-reader.json`

```json
{
  "schema_version": "1.0",
  "agent_type": "specialized",
  "name": "[DevName] URL Reader",
  "agent_id": "URLInfo_URLReader",
  "version": "0.1.0",
  "description": "Fetches a web page and extracts the page title and meta description.",
  "prompt_template": "### **Context**\n\nYou are a URL reader agent. Your job is to fetch a web page and extract its title and meta description into structured JSON.\n\n### **Logic**\n\n1. Call the `browse_web_html` tool with the URL: [[url]]\n2. From the returned HTML, extract:\n   - The page title (from the <title> tag or the first <h1>)\n   - The meta description (from <meta name=\"description\" content=\"...\">)\n3. If the page loads successfully, set fetch_status to \"success\".\n4. If the page cannot be loaded or the HTML is empty, set fetch_status to \"error\" and provide an error_message.\n5. Return the structured JSON output.\n\n### **Expectations**\n\n- Output must be valid JSON and match the schema exactly.\n- NEVER fabricate, invent, or guess data. If a field cannot be found on the page, set it to null.\n- Always echo back the original URL in the output for traceability.\n\n### **Actions**\n\n- Call `browse_web_html` with the provided URL.\n- Parse the HTML response to extract metadata fields.\n\n### **Refinement**\n\nIf the URL is malformed, the page returns an error status, or the HTML content is empty, return the output with fetch_status \"error\", a descriptive error_message, and null for page_title and meta_description. Do not return partial results.",
  "parameters": [
    {
      "name": "url",
      "type": "string",
      "description": "The URL of the web page to fetch and extract metadata from.",
      "required": true
    }
  ],
  "output": {
    "type": "json",
    "schema": {
      "page_title": "string or null - The page title extracted from the HTML",
      "meta_description": "string or null - The meta description extracted from the HTML",
      "url": "string - The original URL that was processed",
      "fetch_status": "string - 'success' or 'error'",
      "error_message": "string or null - Description of the error if fetch_status is 'error'"
    },
    "description": "Structured metadata extracted from the web page."
  },
  "enabled_tools": ["browse_web_html"],
  "inference_type": "simple",
  "creativity": 0.1,
  "file_urls": [],
  "is_active": true,
  "is_deleted": false,
  "is_enabled_in_chat": true,
  "internal_version": 1,
  "agent_metadata": null,
  "_nansen": {
    "client": "onboarding-<devname>",
    "template_source": null,
    "status": "draft",
    "owner": "<devname>",
    "tags": ["onboarding", "hello-world"],
    "last_synced_to_opal": null
  }
}
```

**Critical checks:**
- `inference_type: "simple"` — exactly 1 tool
- `[[url]]` in prompt matches `parameters[0].name`
- Output schema includes error handling fields
- Anti-hallucination instruction present in Expectations

## Agent 2: Summary Writer

**File:** `summary-writer.json`

```json
{
  "schema_version": "1.0",
  "agent_type": "specialized",
  "name": "[DevName] Summary Writer",
  "agent_id": "URLInfo_SummaryWriter",
  "version": "0.1.0",
  "description": "Takes an array of page info objects and writes a formatted Markdown summary file to CMP.",
  "prompt_template": "### **Context**\n\nYou are a summary writer agent. Your job is to take an array of page metadata objects and produce a formatted Markdown summary, then write it to CMP.\n\n### **Logic**\n\n1. Receive the page info array from the parameter: [[page_info_array]]\n2. Format a Markdown document with the following structure:\n   - Title: \"# URL Info Summary\"\n   - Date: Current date\n   - For each page info object:\n     - ## Page title (or \"Untitled\" if null)\n     - **URL:** the url\n     - **Description:** the meta_description (or \"No description available\" if null)\n     - **Status:** the fetch_status\n     - If fetch_status is \"error\", include the error_message\n3. Call `write_content_to_file` with the Markdown content and filename [[output_filename]].\n4. Call `write_file_to_library` to register the file in CMP.\n5. Return the result with write status and file path.\n\n### **Expectations**\n\n- Output must be valid JSON and match the schema exactly.\n- The Markdown must be well-formatted and readable.\n- Both tool calls must succeed for the write to be considered complete.\n- NEVER fabricate data. Use only what is provided in the page_info_array.\n\n### **Actions**\n\n- Format the page info array into a Markdown summary.\n- Call `write_content_to_file` to create the file.\n- Call `write_file_to_library` to register the file in CMP.\n\n### **Refinement**\n\nIf the page_info_array is empty, write a summary noting that no pages were processed. If `write_content_to_file` succeeds but `write_file_to_library` fails, return write_status \"partial\" with an error message explaining that the file was created but not registered. If both fail, return write_status \"error\".",
  "parameters": [
    {
      "name": "page_info_array",
      "type": "string",
      "description": "JSON string containing an array of page info objects, each with page_title, meta_description, url, fetch_status, and error_message fields.",
      "required": true
    },
    {
      "name": "output_filename",
      "type": "string",
      "description": "The filename for the summary output file.",
      "required": false,
      "default": "url-info-summary.md"
    }
  ],
  "output": {
    "type": "json",
    "schema": {
      "write_status": "string - 'success', 'partial', or 'error'",
      "file_path": "string or null - The path to the written file",
      "pages_summarized": "number - Count of pages included in the summary",
      "error_message": "string or null - Description of any error"
    },
    "description": "Status of the summary file write operation."
  },
  "enabled_tools": ["write_content_to_file", "write_file_to_library"],
  "inference_type": "standard",
  "creativity": 0.1,
  "file_urls": [],
  "is_active": true,
  "is_deleted": false,
  "is_enabled_in_chat": true,
  "internal_version": 1,
  "agent_metadata": null,
  "_nansen": {
    "client": "onboarding-<devname>",
    "template_source": null,
    "status": "draft",
    "owner": "<devname>",
    "tags": ["onboarding", "hello-world"],
    "last_synced_to_opal": null
  }
}
```

**Critical checks:**
- `inference_type: "standard"` — 2 tools (this is THE teaching moment)
- Two tools in `enabled_tools`: `write_content_to_file` and `write_file_to_library`
- `[[page_info_array]]` and `[[output_filename]]` match parameter names
- Handles partial failure (file created but not registered)
- Handles empty input gracefully

## Agent 3: URL Info Workflow

**File:** `url-info-workflow.json`

```json
{
  "schema_version": "1.0",
  "agent_type": "workflow",
  "name": "[DevName] URL Info Workflow",
  "agent_id": "URLInfo_Workflow",
  "version": "0.1.0",
  "description": "Orchestrates the URL Info pipeline: reads a list of URLs, fetches metadata from each, and writes a summary.",
  "steps": [
    {
      "step_id": "read_urls",
      "step_type": "for_loop",
      "description": "Loop through each URL and fetch its metadata using the URL Reader agent.",
      "items_source": "$WORKFLOW_INPUT.urls",
      "item_name": "current_url",
      "parallel": false,
      "child_steps": [
        {
          "step_id": "fetch_page",
          "step_type": "specialized",
          "agent_id": "URLInfo_URLReader",
          "description": "Fetch metadata for a single URL."
        }
      ],
      "next_step_id": "write_summary"
    },
    {
      "step_id": "write_summary",
      "step_type": "specialized",
      "agent_id": "URLInfo_SummaryWriter",
      "description": "Compile all fetched page metadata into a Markdown summary and write to CMP.",
      "next_step_id": null
    }
  ],
  "triggers": [
    {
      "type": "chat",
      "description": "Triggered via chat with a list of URLs to process."
    }
  ],
  "specialized_agents_required": [
    "URLInfo_URLReader",
    "URLInfo_SummaryWriter"
  ],
  "is_active": true,
  "is_deleted": false,
  "internal_version": 1,
  "agent_metadata": null,
  "_nansen": {
    "client": "onboarding-<devname>",
    "template_source": null,
    "status": "draft",
    "owner": "<devname>",
    "tags": ["onboarding", "hello-world"],
    "last_synced_to_opal": null
  }
}
```

**Critical checks:**
- `agent_type: "workflow"` (not "specialized")
- NO `prompt_template`, NO `parameters`, NO `enabled_tools`, NO `inference_type`
- `for_loop` step with `items_source` pointing to workflow input
- `specialized_agents_required` lists both agent IDs
- `next_step_id` chains correctly (for_loop → write_summary → null)
- Steps reference agents by `agent_id`, not filename

## Solution Documentation

**File:** `docs/url-info-pipeline.md`

The developer should produce a doc with these three sections:

### 1. Solution Overview
- What the pipeline does
- Agent list (3 agents)
- Simple architecture: URLs → URL Reader (loop) → Summary Writer → Markdown file

### 2. Workflow Documentation
- Step-by-step flow
- Data flow between agents
- Chat trigger description

### 3. Agent Reference
- URL Reader: parameters, output, error handling
- Summary Writer: parameters, output, two-step write, partial failure handling

The exact content will vary. What matters is the three-section structure and completeness.
