import { debug, info } from "@actions/core";
import type { GitHub } from "@actions/github/lib/utils.js";
import { type ChatBot, createChatBotFromModel } from "./chatbot/index.js";
import type { PullRequestContext } from "./context.js";
import type { Options } from "./option.js";
import type { Prompts } from "./prompts.js";
import type { ChangeFile } from "./types.js";

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
      info(reviewPrompt);
      const reviewComment = await this.chatbot.reviewCode(
        prContext,
        reviewPrompt,
      );
      info(reviewComment);
    }
  }

  /**
   * Outputs debug information about the reviewer configuration and chatbot.
   */
  debug(): void {
    debug(`${this.options}`);
    debug(`${this.chatbot}`);
  }
}
