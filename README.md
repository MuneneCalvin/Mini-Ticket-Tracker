# Mini Ticket Tracker

A minimal support ticket tracker: Express + TypeScript + Prisma/PostgreSQL API, React (Vite) frontend.

## Stack

| Layer    | Choice                          |
| -------- | -------------------------------- |
| Backend  | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL                       |
| Frontend | React, Vite, TypeScript          |
| Tests    | Vitest, Supertest                |

## Setup & run

Requires **Node 20+** and **Docker**.

**1. Start Postgres**

```sh
docker compose up -d
```

Runs on host port `5434` to avoid clashing with a locally installed Postgres — see `docker-compose.yml`.

**2. Backend**

```sh
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

API runs at `http://localhost:3001`.

Optional — seed a handful of sample tickets so the UI isn't empty on first run:

```sh
npx prisma db seed
```

**3. Frontend** (new terminal)

```sh
cd frontend
cp .env.example .env
npm install
npm run dev
```

UI runs at `http://localhost:5173` (or the next free port).

**4. Tests** (Postgres from step 1 must be running)

```sh
cd backend
npm test
```

**5. Typecheck / lint** (either package)

```sh
npm run typecheck
npm run lint   # frontend only
```

## API

| Endpoint             | Description                                                            |
| --------------------- | ------------------------------------------------------------------------ |
| `POST /tickets`       | Create a ticket. `title` required (max 200 chars); `description` optional (max 2000 chars); `status`, `priority` optional. |
| `GET /tickets`        | List tickets. Query params below.                                      |
| `PATCH /tickets/:id`  | Update any of `title`, `description`, `status`, `priority` — at least one required. |
| `DELETE /tickets/:id` | Delete a ticket. `204` on success.                                      |
| `GET /tickets/stats`  | Ticket counts grouped by status. All three statuses always present, zero-filled. |

`GET /tickets` query params:

| Param    | Values                                            | Default        |
| -------- | -------------------------------------------------- | -------------- |
| `status` | `open`, `in_progress`, `closed`                    | none (all)     |
| `search` | Case-insensitive substring match on title          | none           |
| `sort`   | `created_desc`, `created_asc`, `priority` (high first) | `created_desc` |
| `page`   | Page number                                         | `1`            |
| `limit`  | Page size, max `100`                                | `20`           |

## UI

- Click a ticket row to open a detail view with its full description.
- Use the status dropdown inline in the table for a quick status change, no modal needed.
- Create, edit, and delete all happen in modals. Delete asks for confirmation first; status/priority changes from the table don't, since they're the highest-frequency action and easy to reverse.
- Filter by status, search by title, and sort (newest / oldest / priority) using the controls above the table.

## Decisions & Tradeoffs

**Backend**

- Prisma over raw SQL, for speed and type safety within the time box — trades in an abstraction layer the reviewer has to trust.
- Ticket `id` is an auto-increment integer, not a UUID: nothing here is distributed or exposed to untrusted clients, so the simpler option wins.
- Auth is out of scope for the assignment. A real deployment would need at least basic auth on write endpoints.
- Priority sort happens in-memory after fetching the filtered set, not in the DB query — Postgres/Prisma sort enums alphabetically, not by urgency. Fine at this data scale; would move to a raw `CASE ORDER BY` or a numeric rank column if ticket volume grew.
- `DELETE /tickets/:id` and full-field editing via `PATCH` (title/description, not just status/priority) go beyond the original assignment spec. Added deliberately, kept small: one confirm modal, no soft-delete or audit trail.

**Frontend**

- No routing library or global state manager — a single page with `useState`/`useEffect` is enough at this scope.
- Visual design is an intentional dark "ops console" identity (function-driven color — priority/status carry meaning, not decoration — plus a monospace data layer), custom-built with plain CSS rather than a component library.
- Status changes from the table update optimistically, with rollback on failure, since that's the highest-frequency interaction. Destructive actions (delete) get a confirm step instead, since they're rare and irreversible.

**Testing**

- Tests run against the same dev Postgres database rather than an isolated test schema, with each test cleaning up the rows it creates — faster to set up, a bit riskier for parallel runs (mitigated by disabling file parallelism in Vitest).

**Given more time**, I'd add an isolated test database, cursor-based pagination, and basic auth/rate-limiting on the API.
