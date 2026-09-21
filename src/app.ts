// src/app.ts
import express from "express";
import cors from "cors";
import profileAiRoutes from "./modules/profile/ai-profile.router;
import smellerRouter from "./modules/job_smeller/smeller.router"
import { errorMiddleware } from "./middlewares/error.middleware";
import { env } from "./config/env";
export const app = express();

app.use(
  cors({
    origin: env.ORIGIN_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "cooker-ai-service",
  });
});

app.use("/ai/profile", profileAiRoutes);
app.use("/ai/job-smell", smellerRouter);

app.use(errorMiddleware);
