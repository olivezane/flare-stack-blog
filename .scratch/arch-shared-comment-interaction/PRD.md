# Lift comment UI logic above the Theme Contract

Status: ready-for-agent
Source: architecture-review-20260728

## Problem Statement

The default and fuwari themes each reimplement the full comment UI: data fetching, reply nesting, pagination, form state, submit handling. Identical hooks and state machines live in two places with different CSS wrappers. The Theme Contract (`components.ts`) defines page-level component props (`PostPageProps`, `HomePageProps`, etc.) but not shared interaction modules — every theme reinvents comment behaviour.

This is a shallow-module problem across the Theme Contract seam: the contract defines *what data* a page receives but not *what interaction* shared components provide. Adding a third theme would mean implementing comments a third time. Fixing a comment bug means fixing it twice.

Two adapters (default theme, fuwari theme) justify the seam — but the seam is at the wrong altitude. It should be at the interaction level, not the page level.

## Solution

Lift comment interaction logic into a shared module under `src/features/comments/components/`. The shared module owns:
- Data fetching (TanStack Query hooks for comments + replies)
- Reply state (which thread is expanded, reply form visibility)
- Pagination (load more replies)
- Form submission (create comment, create reply)
- Optimistic updates

Themes provide only the visual skin — a set of render props, slots, or a CSS-class mapping that the shared module uses to render themed DOM. The Theme Contract gains an optional `CommentSection` entry (or the shared module is imported directly by theme page components, bypassing the contract for this one cross-cutting concern).

Two design options to evaluate during implementation:
- **Option A (contract extension)**: Add `CommentSection: React.ComponentType<CommentSectionProps>` to `ThemeComponents`. Each theme provides its own visual wrapper around the shared interaction module. The shared module exports hooks + state; themes compose them.
- **Option B (direct import)**: Themes import `src/features/comments/components/comment-section.tsx` directly. The shared component uses CSS variables from the theme for styling. Themes don't provide a CommentSection adapter — the shared component is the adapter.

Default to **Option B** as the simpler approach. Option A adds contract surface for one component; Option B treats the shared comment UI as a feature module that themes consume like any other shared component.

## User Stories

1. As a theme author, I want to use a pre-built comment section component, so that I don't reimplement comment fetching, reply nesting, and form state.
2. As a maintainer fixing a comment bug, I want to fix it once in the shared module, so that both themes get the fix.
3. As a developer adding a third theme, I want comments to work out of the box, so that I can focus on visual design.
4. As a user, I want comment behaviour to be consistent across themes, so that switching themes doesn't change how replying works.
5. As a code reviewer, I want comment-related PRs to touch one module, so that I don't review the same change duplicated across theme directories.

## Implementation Decisions

- New shared module: `src/features/comments/components/comment-section.tsx` (or a `components/` directory with `comment-section.tsx`, `comment-item.tsx`, `comment-form.tsx`).
- Shared module uses existing TanStack Query hooks from `src/features/comments/hooks/use-comments.ts`.
- Themes replace their per-theme comment components with the shared module.
- Per-theme comment CSS stays in theme stylesheets — the shared component uses theme CSS variables for visual customisation.
- The Theme Contract (`components.ts`) is not modified for this change (avoids contract bloat for one component).
- Default and fuwari themes both import from `@/features/comments/components/comment-section`.

## Testing Decisions

- Existing comment integration tests (`comments.integration.test.ts`) remain the acceptance suite — comment CRUD behaviour is unchanged.
- Visual regression: manual comparison of comment rendering in both themes before and after.
- If the shared module extracts interaction hooks, add focused hook tests for reply state and pagination.
- No new integration test required — the data flow (fetch → render → submit) is unchanged.

## Out of Scope

- Changing the comment data model or API.
- Extracting other duplicated theme components (post cards, friend-link cards, search results) — this establishes the pattern; other components follow if it proves successful.
- Modifying the Theme Contract interface.
- Changing how themes handle layout (Navbar, Footer, Sidebar) — those are genuinely different between themes.

## Further Notes

- This is marked "Speculative" because it touches the Theme Contract boundary (ADR-0003) and changes how themes compose behaviour. The pattern may or may not generalise.
- The immediate win is deleting ~200 lines of duplicated comment UI code across two themes.
- Option B (direct import, bypass contract) is the lower-risk approach — it doesn't expand the Theme Contract surface for one component. If the pattern proves useful for other shared components (post cards, search results), the contract can be extended later.
- A prototype of the shared comment section in one theme, with the other theme adopting it after validation, would de-risk this.
