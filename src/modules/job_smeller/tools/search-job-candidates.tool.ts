import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { env } from "../../../config/env.js";
import { JobsSourceListSchema } from "../schemas/job.schema.js";

const searchInputSchema = z.object({
  keyword: z.string().trim().max(120).default(""),
  limit: z.number().int().min(1).max(100).default(30),
});

function getJobsSearchUrl() {
  const url = new URL(env.CREATE_JOB_URL);
  const pathname = url.pathname.replace(/\/+$/, "");

  if (/\/jobs\/create-bulk$/.test(pathname)) {
    url.pathname = pathname.replace(/\/create-bulk$/, "/search");
  } else if (/\/jobs$/.test(pathname)) {
    url.pathname = `${pathname}/search`;
  } else {
    throw new Error(
      "CREATE_JOB_URL must point to the backend /jobs route or /jobs/create-bulk route",
    );
  }

  url.search = "";
  url.hash = "";
  return url;
}

export const searchJobCandidatesTool = tool(
  async ({ keyword, limit }) => {
    const url = getJobsSearchUrl();
    url.searchParams.set("page", "1");
    url.searchParams.set("size", String(limit));
    url.searchParams.set("keyword", keyword);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.BACKEND_INGEST_TOKEN}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Backend job search failed with HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();
    const responseSchema = z.object({
      success: z.literal(true),
      data: z.object({ rows: JobsSourceListSchema }).passthrough(),
    });
    const parsedResponse = responseSchema.parse(payload);
    return parsedResponse.data.rows.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description ?? "",
      url: job.url ?? "",
      suitability_rate: job.suitability_rate ?? null,
      company:
        typeof job.company === "object" && job.company
          ? { name: job.company.name ?? "", address: job.company.address ?? "" }
          : job.company ?? "",
    }));
  },
  {
    name: "search_job_candidates",
    description:
      "Searches job postings in the backend database by keyword and returns job details for profile matching.",
    schema: searchInputSchema,
  },
);
