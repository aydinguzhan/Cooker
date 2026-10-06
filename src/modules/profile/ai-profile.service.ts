import { gemini } from "../../providers/gemini.provider";
import { buildProfilePrompt } from "./profile-ai.prompt";
import { AiProfileSchema, responseSheme } from "./ai-profile.schema";
import { ProfileController } from "./ai-profile.controller";
import ProfileChainRepository from "./profile-chain.repository";

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
      responseSchema: responseSheme,
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

export class ProfileService {
  constructor(private readonly profileRepository: ProfileChainRepository) { }

  async createProfile(input: string) {
    return await this.profileRepository.createProfile(input)

  }
}
