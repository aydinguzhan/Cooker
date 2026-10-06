import { kapScraper } from "./kap.scraper.js";

const [symbol = "THYAO", daysArgument = "90", limitArgument = "5"] = process.argv.slice(2);
const days = Number(daysArgument);
const limit = Number(limitArgument);

if (!Number.isInteger(days) || days < 1 || days > 365) {
  throw new Error("Gün aralığı 1-365 arasında bir tam sayı olmalı.");
}
if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
  throw new Error("Bildirim sayısı 1-10 arasında bir tam sayı olmalı.");
}

async function main() {
  try {
    const disclosures = await kapScraper.scrapeCompanyDisclosures(symbol, days, limit);
    console.log(JSON.stringify({ symbol: symbol.toUpperCase(), count: disclosures.length, disclosures }, null, 2));
  } catch (error) {
    console.error("KAP taraması başarısız:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
