# DevFlow — MVP Plan: Projects + Builds + Queue

## A developer platform for triggering builds, streaming logs, and managing deployments.

## MVP Data Flow

```
POST /projects/:id/builds
        ↓
  Create Build record (status=QUEUED)
        ↓
  Push job to BullMQ queue
        ↓
  Worker picks the job
        ↓
  Update status → RUNNING
        ↓
  Execute build (simulate for MVP, real Docker later)
        ↓
  Store log lines in BuildLog table
        ↓
  Update status → SUCCESS / FAILED
```

---

## Architecture

```
ProjectsController   ← HTTP routes
      ↓
ProjectsService      ← business logic, error handling
      ↓
ProjectsRepository   ← Prisma queries only
      ↓
PrismaService        ← Postgres connection
```

This 3-layer pattern (Controller → Service → Repository) is repeated for every module.

---

## Module Dependency Order

```
Step 3 — ProjectsModule   (no dependencies, build this first)
    ↓
Step 4 — QueueModule      (BullMQ + Redis, must exist before Builds)
    ↓
Step 5 — BuildsModule     (depends on Projects + Queue)
    ↓
Step 6 — Worker           (consumes from Queue, writes back to DB)
```

---

## Steps

### Step 1 — Prisma Schema ✅

- Models: `User`, `Project`, `Build`, `Deployment`, `BuildLog`
- Proper `@relation` fields between all models
- `createdAt` / `updatedAt` timestamps
- `Build.status` defaults to `"QUEUED"`
- Run: `pnpm prisma migrate dev`

### Step 2 — DTOs + Validation ✅

- `CreateProjectDto` — `name: string`, `repoUrl: string`
- `CreateBuildDto` — `commitSha: string`
- Both in `packages/shared/src/dto/` and exported from `@devflow/shared`
- `class-validator` + `class-transformer` installed
- `ValidationPipe` enabled globally in `apps/api/src/main.ts`

### Step 3 — ProjectsModule ✅

- **Repository**: `findAll()`, `findById(id)`, `create(dto)`, `delete(id)`
- **Service**: delegates to repository, throws `NotFoundException` when project not found
- **Controller**: `GET /projects`, `GET /projects/:id`, `POST /projects`, `DELETE /projects/:id`
- **Module**: imports `PrismaModule`, exports `ProjectsService`

### Step 4 — QueueModule 🔄

- Install: `@nestjs/bullmq bullmq ioredis`
- `BullModule.forRootAsync` — reads `REDIS_HOST` / `REDIS_PORT` from env via `ConfigService`
- `BullModule.registerQueue({ name: 'builds' })` — registers the builds queue
- Exports `BullModule` so `BuildsModule` can inject the queue
- Env vars: `REDIS_HOST=localhost`, `REDIS_PORT=6379`

### Step 5 — BuildsModule ⏳

- **Repository**: `create(projectId, commitSha)`, `findById(id)`, `updateStatus(id, status)`, `addLog(buildId, message)`, `findLogs(buildId)`
- **Service**: `triggerBuild(projectId, dto)` — creates DB record + enqueues job `{ buildId, projectId, commitSha }`
- **Controller**: `POST /projects/:projectId/builds`, `GET /builds/:id`, `GET /builds/:id/logs`
- **Module**: imports `PrismaModule` + `QueueModule`

### Step 6 — Worker ⏳

- Runs as a pure **queue consumer** — no HTTP server (`createApplicationContext()`)
- `BuildProcessor` decorated with `@Processor('builds')` handles jobs:
  1. Update build status → `RUNNING`
  2. Simulate build work (`setTimeout` for MVP)
  3. Insert a `BuildLog` row
  4. Update build status → `SUCCESS` or `FAILED`
- Has its own `PrismaModule` to write back to DB
- Install `@nestjs/bullmq bullmq ioredis` in root

---

## API Endpoints (MVP)

| Method   | Route                         | Description              |
| -------- | ----------------------------- | ------------------------ |
| `GET`    | `/projects`                   | List all projects        |
| `GET`    | `/projects/:id`               | Get project + its builds |
| `POST`   | `/projects`                   | Create a project         |
| `DELETE` | `/projects/:id`               | Delete a project         |
| `POST`   | `/projects/:projectId/builds` | Trigger a build          |
| `GET`    | `/builds/:id`                 | Get build status         |
| `GET`    | `/builds/:id/logs`            | Get build log lines      |

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/devflow
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Local Dev Setup

```bash
# 1. Start Postgres + Redis
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=devflow --name devflow-db postgres:15
docker run -d -p 6379:6379 --name devflow-redis redis:7

# 2. Run migrations
pnpm prisma migrate dev

# 3. Start API
pnpm run start:api:dev

# 4. Start Worker
pnpm run start:worker:dev
```

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | NestJS + TypeScript                 |
| Database     | PostgreSQL via Prisma ORM           |
| Queue        | BullMQ + Redis                      |
| Validation   | class-validator + class-transformer |
| Monorepo     | NestJS CLI monorepo                 |
| Shared types | `@devflow/shared` (local package)   |

---

## What MVP Excludes (future phases)

- JWT authentication / RBAC
- Real Docker build execution
- WebSocket log streaming
- Preview deployments / URLs
- Artifact storage (S3 / DO Spaces)
- Metrics / observability
- Canary / rolling deployments
