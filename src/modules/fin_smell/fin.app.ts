import YahooFinance from "yahoo-finance2";
import companies from "./bist100.companies.json";

const yahooFinance = new YahooFinance({
    suppressNotices: ["yahooSurvey"],
});

export type BistCompany = (typeof companies)[number];

export class FinSmellApp {
    getCompanies(): BistCompany[] {
        return companies;
    }

    getCompany(symbol: string): BistCompany | undefined {
        const normalizedSymbol = symbol.trim().toUpperCase().replace(/\.IS$/, "");
        return companies.find((company) => company.symbol === normalizedSymbol);
    }

    async getCompanyData(symbol: string) {
        const company = this.getCompany(symbol);
        if (!company) throw new Error(`BIST 100 şirketi bulunamadı: ${symbol}`);

        const yahooSymbol = `${company.symbol}.IS`;
        const [quote, fundamentalsResult] = await Promise.allSettled([
            yahooFinance.quote(yahooSymbol),
            yahooFinance.quoteSummary(yahooSymbol, {
                modules: ["financialData", "defaultKeyStatistics", "summaryDetail"],
            }),
        ]);

        if (quote.status === "rejected") throw quote.reason;
        const marketQuote = quote.value;
        const fundamentals = fundamentalsResult.status === "fulfilled" ? fundamentalsResult.value : undefined;

        return {
            company,
            market: {
                currency: marketQuote.currency,
                regularMarketPrice: marketQuote.regularMarketPrice,
                regularMarketChange: marketQuote.regularMarketChange,
                regularMarketChangePercent: marketQuote.regularMarketChangePercent,
                regularMarketPreviousClose: marketQuote.regularMarketPreviousClose,
                regularMarketDayHigh: marketQuote.regularMarketDayHigh,
                regularMarketDayLow: marketQuote.regularMarketDayLow,
                regularMarketVolume: marketQuote.regularMarketVolume,
                marketCap: marketQuote.marketCap,
                fiftyTwoWeekHigh: marketQuote.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: marketQuote.fiftyTwoWeekLow,
                quoteTimestamp: marketQuote.regularMarketTime,
            },
            fundamentals: {
                revenueGrowth: fundamentals?.financialData?.revenueGrowth,
                earningsGrowth: fundamentals?.financialData?.earningsGrowth,
                profitMargins: fundamentals?.financialData?.profitMargins,
                returnOnEquity: fundamentals?.financialData?.returnOnEquity,
                debtToEquity: fundamentals?.financialData?.debtToEquity,
                currentRatio: fundamentals?.financialData?.currentRatio,
                freeCashflow: fundamentals?.financialData?.freeCashflow,
                trailingPE: fundamentals?.defaultKeyStatistics?.trailingPE,
                forwardPE: fundamentals?.defaultKeyStatistics?.forwardPE,
                priceToBook: fundamentals?.defaultKeyStatistics?.priceToBook,
                dividendYield: fundamentals?.summaryDetail?.dividendYield,
            },
            dataRetrievedAt: new Date().toISOString(),
        };
    }
}

export const finSmellApp = new FinSmellApp();
