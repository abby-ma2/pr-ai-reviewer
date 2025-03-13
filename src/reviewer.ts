import { debug, info } from "@actions/core";
import type { GitHub } from "@actions/github/lib/utils.js";
import { type ChatBot, createChatBotFromModel } from "./chatbot/index.js";
import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { Prompts } from "./prompts.js";
import type { ChangeFile } from "./types.js";

export type ReviewComment = {
  startLine: number;
  endLine: number;
  comment: string;
  isLGTM: boolean;
};

/**
 * Reviewer class responsible for performing code reviews using a chatbot.
 * It initializes with configuration options and creates the appropriate chatbot instance.
 */
export class Reviewer {
  /**
   * Configuration options for the reviewer.
   * @private
   */
  private options: Options;

  private octokit: InstanceType<typeof GitHub>;

  /**
   * The chatbot instance used for generating review comments.
   * @private
   */
  private chatbot: ChatBot;

  /**
   * Creates a new Reviewer instance.
   * @param options - Configuration options for the reviewer and chatbot
   */
  constructor(octokit: InstanceType<typeof GitHub>, options: Options) {
    this.octokit = octokit;

    this.options = options;

    this.chatbot = createChatBotFromModel(this.options.model, this.options);
  }

  async reviewChanges({
    prContext,
    prompts,
    changes,
  }: {
    prContext: PullRequestContext;
    prompts: Prompts;
    changes: ChangeFile[];
  }) {
    for (const change of changes) {
      const reviewPrompt = await prompts.renderReviewPrompt(prContext, change);
      info(`Prompt: ${reviewPrompt}\n`);
      const reviewComment = await this.chatbot.reviewCode(
        prContext,
        reviewPrompt,
      );

      const reviews = parseReviewComment(reviewComment);
      info(`Review: ${JSON.stringify(reviews, null, 2)}`);
      for (const review of reviews) {
        if (review.isLGTM) {
          continue;
        }

        const reviewCommentResult =
          await this.octokit.rest.pulls.createReviewComment({
            owner: prContext.owner,
            repo: prContext.repo,
            pull_number: prContext.pullRequestNumber,
            commit_id: prContext.commentId,
            path: change.filename,
            body: review.comment,
            start_line: review.startLine,
            line: review.endLine,
          });
        if (reviewCommentResult.status === 201) {
          info(`Comment created: ${reviewCommentResult.data.html_url}`);
        }
      }
    }
  }

  /**
   * Outputs debug information about the reviewer configuration and chatbot.
   */
  debug(): void {
    debug(`${this.options}`);
    debug(`${this.chatbot}`);
    debug(`${this.octokit}`);
  }
}

export const parseReviewComment = (reviewComment: string): ReviewComment[] => {
  // 空のコメントの場合は空の配列を返す
  if (!reviewComment || reviewComment.trim().length === 0) {
    return [];
  }

  // 区切り文字で分割
  const sections = reviewComment
    .split("---")
    .filter((section) => section.trim().length > 0);
  const result: ReviewComment[] = [];

  for (const section of sections) {
    // 行番号とコメント部分を抽出
    const match = section.trim().match(/^(\d+)-(\d+):?\s*([\s\S]+)$/);

    if (match) {
      const startLine = Number.parseInt(match[1], 10);
      const endLine = Number.parseInt(match[2], 10);
      const comment = match[3].trim();

      // コメントにLGTMが含まれているかチェック
      const isLGTM = comment.toLowerCase().includes("lgtm!");

      result.push({
        startLine,
        endLine,
        comment,
        isLGTM,
      });
    }
  }

  return result;
};
