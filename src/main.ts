import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  info,
  setFailed,
} from "@actions/core";
import { Options } from "./option.js";
import { context, getOctokit } from "@actions/github";

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

const token = getInput("token") || process.env.GITHUB_TOKEN || "";

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

    const octokit = getOctokit(token);
    const incrementalDiff = await octokit.rest.repos.compareCommits({
      owner: repo.owner,
      repo: repo.repo,
      base: commitId,
      head: pull_request.head.sha,
    });
    info(`Incremental diff: ${incrementalDiff} files changed`);
    incrementalDiff.data.files?.map((file) => {
      info(`file: ${file.filename}`);
      info(`status: ${file.status}`);
      info(`patch: ${file.patch}`);
      info(`sha: ${file.sha}`);
      info(`raw_url: ${file.raw_url}`);
      info(`blob_url: ${file.blob_url}`);
      info(`contents_url: ${file.contents_url}`);
      info(`additions: ${file.additions}`);
      info(`deletions: ${file.deletions}`);
      info(`changes: ${file.changes}`);
    });
 
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      setFailed(error.message);
    }
  }
}
