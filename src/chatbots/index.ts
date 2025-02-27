import type { PatchParseResult } from "../patchParser.js";
import type { Prompts } from "../prompts.js";
export * from "./openai.js";

export interface ChatBots {
  reviewCode(prompt: Prompts, patch: PatchParseResult): Promise<string>;
}
