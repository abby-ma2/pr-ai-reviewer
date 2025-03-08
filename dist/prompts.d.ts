import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { PatchParseResult } from "./patchParser.js";
export declare class Prompts {
    private options;
    constructor(options: Options);
    renderReviewPrompt(ctx: PullRequestContext, result: PatchParseResult): string;
    renderHunk(result: PatchParseResult): string;
    debug(): void;
}
