import { Type } from "@google/genai";
import { gemini } from "../../providers/gemini.provider";
import { buildProfilePrompt } from "./profile-ai.prompt";
import { AiProfileSchema } from "./ai-profile.schema";

export async function generateProfileFromPrompt(prompt: string) {
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildProfilePrompt(prompt),
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          bio_description: { type: Type.STRING },
          skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                level: { type: Type.NUMBER },
              },
              required: ["name", "level"],
            },
          },
          experiences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING },
                company: { type: Type.STRING, nullable: true },
                startDate: { type: Type.STRING, nullable: true },
                endDate: { type: Type.STRING, nullable: true },
                isCurrent: { type: Type.BOOLEAN },
                description: { type: Type.STRING },
              },
              required: [
                "role",
                "company",
                "startDate",
                "endDate",
                "isCurrent",
                "description",
              ],
            },
          },
          references: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING, nullable: true },
                title: { type: Type.STRING, nullable: true },
                company: { type: Type.STRING, nullable: true },
              },
              required: ["name", "email", "title", "company"],
            },
          },
        },
        required: [
          "title",
          "bio_description",
          "skills",
          "experiences",
          "references",
        ],
      },
    },
  });

  if (!response.text) {
    throw new Error("Gemini boş cevap döndürdü");
  }

  const json = JSON.parse(response.text);
  const parsed = AiProfileSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error("AI çıktısı beklenen profile formatına uygun değil");
  }

  return parsed.data;
}
