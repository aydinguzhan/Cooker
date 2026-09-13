import { z } from "zod";
import { Type } from "@google/genai";

export const AiProfileSchema = z.object({
  title: z.string(),
  bio_description: z.string(),
  skills: z.array(
    z.object({
      skill_id: z.string(),
      name: z.string(),
      short_key: z.string(),
      level: z.number().min(1).max(5),
    }),
  ),
  experiences: z.array(
    z.object({
      role: z.string(),
      company: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      isCurrent: z.boolean(),
      description: z.string(),
    }),
  ),
  references: z.array(
    z.object({
      name: z.string(),
      email: z.string().nullable(),
      title: z.string().nullable(),
      company: z.string().nullable(),
    }),
  ),
});

export type AiProfile = z.infer<typeof AiProfileSchema>;


export const responseSheme = {
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
}