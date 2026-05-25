import { Type } from "@google/genai";
import { gemini } from "../../providers/gemini.provider";
import { buildProfilePrompt } from "./profile-ai.prompt";
import { AiProfileSchema } from "./ai-profile.schema";

type PromptSkill = {
  id: string;
  name: string;
  short_key: string;
};

function padDatePart(value: string) {
  return value.padStart(2, "0");
}

function normalizeIsoDate(value: string | null, isCurrent: boolean) {
  if (!value) {
    return isCurrent ? null : null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return isCurrent ? null : null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{4}-\d{1,2}$/.test(trimmed)) {
    const [year, month] = trimmed.split("-");
    return `${year}-${padDatePart(month)}-01`;
  }

  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01`;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return isCurrent ? null : null;
  }

  return date.toISOString().slice(0, 10);
}

export async function generateProfileFromPrompt(
  prompt: string,
  skills: PromptSkill[],
) {
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildProfilePrompt(prompt, skills),
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
                skill_id: { type: Type.STRING },
                name: { type: Type.STRING },
                short_key: { type: Type.STRING },
                level: { type: Type.NUMBER },
              },
              required: ["skill_id", "name", "short_key", "level"],
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
  const normalizedJson = {
    ...json,
    experiences: Array.isArray(json.experiences)
      ? json.experiences.map((experience: Record<string, unknown>) => {
          const isCurrent = Boolean(experience.isCurrent);

          return {
            ...experience,
            startDate: normalizeIsoDate(
              typeof experience.startDate === "string"
                ? experience.startDate
                : null,
              false,
            ),
            endDate: isCurrent
              ? null
              : normalizeIsoDate(
                  typeof experience.endDate === "string"
                    ? experience.endDate
                    : null,
                  false,
                ),
            isCurrent,
          };
        })
      : [],
  };
  const parsed = AiProfileSchema.safeParse(normalizedJson);

  if (!parsed.success) {
    throw new Error("AI çıktısı beklenen profile formatına uygun değil");
  }

  return parsed.data;
}
