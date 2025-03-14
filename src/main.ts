import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  setFailed,
} from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { PullRequestContext } from "./context.js";
import { Options } from "./option.js";
import { parsePatch } from "./patchParser.js";
import { Prompts } from "./prompts.js";
import { Reviewer } from "./reviewer.js";
import { ChangeFile, FileDiff } from "./types.js";

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

const token = process.env.GITHUB_TOKEN || "";

/**
 * Gets the PR context
 *
 * @returns PR context
 */
const getPrContext = (): PullRequestContext => {
  const repo = context.repo;
  const pull_request = context.payload.pull_request;

  return new PullRequestContext(
    repo.owner,
    pull_request?.title,
    repo.repo,
    pull_request?.body || "",
    pull_request?.number || 0,
    pull_request?.head?.sha,
  );
};

/**
 * Gets the changed files
 *
 * @param octokit GitHub client
 * @returns Array of changed files
 */
const getChangedFiles = async (
  octokit: ReturnType<typeof getOctokit>,
): Promise<ChangeFile[]> => {
  const pull_request = context.payload.pull_request;
  const repo = context.repo;

  if (!pull_request?.base?.sha) {
    throw new Error("No commit id found");
  }

  const targetBranchDiff = await octokit.rest.repos.compareCommits({
    owner: repo.owner,
    repo: repo.repo,
    base: pull_request.base.sha,
    head: pull_request.head.sha,
  });

  const changes: ChangeFile[] = [];

  if (!targetBranchDiff.data.files) {
    return changes;
  }

  for (const file of targetBranchDiff.data.files) {
    if (!file.patch) {
      continue;
    }

    const changeFile = new ChangeFile(
      file.filename,
      file.sha,
      file.status,
      file.additions,
      file.deletions,
      file.changes,
      file.contents_url,
      file.patch,
      [],
    );

    const results = parsePatch({
      filename: file.filename,
      patch: file.patch,
    });

    for (const result of results) {
      const diff = new FileDiff(file.filename, result.from, result.to);
      changeFile.diff.push(diff);
    }
    changes.push(changeFile);
  }

  return changes;
};

/**
 * The main function for the action.
 * This function orchestrates the entire PR review process:
 * 1. Gets the options from inputs
 * 2. Creates prompt templates
 * 3. Retrieves the PR context
 * 4. Initializes the GitHub client
 * 5. Creates a reviewer instance
 * 6. Fetches changed files in the PR
 * 7. Generates a summary of changes
 * 8. Reviews code changes and posts comments
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 * @throws {Error} If any part of the process fails
 */
export async function run(): Promise<void> {
  try {
    const options = getOptions();

    const prompts = new Prompts(options);

    const prContext = getPrContext();

    const octokit = getOctokit(token);

    const reviewer = new Reviewer(octokit, options);

    const changes = await getChangedFiles(octokit);

    await reviewer.summarizeChanges({
      prContext,
      prompts,
      changes,
    });

    await reviewer.reviewChanges({
      prContext,
      prompts,
      changes,
    });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      setFailed(error.message);
    }
  }
}
