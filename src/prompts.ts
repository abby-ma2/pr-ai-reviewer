import { debug } from "@actions/core";
import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { ChangeFile } from "./types.js";

/**
 * Template for the pull request review prompt.
 * Contains placeholders for title, description, summary, filename, and patches.
 * Provides instructions for the AI reviewer on how to format responses.
 */
const reviewFileDiff = `## GitHub PR Title

\`$title\`

## Description

\`\`\`
$description
\`\`\`

## Summary of changes

\`\`\`
$short_summary
\`\`\`

## IMPORTANT Instructions

Input: New hunks annotated with line numbers and old hunks (replaced code). Hunks represent incomplete code fragments.
Additional Context: PR title, description, summaries and comment chains.
Task: Review new hunks for substantive issues using provided context and respond with comments if necessary.
Output: Review comments in markdown with exact line number ranges in new hunks. Start and end line numbers must be within the same hunk. For single-line comments, start=end line number. Must use example response format below.
Use fenced code blocks using the relevant language identifier where applicable.
Don't annotate code snippets with line numbers. Format and indent code correctly.
Do not use \`suggestion\` code blocks.
For fixes, use \`diff\` code blocks, marking changes with \`+\` or \`-\`. The line number range for comments with fix snippets must exactly match the range to replace in the new hunk.

Consider:
1. Code quality and adherence to best practices
2. Potential bugs or edge cases
3. Performance optimizations
4. Readability and maintainability
5. Any security concerns
Suggest improvements and explain your reasoning for each suggestion.
- Do NOT provide general feedback, summaries, explanations of changes, or praises
  for making good additions.
- Focus solely on offering specific, objective insights based on the
  given context and refrain from making broad comments about potential impacts on
  the system or question intentions behind the changes.

If there are no issues found on a line range, you MUST respond with the
text \`LGTM!\` for that line range in the review section.

## Example

### Example changes

---new_hunk---
\`\`\`
  z = x / y
    return z

20: def add(x, y):
21:     z = x + y
22:     retrn z
23:
24: def multiply(x, y):
25:     return x * y

def subtract(x, y):
  z = x - y
\`\`\`

---old_hunk---
\`\`\`
  z = x / y
    return z

def add(x, y):
    return x + y

def subtract(x, y):
    z = x - y
\`\`\`

---comment_chains---
\`\`\`
Please review this change.
\`\`\`

---end_change_section---

### Example response

22-22:
There's a syntax error in the add function.
\`\`\`diff
-    retrn z
+    return z
\`\`\`
---
24-25:
LGTM!
---

## Changes made to \`$filename\` for your review

$patches

We will communicate in $language.
`;

/**
 * Class responsible for generating and managing prompts used for PR reviews.
 * Handles the templating of review prompts with contextual information.
 */
export class Prompts {
  /**
   * Creates a new Prompts instance with the specified options.
   * @param options - Configuration options for prompts
   */
  constructor(private options: Options) {
    this.options = options;
  }

  /**
   * Renders a review prompt for a specific file change in a pull request.
   * @param ctx - Pull request context containing metadata like title
   * @param change - File change information with diff content
   * @returns Formatted review prompt string with all placeholders replaced
   */
  renderReviewPrompt(ctx: PullRequestContext, change: ChangeFile): string {
    let prompts = reviewFileDiff.replace("$title", ctx.title);
    prompts = prompts.replace("$language", this.options.language);
    return prompts.replace("$patches", change.renderHunk());
  }

  /**
   * Outputs debug information about the current options.
   * Uses the debug function from @actions/core.
   */
  debug(): void {
    debug(`${this.options}`);
  }
}
