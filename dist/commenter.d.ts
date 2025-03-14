import type { GitHub } from "@actions/github/lib/utils.js";
import type { PullRequestContext } from "./context.js";
import type { ReviewComment } from "./reviewer.js";
export declare const DESCRIPTION_START_TAG = "<!-- This is an auto-generated comment: release notes -->";
export declare const DESCRIPTION_END_TAG = "<!-- end of auto-generated comment: release notes -->";
export declare class Commenter {
    private octokit;
    private prContext;
    constructor(octokit: InstanceType<typeof GitHub>, prContext: PullRequestContext);
    updateDescription(message: string): Promise<void>;
    /**
     * Creates a review comment on a specific file in a pull request.
     *
     * @param filename - The path of the file to comment on
     * @param review - The review comment object containing comment text and line information
     * @returns A Promise that resolves when the comment is successfully created
     */
    createReviewComment(filename: string, review: ReviewComment): Promise<void>;
    getDescription(description: string): string;
    removeContentWithinTags(content: string, startTag: string, endTag: string): string;
}
