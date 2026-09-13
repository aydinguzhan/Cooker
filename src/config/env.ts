import dotenv from 'dotenv';
dotenv.config();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  GEMINI_API_KEY: requiredEnv("GEMINI_API_KEY"),
  ORIGIN_URL: requiredEnv("ORIGIN_URL"),
  CREATE_JOB_URL: requiredEnv("CREATE_JOB_URL"),
  BACKEND_INGEST_TOKEN: requiredEnv("BACKEND_INGEST_TOKEN"),
  KARIYER_URL: requiredEnv("KARIYER_URL"),
  SMELL_CRON_SCHEDULE: requiredEnv("SMELL_CRON_SCHEDULE"),
  SMELL_KEYWORD: requiredEnv("SMELL_KEYWORD"),
  PUPPETEER_HEADLESS: requiredEnv("PUPPETEER_HEADLESS") === "true",
};
