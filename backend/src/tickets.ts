import { Router } from "express";
import { z } from "zod";
import { Priority, Status } from "@prisma/client";
import { prisma } from "./prisma.js";

export const ticketsRouter = Router();

const statusValues = Object.values(Status) as [Status, ...Status[]];
const priorityValues = Object.values(Priority) as [Priority, ...Priority[]];

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 2000;
const SEARCH_MAX_LENGTH = 200;

const createTicketSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(TITLE_MAX_LENGTH, `title must be ${TITLE_MAX_LENGTH} characters or fewer`),
  description: z.string().trim().max(DESCRIPTION_MAX_LENGTH, `description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`).optional(),
  status: z.enum(statusValues).optional(),
  priority: z.enum(priorityValues).optional(),
});

const patchTicketSchema = z
  .object({
    status: z.enum(statusValues).optional(),
    priority: z.enum(priorityValues).optional(),
  })
  .refine((body) => body.status !== undefined || body.priority !== undefined, {
    message: "at least one of status or priority is required",
  });

const sortValues = ["created_desc", "created_asc", "priority"] as const;

const listQuerySchema = z.object({
  status: z.enum(statusValues).optional(),
  search: z.string().trim().min(1).max(SEARCH_MAX_LENGTH).optional(),
  sort: z.enum(sortValues).optional().default("created_desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

ticketsRouter.post("/", async (req, res) => {
  const parsed = createTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const ticket = await prisma.ticket.create({ data: parsed.data });
  res.status(201).json(ticket);
});

ticketsRouter.get("/stats", async (_req, res) => {
  const grouped = await prisma.ticket.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const stats: Record<Status, number> = { open: 0, in_progress: 0, closed: 0 };
  for (const row of grouped) {
    stats[row.status] = row._count.status;
  }

  res.json(stats);
});

ticketsRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { status, search, sort, page, limit } = parsed.data;

  const where = {
    ...(status ? { status } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
  };

  if (sort === "priority") {
    // Prisma orders enums alphabetically, which doesn't match urgency (high > medium > low),
    // so priority sort is done in-memory rather than at the DB level.
    const matching = await prisma.ticket.findMany({ where, orderBy: { createdAt: "desc" } });
    matching.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    const start = (page - 1) * limit;
    res.json({ data: matching.slice(start, start + limit), page, limit, total: matching.length });
    return;
  }

  const [data, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: sort === "created_asc" ? "asc" : "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ data, page, limit, total });
});

ticketsRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "invalid ticket id" });
  }

  const parsed = patchTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "ticket not found" });
  }

  const ticket = await prisma.ticket.update({ where: { id }, data: parsed.data });
  res.json(ticket);
});
