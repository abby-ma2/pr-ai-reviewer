import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  info,
  setFailed,
} from "@actions/core";
import { Options } from "./option.js";
import { octokit } from "./octokit.js";
import { context } from "@actions/github";

// const token = getInput("token") || process.env.GITHUB_TOKEN || "";

const getOptions = () => {
  return new Options(
    getBooleanInput("debug"),
    getBooleanInput("disable_review"),
    getBooleanInput("disable_release_notes"),
    getInput("max_files"),
    getBooleanInput("review_simple_changes"),
    getBooleanInput("review_comment_lgtm"),
    getMultilineInput("path_filters"),
    getInput("system_message"),
    getInput("model"),
    getInput("retries"),
    getInput("timeout_ms"),
    getInput("base_url"),
    getInput("language"),
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
    const repo = context.repo;

    const pull_request = context.payload.pull_request;
    const commitId = pull_request?.base?.sha;
    if (!commitId) {
      throw new Error("No commit id found");
    }

    const incrementalDiff = await octokit.rest.repos.compareCommits({
      owner: repo.owner,
      repo: repo.repo,
      base: commitId,
      head: pull_request.head.sha,
    });
    info(`Incremental diff: ${incrementalDiff} files changed`);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      setFailed(error.message);
    }
  }
}
