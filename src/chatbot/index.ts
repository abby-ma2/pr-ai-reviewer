// This module defines the ChatBot interface and factory function to create chatbot instances

import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import { ClaudeClient } from "./claude.js";
import { GeminiClient } from "./gemini.js";
import { OpenAIClient } from "./openai.js";

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
  reviewCode(ctx: PullRequestContext, prompt: string): Promise<string>;
}

/**
 * Factory function to create appropriate ChatBot implementation based on model name
 * @param modelName - Name of the model to use (prefixed with provider name)
 * @param apiKey - API key for the service
 * @param options - Configuration options
 * @returns ChatBot implementation for the specified model
 * @throws Error if model is not supported
 */
export const createChatBotFromModel = (
  modelName: string,
  options: Options,
): ChatBot => {
  if (modelName.startsWith("openai/")) {
    return new OpenAIClient(options);
  }
  if (modelName.startsWith("gemini/")) {
    return new GeminiClient(options);
  }
  if (modelName.startsWith("claude/")) {
    return new ClaudeClient(options);
  }

  throw new Error(`Unsupported model: ${modelName}`);
};
