import type { GitHub } from "@actions/github/lib/utils.js";
import type { PullRequestContext } from "./context.js";
import type { ReviewComment } from "./reviewer.js";

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
}
