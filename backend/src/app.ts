import express from "express";
import cors from "cors";
import { ticketsRouter } from "./tickets.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/tickets", ticketsRouter);
