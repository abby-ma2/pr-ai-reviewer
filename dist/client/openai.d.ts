import type { Options } from "../option.js";
import type { PatchParseResult } from "../patchParser.js";
export declare class OpenAIClient {
    private client;
    private options;
    constructor(apiKey: string, options: Options);
    /**
     * コード差分をレビューする
     * @param filePath 対象のファイルパス
     * @param patch パッチ解析結果
     * @returns レビューコメント
     */
    reviewCode(patch: PatchParseResult): Promise<string>;
    /**
     * ファイル拡張子からファイルタイプを判断
     */
    private getFileType;
    /**
     * コードレビュー用のプロンプトを構築
     */
    private buildReviewPrompt;
    /**
     * PRの全体サマリーを生成する
     * @param files レビューしたファイルとコメントの配列
     * @returns サマリーコメント
     */
    generateSummary(files: Array<{
        path: string;
        review: string;
    }>): Promise<string>;
}
