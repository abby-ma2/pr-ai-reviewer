import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  info,
  setFailed,
} from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { PullRequestContext } from "./context.js";
import { Options } from "./option.js";
import { parsePatch } from "./patchParser.js";
import { Prompts } from "./prompts.js";
import { ChangeFile } from "./types.js";

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
    pull_request?.body,
    pull_request?.number,
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

    const results = parsePatch({
      filename: file.filename,
      patch: file.patch,
    });

    for (const result of results) {
      const changeFile = new ChangeFile(
        file.filename,
        file.sha,
        file.status,
        file.additions,
        file.deletions,
        file.changes,
        file.contents_url,
        result.from,
        result.to,
      );

      changes.push(changeFile);
    }
  }

  return changes;
};

/**
 * Reviews the changed files
 *
 * @param prompts Prompt generation object
 * @param prContext PR context
 * @param changes Array of changed files
 */
const reviewChanges = async (
  prompts: Prompts,
  prContext: PullRequestContext,
  changes: ChangeFile[],
): Promise<void> => {
  for (const change of changes) {
    const reviewPrompt = await prompts.renderReviewPrompt(prContext, change);
    info(reviewPrompt);
  }
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

    const prompts = new Prompts(options);
    prompts.debug();

    const prContext = getPrContext();
    const octokit = getOctokit(token);
    const changes = await getChangedFiles(octokit);

    await reviewChanges(prompts, prContext, changes);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      setFailed(error.message);
    }
  }
}
