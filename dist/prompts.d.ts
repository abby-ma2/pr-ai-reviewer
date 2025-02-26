import type { Options } from "./option.js";
export declare class Prompts {
    private options;
    constructor(options: Options);
    renderReviewPrompt(): string;
    debug(): void;
}
