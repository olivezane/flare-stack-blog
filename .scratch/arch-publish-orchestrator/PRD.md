# Extract workflow orchestration from the Post service into a PublishOrchestrator

Status: ready-for-agent
Source: architecture-review-20260728

## Problem Statement

`startPostProcessWorkflow` in `posts.service.ts` (lines 406–493, 87 lines) embeds workflow orchestration logic that is a distinct concern from reading and writing Posts:

- Creating a publish revision snapshot
- Auto-setting `publishedAt` on first publication
- Detecting future publish dates
- Dispatching `POST_PROCESS_WORKFLOW`
- Terminating old `SCHEDULED_PUBLISH_WORKFLOW` instances
- Conditionally creating new `SCHEDULED_PUBLISH_WORKFLOW` for future posts

This logic lives inside the Post service, coupling post CRUD to workflow dispatch details. Testing post mutations requires mocking Cloudflare Workflow bindings. The orchestration rules (revision before dispatch, date auto-set, future-post branching) have no independent test coverage — they're only exercised through full Post service integration tests.

By the deletion test: extracting the orchestrator concentrates workflow rules into one module; deleting it would scatter revision creation, date resolution, and workflow dispatch across every caller that publishes a post.

## Solution

Extract a **PublishOrchestrator** module. Its interface:

```
start(context, { postId, status, clientToday }) → void
```

Implementation: the current 87 lines of `startPostProcessWorkflow`, moved behind a clean seam. The Post service calls it after updating post status. The orchestrator owns the workflow seam — it knows about `POST_PROCESS_WORKFLOW`, `SCHEDULED_PUBLISH_WORKFLOW`, revision creation, and date auto-set.

Tests inject mock workflow bindings or use the existing `WorkflowStep` mock pattern from `posts.integration.test.ts`. The orchestrator is tested independently: "given a draft post being published for the first time, the orchestrator auto-sets publishedAt, creates a revision, and dispatches the post-process workflow."

## User Stories

1. As a test author, I want to test publish orchestration rules independently of post CRUD, so that workflow dispatch bugs are caught in focused tests.
2. As a maintainer changing how revisions work, I want the change confined to the orchestrator, so that I don't touch post CRUD code.
3. As a maintainer changing how scheduled publish works, I want the change confined to the orchestrator, so that the workflow dispatch contract is the only thing the Post service depends on.
4. As a developer reading the Post service, I want `updatePost` to be about updating a post, not about workflow dispatch, so that the function's purpose is clear.
5. As a developer adding a new publish-time side effect, I want to add it to the orchestrator, so that I don't bloat the Post service further.

## Implementation Decisions

- New module: `src/features/posts/services/publish-orchestrator.ts`.
- Exports one function: `startPublish(context, { postId, status, clientToday })`.
- The Post service's `startPostProcessWorkflow` becomes a thin wrapper that calls the orchestrator, or is removed and callers call the orchestrator directly.
- The orchestrator imports from `PostRepo`, `PostRevisionRepo`, `PostAutoSnapshotService` (logging), and accesses `context.env.POST_PROCESS_WORKFLOW` / `context.env.SCHEDULED_PUBLISH_WORKFLOW`.
- `isFuturePublishDate` import moves from the Post service to the orchestrator.
- The existing `startPostProcessWorkflow` in `posts.service.ts` is replaced with a delegation to the orchestrator (or removed if the only caller is the admin API, which can import the orchestrator directly).

## Testing Decisions

- New test file: `publish-orchestrator.test.ts` (or added to `posts.integration.test.ts` if the orchestrator needs D1/KV).
- Tests use the existing `WorkflowStep` mock pattern from the `PostProcessWorkflow` describe block in `posts.integration.test.ts`.
- Test cases:
  - Draft → published (first time): auto-sets publishedAt, creates revision, dispatches post-process.
  - Draft → published (already had publishedAt): does not overwrite, still creates revision.
  - Future publish: creates scheduled-publish workflow, does not dispatch post-process as immediate.
  - Non-published status change: skips all orchestration.
- Existing Post service integration tests that exercise `startPostProcessWorkflow` continue to pass — they now exercise the orchestrator through the Post service's delegation.

## Out of Scope

- Changing the workflow dispatch API or Cloudflare Workflow bindings.
- Extracting other orchestration (comment moderation, import/export) — each is a separate concern.
- Moving workflow step logic (post-process steps, scheduled-publish steps) — only the dispatch orchestration moves.
- Changing how revisions are stored or validated.

## Further Notes

- This candidate pairs well with candidate #1 (split Post service). After both: the Post service is split by read/write, and the write side delegates orchestration to a dedicated module. The Post service becomes a thin coordinator: "update the post, then tell the orchestrator."
- The orchestrator is a "ports & adapters" dependency: it takes `env` (containing workflow bindings) from context. Tests provide mock bindings.
- ADR-0004 (Workflows and Queues for async work) is respected — the orchestrator dispatches to Workflows, it doesn't replace them.
