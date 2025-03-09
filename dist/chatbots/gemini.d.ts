import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import type { Prompts } from "../prompts.js";
import type { ChangeFile } from "../types.js";
import type { ChatBot } from "./index.js";
export declare class GeminiClient implements ChatBot {
    private client;
    private model;
    private options;
    constructor(apiKey: string, options: Options);
    /**
     * コード差分をレビューする
     * @param filePath 対象のファイルパス
     * @param change パッチ解析結果
     * @returns レビューコメント
     */
    reviewCode(ctx: PullRequestContext, prompt: Prompts, change: ChangeFile): Promise<string>;
}
