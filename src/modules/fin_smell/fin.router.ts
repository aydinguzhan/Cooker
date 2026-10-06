import { Router } from "express";
import { finSmellApp } from "./fin.app.js";
import { finSmellLlm } from "./fin.llm.js";
import { kapScraper } from "./kap.scraper.js";

const router = Router();

router.get("/companies", (_req, res) => {
  res.json({ success: true, count: finSmellApp.getCompanies().length, data: finSmellApp.getCompanies() });
});

router.get("/:symbol/kap", async (req, res) => {
  const symbol = req.params.symbol;
  if (!finSmellApp.getCompany(symbol)) {
    return res.status(404).json({ success: false, message: `BIST 100 şirketi bulunamadı: ${symbol}` });
  }

  const requestedDays = Number(req.query.days ?? 90);
  const requestedLimit = Number(req.query.limit ?? 5);
  const days = Number.isFinite(requestedDays) ? Math.min(Math.max(Math.trunc(requestedDays), 1), 365) : 90;
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 10) : 5;

  try {
    const data = await kapScraper.scrapeCompanyDisclosures(symbol, days, limit);
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "KAP bildirimleri alınamadı.";
    return res.status(502).json({ success: false, message });
  }
});

router.get("/:symbol", async (req, res) => {
  try {
    const data = await finSmellApp.getCompanyData(req.params.symbol);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Şirket verisi alınamadı.";
    const status = message.startsWith("BIST 100 şirketi bulunamadı") ? 404 : 502;
    return res.status(status).json({ success: false, message });
  }
});

router.get("/:symbol/analyze", async (req, res) => {
  try {
    const data = await finSmellLlm.analyzeCompany(req.params.symbol);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Şirket analizi oluşturulamadı.";
    const status = message.startsWith("BIST 100 şirketi bulunamadı") ? 404 : 502;
    return res.status(status).json({ success: false, message });
  }
});

export default router;
