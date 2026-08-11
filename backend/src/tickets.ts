import { Router } from "express";
import { z } from "zod";
import { Priority, Status } from "@prisma/client";
import { prisma } from "./prisma.js";

export const ticketsRouter = Router();

const statusValues = Object.values(Status) as [Status, ...Status[]];
const priorityValues = Object.values(Priority) as [Priority, ...Priority[]];

const createTicketSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  description: z.string().optional(),
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

const listQuerySchema = z.object({
  status: z.enum(statusValues).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

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
  const { status, page, limit } = parsed.data;

  const where = status ? { status } : {};
  const [data, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
