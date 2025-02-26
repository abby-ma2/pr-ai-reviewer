import { debug } from "@actions/core";
import type { Options } from "./option.js";

export class Prompts {
  constructor(private options: Options) {
    this.options = options;
  }

  renderReviewPrompt(): string {
    return "TODO";
  }

  debug(): void {
    debug(`${this.options}`);
  }
}
