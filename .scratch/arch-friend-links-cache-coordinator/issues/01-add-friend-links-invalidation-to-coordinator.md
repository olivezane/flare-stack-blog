# Add invalidateFriendLinks to the cache-invalidation coordinator

Status: ready-for-agent
Blocked by: None

## Parent

[Friend-links cache invalidation coordinator PRD](../PRD.md)

## What to build

Add `invalidateFriendLinks` to `cache-invalidation.ts` and route all five friend-links mutations through it. Remove the local `invalidateCache` function from `friend-links.service.ts`.

## Acceptance criteria

- [ ] `invalidateFriendLinks(context)` added to `cache-invalidation.ts`, bumping `friend-links:list` version and purging `/friend-links` from CDN.
- [ ] Friend-links service imports `invalidateFriendLinks` instead of defining its own `invalidateCache`.
- [ ] Local `invalidateCache` function removed from `friend-links.service.ts`.
- [ ] Unused `CacheService` and `purgeCDNCache` imports removed from `friend-links.service.ts`.
- [ ] All five mutation methods (`createFriendLink`, `approveFriendLink`, `rejectFriendLink`, `updateFriendLink`, `deleteFriendLink`) call the coordinator.
- [ ] Full test suite passes (including friend-links integration tests).
- [ ] Lint and type-check pass.

## Comments

<!-- conversation appended below -->
