import type { GitHub } from "@actions/github/lib/utils.js";
import type { PullRequestContext } from "./context.js";
import type { ReviewComment } from "./reviewer.js";
export declare class Commenter {
    private octokit;
    private prContext;
    constructor(octokit: InstanceType<typeof GitHub>, prContext: PullRequestContext);
    /**
     * Creates a review comment on a specific file in a pull request.
     *
     * @param filename - The path of the file to comment on
     * @param review - The review comment object containing comment text and line information
     * @returns A Promise that resolves when the comment is successfully created
     */
    createReviewComment(filename: string, review: ReviewComment): Promise<void>;
}
