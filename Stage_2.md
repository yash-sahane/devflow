# DevFlow — Stage 2 Plan: Auth, Real-Time Logs & Deployments

## Build on the MVP to add authentication, WebSocket streaming, deployment tracking, API docs, and tests.

## Stage 2 Data Flow

```
WebSocket Client connects → AuthGuard validates JWT token
        ↓
POST /projects/:id/builds (authenticated)
        ↓
  Build record created → BullMQ job enqueued
        ↓
  Worker picks job → emits log lines to Redis pub/sub channel
        ↓
  WebSocket Gateway subscribes → pushes live lines to client
        ↓
  Build completes → Worker creates Deployment record
        ↓
  GET /deployments/:id/rollback → swaps active deployment
```

---

## Architecture

```
AuthModule           ← JWT register/login/refresh
      ↓
LogsGateway          ← WebSocket namespace (/logs), Redis subscriber
      ↑
Worker (enhanced)    ← publishes log lines to Redis pub/sub
      ↓
DeploymentsModule    ← create deployment on build success, rollback logic
      ↓
SwaggerModule        ← auto-generated API docs at /api/docs
```

---

## Module Dependency Order

```
Step 1 — AuthModule        (no dependencies, build this first)
    ↓
Step 2 — Shared DTO/Enum updates  (used by AuthModule + everywhere)
    ↓
Step 3 — LogsGateway       (depends on Redis from QueueModule)
    ↓
Step 4 — Worker upgrade    (publishes to Redis, structured multi-step logs)
    ↓
Step 5 — DeploymentsModule (depends on BuildsModule + PrismaModule)
    ↓
Step 6 — Swagger           (decorates all existing modules, last touch)
    ↓
Step 7 — Tests             (can be written alongside any step above)
```

---

## Steps

### Step 1 — Auth Module (JWT) ⏳

- Install: `@nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs`
- Install types: `@types/passport-jwt @types/bcryptjs`
- `POST /auth/register` — hash password with `bcryptjs`, create `User` record
- `POST /auth/login` — validate credentials, return `accessToken` (JWT, 15m) + `refreshToken` (JWT, 7d)
- `POST /auth/refresh` — exchange refresh token for new access token
- `JwtStrategy` — extends `PassportStrategy(Strategy)`, validates JWT payload, returns `{ userId, email, role }`
- `JwtAuthGuard` — extends `AuthGuard('jwt')`, used as a guard on protected routes
- `@CurrentUser()` decorator — extracts user from `request.user` set by JwtStrategy
- `AuthModule` — provides `JwtStrategy`, `PassportModule`, `JwtModule.registerAsync` (reads `JWT_SECRET` from env)
- Wire `userId` into `Project.userId` on creation using `@CurrentUser()` in `ProjectsController`
- New files:
  - `apps/api/src/modules/auth/auth.module.ts`
  - `apps/api/src/modules/auth/auth.service.ts`
  - `apps/api/src/modules/auth/auth.controller.ts`
  - `apps/api/src/modules/auth/jwt.strategy.ts`
  - `apps/api/src/modules/auth/jwt-auth.guard.ts`
  - `apps/api/src/modules/auth/current-user.decorator.ts`

### Step 2 — Shared Types & DTO Updates ⏳

- Add `RegisterDto` — `email: string` (IsEmail), `password: string` (MinLength 8)
- Add `LoginDto` — `email: string` (IsEmail), `password: string`
- Add `UserRole` enum — `ADMIN = 'ADMIN'`, `DEV = 'DEV'`, `VIEWER = 'VIEWER'`
- Export all new items from `packages/shared/src/index.ts`
- New files:
  - `packages/shared/src/dto/register-dto.ts`
  - `packages/shared/src/dto/login-dto.ts`
  - `packages/shared/src/enums/user-role.enum.ts`

### Step 3 — WebSocket Gateway (Real-Time Log Streaming) ⏳

- Install: `@nestjs/websockets @nestjs/platform-socket.io socket.io`
- `LogsGateway` — `@WebSocketGateway({ namespace: '/logs', cors: true })`
- Client emits `subscribe-build` event with `{ buildId }` → gateway joins that socket to room `build:<buildId>`
- Gateway subscribes to Redis pub/sub channel `build-logs:<buildId>` using a dedicated `ioredis` subscriber instance
- On Redis message received → `server.to('build:<buildId>').emit('log-line', { message, timestamp })`
- On build complete → emit `build-complete` event with `{ buildId, status }`
- `LogsModule` — provides `LogsGateway`, imports `QueueModule` (for shared Redis config)
- Import `LogsModule` into `ApiModule`
- New files:
  - `apps/api/src/modules/logs/logs.gateway.ts`
  - `apps/api/src/modules/logs/logs.module.ts`

### Step 4 — Enhanced Worker (Structured Logs + Pub/Sub + Retries) ⏳

- Add a Redis publisher (`ioredis`) to the worker for publishing log lines
- Replace the single `setTimeout` simulation with structured steps:
  1. `Cloning repository...` (500ms delay)
  2. `Installing dependencies...` (1000ms delay)
  3. `Running build command...` (1500ms delay)
  4. `Build complete.`
- Each step: `BuildsRepository.addLog(buildId, message)` + `redisPublisher.publish('build-logs:<buildId>', JSON.stringify({ message, timestamp }))`
- On error: log error message to DB + publish to Redis channel, then set status `FAILED`
- Configure BullMQ job options in `BuildsService`: `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }`
- Add `@OnWorkerEvent('failed')` handler to log job-level failure metadata
- Modified file:
  - `apps/worker/src/processors/build.processor.ts`

### Step 5 — Deployments Module ⏳

