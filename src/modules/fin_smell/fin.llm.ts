import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { env } from "../../config/env.js";
import { finSmellApp } from "./fin.app.js";

const companyDataTool = tool(
  async ({ symbol }) => JSON.stringify(await finSmellApp.getCompanyData(symbol)),
  {
    name: "get_bist_company_data",
    description: "BIST 100 şirketinin güncel piyasa fiyatı ve temel finansal göstergelerini getirir.",
    schema: z.object({ symbol: z.string().describe("BIST işlem kodu, ör. THYAO") }),
  },
);

const analysisSchema = z.object({
  companyOverview: z.string(),
  marketData: z.string(),
  financialAssessment: z.string(),
  analysisSummary: z.string().describe("Yatırımcı için kısa, birkaç cümlelik Türkçe özet"),
  risks: z.array(z.string()),
  dataAsOf: z.string(),
});

export class FinSmellLlm {
  private readonly model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: env.GEMINI_API_KEY,
    temperature: 0.2,
  });

  async analyzeCompany(symbol: string) {
    const normalizedSymbol = symbol.trim().toUpperCase().replace(/\.IS$/, "");
    const messages = [
      new SystemMessage(
        "Türkçe yanıt veren bir finansal analiz asistanısın. get_bist_company_data aracını kullan. " +
          "Yalnızca araçtan gelen verileri yorumla; eksik veriyi uydurma, eksik olduğunu açıkça belirt. " +
          "Fiyat, hacim, piyasa değeri, büyüme, kârlılık, borçluluk ve değerleme göstergelerini yatırımcı açısından açıkla. " +
          "Kısa ve dengeli ol; kesin al/sat tavsiyesi verme. Verinin zamanını belirt.",
      ),
      new HumanMessage(`BIST 100 şirketi ${normalizedSymbol} için yatırımcıya yönelik şirket ve finansal durum özeti hazırla.`),
    ];

    const response = await this.model.bindTools([companyDataTool]).invoke(messages);
    const toolMessages: (ToolMessage | HumanMessage)[] = [];
    for (const call of response.tool_calls ?? []) {
      const callSymbol = String(call.args.symbol ?? normalizedSymbol);
      if (call.name === "get_bist_company_data") {
        const result = await companyDataTool.invoke({ symbol: callSymbol });
        toolMessages.push(new ToolMessage({ content: String(result), tool_call_id: call.id! }));
      }
    }

    if (toolMessages.length === 0) {
      const result = await companyDataTool.invoke({ symbol: normalizedSymbol });
      toolMessages.push(new HumanMessage(`Şirket verisi: ${String(result)}`));
    }

    const structuredModel = this.model.withStructuredOutput(analysisSchema);
    return structuredModel.invoke([
      ...messages,
      response,
      ...toolMessages,
      new HumanMessage("Sonucu istenen yapılandırılmış alanlarla döndür. analysisSummary kısa olsun."),
    ]);
  }
}

export const finSmellLlm = new FinSmellLlm();
