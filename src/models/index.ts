import type { PatchParseResult } from "../patchParser.js";
export * from "./openai.js";

export interface ReviewModel {
  reviewCode(patch: PatchParseResult): Promise<string>;
}
