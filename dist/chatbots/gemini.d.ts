import type { PullRequestContext } from "../context.js";
import type { Options } from "../option.js";
import type { PatchParseResult } from "../patchParser.js";
import type { Prompts } from "../prompts.js";
import type { ChatBots } from "./index.js";
export declare class GeminiClient implements ChatBots {
    private client;
    private model;
    private options;
    constructor(apiKey: string, options: Options);
    /**
     * コード差分をレビューする
     * @param filePath 対象のファイルパス
     * @param patch パッチ解析結果
     * @returns レビューコメント
     */
    reviewCode(ctx: PullRequestContext, prompt: Prompts, patch: PatchParseResult): Promise<string>;
    /**
     * ファイル拡張子からファイルタイプを判断
     */
    private getFileType;
}
