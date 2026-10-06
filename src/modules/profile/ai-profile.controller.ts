import type { NextFunction, Request, Response } from "express";
import { generateProfileFromPrompt, ProfileService } from "./ai-profile.service";

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
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  async createProfile(req: Request, res: Response) {
    const { prompt } = req.body;
    const result = await this.profileService.createProfile(prompt)
    console.log(result)
    return res.send(result).status(200)
  }
}
