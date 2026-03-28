# DevFlow MVP Implementation Plan (No-Gap)

## 1. Goal

Ship a stable MVP that supports project collaboration by multiple users with predictable authorization, while preserving existing build, logs, and deployment behavior.

MVP end state:

- Multiple users can work on one project.
- Access checks are role-based and centralized.
- Existing single-owner data keeps working after migration.
- No hidden authorization paths remain.

## 2. Scope Boundaries

### In scope (MVP only)

- Keep current JWT login and refresh flow as identity layer.
- Introduce project membership model.
- Enforce basic RBAC for projects, builds, deployments, and logs.
- Add minimal member management endpoints.
- Add focused tests for authorization and regression.

### Out of scope (deferred)

- SSO/OAuth providers.
- Fine-grained policy engine (condition-based rules).
- Enterprise secret management and compliance controls.
- Advanced deployment strategies (canary/blue-green).
- Multi-organization tenancy and billing.

## 3. Current Code Reality Map

Status snapshot from current codebase:

1. JWT auth exists and protects project/build/deployment routes.
2. Global user role exists (`ADMIN`, `DEV`, `VIEWER`) but is not fully enforced as route-level authorization policy.
3. Access is owner-based (`project.userId`) in repositories/services.
4. Queue + worker + logs + deployments are functional.
5. Stage docs are partially outdated versus current code progress.

This means the main gap is collaboration RBAC, not core build/deploy plumbing.

## 4. Gap Register (Current -> MVP)

G1. Missing project membership entity.

- Closure: add `ProjectMember` model with unique `(projectId, userId)`.

G2. Authorization logic is scattered.

- Closure: central authorization service + guard/decorator.

G3. Owner-based query filters block collaboration.

- Closure: membership-aware query patterns for projects/builds/deployments/logs.

G4. No member management API.

- Closure: list/add/update/remove member endpoints.

G5. Migration safety not fully defined.

- Closure: backfill owner as `PROJECT_ADMIN`; verify each project has at least one admin member.

G6. Last admin protection missing.

- Closure: block removal/demotion of final `PROJECT_ADMIN`.

G7. Authorization test coverage incomplete.

- Closure: add unit + integration tests for allow/deny matrix.

G8. Documentation drift across plan files.

- Closure: align Stage docs with this MVP plan after implementation.

## 5. Authorization Model for MVP

### Global role

- `ADMIN`: platform-level override.
- `DEV`, `VIEWER`: normal platform users.

### Project role

- `PROJECT_ADMIN`: manage project + members + privileged actions.
- `DEVELOPER`: build and deployment operations without member admin.
- `VIEWER`: read-only project access.

### Permission matrix

- `project.read`: `PROJECT_ADMIN`, `DEVELOPER`, `VIEWER`, `ADMIN`
- `project.update`: `PROJECT_ADMIN`, `ADMIN`
- `project.delete`: `PROJECT_ADMIN`, `ADMIN`
- `members.read`: `PROJECT_ADMIN`, `ADMIN`
- `members.write`: `PROJECT_ADMIN`, `ADMIN`
- `build.trigger`: `PROJECT_ADMIN`, `DEVELOPER`, `ADMIN`
- `logs.read`: `PROJECT_ADMIN`, `DEVELOPER`, `VIEWER`, `ADMIN`
- `deployment.read`: `PROJECT_ADMIN`, `DEVELOPER`, `VIEWER`, `ADMIN`
- `deployment.rollback`: `PROJECT_ADMIN`, `DEVELOPER`, `ADMIN`

## 6. Phase Plan (Execution)

## Phase 0 - Decision Lock

Goal: freeze core decisions and avoid rework.

Status: LOCKED (2026-03-28)

Canonical lock artifacts:

- `packages/shared/src/enums/user-role.enum.ts`
- `packages/shared/src/enums/project-role.enum.ts`
- `packages/shared/src/auth/permissions.ts`

Tasks:

1. Freeze role names and matrix in this file.
2. Confirm project membership as source of truth for access.
3. Confirm temporary coexistence of `Project.userId` during migration.

Exit criteria:

- All role names and permissions approved.
- No coding starts before this lock.

Decision lock confirmations:

1. Project membership is the source of truth for authorization in MVP and beyond.
2. `Project.userId` is temporary migration compatibility state only.
3. All endpoint-level permissions must map to the canonical permission constants before Phase 2 completion.

