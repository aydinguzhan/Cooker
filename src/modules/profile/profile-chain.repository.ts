import * as dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolMessage } from "@langchain/core/messages";

import { createLangMessages } from "./profile-ai.prompt";
import { searchSkillsTool } from "./ai-profile.tools";
import { AiProfileSchema } from "./ai-profile.schema";

dotenv.config();

export default class ProfileChainRepository {

    async createProfile(input: string) {

        const messages = createLangMessages(input);

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0.7,
        });

        /*
         * --------------------------------
         * 1. TOOL MODEL
         * --------------------------------
         */

        const modelWithTools = model.bindTools([
            searchSkillsTool,
        ]);

        const response =
            await modelWithTools.invoke(messages);

        /*
         * --------------------------------
         * 2. TOOL'LARI ÇALIŞTIR
         * --------------------------------
         */

        const toolMessages: ToolMessage[] = [];

        for (const toolCall of response.tool_calls ?? []) {

            if (toolCall.name === "search_skills") {

                const result =
                    await searchSkillsTool.invoke({
                        query: String(
                            toolCall.args.query
                        ),
                    });

                toolMessages.push(
                    new ToolMessage({
                        content: JSON.stringify(result),
                        tool_call_id: toolCall.id!,
                    })
                );
            }
        }

        /*
         * --------------------------------
         * 3. STRUCTURED MODEL
         * --------------------------------
         */

        const structuredModel =
            model.withStructuredOutput(
                AiProfileSchema
            );

        /*
         * --------------------------------
         * 4. GEMINI'YE TOOL SONUÇLARINI
         *    VER VE AiProfile ÜRETTİR
         * --------------------------------
         */

        const finalResponse =
            await structuredModel.invoke([
                ...messages,
                response,
                ...toolMessages,
            ]);

        return finalResponse;
    }
}