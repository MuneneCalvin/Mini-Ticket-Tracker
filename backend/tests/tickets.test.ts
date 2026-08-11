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
});
