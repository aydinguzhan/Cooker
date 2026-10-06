import { smellerService } from "../src/modules/job_smeller/smeller.module.js";
import { env } from "../src/config/env.js";

try {
  const jobs = await smellerService.scrapeWithAI(env.SMELL_KEYWORD);
  console.log("Scraped jobs:", JSON.stringify(jobs, null, 2));
} catch (error) {
  console.error("[job-smeller] Tek seferlik scrape başarısız:", error);
  process.exitCode = 1;
}
