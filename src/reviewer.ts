import { debug } from "@actions/core";
import type { GitHub } from "@actions/github/lib/utils.js";
import { type ChatBot, createChatBotFromModel } from "./chatbot/index.js";
import type { Commenter } from "./commenter.js";
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

  /**
   * Commenter instance used to post review comments to GitHub.
   * @private
   */
  private commenter: Commenter;

  /**
   * GitHub API client instance.
   * @private
   */
  private octokit: InstanceType<typeof GitHub>;

  /**
   * The chatbot instance used for generating review comments.
   * @private
   */
  private chatbot: ChatBot;

  /**
   * Creates a new Reviewer instance.
   * @param octokit - GitHub API client instance
   * @param commenter - Commenter instance for posting comments
   * @param options - Configuration options for the reviewer and chatbot
   */
  constructor(
    octokit: InstanceType<typeof GitHub>,
    commenter: Commenter,
    options: Options,
  ) {
    this.octokit = octokit;
    this.commenter = commenter;
    this.options = options;
    this.chatbot = createChatBotFromModel(this.options.model, this.options);
  }

  /**
   * Generates summaries for each file change in a pull request.
   *
   * @param prContext - Context information about the pull request
   * @param prompts - Prompt templates for generating summaries
   * @param changes - List of files changed in the pull request
   */
  async summarizeChanges({
    prContext,
    prompts,
    changes,
  }: {
    prContext: PullRequestContext;
    prompts: Prompts;
    changes: ChangeFile[];
  }): Promise<string> {
    for (const change of changes) {
      const prompt = prompts.renderSummarizeFileDiff(prContext, change);
      const summary = await this.chatbot.chat(prContext, prompt);

      debug(`Summary: ${change.filename} \n ${summary}\n`);
      prContext.appendChangeSummary(change.filename, summary);
    }
    // TODO summarize all changes
    // update description
    return prContext.getChangeSummary();
  }

  /**
   * Reviews code changes in a pull request and posts review comments.
   *
   * @param prContext - Context information about the pull request
   * @param prompts - Prompt templates for generating reviews
   * @param changes - List of files changed in the pull request
   */
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
      for (const diff of change.diff) {
        const reviewPrompt = prompts.renderReviewPrompt(prContext, diff);

        // debug(`Prompt: ${reviewPrompt}\n`);

        const reviewComment = await this.chatbot.reviewCode(
          prContext,
          reviewPrompt,
        );

        const reviews = parseReviewComment(reviewComment);

        for (const review of reviews) {
          if (review.isLGTM) {
            continue;
          }
          await this.commenter.createReviewComment(change.filename, review);
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

/**
 * Parses the review comment string and extracts structured review data.
 *
 * @param reviewComment - The raw review comment string to parse
 * @returns Array of ReviewComment objects containing structured review data
 */
export const parseReviewComment = (reviewComment: string): ReviewComment[] => {
  // Return empty array for empty comments
  if (!reviewComment || reviewComment.trim().length === 0) {
    return [];
  }

  // Split by separator
  const sections = reviewComment
    .split("---")
    .filter((section) => section.trim().length > 0);
  const result: ReviewComment[] = [];

  for (const section of sections) {
    // Extract line numbers and comment content
    const match = section.trim().match(/^(\d+)-(\d+):?\s*([\s\S]+)$/);

    if (match) {
      const startLine = Number.parseInt(match[1], 10);
      const endLine = Number.parseInt(match[2], 10);
      const comment = match[3].trim();

      // Check if comment contains LGTM
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
