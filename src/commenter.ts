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

  async updateDescription(message: string) {
    const { owner, repo, pullRequestNumber } = this.prContext;
    const pr = await this.octokit.rest.pulls.get({
      owner: owner,
      repo: repo,
      pull_number: pullRequestNumber,
    });
    let body = "";
    if (pr.data.body) {
      body = pr.data.body;
    }
    const description = this.getDescription(body);

    const cleaned = this.removeContentWithinTags(
      message,
      DESCRIPTION_START_TAG,
      DESCRIPTION_END_TAG,
    );
    const newDescription = `${description}\n${DESCRIPTION_START_TAG}\n${cleaned}\n${DESCRIPTION_END_TAG}`;

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

  getDescription(description: string) {
    return this.removeContentWithinTags(
      description,
      DESCRIPTION_START_TAG,
      DESCRIPTION_END_TAG,
    );
  }

  removeContentWithinTags(content: string, startTag: string, endTag: string) {
    const start = content.indexOf(startTag);
    const end = content.lastIndexOf(endTag);
    if (start >= 0 && end >= 0) {
      return content.slice(0, start) + content.slice(end + endTag.length);
    }
    return content;
  }
}
