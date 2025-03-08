import { debug, info, warning } from "@actions/core";
import Anthropic from "@anthropic-ai/sdk";
import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import type { Prompts } from "../prompts.js";
import type { ChangeFile } from "../types.js";
import type { ChatBots } from "./index.js";

const defaultModel = "claude-3-5-haiku-20241022";

export class ClaudeClient implements ChatBots {
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
   * コード差分をレビューする
   * @param prompt レビューに使用するプロンプト
   * @param patch パッチ解析結果
   * @returns レビューコメント
   */
  async reviewCode(
    ctx: PullRequestContext,
    prompt: Prompts,
    change: ChangeFile,
  ): Promise<string> {
    if (this.options.disableReview) {
      info("Code review is disabled in options");
      return "";
    }

    try {
      // Claude APIを呼び出す
      const result = await this.client.messages.create({
        model: this.model,
        system: this.options.systemMessage,
        messages: [
          { role: "user", content: prompt.renderReviewPrompt(ctx, change) },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      });

      const reviewComment = result.content[0];

      if (this.options.debug) {
        debug(`Review for ${change.from.filename}:\n${reviewComment}`);
      }

      return reviewComment.type === "text" ? reviewComment.text : "";
    } catch (error) {
      warning(
        `Failed to review code for ${change.from.filename}: ${error instanceof Error ? error.message : String(error)}`,
      );

      // リトライロジック
      if (this.options.retries > 0) {
        info(
          `Retrying review for ${change.from.filename} (${this.options.retries} retries left)`,
        );
        this.options.retries--;
        return this.reviewCode(ctx, prompt, change);
      }

      return "Failed to review this file due to an API error.";
    }
  }
}
