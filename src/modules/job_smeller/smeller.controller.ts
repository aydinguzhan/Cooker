import { Request, Response } from "express";
import { SmellerService } from "./smeller.service";
import { success } from "zod";

export class SmellerController {
    constructor(private readonly smellerService: SmellerService) { }

    async kariyerScrapeWithAI(req: Request, res: Response) {
        const { keyword } = req.query;
        if (!keyword) throw new Error("keyword is required!")
        const results = await this.smellerService.scrapeWithAI(keyword as string)
        return res.send({
            success: true,
            data: results,
        })

    }

    async kariyerScrapeWithAILocal(keyword: string) {
        if (!keyword) throw new Error("keyword is required!")
        const results = await this.smellerService.scrapeWithAI(keyword as string)
        return results

    }
}