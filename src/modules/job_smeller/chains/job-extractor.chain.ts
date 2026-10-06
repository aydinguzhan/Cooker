import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "../../../config/env.js";
import {
  buildJobExtractionMessages,
  searchJobMatchMessages,
} from "../prompts/job-smeller.prompt.js";
import {
  ExtractedJobListSchema,
  JobMatchProfileSchema,
  JobMatchResponseSchema,
  JobsSourceListSchema,
  ScrapedJobListSchema,
  type JobSource,
  type JobMatchResult,
  type JobMatchProfile,
  type ScrapedJob,
} from "../schemas/job.schema.js";
import { searchJobCandidatesTool } from "../tools/search-job-candidates.tool.js";

const MAX_SOURCES_PER_REQUEST = 5;
const MAX_MATCH_JOBS_PER_REQUEST = 10;

export class JobExtractorChain {
  private readonly model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: env.GEMINI_API_KEY,
    temperature: 0.7,
  });

  private readonly structuredModel = this.model.withStructuredOutput(
    ExtractedJobListSchema,
  );
  private readonly matchingModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: env.GEMINI_API_KEY,
    temperature: 0.1,
  }).withStructuredOutput(
    JobMatchResponseSchema,
  );

  async extract(keyword: string, sources: JobSource[]): Promise<ScrapedJob[]> {
    const result: ScrapedJob[] = [];

    for (let offset = 0; offset < sources.length; offset += MAX_SOURCES_PER_REQUEST) {
      const sourceBatch = sources.slice(offset, offset + MAX_SOURCES_PER_REQUEST);
      const response = await this.structuredModel.invoke(
        buildJobExtractionMessages(keyword, sourceBatch),
      );

      const seenSourceIndexes = new Set<number>();
      for (const extracted of response) {
        if (seenSourceIndexes.has(extracted.sourceIndex)) continue;
        seenSourceIndexes.add(extracted.sourceIndex);
        const source = sourceBatch[extracted.sourceIndex];
        if (!source) {
          console.warn(`[job-smeller] Geçersiz sourceIndex: ${extracted.sourceIndex}`);
          continue;
        }

        result.push({
          title: extracted.title,
          company: extracted.company ?? "",
          address: extracted.address ?? "",
          description: extracted.description ?? "",
          url: source.url,
        });
      }
    }

    return ScrapedJobListSchema.parse(result);
  }
  async searchMatchJobs(
    keyword: string,
    userProfile: JobMatchProfile,
  ): Promise<JobMatchResult[]> {
    const profile = JobMatchProfileSchema.parse(userProfile);
    const jobs = await searchJobCandidatesTool.invoke({
      keyword,
      limit: 50,
    });
    const candidates = JobsSourceListSchema.parse(jobs);
    if (candidates.length === 0) return [];

    const matches: JobMatchResult[] = [];
    const seenJobIds = new Set<string>();

    for (
      let offset = 0;
      offset < candidates.length;
      offset += MAX_MATCH_JOBS_PER_REQUEST
    ) {
      const batch = candidates.slice(offset, offset + MAX_MATCH_JOBS_PER_REQUEST);
      const response = await this.matchingModel.invoke(
        searchJobMatchMessages(keyword, batch, profile),
      );
      const batchById = new Map(batch.map((job) => [job.id, job]));

      for (const match of response.matches) {
        const job = batchById.get(match.jobId);
        if (!job || seenJobIds.has(match.jobId) || match.score < 40) continue;
        seenJobIds.add(match.jobId);
        matches.push({
          ...job,
          matchScore: match.score,
          matchReasons: match.reasons,
        });
      }
    }

    return matches.sort((left, right) => right.matchScore - left.matchScore);
  }
}
