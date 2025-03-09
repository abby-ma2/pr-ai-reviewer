import { debug, info, warning } from "@actions/core";
import {
  type GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import type { Prompts } from "../prompts.js";
import type { ChangeFile } from "../types.js";
import type { ChatBot } from "./index.js";

const defaultModel = "gemini-2.0-flash-lite";

export class GeminiClient implements ChatBot {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private options: Options;

  constructor(apiKey: string, options: Options) {
    this.options = options;
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({
      model: options.model || defaultModel,
    });

    if (this.options.debug) {
      debug("Gemini client initialized");
      debug(`Using model: ${this.model}`);
    }
  }

  /**
   * コード差分をレビューする
   * @param filePath 対象のファイルパス
   * @param change パッチ解析結果
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
      // Gemini APIを呼び出す
      const result = await this.model.generateContent({
        contents: [
          { role: "user", parts: [{ text: this.options.systemMessage }] },
          {
            role: "user",
            parts: [{ text: prompt.renderReviewPrompt(ctx, change) }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          // maxOutputTokens: 2000,
        },
      });

      const reviewComment = result.response.text();

      if (this.options.debug) {
        debug(`Review for ${change.from.filename}:\n${reviewComment}`);
      }

      return reviewComment;
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
