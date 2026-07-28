# Split the Post service module — public reads vs admin mutations

Status: ready-for-agent
Source: architecture-review-20260728

## Problem Statement

The Post service module (`posts.service.ts`) exposes 18 functions in a single interface, mixing three distinct concern clusters: public cached reads (`getPinnedPosts`, `getPostsCursor`, `findPostBySlug`, `getRelatedPosts`), admin CRUD (`getPosts`, `getPostsCount`, `findPostBySlugAdmin`, `findPostById`, `updatePost`, `deletePost`, `generateSlug`, `createEmptyPost`, `generateSummaryByPostId`, `previewSummary`), and workflow orchestration (`startPostProcessWorkflow`). Every caller pulls in the full module. Tests for public reads must set up admin auth context. Tests for admin mutations must configure cache warm-up. The interface is nearly as complex as the implementation — a shallow module by the deletion test: deleting either half would scatter functionality across callers rather than concentrating it.

This module is the single most-changed file in the codebase, appearing in nearly every release. Each change risks touching the wrong half of the interface, and the 18-export surface makes it hard to reason about what a change affects.

## Solution

Split the Post service into two deep modules:

- **Post Public Reader** — cached reads for public routes. Interface: `getPinnedPosts`, `getPostsCursor`, `findPostBySlug`, `getRelatedPosts`. Callers: Hono public routes, TanStack Query hooks, SSR data loaders. Tests: need only public context (no admin auth), focus on cache behaviour.
- **Post Admin Writer** — mutations and admin queries. Interface: `getPosts`, `getPostsCount`, `findPostBySlugAdmin`, `findPostById`, `updatePost`, `deletePost`, `generateSlug`, `createEmptyPost`, `generateSummaryByPostId`, `previewSummary`, `startPostProcessWorkflow`. Callers: admin API, MCP tools. Tests: need admin auth context, focus on mutation correctness and side effects.

Both modules share the existing Post data layer (`posts.data.ts`), which stays unchanged.

The pure-computation helpers (`generateSlug`, `generateSummaryByPostId`, `previewSummary`) stay in the admin writer — they're only called from admin contexts. `findPostById` stays in admin writer even though `getRelatedPosts` (public reader) could theoretically use it, because the public reader's related-posts flow goes through `PostRepo.getPublicPostsByIds` directly.

No new seams — this is an in-process refactor. Existing integration tests are the test surface.

## User Stories

1. As a maintainer, I want public Post reads in one module, so that I can change caching strategy without touching admin mutation code.
2. As a maintainer, I want admin Post mutations in one module, so that I can change workflow dispatch logic without touching public read code.
3. As a test author, I want public read tests to skip admin auth setup, so that cache-behaviour tests are faster and simpler.
4. As a test author, I want admin mutation tests to skip public cache warm-up setup, so that mutation tests are faster and simpler.
5. As a developer reading the codebase, I want to see "what does the public blog surface expose?" by opening one file, not scanning 18 exports.
6. As a developer debugging a cache issue, I want the relevant module to contain only cache-related code, so that the bug's context is bounded.
7. As a developer adding a new public endpoint, I want to import `PostPublicReader` without pulling in workflow orchestration, so that I don't accidentally couple a read path to side effects.
8. As a developer adding a new admin mutation, I want to import `PostAdminWriter` without pulling in public cache semantics, so that I don't accidentally introduce cache behaviour into an admin path.
9. As an AI agent navigating the codebase, I want fewer exports per module, so that tool-selection accuracy improves when picking the right function.
10. As a code reviewer, I want a PR touching public reads to clearly not touch admin mutations, so that review scope is bounded.

## Implementation Decisions

- Split `posts.service.ts` into two files: `posts.reader.ts` (public reads) and `posts.writer.ts` (admin mutations + workflow orchestration).
- The data layer (`posts.data.ts`) remains a single shared module — both readers and writers import from it.
- Public reader functions: `getPinnedPosts`, `getPostsCursor`, `findPostBySlug`, `getRelatedPosts`.
- Admin writer functions: `getPosts`, `getPostsCount`, `findPostBySlugAdmin`, `findPostById`, `updatePost`, `deletePost`, `generateSlug`, `createEmptyPost`, `generateSummaryByPostId`, `previewSummary`, `startPostProcessWorkflow`.
- The private `stripPublicContentJson` helper moves to the writer module (it's only used by admin-facing functions).
- Import paths in callers (API routes, query hooks, MCP tools) update to import from the correct new module.
- No behaviour change. No test logic changes except import paths.
- This is a pure mechanical refactor — verify with the existing test suite.

## Testing Decisions

- Existing integration tests in `posts.integration.test.ts` remain the acceptance suite — they import from both reader and writer modules.
- No new tests needed. The existing 1755-line integration test already covers all functions across both modules.
- Run the full Workers integration test suite (185 tests) and Node test suite (127 tests).
- Tests should pass with zero logic changes — only import path updates.
- If any test breaks, the split boundary is wrong and must be adjusted.

## Out of Scope

- Extracting the workflow orchestration (`startPostProcessWorkflow`) into a separate PublishOrchestrator module — that's candidate #6, a separate issue.
- Changing any function signatures or behaviour.
- Splitting the data layer (`posts.data.ts`).
- Moving `findPostById` to the public reader — it exposes sync-hash internals that belong to admin context.
- Renaming functions.

## Further Notes

- This is the highest-leverage deepening candidate from the 2026-07-28 architecture review.
- `posts.service.ts` is 493 lines with 18 exports. After split: ~130 lines (reader) + ~363 lines (writer).
- The friend-links service has a similar but smaller public/admin split pattern — this refactor establishes the convention for the codebase.
