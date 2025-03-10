import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
/**
 * Interface for chatbot clients that can review code
 */
export interface ChatBot {
    /**
     * Review code changes and provide feedback
     * @param ctx - Pull request context containing repository information
     * @param prompt - The review prompt containing instructions and context
     * @returns Promise resolving to review comments as string
     */
    reviewCode(ctx: PullRequestContext, prompt: string): Promise<string>;
}
/**
 * Factory function to create appropriate ChatBot implementation based on model name
 * @param modelName - Name of the model to use (prefixed with provider name)
 * @param options - Configuration options
 * @returns ChatBot implementation for the specified model
 * @throws Error if model is not supported
 */
export declare const createChatBotFromModel: (modelName: string, options: Options) => ChatBot;
