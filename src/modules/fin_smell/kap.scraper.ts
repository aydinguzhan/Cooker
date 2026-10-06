import axios from "axios";
import puppeteer from "puppeteer";

const KAP_BASE_URL = "https://www.kap.org.tr";
const KAP_COMPANIES_URL = `${KAP_BASE_URL}/tr/api/company/items/IGS/A`;
const KAP_DISCLOSURES_URL = `${KAP_BASE_URL}/tr/api/disclosure/members/byCriteria`;

type KapCompany = {
  mkkMemberOid?: string;
  memberOid?: string;
  oid?: string;
  stockCode?: string;
  ticker?: string;
  code?: string;
  name?: string;
};

type KapDisclosure = {
  disclosureIndex: number;
  publishDate?: string;
  kapTitle?: string;
  disclosureClass?: string;
  disclosureType?: string;
  subject?: string;
  summary?: string | null;
  stockCodes?: string;
  relatedStocks?: string | null;
  attachmentCount?: number;
};

export type KapDisclosureContent = KapDisclosure & {
  url: string;
  content: string;
};

export class KapScraper {
  private companiesRequest?: Promise<KapCompany[]>;

  private getCompanies(): Promise<KapCompany[]> {
    this.companiesRequest ??= axios
      .get<KapCompany[]>(KAP_COMPANIES_URL, {
        timeout: 20_000,
        headers: { "User-Agent": "Mozilla/5.0", Referer: `${KAP_BASE_URL}/tr/` },
      })
      .then(({ data }) => (Array.isArray(data) ? data : []));
    return this.companiesRequest;
  }

  private async getCompanyOid(symbol: string): Promise<string> {
    const normalizedSymbol = symbol.trim().toUpperCase().replace(/\.IS$/, "");
    const companies = await this.getCompanies();
    const company = companies.find((item) =>
      [item.stockCode, item.ticker, item.code].some((code) => code?.toUpperCase() === normalizedSymbol),
    );
    const oid = company?.mkkMemberOid ?? company?.memberOid ?? company?.oid;
    if (!oid) throw new Error(`KAP şirket kaydı bulunamadı: ${normalizedSymbol}`);
    return oid;
  }

  async scrapeCompanyDisclosures(symbol: string, days = 90, limit = 5): Promise<KapDisclosureContent[]> {
    const normalizedSymbol = symbol.trim().toUpperCase().replace(/\.IS$/, "");
    const companyOid = await this.getCompanyOid(normalizedSymbol);
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    const formatDate = (date: Date) => date.toISOString().slice(0, 10);

    const { data } = await axios.post<KapDisclosure[]>(
      KAP_DISCLOSURES_URL,
      {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        memberType: "IGS",
        mkkMemberOidList: [companyOid],
        inactiveMkkMemberOidList: [],
        disclosureClass: "",
        subjectList: [],
        isLate: "",
        mainSector: "",
        sector: "",
        subSector: "",
        marketOid: "",
        index: "",
        bdkReview: "",
        bdkMemberOidList: [],
        year: "",
        term: "",
        ruleType: "",
        period: "",
        fromSrc: false,
        srcCategory: "",
        disclosureIndexList: [],
      },
      {
        timeout: 20_000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
          Referer: `${KAP_BASE_URL}/tr/bildirim-sorgu`,
        },
      },
    );

    const disclosures = (Array.isArray(data) ? data : [])
      .filter((item) => Number.isFinite(item.disclosureIndex))
      .sort((a, b) => b.disclosureIndex - a.disclosureIndex)
      .slice(0, Math.min(Math.max(limit, 1), 10));

    if (disclosures.length === 0) return [];

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(30_000);
      const result: KapDisclosureContent[] = [];

      for (const disclosure of disclosures) {
        const url = `${KAP_BASE_URL}/tr/Bildirim/${disclosure.disclosureIndex}`;
        let content = "";
        try {
          await page.goto(url, { waitUntil: "domcontentloaded" });
          await page.waitForFunction(() => document.body.innerText.length > 300, { timeout: 10_000 }).catch(() => undefined);
          content = await page.evaluate(() => document.body.innerText.replace(/\n{3,}/g, "\n\n").trim());
          content = content.slice(0, 12_000);
        } catch {
          // Bildirim listesi özeti, içerik sayfası erişilemez olduğunda yine kullanılabilir.
        }

        result.push({ ...disclosure, url, content });
      }

      return result;
    } finally {
      await browser.close();
    }
  }
}

export const kapScraper = new KapScraper();
