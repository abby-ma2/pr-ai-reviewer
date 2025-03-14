import type { GitHub } from "@actions/github/lib/utils.js";
import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { ReviewComment } from "./reviewer.js";
export declare const DESCRIPTION_START_TAG = "<!-- This is an auto-generated comment: release notes -->";
export declare const DESCRIPTION_END_TAG = "<!-- end of auto-generated comment: release notes -->";
export declare class Commenter {
    private options;
    private octokit;
    private prContext;
    constructor(options: Options, octokit: InstanceType<typeof GitHub>, prContext: PullRequestContext);
    /**
     * Updates the pull request description with a provided message.
     * The message is wrapped between special tags to be identifiable.
     *
     * @param message - The content to add to the PR description
     * @returns A Promise that resolves when the description is updated
     */
    updateDescription(message: string): Promise<void>;
    /**
     * Creates a review comment on a specific file in a pull request.
     *
     * @param filename - The path of the file to comment on
     * @param review - The review comment object containing comment text and line information
     * @returns A Promise that resolves when the comment is successfully created
     */
    createReviewComment(filename: string, review: ReviewComment): Promise<void>;
    /**
     * Extracts the original description by removing any content that was
     * previously added between the defined tags.
     *
     * @param description - The full description text of the pull request
     * @returns The description text without any auto-generated content
     */
    getDescription(description: string): string;
    /**
     * Removes any content found between the specified start and end tags.
     *
     * @param content - The string to process
     * @param startTag - The opening tag marking the beginning of content to remove
     * @param endTag - The closing tag marking the end of content to remove
     * @returns The content string with the tagged section removed
     */
    removeContentWithinTags(content: string, startTag: string, endTag: string): string;
}
