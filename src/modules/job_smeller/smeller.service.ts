import { JobExtractorChain } from "./chains/job-extractor.chain.js";
import { KariyerScraper } from "./scraper/kariyer.scraper.js";
import type {
  JobMatchProfile,
  JobMatchResult,
  ScrapedJob,
} from "./schemas/job.schema.js";

export class SmellerService {
  constructor(
    private readonly scraper: KariyerScraper,
    private readonly extractor: JobExtractorChain,
  ) { }

  async scrapeWithAI(keyword: string): Promise<ScrapedJob[]> {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) throw new Error("keyword is required");

    console.log(`[job-smeller] Kariyer.net araması başlatılıyor: ${normalizedKeyword}`);
    const sources = await this.scraper.scrape(normalizedKeyword);
    if (sources.length === 0) {
      console.info("[job-smeller] Arama sonucunda ilan bulunamadı.");
      return [];
    }

    console.log(`[job-smeller] ${sources.length} ilan detayı LangChain'e gönderiliyor.`);
    const jobs = await this.extractor.extract(normalizedKeyword, sources);
    console.log(`[job-smeller] ${jobs.length} ilan yapılandırılmış olarak çıkarıldı.`);
    const missingDescriptions = jobs.filter((job) => !job.description).length;
    if (missingDescriptions > 0) {
      console.warn(`[job-smeller] ${missingDescriptions} ilanda açıklama boş kaldı.`);
    }
    return jobs;
  }

  searchMatchJobs(
    keyword: string,
    userProfile: JobMatchProfile,
  ): Promise<JobMatchResult[]> {
    return this.extractor.searchMatchJobs(keyword, userProfile);
  }
}
