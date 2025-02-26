import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  info,
  setFailed,
} from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Options } from "./option.js";
import { parsePatch } from "./patchParser.js";
import { Prompts } from "./prompts.js";

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

    const prompts = new Prompts(options);
    prompts.debug();

    const repo = context.repo;

    const pull_request = context.payload.pull_request;
    const commitId = pull_request?.base?.sha;
    if (!commitId) {
      throw new Error("No commit id found");
    }

    const octokit = getOctokit(token);

    const targetBranchDiff = await octokit.rest.repos.compareCommits({
      owner: repo.owner,
      repo: repo.repo,
      base: pull_request.base.sha,
      head: pull_request.head.sha,
    });

    targetBranchDiff.data.files?.map((file) => {
      info(`${file.patch}`);

      const results = parsePatch({
        filename: file.filename,
        patch: file.patch,
      });

      for (const result of results) {
        const modifiedFile = {
          filename: file.filename,
          sha: file.sha,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          rawUrl: file.raw_url,
          url: file.contents_url,
          original: result.original,
          modified: result.modified,
        };
        info(JSON.stringify(modifiedFile, null, 2));
      }
    });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      setFailed(error.message);
    }
  }
}
