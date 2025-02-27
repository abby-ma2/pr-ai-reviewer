import type { Options } from "../option.js";
import type { PatchParseResult } from "../patchParser.js";
import type { Prompts } from "../prompts.js";
import type { ModifiedFile } from "../types.js";
import type { ChatBots } from "./index.js";
export declare class ClaudeClient implements ChatBots {
    private client;
    private model;
    private options;
    constructor(apiKey: string, options: Options);
    /**
     * コード差分をレビューする
     * @param prompt レビューに使用するプロンプト
     * @param patch パッチ解析結果
     * @returns レビューコメント
     */
    reviewCode(prompt: Prompts, patch: PatchParseResult): Promise<string>;
    /**
     * PRの全体サマリーを生成する
     * @param files レビューしたファイルとコメントの配列
     * @returns サマリーコメント
     */
    generateSummary(files: Array<ModifiedFile>): Promise<string>;
}
