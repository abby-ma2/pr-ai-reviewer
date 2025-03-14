import type { GitHub } from "@actions/github/lib/utils.js";
import type { PullRequestContext } from "./context.js";
import type { ReviewComment } from "./reviewer.js";

export const DESCRIPTION_START_TAG =
  "<!-- This is an auto-generated comment: release notes -->";
export const DESCRIPTION_END_TAG =
  "<!-- end of auto-generated comment: release notes -->";

export class Commenter {
  private octokit: InstanceType<typeof GitHub>;
  private prContext: PullRequestContext;

  constructor(
    octokit: InstanceType<typeof GitHub>,
    prContext: PullRequestContext,
  ) {
    this.octokit = octokit;
    this.prContext = prContext;
  }

  /**
   * Updates the pull request description with a provided message.
   * The message is wrapped between special tags to be identifiable.
   *
   * @param message - The content to add to the PR description
   * @returns A Promise that resolves when the description is updated
   */
  async updateDescription(message: string) {
    const { owner, repo, pullRequestNumber } = this.prContext;
    const pr = await this.octokit.rest.pulls.get({
      owner: owner,
      repo: repo,
      pull_number: pullRequestNumber,
    });
    // Get the current description of the pull request
    const body = pr.data.body || "";
    const description = this.getDescription(body);
    const cleaned = this.removeContentWithinTags(
      message,
      DESCRIPTION_START_TAG,
      DESCRIPTION_END_TAG,
    );

    // Append the new content to the existing description
    const newDescription = `${description}\n${DESCRIPTION_START_TAG}\n## Pull request summaries\n${cleaned}\n${DESCRIPTION_END_TAG}`;

    // Update the pull request description
    await this.octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: pullRequestNumber,
      body: newDescription,
    });
  }

  /**
   * Creates a review comment on a specific file in a pull request.
   *
   * @param filename - The path of the file to comment on
   * @param review - The review comment object containing comment text and line information
   * @returns A Promise that resolves when the comment is successfully created
   */
  async createReviewComment(filename: string, review: ReviewComment) {
    // Define base request and conditional parameters separately
    const baseRequest = {
      owner: this.prContext.owner,
      repo: this.prContext.repo,
      pull_number: this.prContext.pullRequestNumber,
      commit_id: this.prContext.commentId,
      path: filename,
      body: review.comment,
    };

    // Set line parameters appropriately
    const requestParams =
      review.startLine === review.endLine
        ? { ...baseRequest, line: review.endLine }
        : {
            ...baseRequest,
            start_line: review.startLine,
            line: review.endLine,
          };

    const reviewCommentResult =
      await this.octokit.rest.pulls.createReviewComment(requestParams);
    if (reviewCommentResult.status === 201) {
      // debug(`Comment created: ${reviewCommentResult.data.html_url}`);
    }
  }

  /**
   * Extracts the original description by removing any content that was
   * previously added between the defined tags.
   *
   * @param description - The full description text of the pull request
   * @returns The description text without any auto-generated content
   */
  getDescription(description: string) {
    return this.removeContentWithinTags(
      description,
      DESCRIPTION_START_TAG,
      DESCRIPTION_END_TAG,
    );
  }

  /**
   * Removes any content found between the specified start and end tags.
   *
   * @param content - The string to process
   * @param startTag - The opening tag marking the beginning of content to remove
   * @param endTag - The closing tag marking the end of content to remove
   * @returns The content string with the tagged section removed
   */
  removeContentWithinTags(content: string, startTag: string, endTag: string) {
    const start = content.indexOf(startTag);
    const end = content.lastIndexOf(endTag);
    if (start >= 0 && end >= 0) {
      return content.slice(0, start) + content.slice(end + endTag.length);
    }
    return content;
  }
}
