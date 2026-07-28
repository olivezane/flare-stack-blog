# Extract coercedDate and parameterise site-config schema factory

Status: ready-for-agent
Blocked by: None

## Parent

[Shared schema primitives PRD](../PRD.md)

## What to build

Create `src/lib/schema-helpers.ts` with the shared `coercedDate` Zod primitive. Replace 3 local definitions in feature schemas. Optionally refactor `site-config.schema.ts` to a parameterised factory — defer if complex, do the `coercedDate` extraction as the minimum viable change.

## Acceptance criteria

- [ ] `src/lib/schema-helpers.ts` created with `coercedDate` export.
- [ ] `posts.schema.ts`, `tags.schema.ts`, `comments.schema.ts` import `coercedDate` from the shared module instead of defining it locally.
- [ ] Local `coercedDate` definitions removed from all three feature schemas.
- [ ] Type-check passes — all Zod inference produces identical types.
- [ ] Existing tests pass — no schema behaviour change.
- [ ] (Optional) `site-config.schema.ts` refactored to parameterised factory — if deferred, note in comments.

## Comments

<!-- conversation appended below -->
