import { debug, info, warning } from "@actions/core";
import OpenAI from "openai";
import type { Options } from "../option.js";
import type { PatchParseResult } from "../patchParser.js";
import type { Prompts } from "../prompts.js";
import type { ModifiedFile } from "../types.js";
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
  async reviewCode(prompt: Prompts, patch: PatchParseResult): Promise<string> {
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
          { role: "user", content: prompt.renderReviewPrompt() },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const reviewComment = response.choices[0]?.message?.content || "";

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
   * コードレビュー用のプロンプトを構築
   */
  private buildReviewPrompt(
    filePath: string,
    fileType: string,
    originalCode: string,
    modifiedCode: string,
  ): string {
    // TODO change
    return `
I need you to review code changes in a ${fileType} file: ${filePath}

ORIGINAL CODE:
\`\`\`${fileType.toLowerCase()}
${originalCode}
\`\`\`

MODIFIED CODE:
\`\`\`${fileType.toLowerCase()}
${modifiedCode}
\`\`\`

Please analyze these changes and provide a detailed code review focusing on:
1. Potential bugs or issues
2. Performance concerns
3. Security vulnerabilities
4. Code quality improvements
5. Maintainability suggestions

If the changes look good, mention that. If there are issues, explain them and suggest improvements.
Format your review as Markdown.
${!this.options.reviewCommentLGTM ? 'If the code is LGTM (Looks Good To Me), just respond with "LGTM".' : ""}

Your review:
`;
  }

  /**
   * PRの全体サマリーを生成する
   * @param files レビューしたファイルとコメントの配列
   * @returns サマリーコメント
   */
  async generateSummary(files: Array<ModifiedFile>): Promise<string> {
    const prompt = "TODO";
    debug(`${files}`);
    try {
      const response = await this.client.chat.completions.create({
        model: this.options.model,
        messages: [
          {
            role: "system",
            content:
              "You are an experienced code reviewer summarizing the changes in a pull request.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      warning(
        `Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`,
      );
      return "Failed to generate summary due to an API error.";
    }
  }
}
