# Extract shared comment section component above the Theme Contract

Status: ready-for-agent
Blocked by: None

## Parent

[Shared comment interaction PRD](../PRD.md)

## What to build

Create a shared comment section component in `src/features/comments/components/` that owns data fetching, reply state, pagination, and form submission. Replace the per-theme comment implementations in default and fuwari themes with imports from the shared module.

## Acceptance criteria

- [ ] Shared comment section component created in `src/features/comments/components/`.
- [ ] Component owns: fetching root comments, fetching replies, reply expansion state, reply form visibility, comment submission, pagination ("load more").
- [ ] Component uses existing `use-comments` hooks from `src/features/comments/hooks/`.
- [ ] Visual styling uses theme CSS variables — no hardcoded theme-specific styles in the shared component.
- [ ] Default theme's comment components replaced with shared module import.
- [ ] Fuwari theme's comment components replaced with shared module import.
- [ ] Per-theme comment CSS preserved in theme stylesheets (shared component renders semantic class names / CSS variable consumers).
- [ ] Comment behaviour identical to before: create, reply, paginate, delete (own), admin moderate.
- [ ] Full test suite passes.
- [ ] Manual smoke test: comments work in both themes.

## Comments

<!-- conversation appended below -->
