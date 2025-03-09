import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { ChangeFile } from "./types.js";
export declare class Prompts {
    private options;
    constructor(options: Options);
    renderReviewPrompt(ctx: PullRequestContext, change: ChangeFile): string;
    debug(): void;
}
