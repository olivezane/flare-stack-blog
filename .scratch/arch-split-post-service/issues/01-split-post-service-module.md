# Split the Post service module into public reader and admin writer

Status: ready-for-agent
Blocked by: None

## Parent

[Split the Post service module PRD](../PRD.md)

## What to build

Split `src/features/posts/services/posts.service.ts` into two modules: a **Post Public Reader** and a **Post Admin Writer**. The data layer stays shared. All 25 call sites across API routes, query hooks, and MCP tools update their imports. Zero behaviour change.

## Acceptance criteria

- [ ] Public reader module exports exactly: `getPinnedPosts`, `getPostsCursor`, `findPostBySlug`, `getRelatedPosts`.
- [ ] Admin writer module exports exactly: `getPosts`, `getPostsCount`, `findPostBySlugAdmin`, `findPostById`, `updatePost`, `deletePost`, `generateSlug`, `createEmptyPost`, `generateSummaryByPostId`, `previewSummary`, `startPostProcessWorkflow`.
- [ ] Private helper `stripPublicContentJson` lives in the writer module (only admin callers use it).
- [ ] All import paths in callers updated: Hono routes, TanStack Query hooks, server functions, MCP tools.
- [ ] Original `posts.service.ts` removed after all callers migrated (or re-exports from both new modules during transition, then removed).
- [ ] Full test suite passes with zero logic changes (185 Workers integration + 127 Node tests).
- [ ] Lint and type-check pass.

## Comments

<!-- conversation appended below -->
