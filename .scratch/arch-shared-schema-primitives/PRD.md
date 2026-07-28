# Extract shared schema primitives — coalesce duplicated Zod patterns

Status: ready-for-agent
Source: architecture-review-20260728

## Problem Statement

Three Zod patterns are duplicated across the codebase:

1. **`coercedDate`** — `z.union([z.date(), z.string().pipe(z.coerce.date())])` — appears independently in `posts.schema.ts`, `tags.schema.ts`, and `comments.schema.ts`. Every feature that handles dates from D1 (which stores Unix timestamps as integers, exposed as Date objects or ISO strings depending on context) redefines this union.

2. **Theme site config schema triplication** — `site-config.schema.ts` (370 lines) defines the same theme configuration shape three times: raw output schema, input schema, and form schema. Each variant has near-identical field lists with slight coercion differences (form uses strings, input uses mixed, output uses parsed values). The file is dominated by schema structural repetition rather than business logic.

3. **`CACHE_NAMESPACES`** — the `CacheNamespace` type is defined in `cache/types.ts` but consumer modules use raw string literals that may drift from the canonical list.

These are shallow by the deletion test: extracting a shared `coercedDate` removes 3 local definitions and concentrates the coercion semantics in one place. A parameterised theme config factory removes ~200 lines of near-duplicate schema definitions.

## Solution

Create `src/lib/schema-helpers.ts` with:
- `coercedDate` — the canonical Zod union for D1 date fields
- (future) any other recurring Zod patterns discovered during extraction

Refactor `site-config.schema.ts` to use a single parameterised factory that derives input and form variants from one canonical schema definition. The factory takes a mode parameter (`"output"`, `"input"`, `"form"`) and adjusts field types accordingly.

## User Stories

1. As a developer adding a new feature with date fields, I want to import `coercedDate` from a shared module, so that I don't rediscover the D1 date union pattern.
2. As a maintainer changing how dates are coerced, I want to change one definition, so that the fix applies everywhere dates cross the D1 boundary.
3. As a developer reading `site-config.schema.ts`, I want the file to express the config shape once, so that I don't have to diff three near-identical schemas to spot the differences.
4. As a code reviewer, I want a PR adding a theme config field to touch one schema definition, so that I don't review the same field added three times.
5. As an AI agent navigating schemas, I want to find the canonical date type in one place, so that I don't infer a pattern from whichever feature schema I opened first.

## Implementation Decisions

- New file: `src/lib/schema-helpers.ts` — exports `coercedDate` and any other extracted primitives.
- `coercedDate` definition: `z.union([z.date(), z.string().pipe(z.coerce.date())])` — the exact pattern currently in use.
- Feature schemas (`posts.schema.ts`, `tags.schema.ts`, `comments.schema.ts`) replace their local `coercedDate` with the import.
- `site-config.schema.ts` refactored to a factory pattern: one canonical field list, mode parameter controls output/input/form variants.
- Site config refactor is a deeper change — if it proves complex, split into a separate issue and only do `coercedDate` extraction in this one.

## Testing Decisions

- Existing schema validation tests (if any) remain the acceptance suite.
- Add a focused test for `coercedDate` in `schema-helpers.test.ts`: accepts Date, accepts ISO string, rejects number, rejects arbitrary string.
- Site config schema tests must pass with identical behaviour after refactor.
- Run full type-check — Zod type inference must produce identical types.

## Out of Scope

- Changing the schema shapes themselves (e.g. switching from `z.coerce.date()` to a custom transformer).
- Normalising Tag names or changing Tag uniqueness rules.
- Adding runtime validation beyond what Zod already provides.
- Extracting non-Zod patterns (e.g. Drizzle column definitions).

## Further Notes

- `coercedDate` extraction is immediate and zero-risk. The site config refactor is higher-effort and can be deferred.
- The `src/lib/` directory already hosts shared infrastructure — `schema-helpers.ts` fits the existing convention.
- This is an in-process dependency (pure Zod types) — no I/O, no adapter needed.
