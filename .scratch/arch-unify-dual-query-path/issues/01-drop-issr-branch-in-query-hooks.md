# Drop the isSSR branch from all TanStack Query hooks

Status: ready-for-agent
Blocked by: None

## Parent

[Unify dual query path PRD](../PRD.md)

## What to build

Remove the `isSSR` conditional branch from every TanStack Query hook across all 13 feature query files. Each hook calls its server function directly — no HTTP RPC fallback.

## Acceptance criteria

- [ ] All `isSSR` branches removed from query hooks in `src/features/*/queries/index.ts`.
- [ ] Each query hook calls its corresponding server function directly (e.g. `getPostsCursorFn`, `findPostBySlugFn`).
- [ ] `apiClient` imports removed from query files where they only served the CSR branch.
- [ ] Hono public API routes preserved as CDN-populating endpoints (not removed).
- [ ] Full test suite passes (185 Workers integration + 127 Node).
- [ ] Lint and type-check pass.
- [ ] Manual smoke test: home page loads posts, post detail page loads content, tag filter works, search works.

## Comments

<!-- conversation appended below -->
