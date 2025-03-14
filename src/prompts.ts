import { debug } from "@actions/core";
import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { ChangeFile, FileDiff } from "./types.js";

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
`;

const defaultFooter = `
IMPORTANT: We will communicate in $language.
`;

const summarizeFileDiff = `
## GitHub PR Title

\`$title\`

## Description

\`\`\`
$description
\`\`\`

## Diff

$filename

$patches

## Instructions

I would like you to succinctly summarize the diff.
If applicable, your summary should include a note about alterations
to the signatures of exported functions, global data structures and
variables, and any changes`; // TODO add output format

/**
 * Class responsible for generating and managing prompts used for PR reviews.
 * Handles the templating of review prompts with contextual information.
 */
export class Prompts {
  /**
   * Creates a new Prompts instance with the specified options.
   * @param options - Configuration options for prompts
   * @param footer - Footer text to append to prompts (defaults to defaultFooter)
   */
  constructor(
    private options: Options,
    private footer: string = defaultFooter,
  ) {
    this.options = options;
  }

  /**
   * Renders a review prompt for a specific file change in a pull request.
   * @param ctx - Pull request context containing metadata like title and description
   * @param diff - File change information with diff content
   * @returns Formatted review prompt string with all placeholders replaced
   */
  renderReviewPrompt(ctx: PullRequestContext, diff: FileDiff): string {
    const data = {
      title: ctx.title,
      description: ctx.description || "",
      filename: diff.filename || "",
      language: this.options.language || "",
      patches: diff.renderHunk(),
    };

    return this.renderTemplate(reviewFileDiff, data);
  }

  renderSummarizeFileDiff(ctx: PullRequestContext, change: ChangeFile): string {
    const data = {
      title: ctx.title,
      description: ctx.description || "",
      filename: change.filename || "",
      language: this.options.language || "",
      patches: change.patch,
    };

    return this.renderTemplate(summarizeFileDiff, data);
  }

  /**
   * Renders a template string by replacing placeholders with provided values.
   * @param template - Template string containing placeholders in the format $key or ${key}
   * @param values - Object containing key-value pairs for placeholder replacement
   * @returns Formatted string with all placeholders replaced and footer appended
   */
  renderTemplate(template: string, values: Record<string, string>): string {
    // add footer
    let result = `${template}\n\n---\n\n${this.footer}\n`;

    for (const [key, value] of Object.entries(values)) {
      const placeholder1 = `$${key}`;
      const placeholder2 = `\${${key}}`;
      result = result.split(placeholder1).join(value);
      result = result.split(placeholder2).join(value);
    }

    return result;
  }

  /**
   * Outputs debug information about the current options.
   * Uses the debug function from @actions/core.
   */
  debug(): void {
    debug(`${this.options}`);
  }
}
