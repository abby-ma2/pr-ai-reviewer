import { debug, info, warning } from "@actions/core";
import {
  type GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import type { Options } from "../option.js";
import type { PatchParseResult } from "../patchParser.js";
import type { Prompts } from "../prompts.js";
import type { ModifiedFile } from "../types.js";
import type { ChatBots } from "./index.js";

const defaultModel = "gemini-2.0-flash-lite";

export class GeminiClient implements ChatBots {
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
   * @param patch パッチ解析結果
   * @returns レビューコメント
   */
  async reviewCode(prompt: Prompts, patch: PatchParseResult): Promise<string> {
    if (this.options.disableReview) {
      info("Code review is disabled in options");
      return "";
    }

    try {
      // Gemini APIを呼び出す
      const result = await this.model.generateContent({
        contents: [
          { role: "user", parts: [{ text: this.options.systemMessage }] },
          { role: "user", parts: [{ text: prompt.renderReviewPrompt() }] },
        ],
        generationConfig: {
          temperature: 0.1,
          // maxOutputTokens: 2000,
        },
      });

      const reviewComment = result.response.text();

      if (this.options.debug) {
        debug(`Review for ${patch.original.filename}:\n${reviewComment}`);
      }

      return reviewComment;
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
   * ファイル拡張子からファイルタイプを判断
   */
  private getFileType(extension: string): string {
    const extensionMap: Record<string, string> = {
      js: "JavaScript",
      ts: "TypeScript",
      jsx: "React JSX",
      tsx: "React TSX",
      py: "Python",
      rb: "Ruby",
      go: "Go",
      java: "Java",
      php: "PHP",
      cs: "C#",
      cpp: "C++",
      c: "C",
      html: "HTML",
      css: "CSS",
      scss: "SCSS",
      md: "Markdown",
      json: "JSON",
      yml: "YAML",
      yaml: "YAML",
      xml: "XML",
      sh: "Shell",
      bash: "Bash",
      sql: "SQL",
    };

    return extensionMap[extension] || "Unknown";
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
      const result = await this.model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "You are an experienced code reviewer summarizing the changes in a pull request.",
              },
            ],
          },
          { role: "user", parts: [{ text: prompt }] },
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1000,
        },
      });

      return result.response.text();
    } catch (error) {
      warning(
        `Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`,
      );
      return "Failed to generate summary due to an API error.";
    }
  }
}
