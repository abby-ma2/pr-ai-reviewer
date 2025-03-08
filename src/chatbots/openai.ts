import { debug, info, warning } from "@actions/core";
import OpenAI from "openai";
import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import type { Prompts } from "../prompts.js";
import type { ChangeFile } from "../types.js";
import type { ChatBots } from "./index.js";

export class OpenAIClient implements ChatBots {
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
   * コード差分をレビューする
   * @param filePath 対象のファイルパス
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

    // ファイルタイプを判断（拡張子から）
    // const fileExtension = patch.original.filename.split(".").pop() || "";      const fileType = this.getFileType(fileExtension);

    try {
      // OpenAI APIを呼び出す
      const response = await this.client.chat.completions.create({
        model: this.options.model,
        messages: [
          { role: "system", content: this.options.systemMessage },
          { role: "user", content: prompt.renderReviewPrompt(ctx, change) },
        ],
        temperature: 0.1,
        // max_tokens: 2000,
      });

      const reviewComment = response.choices[0]?.message?.content || "";

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
