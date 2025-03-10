import { debug, info, warning } from "@actions/core";
import {
  type GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import { type ChatBot, getModelName } from "./index.js";

const defaultModel = "gemini-2.0-flash-lite";
const apiKey = process.env.GOOGLE_API_KEY || "";

export class GeminiClient implements ChatBot {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private options: Options;

  constructor(options: Options) {
    this.options = options;
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({
      model: getModelName(options.model) || defaultModel,
    });

    if (this.options.debug) {
      debug("Gemini client initialized");
      debug(`Using model: ${this.model}`);
    }
  }

  /**
   * Review code changes and provide feedback
   * @param ctx - Pull request context
   * @param prompt - Prompt for the review
   * @returns Review comments
   */
  async reviewCode(ctx: PullRequestContext, prompt: string): Promise<string> {
    if (this.options.disableReview) {
      info("Code review is disabled in options");
      return "";
    }

    try {
      // Call the Gemini API
      const result = await this.model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          // maxOutputTokens: 2000,
        },
      });

      const reviewComment = result.response.text();

      return reviewComment;
    } catch (error) {
      warning(
        `Failed to review code for: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Retry logic
      if (this.options.retries > 0) {
        this.options.retries--;
        return this.reviewCode(ctx, prompt);
      }

      return "Failed to review this file due to an API error.";
    }
  }
}
