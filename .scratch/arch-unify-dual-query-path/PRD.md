# Unify the dual query path — drop SSR/CSR branching in query hooks

Status: ready-for-agent
Source: architecture-review-20260728

## Problem Statement

Every TanStack Query hook in the codebase branches on `isSSR` to choose between two data-fetching paths:

```ts
if (isSSR) {
  return await getPostsCursorFn({ data: { limit } });  // server function
}
const res = await apiClient.posts.$get({ query: ... });  // Hono HTTP RPC
```

Both paths hit the same service methods. This means:
- Two cache layers (Cloudflare Cache API for HTTP responses, KV versioned cache for server functions) store the same data.
- Two test surfaces — SSR path and CSR path need separate test setup.
- Every new query hook copies the `isSSR` branch pattern.
- Adding a new public endpoint means wiring it into both the Hono route layer and the query layer.

The Hono public API routes (`/api/posts`, `/api/post/:slug`, `/api/tags`, `/api/search`) are thin wrappers around service calls — they exist primarily to give the CDN a URL to cache. The real data-fetching logic lives in server functions and service modules.

## Solution

Go all-in on server functions for data fetching. Drop the `isSSR` branch from every query hook. Hono public routes become reverse-proxy shells — they still serve CDN-cacheable responses at the edge, but the query layer uses only server functions.

If CDN edge caching of JSON API responses is not critical for a personal blog (KV + Cloudflare Cache API on rendered pages already covers the hot path), the Hono public API routes can be removed entirely. Otherwise, they stay as pass-through CDN-populating endpoints but lose their role as the CSR data path.

## User Stories

1. As a developer writing a new query hook, I want one way to fetch data (server functions), so that I don't copy-paste an `isSSR` branch from existing hooks.
2. As a developer debugging a data-fetching issue, I want to trace one path from component to service, so that I don't have to check which branch ran.
3. As a test author, I want query hooks to have one test surface, so that I don't maintain separate SSR and CSR test setups.
4. As a maintainer, I want one cache layer for data (KV), so that invalidation is coordinated in one place.
5. As a code reviewer, I want PRs to not contain duplicative "just like the other path" code, so that review burden is lower.
6. As an AI agent generating a new query hook, I want a single pattern to follow, so that generated code is consistent with existing hooks.
7. As an operator, I want the deployment to still benefit from CDN edge caching for public pages, so that latency doesn't regress.

## Implementation Decisions

- Remove the `isSSR` branch from all query hooks in `src/features/*/queries/index.ts`.
- Each query hook calls its server function directly (e.g. `getPostsCursorFn`, `findPostBySlugFn`) — no conditional.
- Hono public API routes remain as CDN-populating endpoints but are no longer the CSR data path.
- The `apiClient` (Hono RPC typed client) imports in query hooks are removed where they only served the CSR branch.
- `posts.public.api.ts` server functions are already the SSR path — they become the only path.
- Consider whether the Hono public routes can be simplified to just the cache middleware wrapping a server-function call (reduce duplication of the "call service, return JSON" pattern).

### Decision point: keep or remove Hono public routes?

Two options to evaluate during implementation:
- **Keep**: Hono routes stay as CDN edge-cache population. They still call service methods but are never called from query hooks. They serve external consumers (RSS readers, API consumers) who hit `/api/posts` directly.
- **Remove**: Delete Hono public routes entirely. The CDN caches rendered pages, not JSON API responses. External API consumers use MCP instead.

Default to **keep** unless the implementation reveals the routes have no callers outside the query hooks.

## Testing Decisions

- Existing integration tests that hit Hono routes via `testRequest` remain — they validate the CDN-cacheable endpoints still work.
- Query hook tests (if any exist at the component level) update to use only the server function path.
- The `isSSR` mock in test setup becomes unnecessary for query tests and can be removed.
- Run full test suite (185 Workers integration + 127 Node) — no regressions.

## Out of Scope

- Removing Hono as the HTTP framework — the middleware stack, auth proxy, and shield remain.
- Changing the Theme Contract or page rendering.
- Changing the MCP subsystem (it already uses service modules directly).
- Modifying the `apiClient` type generation (it can stay for potential external consumers).

## Further Notes

- This candidate is marked "Worth exploring" because it touches 13 query files and the Hono route layer — a broader change than the single-module candidates.
- ADR-0001 (Cloudflare Workers-only) is not contradicted if Hono routes stay as CDN-populating endpoints.
- The `isSSR` flag comes from TanStack Start's server-side rendering detection. Server functions already work in both SSR and CSR contexts via TanStack Start's polyfilled `fetch` — the branch was a workaround, not a requirement.
- This is the only candidate that potentially deletes code in two layers (query hooks + Hono routes) rather than just reorganising.
