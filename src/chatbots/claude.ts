import { debug, info, warning } from "@actions/core";
import Anthropic from "@anthropic-ai/sdk";
import type { Options } from "../option.js";
import type { PatchParseResult } from "../patchParser.js";
import type { Prompts } from "../prompts.js";
import type { ModifiedFile } from "../types.js";
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
  async reviewCode(prompt: Prompts, patch: PatchParseResult): Promise<string> {
    if (this.options.disableReview) {
      info("Code review is disabled in options");
      return "";
    }

    try {
      // Claude APIを呼び出す
      const result = await this.client.messages.create({
        model: this.model,
        system: this.options.systemMessage,
        messages: [{ role: "user", content: prompt.renderReviewPrompt() }],
        max_tokens: 2000,
        temperature: 0.1,
      });

      const reviewComment = result.content[0];

      if (this.options.debug) {
        debug(`Review for ${patch.original.filename}:\n${reviewComment}`);
      }

      return reviewComment.type === "text" ? reviewComment.text : "";
    } catch (error) {
      warning(
        `Failed to review code for ${patch.original.filename}: ${error instanceof Error ? error.message : String(error)}`,
      );

      // リトライロジック
      if (this.options.retries > 0) {
        info(
          `Retrying review for ${patch.original.filename} (${this.options.retries} retries left)`,
        );
        this.options.retries--;
        return this.reviewCode(prompt, patch);
      }

      return "Failed to review this file due to an API error.";
    }
  }

  /**
   * PRの全体サマリーを生成する
   * @param files レビューしたファイルとコメントの配列
   * @returns サマリーコメント
   */
  async generateSummary(files: Array<ModifiedFile>): Promise<string> {
    const fileDetailsArray = files.map(
      (file) =>
        `File: ${file.filename}\nReview Comments: ${file.reviewComment}`,
    );

    const prompt = `Please provide a concise summary of the following pull request based on the review comments for each file:
      
${fileDetailsArray.join("\n\n")}

Summarize the main changes, potential issues found, and overall assessment of the pull request.`;

    try {
      const result = await this.client.messages.create({
        model: this.model,
        system:
          "You are an experienced code reviewer summarizing the changes in a pull request.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.5,
      });

      return result.content[0].text;
    } catch (error) {
      warning(
        `Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`,
      );
      return "Failed to generate summary due to an API error.";
    }
  }
}
