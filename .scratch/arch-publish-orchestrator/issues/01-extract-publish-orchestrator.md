# Extract PublishOrchestrator from the Post service

Status: ready-for-agent
Blocked by: None

## Parent

[PublishOrchestrator PRD](../PRD.md)

## What to build

Extract the 87-line `startPostProcessWorkflow` function from `posts.service.ts` into a dedicated `publish-orchestrator.ts` module. The orchestrator owns revision creation, date auto-set, future-post detection, and workflow dispatch.

## Acceptance criteria

- [ ] `publish-orchestrator.ts` created with `startPublish(context, { postId, status, clientToday })` export.
- [ ] Implementation moved from `posts.service.ts` lines 406–493 — revision snapshot, date auto-set, future detection, workflow dispatch, old-instance termination.
- [ ] `isFuturePublishDate` import moved to orchestrator.
- [ ] Post service's `startPostProcessWorkflow` delegates to orchestrator, or callers updated to import orchestrator directly.
- [ ] Post service shrinks by ~87 lines.
- [ ] Existing tests pass — `startPostProcessWorkflow` behaviour unchanged.
- [ ] Orchestrator tested independently with mock workflow bindings (using existing `WorkflowStep` mock pattern).
- [ ] Lint and type-check pass.

## Comments

<!-- conversation appended below -->
