# Consolidate MCP tool files — one module per feature

Status: ready-for-agent
Source: architecture-review-20260728

## Problem Statement

The MCP subsystem has 26 individual tool files (`posts-list.tool.ts`, `posts-delete.tool.ts`, etc.), each ~25–40 lines. Every tool file follows the identical pattern: import a service function, wrap in `defineMcpTool`, delegate to the service. Understanding one feature's MCP surface means opening 3–6 files. Adding a new tool means creating a new file in a directory that already has 26 siblings. The interface (one import per tool) is nearly as complex as the implementation (one handler per tool) — these are shallow modules.

The deletion test confirms it: consolidating tool definitions into one file per feature concentrates complexity rather than scattering it. The `index.ts` barrel file already re-exports them as a single array — the consolidation just moves the definitions into one place.

## Solution

Collapse each MCP feature's tool files into a single module. Instead of:

```
features/posts/tools/posts-list.tool.ts
features/posts/tools/posts-get.tool.ts
features/posts/tools/posts-create-draft.tool.ts
features/posts/tools/posts-delete.tool.ts
features/posts/tools/posts-update.tool.ts
features/posts/tools/posts-set-visibility.tool.ts
```

One file:

```
features/posts/posts-tools.ts  (exports McpToolDefinition[])
```

Same for tags (5 files → 1), comments (3 files → 1), media (3 files → 1), friend-links (4 files → 1), search (1 file → already done), analytics (1 file → already done).

The `index.ts` barrel updates its import source. `registerMcpTools` in `mcp-tool-registry.ts` is unchanged — it already receives `McpToolDefinition[]` arrays.

## User Stories

1. As a developer adding a new MCP tool, I want to add ~30 lines to an existing file instead of creating a new file, so that the boilerplate overhead is proportional to the logic.
2. As a developer understanding a feature's MCP surface, I want to see all its tool definitions on one screen, so that I can compare input schemas and handler patterns side by side.
3. As a code reviewer, I want a PR adding a tool to show the new definition alongside existing ones in the diff, so that I can spot inconsistencies in schema or error handling.
4. As an AI agent navigating the MCP subsystem, I want fewer files to open when mapping tools to service calls, so that tool-selection context stays compact.
5. As a maintainer, I want the file count in `src/features/mcp/` to reflect the number of features (7) not the number of tools (26), so that directory listings are scannable.

## Implementation Decisions

- One file per MCP feature: `posts-tools.ts`, `tags-tools.ts`, `comments-tools.ts`, `media-tools.ts`, `friend-links-tools.ts`, `search-tools.ts`, `analytics-tools.ts`.
- Each file exports `const mcpXxxTools: McpToolDefinition[]`.
- The existing `features/<name>/index.ts` barrel imports from the new consolidated file instead of individual tool files.
- Original individual tool files are deleted after consolidation.
- No change to `defineMcpTool`, `registerMcpTool`, or `mcp-tool-registry.ts`.
- No change to tool schemas, service files, or handler logic.
- Tool definition order within the array matches the original export order from `index.ts`.

## Testing Decisions

- No new tests needed — this is a pure mechanical refactor.
- Verify: build succeeds, type-check passes, MCP server starts and registers all tools.
- Existing integration tests that exercise MCP endpoints remain the acceptance suite.
- Manual verification: MCP tool list output unchanged after refactor.

## Out of Scope

- Merging tool schemas or service files.
- Changing the MCP tool registration infrastructure.
- Reducing the number of tools — this is a file-layout change only.
- Changing the MCP server initialization flow.

## Further Notes

- Net file deletion: 26 individual tool files removed, 5 new consolidated files created (2 features already single-file: search has 1 tool, analytics has 1 tool) = 21 files removed.
- The `features/posts/` MCP directory shrinks from 9 files to 4 (index, schema, service, tools).
- The `/codebase-design` glossary applies: each consolidated file is a deeper module — one import gives all of a feature's MCP tools.
