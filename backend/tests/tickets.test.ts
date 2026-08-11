import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/prisma.js";

beforeEach(async () => {
  await prisma.ticket.deleteMany();
});

afterAll(async () => {
  await prisma.ticket.deleteMany();
  await prisma.$disconnect();
});

describe("POST /tickets", () => {
  it("creates a ticket with defaults applied", async () => {
    const res = await request(app).post("/tickets").send({ title: "Printer on fire" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Printer on fire",
      status: "open",
      priority: "medium",
    });
    expect(res.body.id).toBeDefined();
  });

  it("rejects a missing title with 400", async () => {
    const res = await request(app).post("/tickets").send({ description: "no title here" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("rejects an invalid priority value with 400", async () => {
    const res = await request(app).post("/tickets").send({ title: "Bad priority", priority: "urgent" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("rejects a title over the length limit with 400", async () => {
    const res = await request(app)
      .post("/tickets")
      .send({ title: "a".repeat(201) });

    expect(res.status).toBe(400);
  });
});

describe("GET /tickets/stats", () => {
  it("returns counts grouped by status", async () => {
    await prisma.ticket.createMany({
      data: [
        { title: "a", status: "open" },
        { title: "b", status: "open" },
        { title: "c", status: "in_progress" },
        { title: "d", status: "closed" },
      ],
    });

    const res = await request(app).get("/tickets/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ open: 2, in_progress: 1, closed: 1 });
  });

  it("returns all-zero counts when there are no tickets", async () => {
    const res = await request(app).get("/tickets/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ open: 0, in_progress: 0, closed: 0 });
  });
});

describe("GET /tickets", () => {
  it("returns an empty list when there are no tickets", async () => {
    const res = await request(app).get("/tickets");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], page: 1, limit: 20, total: 0 });
  });

  it("returns an empty page past the last page rather than erroring", async () => {
    await prisma.ticket.create({ data: { title: "only ticket" } });

    const res = await request(app).get("/tickets?page=5&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(1);
  });

  it("rejects an invalid status filter with 400", async () => {
    const res = await request(app).get("/tickets?status=urgent");

    expect(res.status).toBe(400);
  });

  it("filters by title search substring, case-insensitive", async () => {
    await prisma.ticket.createMany({
      data: [{ title: "Printer on fire" }, { title: "VPN dropping" }],
    });

    const res = await request(app).get("/tickets?search=printer");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Printer on fire");
  });

  it("sorts by priority with high first when sort=priority", async () => {
    await prisma.ticket.createMany({
      data: [
        { title: "low one", priority: "low" },
        { title: "high one", priority: "high" },
        { title: "medium one", priority: "medium" },
      ],
    });

    const res = await request(app).get("/tickets?sort=priority");

    expect(res.status).toBe(200);
    expect(res.body.data.map((t: { priority: string }) => t.priority)).toEqual(["high", "medium", "low"]);
  });
});

describe("PATCH /tickets/:id", () => {
  it("updates a ticket's status", async () => {
    const created = await prisma.ticket.create({ data: { title: "Fix leak" } });

    const res = await request(app).patch(`/tickets/${created.id}`).send({ status: "closed" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("closed");
  });

  it("returns 404 for a non-existent ticket", async () => {
    const res = await request(app).patch("/tickets/999999").send({ status: "closed" });

    expect(res.status).toBe(404);
  });

  it("rejects an invalid status value with 400", async () => {
    const created = await prisma.ticket.create({ data: { title: "Fix leak" } });

    const res = await request(app).patch(`/tickets/${created.id}`).send({ status: "urgent" });

    expect(res.status).toBe(400);
  });

  it("rejects an empty body with 400", async () => {
    const created = await prisma.ticket.create({ data: { title: "Fix leak" } });

    const res = await request(app).patch(`/tickets/${created.id}`).send({});

    expect(res.status).toBe(400);
  });

  it("updates title and description", async () => {
    const created = await prisma.ticket.create({ data: { title: "Fix leak" } });

    const res = await request(app)
      .patch(`/tickets/${created.id}`)
      .send({ title: "Fix the leak in room 4", description: "Under the sink" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Fix the leak in room 4");
    expect(res.body.description).toBe("Under the sink");
  });

  it("rejects an empty title with 400", async () => {
    const created = await prisma.ticket.create({ data: { title: "Fix leak" } });

    const res = await request(app).patch(`/tickets/${created.id}`).send({ title: "   " });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /tickets/:id", () => {
  it("deletes an existing ticket", async () => {
    const created = await prisma.ticket.create({ data: { title: "Fix leak" } });

    const res = await request(app).delete(`/tickets/${created.id}`);
    expect(res.status).toBe(204);

    const stillThere = await prisma.ticket.findUnique({ where: { id: created.id } });
    expect(stillThere).toBeNull();
  });

  it("returns 404 for a non-existent ticket", async () => {
    const res = await request(app).delete("/tickets/999999");

    expect(res.status).toBe(404);
  });
});
