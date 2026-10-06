import { z } from "zod";

export const ScrapedJobSchema = z.object({
  title: z.string().trim().min(1),
  company: z.string().trim().default(""),
  address: z.string().trim().default(""),
  description: z.string().trim().default(""),
  url: z.string().url(),
});

export const ScrapedJobListSchema = z.array(ScrapedJobSchema);

export const ExtractedJobListSchema = z.array(
  z.object({
    sourceIndex: z.number().int().nonnegative(),
    title: z.string().trim().min(1),
    company: z.string().trim().default(""),
    address: z.string().trim().default(""),
    description: z.string().trim().default(""),
  }),
);

export type ScrapedJob = z.infer<typeof ScrapedJobSchema>;
export type JobSource = {
  url: string;
  listingText: string;
  detailText: string;
};

export const JobsSourceSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1),
    description: z.string().nullish(),
    company: z
      .union([
        z.string(),
        z
          .object({
            name: z.string().nullish(),
            address: z.string().nullish(),
          })
          .passthrough(),
      ])
      .nullish(),
    company_name: z.string().nullish(),
    address: z.string().nullish(),
    url: z.string().nullish(),
    suitability_rate: z.union([z.string(), z.number()]).nullish(),
  })
  .passthrough();

export const JobsSourceListSchema = z.array(JobsSourceSchema);

export const JobMatchProfileSchema = z.object({
  skills: z.array(z.string()),
  experience: z.number().nonnegative(),
  location: z.string(),
});

export const JobMatchResponseSchema = z.object({
  matches: z.array(
    z.object({
      jobId: z.string().min(1),
      score: z.number().int().min(0).max(100),
      reasons: z.array(z.string().trim().min(1)).max(3),
    }),
  ),
});

export type JobMatchCandidate = z.infer<typeof JobsSourceSchema>;
export type JobMatchProfile = z.infer<typeof JobMatchProfileSchema>;
export type JobMatchResult = JobMatchCandidate & {
  matchScore: number;
  matchReasons: string[];
};
