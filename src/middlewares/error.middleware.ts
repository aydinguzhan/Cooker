// src/middlewares/error.middleware.ts
import type { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(error);

  return res.status(500).json({
    message: error instanceof Error ? error.message : "Internal Server Error",
  });
}