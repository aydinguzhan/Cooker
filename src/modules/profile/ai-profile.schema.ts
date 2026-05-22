import { z } from "zod";

export const AiProfileSchema = z.object({
  title: z.string(),
  bio_description: z.string(),
  skills: z.array(
    z.object({
      name: z.string(),
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