import { JobExtractorChain } from "./chains/job-extractor.chain.js";
import { KariyerScraper } from "./scraper/kariyer.scraper.js";
import { SmellerController } from "./smeller.controller.js";
import { SmellerService } from "./smeller.service.js";

const scraper = new KariyerScraper();
const extractor = new JobExtractorChain();
const smellerService = new SmellerService(scraper, extractor);
const smellerController = new SmellerController(smellerService);

export { smellerController, smellerService };
