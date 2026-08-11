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
- `PATCH /tickets/:id` — update `status` and/or `priority`
- `GET /tickets/stats` — ticket counts grouped by status (all three statuses always present, zero-filled)

## Decisions & Tradeoffs

Used Prisma over raw SQL for speed and type safety within the time box, at the cost of an extra abstraction layer a reviewer has to trust. Ticket `id` is an auto-increment integer rather than a UUID, since nothing here is distributed or exposed to untrusted clients — simpler to read and test. Auth was left out entirely as out of scope for the assignment; a real deployment would need at least basic auth on write endpoints. Tests run against the same dev Postgres database rather than an isolated test database/schema, with each test cleaning up the rows it creates — faster to set up, but a bit riskier for parallel test runs (mitigated by disabling file parallelism in Vitest). The frontend has no routing library or global state manager since a single page with `useState`/`useEffect` is enough for this scope. Styling is intentionally plain CSS with no component library, since visual polish isn't graded. Status changes update the UI optimistically (with rollback on failure) instead of a full refetch, since that's the interaction a user does most often. Priority sort is done in-memory after fetching the filtered set rather than in the DB query, because Postgres/Prisma sort enums alphabetically, not by urgency — fine at this data scale, but would move to a raw `CASE` `ORDER BY` or a numeric rank column if ticket volume grew. Given more time, I'd add an isolated test database, cursor-based pagination for the ticket list, and basic auth/rate-limiting on the API.
