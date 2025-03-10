import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import { type ChatBot } from "./index.js";
export declare class OpenAIClient implements ChatBot {
    private client;
    private options;
    constructor(options: Options);
    /**
     * Review code changes and provide feedback
     * @param ctx - Pull request context
     * @param prompt - Prompt for the review
     * @returns Review comments
     */
    reviewCode(ctx: PullRequestContext, prompt: string): Promise<string>;
}
