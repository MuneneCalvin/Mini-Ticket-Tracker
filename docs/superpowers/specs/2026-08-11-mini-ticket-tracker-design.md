# Mini Ticket Tracker — Design Spec

Take-home assignment (Lodwar Services, mid-level full-stack). Deadline: Wed 2026-08-12, 6pm EAT.

## Goal

Minimal backend + UI for tracking support tickets: REST API, Postgres DB, lightweight React UI. Judged on judgment/structure/decision-making, not feature completeness or polish. Don't over-build.

## Stack

- Backend: Node.js + Express + TypeScript
- DB: PostgreSQL, accessed via Prisma (schema-driven migrations, type-safe queries)
- Frontend: React + Vite + TypeScript
- Tests: Vitest + supertest (API/integration tests)
- Local run: docker-compose for Postgres only; app processes run via npm scripts (not containerized, to keep dev loop fast)

## Repo layout

```
/backend       Express API, Prisma schema, tests
/frontend      React app (Vite)
/docker-compose.yml   Postgres service only
/README.md
```

## Data model

```prisma
model Ticket {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  status      Status   @default(open)
  priority    Priority @default(medium)
  createdAt   DateTime @default(now())
}

enum Status {
  open
  in_progress
  closed
}

enum Priority {
  low
  medium
  high
}
```

Assumption: `id` is auto-increment integer, not UUID — simpler for a small take-home, no distributed-id requirement stated.

## API

- `POST /tickets` — body `{title, description?, status?, priority?}`. `title` required (400 if missing/empty). `status`/`priority` default to `open`/`medium` if omitted. Returns 201 + created ticket.
- `GET /tickets?status=&page=&limit=` — `status` optional exact-match filter. `page` (default 1) and `limit` (default 20) for offset pagination. Returns `{data: Ticket[], page, limit, total}`.
- `PATCH /tickets/:id` — body may include `status` and/or `priority` only (title/description not editable per spec's "way to change status" requirement — priority included since PATCH endpoint explicitly says "status or priority"). 404 if id not found, 400 on invalid enum value.
- `GET /tickets/stats` — returns counts grouped by status, e.g. `{open: 3, in_progress: 1, closed: 5}`. All three keys always present, defaulting to 0.

Validation via `zod`. Errors returned as `{error: string}` with appropriate status code (400/404).

No auth — out of scope per assignment (single-tenant internal tool assumption).

## Frontend

Single page (`App.tsx`), three components:

- `TicketForm` — title (required), description, priority select. POSTs, refreshes list on success.
- `TicketList` — table/list of tickets showing title, status badge, priority badge, created date. Status changeable inline via `<select>` that PATCHes and updates local state. Status filter dropdown + basic prev/next pagination controls.
- `StatsBar` — small summary showing count per status, fetched from `/tickets/stats`.

No routing library, no state management library — plain `useState`/`useEffect` + `fetch`. Styling: minimal CSS, no component library, since visual polish is explicitly not graded.

## Testing

`backend/tests/tickets.test.ts` using vitest + supertest against the dev Postgres DB (docker-compose), run serially. Covers:

1. `POST /tickets` creates a ticket and returns 201 with correct fields.
2. `POST /tickets` returns 400 when `title` missing.
3. `GET /tickets/stats` returns correct grouped counts after seeding known tickets.
4. `PATCH /tickets/:id` updates status and returns updated ticket.

Tradeoff (documented in README): tests run against the same dev DB rather than an isolated test DB/schema, for setup simplicity within the time box. Each test cleans up rows it creates.

## Out of scope (explicitly, to avoid over-building)

- Auth/authz
- Ticket editing beyond status/priority (per PATCH spec)
- Soft delete / delete endpoint (not required)
- Real-time updates, websockets
- CI pipeline
- Isolated test database

## Commit plan

Incremental commits per assignment requirement — roughly: scaffold + docker-compose → Prisma schema/migration → API endpoints (one or few commits) → tests → frontend scaffold → frontend components → README.