## Phase 1 - Schema and Migration Safety

Goal: create collaboration data model safely.

Tasks:

1. Add `ProjectMember` model:

- `id`, `projectId`, `userId`, `role`, `createdAt`, `updatedAt`

2. Add unique `(projectId, userId)`.
3. Add indexes for `projectId`, `userId`, `role`.
4. Create migration to backfill every existing project owner as `PROJECT_ADMIN`.
5. Add migration verification query to ensure no project is left without an admin member.

Primary files expected:

- `prisma/schema.prisma`
- `prisma/migrations/*`

Exit criteria:

- Existing projects are readable after migration.
- Every project has at least one admin member.

## Phase 2 - Central Authorization Infrastructure

Goal: unify authorization decisions.

Tasks:

1. Add authorization service methods:

- `canReadProject`
- `canManageProject`
- `canManageMembers`
- `canTriggerBuild`
- `canReadLogs`
- `canRollbackDeployment`

2. Keep `JwtAuthGuard` for identity only.
3. Add role/permission guard + decorator.
4. Implement `ADMIN` override in one place only.

Primary files expected:

- `apps/api/src/modules/auth/*` (guard wiring)
- new authorization module files

Exit criteria:

- Controllers/services do not implement custom ad hoc role logic.
- All authz decisions flow through one service.

## Phase 3 - Project and Member Management APIs

Goal: enable team collaboration operations.

Tasks:

1. Update project list/get to membership-aware access.
2. Update project create flow to auto-create creator membership as `PROJECT_ADMIN`.
3. Add endpoints:

- `GET /projects/:projectId/members`
- `POST /projects/:projectId/members`
- `PATCH /projects/:projectId/members/:userId`
- `DELETE /projects/:projectId/members/:userId`

4. Validate constraints:

- cannot remove last `PROJECT_ADMIN`
- invalid role transitions blocked

Primary files expected:

- `apps/api/src/modules/projects/*`
- new member controller/service/repository files

Exit criteria:

- Two users can access one project based on assigned roles.

## Phase 4 - Builds, Deployments, Logs Retrofit

Goal: close authorization leaks on related resources.

Tasks:

1. Replace owner-only checks in build queries with membership checks.
2. Replace owner-only checks in deployment queries with membership checks.
3. Ensure log read access checks member role.
4. Enforce rollback permission via centralized policy.

Primary files expected:

- `apps/api/src/modules/builds/*`
- `apps/api/src/modules/deployments/*`

Exit criteria:

- Unauthorized users cannot read or mutate resources.
- Authorized members preserve current behavior.

## Phase 5 - Tests and Documentation Alignment

Goal: guarantee no-gap delivery and prevent regressions.

Tasks:

1. Unit tests for permission decisions and edge cases.
2. Integration tests for cross-user allow/deny matrix.
3. Regression tests for queue + worker + deployment flows.
4. Update API docs and stage docs to remove outdated statuses.
5. Add migration rollback note and smoke-test playbook.

Primary files expected:

- `apps/api/src/modules/**/*.spec.ts`
- `Stage_1.md`, `Stage_2.md`, and this file

Exit criteria:

- Test suite green for authz and regression scenarios.
- Documentation reflects actual state and next steps.

## 7. Non-Negotiable No-Gap Checks

1. Every protected endpoint maps to a permission in this file.
2. Every permission has at least one automated test.
3. No repository performs hidden role checks outside the central policy contract.
4. No project becomes orphaned from admin membership after migration.
5. `ADMIN` override behavior is explicit and tested.

## 8. Implementation Sequence (Do Not Reorder)

1. Phase 0 lock
2. Phase 1 schema/migration
3. Phase 2 authz infrastructure
4. Phase 3 member APIs
5. Phase 4 resource retrofit
6. Phase 5 tests and docs

## 9. MVP Release Gate

Release only if all conditions are true:

1. Two non-admin users collaborate on one project with different project roles.
2. Unauthorized cross-user read/write attempts return deny response.
3. Existing pre-migration projects remain accessible.
4. Build trigger, logs, deployment list, rollback obey the permission matrix.
5. No duplicate authorization logic remains in controllers/services/repositories.

## 10. Handoff to Next-Level Plan

When MVP release gate is passed, pass these artifacts into post-MVP plan:

1. Final permission matrix and guard conventions.
2. Migration notes and data invariants.
3. Authz/regression test suite baseline.
4. Updated and aligned stage documentation.
