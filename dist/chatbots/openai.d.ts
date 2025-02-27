import type { Options } from "../option.js";
import type { PatchParseResult } from "../patchParser.js";
import type { Prompts } from "../prompts.js";
import type { ChatBots } from "./index.js";
export declare class OpenAIClient implements ChatBots {
    private client;
    private options;
    constructor(apiKey: string, options: Options);
    /**
     * コード差分をレビューする
     * @param filePath 対象のファイルパス
     * @param patch パッチ解析結果
     * @returns レビューコメント
     */
    reviewCode(prompt: Prompts, patch: PatchParseResult): Promise<string>;
    /**
     * ファイル拡張子からファイルタイプを判断
     */
    private getFileType;
}
