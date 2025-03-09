import { debug, info, warning } from "@actions/core";
import OpenAI from "openai";
import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import type { ChatBot } from "./index.js";

export class OpenAIClient implements ChatBot {
  private client: OpenAI;
  private options: Options;

  constructor(apiKey: string, options: Options) {
    this.options = options;
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: options.apiBaseUrl,
    });

    if (this.options.debug) {
      debug(`OpenAI client initialized with base URL: ${options.apiBaseUrl}`);
      debug(`Using model: ${options.model}`);
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

    // ファイルタイプを判断（拡張子から）
    // const fileExtension = patch.original.filename.split(".").pop() || "";      const fileType = this.getFileType(fileExtension);

    try {
      // OpenAI APIを呼び出す
      const response = await this.client.chat.completions.create({
        model: this.options.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        // max_tokens: 2000,
      });

      const reviewComment = response.choices[0]?.message?.content || "";

      return reviewComment;
    } catch (error) {
      warning(
        `Failed to review code for : ${error instanceof Error ? error.message : String(error)}`,
      );

      // リトライロジック
      if (this.options.retries > 0) {
        this.options.retries--;
        return this.reviewCode(ctx, prompt);
      }

      return "Failed to review this file due to an API error.";
    }
  }
}
