import type { GitHub } from "@actions/github/lib/utils.js";
import type { Commenter } from "./commenter.js";
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
/**
 * Reviewer class responsible for performing code reviews using a chatbot.
 * It initializes with configuration options and creates the appropriate chatbot instance.
 */
export declare class Reviewer {
    /**
     * Configuration options for the reviewer.
     * @private
     */
    private options;
    /**
     * Commenter instance used to post review comments to GitHub.
     * @private
     */
    private commenter;
    /**
     * GitHub API client instance.
     * @private
     */
    private octokit;
    /**
     * The chatbot instance used for generating review comments.
     * @private
     */
    private chatbot;
    /**
     * Creates a new Reviewer instance.
     * @param octokit - GitHub API client instance
     * @param commenter - Commenter instance for posting comments
     * @param options - Configuration options for the reviewer and chatbot
     */
    constructor(octokit: InstanceType<typeof GitHub>, commenter: Commenter, options: Options);
    /**
     * Generates summaries for each file change in a pull request.
     *
     * @param prContext - Context information about the pull request
     * @param prompts - Prompt templates for generating summaries
     * @param changes - List of files changed in the pull request
     */
    summarizeChanges({ prContext, prompts, changes, }: {
        prContext: PullRequestContext;
        prompts: Prompts;
        changes: ChangeFile[];
    }): Promise<string>;
    /**
     * Reviews code changes in a pull request and posts review comments.
     *
     * @param prContext - Context information about the pull request
     * @param prompts - Prompt templates for generating reviews
     * @param changes - List of files changed in the pull request
     */
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
