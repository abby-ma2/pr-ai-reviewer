import * as core from "@actions/core";
import { Options } from "./option.js";

const getOptions = () => {
  return new Options(
    core.getBooleanInput("debug"),
    core.getBooleanInput("disable_review"),
    core.getBooleanInput("disable_release_notes"),
    core.getInput("max_files"),
    core.getBooleanInput("review_simple_changes"),
    core.getBooleanInput("review_comment_lgtm"),
    core.getMultilineInput("path_filters"),
    core.getInput("system_message"),
    core.getInput("model"),
    core.getInput("retries"),
    core.getInput("timeout_ms"),
    core.getInput("base_url"),
    core.getInput("language"),
  );
};

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const options = getOptions();
    options.print();
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
