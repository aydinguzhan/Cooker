// src/app.ts
import express from "express";
import cors from "cors";
import profileAiRoutes from "./modules/profile/ai-profile.router";
import { errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

app.use(
  cors({
    origin: 'http://localhost:8080',
    methods: ['GET','POST'],
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

app.use(errorMiddleware);