- **Prisma schema update**: add `isActive Boolean @default(false)` to `Deployment` model → run `pnpm prisma migrate dev`
- **Repository**: `create(buildId, url)`, `findByBuildId(buildId)`, `findAllByProject(projectId)`, `setActive(deploymentId, projectId)` (sets one active, deactivates rest for project)
- **Service**:
  - `createDeployment(buildId)` — called by worker on `SUCCESS`; generates URL `pr-<buildId>.devflow.local`; creates `Deployment` record with `isActive: true`
  - `rollback(deploymentId)` — calls `setActive`, returns updated deployment
  - `getDeployments(projectId)` — returns all deployments for a project, ordered by `createdAt` desc
- **Controller**:
  - `GET /projects/:projectId/deployments` → list deployments
  - `GET /deployments/:id` → single deployment details
  - `POST /deployments/:id/rollback` → rollback to this deployment
- **Module**: imports `PrismaModule`, exports `DeploymentsService`
- Import `DeploymentsModule` into `WorkerModule` (worker needs `DeploymentsService` to create deployments)
- New files:
  - `apps/api/src/modules/deployments/deployments.module.ts`
  - `apps/api/src/modules/deployments/deployments.service.ts`
  - `apps/api/src/modules/deployments/deployments.controller.ts`
  - `apps/api/src/modules/deployments/deployments.repository.ts`

### Step 6 — Swagger / OpenAPI Docs ⏳

- Install: `@nestjs/swagger`
- In `main.ts`: configure `DocumentBuilder` with title, description, version, bearer auth scheme
- Call `SwaggerModule.setup('api/docs', app, document)`
- Decorate all DTOs in `packages/shared/src/dto/` with `@ApiProperty()` / `@ApiPropertyOptional()`
- Decorate all controllers with `@ApiTags('resource-name')`
- Decorate protected routes with `@ApiBearerAuth()`
- Add `@ApiResponse({ status, description })` to key endpoints
- Deliverable: browsable docs at `http://localhost:5500/api/docs`
- Modified files:
  - `apps/api/src/main.ts`
  - All controller files (add decorators)
  - All DTO files in `packages/shared/src/dto/`

### Step 7 — Unit Tests ⏳

- `projects.service.spec.ts` — mock `ProjectsRepository`; test `NotFoundException` thrown on missing id; test create calls repository with correct args
- `projects.repository.spec.ts` — mock `PrismaService`; test `findAll` calls `prisma.project.findMany` with `include: { builds: true }`
- `builds.service.spec.ts` — mock `BuildsRepository` + `Queue`; assert `queue.add('build-job', { buildId, projectId, commitSha })` is called; assert returned object has `{ buildId, status: 'QUEUED' }`
- `builds.repository.spec.ts` — mock `PrismaService`; test `updateStatus` calls `prisma.build.update` with correct args; test `addLog` creates a `BuildLog`
- `auth.service.spec.ts` — mock `PrismaService`; test register hashes password (does not store plaintext); test login returns `null` on wrong password
- `deployments.service.spec.ts` — mock `DeploymentsRepository`; test `createDeployment` generates correct URL format; test `rollback` calls `setActive`
- Pattern: use `Test.createTestingModule` with explicit provider mocking (same pattern as existing `*.spec.ts` files)
- New/modified files:
  - `apps/api/src/modules/projects/projects.service.spec.ts`
  - `apps/api/src/modules/projects/projects.repository.spec.ts`
  - `apps/api/src/modules/builds/builds.service.spec.ts`
  - `apps/api/src/modules/builds/builds.repository.spec.ts`
  - `apps/api/src/modules/auth/auth.service.spec.ts`
  - `apps/api/src/modules/deployments/deployments.service.spec.ts`

---

## New API Endpoints (Stage 2)

| Method | Route                              | Auth | Description                      |
| ------ | ---------------------------------- | ---- | -------------------------------- |
| `POST` | `/auth/register`                   | —    | Create user account              |
| `POST` | `/auth/login`                      | —    | Get access + refresh tokens      |
| `POST` | `/auth/refresh`                    | —    | Exchange refresh token           |
| `GET`  | `/projects/:projectId/deployments` | JWT  | List all deployments for project |
| `GET`  | `/deployments/:id`                 | JWT  | Get single deployment            |
| `POST` | `/deployments/:id/rollback`        | JWT  | Roll back to this deployment     |
| `WS`   | `/logs` (namespace)                | —    | Subscribe to live build logs     |

All existing `/projects` and `/builds` routes gain `JwtAuthGuard`.

---

## Environment Variables (additions)

```env
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Verification Checklist

- [ ] `POST /auth/register` creates user, password is hashed in DB
- [ ] `POST /auth/login` returns `accessToken` and `refreshToken`
- [ ] `GET /projects` without token → `401 Unauthorized`
- [ ] `GET /projects` with valid token → project list
- [ ] Trigger a build → WebSocket client receives log lines (`Cloning...`, `Installing...`, `Running...`) in real-time before build completes
- [ ] Build succeeds → `GET /projects/:id/deployments` returns a deployment with `isActive: true`
- [ ] `POST /deployments/:id/rollback` → older deployment becomes `isActive: true`
- [ ] `http://localhost:5500/api/docs` loads Swagger UI with all endpoints
- [ ] `pnpm test` passes all unit tests including new service/repo specs

---

## What Stage 2 Excludes (Stage 3)

- Real Docker container execution (still simulated multi-step)
- RBAC enforcement beyond JWT identity (Admin/Viewer role guards)
- Object storage for build artifacts (S3 / DigitalOcean Spaces)
- Preview deployment URLs served over real HTTP
- Prometheus metrics + Grafana dashboard
- Canary / rolling deployments
- DigitalOcean infrastructure provisioning (Terraform)
