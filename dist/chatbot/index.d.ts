import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
/**
 * Interface for chatbot clients that can review code
 */
export interface ChatBot {
    create(ctx: PullRequestContext, prompt: string): Promise<string>;
}
/**
 * Extract the model name from a full model identifier string
 * @param name - Full model identifier in "provider/model" format
 * @returns The model portion of the identifier, or the original string if no provider prefix
 */
export declare const getModelName: (name: string) => string;
/**
 * Factory function to create appropriate ChatBot implementation based on model name
 * @param modelName - Name of the model to use (prefixed with provider name)
 * @param options - Configuration options
 * @returns ChatBot implementation for the specified model
 * @throws Error if model is not supported
 */
export declare const createChatBotFromModel: (modelName: string, options: Options) => ChatBot;
