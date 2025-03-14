import { debug, warning } from "@actions/core";
import Anthropic from "@anthropic-ai/sdk";
import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import { type ChatBot, getModelName } from "./index.js";

const defaultModel = "claude-3-5-haiku-20241022";
const apiKey = process.env.ANTHROPIC_API_KEY || "";

export class ClaudeClient implements ChatBot {
  private client: Anthropic;
  private model: string;
  private options: Options;

  constructor(options: Options) {
    this.options = options;
    this.client = new Anthropic({
      apiKey: apiKey,
    });
    this.model = getModelName(options.model) || defaultModel;

    if (this.options.debug) {
      debug("Claude client initialized");
      debug(`Using model: ${this.model}`);
    }
  }

  async create(ctx: PullRequestContext, prompt: string): Promise<string> {
    try {
      // Call Claude API
      const result = await this.client.messages.create({
        model: this.model,
        system: this.options.systemMessage,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8192,
        temperature: 0.1,
      });

      const res = result.content[0];

      return res.type === "text" ? res.text : "";
    } catch (error) {
      warning(
        `Failed to review code for : ${error instanceof Error ? error.message : String(error)}`,
      );

      // Retry logic
      if (this.options.retries > 0) {
        this.options.retries--;
        return this.create(ctx, prompt);
      }

      return "Failed to review this file due to an API error.";
    }
  }
}
