import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { ChangeFile, FileDiff } from "./types.js";
/**
 * Class responsible for generating and managing prompts used for PR reviews.
 * Handles the templating of review prompts with contextual information.
 */
export declare class Prompts {
    private options;
    private footer;
    /**
     * Creates a new Prompts instance with the specified options.
     * @param options - Configuration options for prompts
     * @param footer - Footer text to append to prompts (defaults to defaultFooter)
     */
    constructor(options: Options, footer?: string);
    renderSummarizeReleaseNote(message: string): string;
    /**
     * Renders a summary prompt for a specific file change in a pull request.
     * @param ctx - Pull request context containing metadata like title and description
     * @param change - File change information with patch content
     * @returns Formatted summary prompt string with all placeholders replaced
     */
    renderSummarizeFileDiff(ctx: PullRequestContext, change: ChangeFile): string;
    /**
     * Renders a review prompt for a specific file change in a pull request.
     * @param ctx - Pull request context containing metadata like title and description
     * @param diff - File change information with diff content
     * @returns Formatted review prompt string with all placeholders replaced
     */
    renderReviewPrompt(ctx: PullRequestContext, diff: FileDiff): string;
    /**
     * Renders a template string by replacing placeholders with provided values.
     * @param template - Template string containing placeholders in the format $key or ${key}
     * @param values - Object containing key-value pairs for placeholder replacement
     * @returns Formatted string with all placeholders replaced and footer appended
     */
    renderTemplate(template: string, values: Record<string, string>): string;
    /**
     * Outputs debug information about the current options.
     * Uses the debug function from @actions/core.
     */
    debug(): void;
}
