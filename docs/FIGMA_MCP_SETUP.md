# Figma MCP Setup (Project Standard)

This project uses Codex Figma MCP for design-to-code work. Configure once per machine.

## 1) Connect MCP Server

```bash
codex mcp add figma --url https://mcp.figma.com/mcp
codex mcp login figma
```

If required by your Codex version, enable remote MCP client:

```toml
[features]
rmcp_client = true
```

Then restart Codex.

## 2) Required Inputs for Design Tasks

Provide one of:
- Figma URL with `node-id` (preferred)
- Explicit `fileKey` + `nodeId`

Example:
- `https://www.figma.com/design/<fileKey>/<name>?node-id=12-34`

## 3) Non-Negotiable Fetch Order

1. `get_design_context`
2. `get_screenshot`
3. Asset download/use from MCP payload
4. Only then implement code changes

If context is too large:
1. `get_metadata`
2. Fetch child nodes with `get_design_context`

## 4) Asset Rules

- Use MCP-provided localhost asset URLs directly.
- Do not add icon libraries for Figma-provided icons.
- Do not replace missing assets with placeholders when MCP provides an asset source.

