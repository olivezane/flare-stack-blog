# Consolidate individual MCP tool files into one file per feature

Status: ready-for-agent
Blocked by: None

## Parent

[Consolidate MCP tool files PRD](../PRD.md)

## What to build

Merge each MCP feature's individual tool files into a single consolidated module. The 26 individual `*.tool.ts` files become 7 feature-level files. Zero logic changes — only file organisation.

## Acceptance criteria

- [ ] Each MCP feature has one tool file exporting `McpToolDefinition[]` (posts: 6 tools → `posts-tools.ts`, tags: 5 → `tags-tools.ts`, comments: 3 → `comments-tools.ts`, media: 3 → `media-tools.ts`, friend-links: 4 → `friend-links-tools.ts`, search: already 1 file, analytics: already 1 file).
- [ ] Individual tool files deleted after consolidation.
- [ ] Feature `index.ts` barrel files updated to import from the consolidated file.
- [ ] Tool definition order preserved (matches original `index.ts` export order).
- [ ] `mcp-tool-registry.ts` unchanged.
- [ ] Build, type-check, and lint pass.
- [ ] MCP server starts and registers all 26 tools.

## Comments

<!-- conversation appended below -->
