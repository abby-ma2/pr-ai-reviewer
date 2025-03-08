import type { PullRequestContext } from "../context.js";
import type { Prompts } from "../prompts.js";
import type { ChangeFile } from "../types.js";
export * from "./openai.js";

export interface ChatBots {
  reviewCode(
    ctx: PullRequestContext,
    prompt: Prompts,
    change: ChangeFile,
  ): Promise<string>;
}
