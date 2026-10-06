import type { Request, Response } from "express";
import { z } from "zod";
import { SmellerService } from "./smeller.service.js";
import { JobMatchProfileSchema } from "./schemas/job.schema.js";

export class SmellerController {
  constructor(private readonly smellerService: SmellerService) {}

  async kariyerScrapeWithAI(req: Request, res: Response) {
    const { keyword } = req.query;
    if (typeof keyword !== "string" || !keyword.trim()) {
      return res.status(400).json({
        success: false,
        message: "keyword query parameter is required",
      });
    }

    const results = await this.smellerService.scrapeWithAI(keyword);
    return res.json({ success: true, data: results });
  }

  async matchJobs(req: Request, res: Response) {
    const requestSchema = z.object({
      keyword: z.string().trim().max(120).default(""),
      userProfile: JobMatchProfileSchema,
    });
    const parsedBody = requestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid keyword or userProfile",
      });
    }

    const matches = await this.smellerService.searchMatchJobs(
      parsedBody.data.keyword,
      parsedBody.data.userProfile,
    );
    return res.json({ success: true, data: matches });
  }
}
