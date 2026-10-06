import { finSmellApp } from "./fin.app.js";

const symbol = (process.argv[2] ?? "THYAO").trim().toUpperCase();

async function main() {
  try {
    const data = await finSmellApp.getCompanyData(symbol);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Finansal analiz çalıştırılamadı:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
