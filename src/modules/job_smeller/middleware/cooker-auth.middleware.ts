import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../../../config/env.js";

export function cookerAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.header("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const tokenBuffer = Buffer.from(token);
  const expectedTokenBuffer = Buffer.from(env.BACKEND_INGEST_TOKEN);

  if (
    tokenBuffer.length !== expectedTokenBuffer.length ||
    !timingSafeEqual(tokenBuffer, expectedTokenBuffer)
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  return next();
}
