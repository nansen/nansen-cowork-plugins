# Opal System Tools Quick Reference

A quick reference guide for Optimizely Opal system tools organized by category.

**Table of Contents**
- [Core & General](#core--general)
- [Content Marketing Platform (CMP)](#content-marketing-platform-cmp)
- [Content Management System (SaaS)](#content-management-system-saas)
- [Campaign Management](#campaign-management)
- [Content Recommendations](#content-recommendations)

---

## Campaign Management

| Tool Name | Description |
|-----------|-------------|
| `campaign_get_smart_campaign` | Retrieves detailed information about a single Smart Campaign. |
| `campaign_get_smart_campaign_list` | Retrieves detailed information about a list of Smart Campaigns. |
| `campaign_get_smart_campaign_message_content` | Retrieves the content of a specific campaign email message in either plain text or HTML format. |
| `campaign_get_smart_campaign_messages` | Retrieves a list of all messages associated with a specific Smart Campaign. |
| `campaign_get_smart_campaign_report` | Generates a detailed report for a Smart Campaign, including statistics on recipients, bounces, unsubscribes, opens, and clicks. |

## Content Management System (SaaS)

| Tool Name | Description |
|-----------|-------------|
| `cms_create_content_item` | Creates a new empty content instance in CMS (SaaS) based on an existing content type. |
| `cms_create_content_type` | Creates a new content type in CMS (SaaS). |
| `cms_create_property_group` | Create a property group used for content type properties in CMS (SaaS). |
| `cms_delete_content_item` | Deletes a content item from CMS (SaaS) using its unique content key. |
| `cms_delete_content_type` | Performs a non-disruptive deletion of a content type in CMS (SaaS). |
| `cms_get_content_data` | Retrieves CMS (SaaS) content data for a specific content item. |
| `cms_get_content_type_details` | Gets the full details of a content type, including properties, from CMS (SaaS). |
| `cms_list_content_types` | Gets a list of content types, excluding properties, from CMS (SaaS). |
| `cms_list_property_groups` | Retrieve a list of all property groups available in CMS (SaaS). |
| `cms_publish_content_item` | Publishes a specific content version in CMS (SaaS), making it visible to site visitors. |
| `cms_seo_analysis` | Analyze CMS (SaaS) content for SEO performance, and get AI-powered recommendations for optimization. |
| `cms_seo_edit` | Edit and apply SEO recommendations to CMS (SaaS) content. |
| `cms_update_content_item` | Updates the value for any property of a content item using a JSON Merge Patch algorithm. |
| `cms_update_content_type` | Updates an existing content type in CMS (SaaS). |
| `get_idealab_domain_competition` | Returns Idea Lab domain organic competition data. |
| `get_idealab_domain_keywords` | Returns Idea Lab domain keywords data. |
| `get_idealab_keyword_infos` | Returns Idea Lab SEO keyword information. |
| `get_idealab_keyword_keyword_questions` | Returns common questions for an Idea Lab SEO keyword in a given country. |
| `get_idealab_keyword_related_keywords` | Returns related keywords semantically related to a given keyword in a specific country. |
| `graph_content_graphql_executor` | Execute custom GraphQL queries against your Optimizely Graph instance. |
| `graph_content_search_tool` | Use as a simpler alternative for searching content in Optimizely Graph. |
| `graph_content_type_schema` | Use as your starting point for understanding the content structure within your Optimizely Graph instance. |

## Content Marketing Platform (CMP)

| Tool Name | Description |
|-----------|-------------|
| `add_comment_on_cmp_campaign` | Add a comment to a CMP campaign, with support for attachments and replies. |
| `add_comment_on_cmp_task` | Add a comment to a CMP task, with support for attachments and replies. |
| `add_comment_on_cmp_work_request` | Add a comment with optional file attachments to a work request in CMP. |
| `add_comment_on_task_substep` | Add a comment to a CMP task workflow substep. |
| `batch_upload_files_to_cmp_resource` | Uploads multiple files to a CMP campaign, task, or library. |
| `canvas_to_structured_content` | Converts the content of an AI canvas into a specified structured content within a CMP task. |
| `cmp_retrieve_asset_from_library` | Retrieves assets from the CMP Library and returns their content in human-readable form (markdown). |
| `create_article_in_task` | Creates an article inside a task in CMP. |
| `create_campaign` | Proposes new campaigns for CMP based on the prompt, conversation history, and existing campaign brief. |
| `create_campaign_from_work_request` | Creates a new campaign in Opal based on an existing work request. |
| `create_library_folder` | Creates a folder in the CMP library to organize assets and content. |
| `create_milestone` | Creates a new milestone within a specified campaign or project in CMP. |
| `create_task` | Creates a single task suggestion for a specified CMP campaign. |
| `create_task_from_work_request` | Creates a new task in CMP based on an existing work request. |
| `create_tasks` | Suggests multiple tasks for a CMP campaign based on prompt, chat history, and campaign brief. |
| `find_library_folder` | Finds CMP library folders using regex. |
| `find_team` | Finds CMP teams using regex-based queries. |
| `find_user` | Finds CMP users using regex-based queries. |
| `get_all_fields` | Returns suggested task-asset fields in CMP that match a natural-language description. |
| `get_cmp_content_type_details` | Returns details for a specific content type in CMP. |
| `get_cmp_organization_content_types` | Lists content types defined for your organization in CMP. |
| `get_cmp_resource` | Returns contextual information for a CMP task or campaign, including content and file metadata. |
| `get_cmp_resource_files` | Fetches files (images, videos, raw files, and attachments) from CMP tasks or campaigns and uploads them into Opal. |
| `get_form_template_by_id` | Retrieves a specific form template using its unique identifier. |
| `get_form_templates` | Retrieves a list of all available form templates in CMP. |
| `get_library_folder_tree` | Displays a hierarchical tree view of the CMP library folders and assets. |
| `get_object_templates` | Retrieves a list of available object templates in CMP. |
| `get_relevant_workflows` | Finds CMP workflows that match the given context. |
| `get_saved_view_resources` | Retrieves resources associated with a specific saved view in CMP. |
| `get_task_asset_fields` | Retrieves current field values for a task asset. |
| `get_workflow_by_id` | Returns the CMP workflow's structure, steps, sub-steps, actions, and assignees. |
| `search_application_data` | Searches across CMP campaigns, tasks, assets, and briefs with RAG, returning ranked results and links. |
| `search_cmp_resources` | Searches for various resources within CMP based on specified criteria. |
| `suggest_structured_content` | Suggests structured content, such as articles, blogs, newsletters, or social media posts, for a CMP task. |
| `update_asset` | Updates various properties of an asset in the CMP Library, including metadata, tags, location, and archival status. |
| `update_campaign_brief` | Updates a campaign brief in CMP after you give Opal a confirmation. |
| `update_library_asset_field` | Update a single field value on a CMP library asset. |
| `update_milestone` | Modifies the details of an existing CMP milestone, such as its name, due date, status, or description. |
| `update_task` | Updates an existing task's title, owner, dates, or other attributes. |
| `update_task_asset_fields` | Adds or replaces fields on a CMP task's asset or content. |
| `update_task_brief` | Updates the brief for a task in CMP. |
| `update_task_structured_content` | Updates structured content within a CMP task. |
| `update_task_substep` | Update the status or assignee of workflow substeps in a task. |
| `update_work_request_resource_link` | Modifies an existing resource link associated with a specific work request. |
| `upsert_task_field` | Creates or updates a CMP task field by name. |
| `write_file_to_library` | Write (create or update) a file to the CMP Library with automatic folder creation and file versioning. |

## Content Recommendations

| Tool Name | Description |
|-----------|-------------|
| `contentrecs_top_content` | Retrieves the highest-performing content items ranked by user interactions within a specified date range. |
| `contentrecs_top_recommendation_widgets` | Analyzes recommendation widget performance with detailed A/B testing metrics comparing personalized and unpersonalized recommendations. |
| `contentrecs_top_topics` | Retrieves performance metrics for the most engaging topics based on user interactions. |
| `pr_create_page` | Creates a new page within a site. |
| `pr_create_position` | Creates a new position on a specific page for placing widgets. |
| `pr_create_widget` | Creates a new recommendation widget. |
| `pr_get_algorithm_hints` | Retrieves available quick filters (hints) for a specific algorithm. |
| `pr_get_channels` | Retrieves all available widget channels for a site. |
| `pr_get_currencies` | Retrieves all available currencies for a site. |
| `pr_get_order_report` | Retrieves order reports for a specified date range. |
| `pr_get_pages` | Retrieves all pages for a site. |
| `pr_get_positions` | Retrieves the available widget positions for a specific page. |
| `pr_get_product_sets` | Retrieves all available product sets for a site. |
| `pr_get_sites` | Retrieves the available sites for your organization. |
| `pr_get_widget_config` | Retrieves the configuration details for a specific widget. |
| `pr_get_widgets` | Retrieves all available widgets for a site. |
| `pr_switch_site` | Switches the active site context. |

## Core & General

| Tool Name | Description |
|-----------|-------------|
| `add_todo` | Adds an item to a to-do checklist. |
| `analyze_image_content` | Helps Opal understand and interpret the visual content of images, whether they are screenshots you provide or images Opal has found through a search. |
| `analyze_pagespeed` | Analyze a webpage's performance, SEO, or accessibility using Google PageSpeed Insights. |
| `browse_web` | Opens and extracts content from multiple webpages concurrently and returns the content in Markdown or HTML format. |
| `browse_web_html` | Browses a single webpage, extracts information, and returns content in raw HTML format. |
| `change_image_aspect_ratio` | Changes the aspect ratio of existing images. Maintains all visual content while extending to fit the new ratio. |
| `complete_todo` | Marks a to-do checklist item complete. |
| `convert_to_pdf` | Converts a file or webpage to PDF. |
| `create_canvas` | Creates an interactive AI canvas (element) where you and Opal can collaboratively edit content in real-time. |
| `create_powerpoint_canvas` | Imports an external PowerPoint file (.pptx) and sets it up as a canvas for viewing, review, and text-based editing. |
| `create_todolist` | Creates a to-do checklist and returns its ID. |
| `edit_canvas` | Edits existing AI canvas (element) content using JSON Patch operations. |
| `figure_out_search_keywords` | Generates 8-15 related search keywords for comprehensive information about a topic. |
| `generate_or_edit_image` | Generate new images from text descriptions or edit existing images. Supports style transfers, object manipulation, zoom, and more. |
| `generate_video` | Generates videos from text descriptions and optional starting images. |
| `get_canvas` | Retrieves an AI canvas (element) with current content and metadata for read-only operations. |
| `get_canvas_by_workspace` | Lists all canvases (elements) in the current thread's workspace. |
| `get_canvas_workspace` | Returns details about the current workspace, including its metadata and current version information. |
| `get_file_metadata` | Retrieves metadata for a file, such as dimensions or alt text. |
| `get_today` | Returns the current UTC date and time in a human-readable Markdown format. |
| `ideate` | Generates a plan and suggests available tools for complex or ambiguous tasks. |
| `list_todos` | Lists items in a to-do checklist. |
| `read_file_content` | Reads a file from the Opal backend with configurable encoding. |
| `search_optimizely_docs` | Searches Optimizely public documentation (end-user and developer documentation) and summarizes relevant content. |
| `search_optimizely_graph` | Search for relevant information in your CMP and CMS data using RAG for Optimizely Graph. |
| `search_web` | Searches the web for a given query using Google. |
| `send_email` | Composes and sends emails as a notification tool. |
| `take_webpage_screenshot` | Captures a screenshot of a webpage by given URL. |
| `update_powerpoint_canvas` | Updates an existing PowerPoint canvas by modifying the underlying .pptx file. |
| `write_content_to_file` | Saves generated content by Opal as a file in the backend. |

---

## Commonly Used Tools

These are the most frequently used tools across all categories:

| Tool | Category | Purpose |
|------|----------|---------|
| `browse_web` | Core & General | Opens and extracts content from multiple webpages concurrently in Markdown or HTML format |
| `browse_web_html` | Core & General | Browses a single webpage and returns content in raw HTML format |
| `take_webpage_screenshot` | Core & General | Captures a screenshot of a webpage by given URL |
| `write_content_to_file` | Core & General | Saves generated content as a file in the backend |
| `write_file_to_library` | CMP | Write (create or update) a file to the CMP Library with automatic folder creation and file versioning |
| `get_cmp_resource_files` | CMP | Fetches files (images, videos, raw files, and attachments) from CMP tasks or campaigns |
| `cmp_retrieve_asset_from_library` | CMP | Retrieves assets from the CMP Library and returns their content in human-readable form |
| `get_cmp_resource` | CMP | Returns contextual information for a CMP task or campaign, including content and file metadata |
| `create_task` | CMP | Creates a single task suggestion for a specified CMP campaign |
| `create_campaign` | CMP | Proposes new campaigns for CMP based on prompt and conversation history |
| `cms_list_content_types` | CMS | Gets a list of content types from CMS (SaaS) |
| `cms_get_content_type_details` | CMS | Gets the full details of a content type, including properties, from CMS (SaaS) |
| `cms_create_content_item` | CMS | Creates a new empty content instance in CMS (SaaS) based on an existing content type |
| `cms_publish_content_item` | CMS | Publishes a specific content version in CMS (SaaS), making it visible to site visitors |

---

## Custom Tools (Cloudflare Workers)

When Opal's built-in tools don't cover your use case, you can build custom tools
deployed as Cloudflare Workers.

| Tool | Location | Purpose |
|------|----------|---------|
| `sustainability-review-docx` | `tools/sustainability-review-docx/` | Generates formatted Word documents (.docx) from structured review data. Reference implementation for custom tools. |

### Key Implementation Notes for Custom Tools

**Opal Request Envelope:** Opal wraps tool parameters in a `"parameters"`
envelope (`{ "parameters": {...}, "environment": {...}, "chat_metadata": {...} }`).
Your Worker MUST unwrap this. See the "Custom Tools" section in the main SKILL.md
for the unwrap pattern.

**Discovery Endpoint:** Every custom tool must expose `GET /discovery` returning
a JSON spec with function names, parameters, and endpoints. Opal caches this spec,
so re-register the tool in the Opal UI after any discovery changes.

**Pass-Through Pattern:** For structured data, accept a JSON string parameter and
parse server-side to avoid LLM data corruption during tool calls.

**Testing:** Always test with curl first (top-level JSON keys), then deploy for
Opal (envelope-wrapped). If curl works but Opal doesn't, the envelope is the
likely culprit.

---

## Notes

- All tool names use snake_case (e.g., `browse_web`, `get_cmp_resource_files`)
- Tools are organized by their primary use case category
- Parameters and detailed documentation are available in the official Opal documentation
- Most tools accept optional parameters for customization
- Some tools support batch operations (e.g., `batch_upload_files_to_cmp_resource`)
