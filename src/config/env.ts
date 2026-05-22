import dotenv from 'dotenv';
dotenv.config();

export const env = {
    PORT : Number(process.env.PORT),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
}
if (!env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}