# Route friend-links cache invalidation through the coordinator

Status: ready-for-agent
Source: architecture-review-20260728

## Problem Statement

The friend-links service has a local `invalidateCache` function that calls `CacheService.bumpVersion` + `purgeCDNCache` — the exact same coordination pattern the `cache-invalidation.ts` coordinator already encapsulates for Posts and Tags. Five mutation methods (`createFriendLink`, `approveFriendLink`, `rejectFriendLink`, `updateFriendLink`, `deleteFriendLink`) each call this local function, duplicating the coordination concern across call sites.

The cache-invalidation coordinator was built to be the single entry point for KV version bumps and CDN purges. Friend-links missed that consolidation — the pattern leaked. The fix is trivial: add one function to the coordinator and route all five friend-links mutations through it.

## Solution

Add `invalidateFriendLinks` to `src/features/cache/cache-invalidation.ts`. It does exactly what the local `invalidateCache` does: bump the `friend-links:list` version and purge `/friend-links` from CDN. The friend-links service imports and calls it. The local `invalidateCache` function is deleted.

One coordinator. One function. Five call sites → zero duplicated invalidation logic.

## User Stories

1. As a maintainer, I want all cache invalidation rules in one coordinator module, so that I can audit invalidation behaviour without searching every service file.
2. As a developer modifying cache strategy, I want to change CDN purge URLs in one place, so that I don't miss a service that has its own local invalidation.
3. As a developer adding a new content type with cache needs, I want to follow the existing coordinator pattern, so that the codebase has a single convention.
4. As a code reviewer, I want to see cache invalidation logic in the cache feature, not scattered across service files, so that review scope is bounded.

## Implementation Decisions

- Add `invalidateFriendLinks(context)` to `cache-invalidation.ts`.
- Implementation: `bumpVersion("friend-links:list")` + `purgeCDNCache({ urls: ["/friend-links"] })`.
- Friend-links service imports `invalidateFriendLinks` from `@/features/cache/cache-invalidation` instead of defining its own `invalidateCache`.
- Five mutation methods replace `invalidateCache(context)` with `invalidateFriendLinks(context)`.
- The local `invalidateCache` function and its `CacheService` + `purgeCDNCache` imports are removed from `friend-links.service.ts`.
- The `bumpVersion` + `purgeCDNCache` imports that were only used by the local invalidation function are also removed.

## Testing Decisions

- Existing friend-links integration tests (`friend-links.integration.test.ts`) verify cache behaviour after mutations — they remain the acceptance suite.
- No new tests needed. The coordinator pattern is already tested for posts and tags.
- Verify: full test suite passes, cache invalidation after friend-link mutations still works.

## Out of Scope

- Changing the friend-links cache key scheme or TTL.
- Adding CDN purge for additional URLs beyond `/friend-links`.
- Refactoring other services that may have local invalidation patterns (none found in the architecture review).
- Changing the coordinator's public API shape.

## Further Notes

- This is the smallest candidate from the 2026-07-28 architecture review — one function, five call-site replacements, zero risk.
- The coordinator already has `invalidatePost`, `invalidateSyncHash`, `invalidateTagRelated`, and `invalidateSite`. Adding `invalidateFriendLinks` completes the set.
- Friend-links was the only content type missed in the original coordinator consolidation.
