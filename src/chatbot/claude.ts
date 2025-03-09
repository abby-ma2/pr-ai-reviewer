import { debug, info, warning } from "@actions/core";
import Anthropic from "@anthropic-ai/sdk";
import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import type { ChatBot } from "./index.js";

const defaultModel = "claude-3-5-haiku-20241022";

export class ClaudeClient implements ChatBot {
  private client: Anthropic;
  private model: string;
  private options: Options;

  constructor(apiKey: string, options: Options) {
    this.options = options;
    this.client = new Anthropic({
      apiKey: apiKey,
    });
    this.model = options.model || defaultModel;

    if (this.options.debug) {
      debug("Claude client initialized");
      debug(`Using model: ${this.model}`);
    }
  }

  /**
   * Review code differences
   * @param prompt The prompt used for review
   * @param patch Patch analysis result
   * @returns Review comment
   */
  async reviewCode(ctx: PullRequestContext, prompt: string): Promise<string> {
    if (this.options.disableReview) {
      info("Code review is disabled in options");
      return "";
    }

    try {
      // Call Claude API
      const result = await this.client.messages.create({
        model: this.model,
        system: this.options.systemMessage,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.1,
      });

      const reviewComment = result.content[0];

      return reviewComment.type === "text" ? reviewComment.text : "";
    } catch (error) {
      warning(
        `Failed to review code for : ${error instanceof Error ? error.message : String(error)}`,
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
