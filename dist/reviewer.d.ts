import type { GitHub } from "@actions/github/lib/utils.js";
import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { Prompts } from "./prompts.js";
import type { ChangeFile } from "./types.js";
export type ReviewComment = {
    startLine: number;
    endLine: number;
    comment: string;
    isLGTM: boolean;
};
/**hp
 * Reviewer class responsible for performing code reviews using a chatbot.
 * It initializes with configuration options and creates the appropriate chatbot instance.
 */
export declare class Reviewer {
    /**
     * Configuration options for the reviewer.
     * @private
     */
    private options;
    private octokit;
    /**
     * The chatbot instance used for generating review comments.
     * @private
     */
    private chatbot;
    /**
     * Creates a new Reviewer instance.
     * @param options - Configuration options for the reviewer and chatbot
     */
    constructor(octokit: InstanceType<typeof GitHub>, options: Options);
    reviewChanges({ prContext, prompts, changes, }: {
        prContext: PullRequestContext;
        prompts: Prompts;
        changes: ChangeFile[];
    }): Promise<void>;
    /**
     * Outputs debug information about the reviewer configuration and chatbot.
     */
    debug(): void;
}
/**
 * Parses the review comment string and extracts structured review data.
 *
 * @param reviewComment - The raw review comment string to parse
 * @returns Array of ReviewComment objects containing structured review data
 */
export declare const parseReviewComment: (reviewComment: string) => ReviewComment[];
