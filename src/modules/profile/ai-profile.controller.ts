import type { NextFunction, Request, Response } from "express";
import { generateProfileFromPrompt } from "./ai-profile.service";

export async function generateProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { prompt, skills } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        message: "Prompt alanı zorunludur",
      });
    }

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        message: "Skills alanı zorunludur",
      });
    }

    const profile = await generateProfileFromPrompt(prompt, skills);

    return res.status(200).json({
      message: "Profile generated successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}
