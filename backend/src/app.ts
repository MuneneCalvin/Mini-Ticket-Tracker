import express from "express";
import cors from "cors";
import morgan from "morgan";
import { ticketsRouter } from "./tickets.js";

export const app = express();

app.use(cors());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use("/tickets", ticketsRouter);
