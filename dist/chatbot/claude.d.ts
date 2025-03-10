import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import type { ChatBot } from "./index.js";
export declare class ClaudeClient implements ChatBot {
    private client;
    private model;
    private options;
    constructor(options: Options);
    /**
     * Review code differences
     * @param prompt The prompt used for review
     * @param patch Patch analysis result
     * @returns Review comment
     */
    reviewCode(ctx: PullRequestContext, prompt: string): Promise<string>;
}
