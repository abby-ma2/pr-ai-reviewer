import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import type { Prompts } from "../prompts.js";
import type { ChangeFile } from "../types.js";
/**
 * Interface for chatbot clients that can review code
 */
export interface ChatBot {
    /**
     * Review code changes and provide feedback
     * @param ctx - Pull request context containing repository information
     * @param prompt - Prompt templates to use for the review
     * @param change - File changes to be reviewed
     * @returns Promise resolving to review comments as string
     */
    reviewCode(ctx: PullRequestContext, prompt: Prompts, change: ChangeFile): Promise<string>;
}
/**
 * Factory function to create appropriate ChatBot implementation based on model name
 * @param modelName - Name of the model to use (prefixed with provider name)
 * @param apiKey - API key for the service
 * @param options - Configuration options
 * @returns ChatBot implementation for the specified model
 * @throws Error if model is not supported
 */
export declare const createChatBotFromModel: (modelName: string, apiKey: string, options: Options) => ChatBot;
