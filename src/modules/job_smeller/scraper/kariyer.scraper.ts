import puppeteer from "puppeteer-extra";
import type { Browser, Page } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { env } from "../../../config/env.js";
import type { JobSource } from "../schemas/job.schema.js";

puppeteer.use(StealthPlugin());

type Listing = {
  url: string;
  listingText: string;
};

const MAX_LISTINGS = 20;
const DETAIL_PAGE_CONCURRENCY = 3;
const MAX_DETAIL_TEXT_LENGTH = 30_000;

export class KariyerScraper {
  async scrape(keyword: string): Promise<JobSource[]> {
    const browser = await puppeteer.launch({
      headless: env.PUPPETEER_HEADLESS,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const listings = await this.scrapeListings(browser, keyword);
      return await this.scrapeDetails(browser, listings);
    } finally {
      await browser.close();
    }
  }

  private async scrapeListings(browser: Browser, keyword: string): Promise<Listing[]> {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });

    try {
      const targetUrl = `${env.KARIYER_URL}?kw=${encodeURIComponent(keyword)}`;
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForFunction(
        () => document.querySelectorAll('a[href*="-is-ilani-"], a[href*="/is-ilani/"]').length > 0,
        { timeout: 15_000 },
      ).catch(() => undefined);

      const listings = await page.evaluate(() => {
        const links = Array.from(
          document.querySelectorAll<HTMLAnchorElement>(
            'a[href*="-is-ilani-"], a[href*="/is-ilani/"]',
          ),
        );
        const unique = new Map<string, string>();

        for (const link of links) {
          const url = new URL(link.href);
          url.hash = "";
          const card = link.closest("article") ?? link.closest("div") ?? link.parentElement;
          const text = card?.innerText.replace(/\s+/g, " ").trim() ?? link.innerText.trim();
          if (text.length > 10 && !unique.has(url.href)) unique.set(url.href, text);
        }

        return Array.from(unique, ([url, listingText]) => ({ url, listingText })).slice(0, 20);
      });

      return listings;
    } finally {
      await page.close();
    }
  }

  private async scrapeDetails(browser: Browser, listings: Listing[]): Promise<JobSource[]> {
    const output: JobSource[] = new Array(listings.length);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < listings.length) {
        const index = nextIndex++;
        const listing = listings[index];
        const page = await browser.newPage();
        try {
          await page.goto(listing.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
          await page.waitForSelector("body", { timeout: 10_000 });
          const detailText = await this.readDetailText(page);
          output[index] = {
            ...listing,
            detailText: detailText || listing.listingText,
          };
        } catch (error) {
          console.warn(`[job-smeller] İlan detay sayfası okunamadı: ${listing.url}`, error);
          output[index] = { ...listing, detailText: listing.listingText };
        } finally {
          await page.close();
        }
      }
    };

    await Promise.all(
      Array.from(
        { length: Math.min(DETAIL_PAGE_CONCURRENCY, listings.length) },
        () => worker(),
      ),
    );

    return output;
  }

  private async readDetailText(page: Page): Promise<string> {
    const detailText = await page.evaluate(() => {
      const descriptionSelectors = [
        '[data-testid*="description"]',
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '[id*="job-description"]',
        '[id*="jobDescription"]',
      ];
      const descriptionCandidates = descriptionSelectors.flatMap((selector) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector))
          .map((element) => element.innerText.replace(/\s+/g, " ").trim())
          .filter((text) => text.length > 120),
      );
      const explicitDescription = descriptionCandidates.sort(
        (left, right) => right.length - left.length,
      )[0];

      const contentRoot = document.querySelector<HTMLElement>("main") ?? document.body;
      const pageText = contentRoot?.innerText.replace(/\s+/g, " ").trim() ?? "";
      return explicitDescription || pageText;
    });

    return detailText.slice(0, MAX_DETAIL_TEXT_LENGTH);
  }
}
