import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { ChangeFile } from "./types.js";
/**
 * Class responsible for generating and managing prompts used for PR reviews.
 * Handles the templating of review prompts with contextual information.
 */
export declare class Prompts {
    private options;
    /**
     * Creates a new Prompts instance with the specified options.
     * @param options - Configuration options for prompts
     */
    constructor(options: Options);
    /**
     * Renders a review prompt for a specific file change in a pull request.
     * @param ctx - Pull request context containing metadata like title
     * @param change - File change information with diff content
     * @returns Formatted review prompt string with all placeholders replaced
     */
    renderReviewPrompt(ctx: PullRequestContext, change: ChangeFile): string;
    /**
     * Outputs debug information about the current options.
     * Uses the debug function from @actions/core.
     */
    debug(): void;
}
