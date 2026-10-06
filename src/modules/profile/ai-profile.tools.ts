import { tool } from "@langchain/core/tools";
import { z } from "zod"
export const searchSkillsTool = tool(
    async ({ query }) => {
        const response = await fetch(
            `http://localhost:8080/refdatas/skills-search/langchain?skill=${encodeURIComponent(query.toLowerCase())}`
        );

        if (!response.ok) {
            throw new Error("Skills API request failed");
        }

        const data = await response.json();

        return JSON.stringify(data);
    },
    {
        name: "search_skills",

        description: `
    Search the application's skill reference data.

    Use this tool whenever you need to find the
    official skill ID and information for a skill.

    Never invent skill IDs.

    Example:
    React
    TypeScript
    Node.js
    NestJS
    `,

        schema: z.object({
            query: z
                .string()
                .describe("The skill name to search for"),
        }),
    }

);