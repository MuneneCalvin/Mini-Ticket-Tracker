# Mini Ticket Tracker

A minimal support ticket tracker: Express + TypeScript + Prisma/PostgreSQL API, React (Vite) frontend.

## Stack

- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL
- Frontend: React + Vite + TypeScript
- Tests: Vitest + Supertest

## Setup & run

Requires Node 20+ and Docker.

1. Start Postgres:
   ```
   docker compose up -d
   ```
   (Runs on host port `5434` to avoid clashing with a locally installed Postgres — mapped in `docker-compose.yml`.)

2. Backend:
   ```
   cd backend
   cp .env.example .env
   npm install
   npx prisma migrate dev
   npm run dev
   ```
   API runs at `http://localhost:3001`.

   Optional: seed a handful of sample tickets so the UI isn't empty on first run:
   ```
   npx prisma db seed
   ```

3. Frontend (new terminal):
   ```
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
   UI runs at `http://localhost:5173` (or next free port).

4. Run backend tests (Postgres from step 1 must be running):
   ```
   cd backend
   npm test
   ```

5. Typecheck / lint (either package):
   ```
   npm run typecheck
   npm run lint   # frontend only
   ```

## API

- `POST /tickets` — create a ticket (`title` required, max 200 chars; `description` optional, max 2000 chars; `status`, `priority` optional)
- `GET /tickets?status=&page=&limit=&search=&sort=` — list tickets
  - `status` — exact match filter (`open` / `in_progress` / `closed`)
  - `search` — case-insensitive substring match on title
  - `sort` — `created_desc` (default), `created_asc`, or `priority` (high first)
  - `page` / `limit` — offset pagination (default `page=1`, `limit=20`, max `limit=100`)
- `PATCH /tickets/:id` — update any of `title`, `description`, `status`, `priority` (at least one required)
- `DELETE /tickets/:id` — delete a ticket, `204` on success
- `GET /tickets/stats` — ticket counts grouped by status (all three statuses always present, zero-filled)

## UI

Click a ticket row to open a detail view with its full description, or use the status dropdown inline in the table for a quick status change without leaving the list. Creating, editing, and deleting all happen in modals. Delete is confirmed before it fires; status/priority changes from the table are intentionally not confirmed — they're the highest-frequency action and reversible with one more click. The table can be filtered by status, searched by title, and sorted (newest/oldest/priority) via the controls above it.

## Decisions & Tradeoffs

Used Prisma over raw SQL for speed and type safety within the time box, at the cost of an extra abstraction layer a reviewer has to trust. Ticket `id` is an auto-increment integer rather than a UUID, since nothing here is distributed or exposed to untrusted clients — simpler to read and test. Auth was left out entirely as out of scope for the assignment; a real deployment would need at least basic auth on write endpoints. Tests run against the same dev Postgres database rather than an isolated test database/schema, with each test cleaning up the rows it creates — faster to set up, but a bit riskier for parallel test runs (mitigated by disabling file parallelism in Vitest). The frontend has no routing library or global state manager since a single page with `useState`/`useEffect` is enough for this scope. The visual design is an intentional dark "ops console" identity (function-driven color — priority/status carry meaning, not decoration — plus a monospace data layer) rather than default light CRUD styling, custom-built with plain CSS rather than a component library. Status changes from the table update optimistically (with rollback on failure) instead of a full refetch, since that's the highest-frequency interaction; destructive actions (delete) get a confirm step instead, since they're rare and irreversible. `DELETE /tickets/:id` and full-field editing via `PATCH` (title/description, not just status/priority) go beyond the original assignment spec — added deliberately, kept small (one confirm modal, no soft-delete or audit trail). Priority sort is done in-memory after fetching the filtered set rather than in the DB query, because Postgres/Prisma sort enums alphabetically, not by urgency — fine at this data scale, but would move to a raw `CASE` `ORDER BY` or a numeric rank column if ticket volume grew. Given more time, I'd add an isolated test database, cursor-based pagination, and basic auth/rate-limiting on the API.
