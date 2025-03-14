import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  setFailed,
} from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Commenter } from "./commenter.js";
import { PullRequestContext } from "./context.js";
import { Options } from "./option.js";
import { parsePatch } from "./patchParser.js";
import { Prompts } from "./prompts.js";
import { Reviewer } from "./reviewer.js";
import { ChangeFile, FileDiff } from "./types.js";

/**
 * Retrieves all configuration options from action inputs.
 *
 * @returns Configured Options instance
 */
const getOptions = () => {
  return new Options(
    getBooleanInput("debug"),
    getBooleanInput("disable_review"),
    getBooleanInput("disable_release_notes"),
    getInput("max_files"),
    getBooleanInput("review_simple_changes"),
    getBooleanInput("review_comment_lgtm"),
    getMultilineInput("path_filters"),
    getInput("system_prompt"),
    getInput("model"),
    getInput("retries"),
    getInput("timeout_ms"),
    getInput("base_url"),
    getInput("language"),
  );
};

const token = process.env.GITHUB_TOKEN || "";

/**
 * Gets the PR context information from GitHub action context
 *
 * @returns Pull request context object
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
 * Fetches and processes the changed files in a pull request
 *
 * @param octokit - GitHub API client
 * @returns Array of changed files with parsed diff information
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
    // Load configuration options from action inputs
    const options = getOptions();

    // Initialize prompt templates with configured options
    const prompts = new Prompts(options);

    // replace system prompt with the one from options
    const systemPrompt = prompts.renderTemplate(options.systemPrompt, {
      language: options.language,
    });
    // Update the system prompt in options
    options.systemPrompt = systemPrompt;

    // Get pull request context information from GitHub context
    const prContext = getPrContext();

    // Create authenticated GitHub API client
    const octokit = getOctokit(token);

    // Initialize commenter for posting review comments
    const commenter = new Commenter(octokit, prContext);

    // Create reviewer instance with GitHub client and options
    const reviewer = new Reviewer(octokit, commenter, options);

    // Fetch files changed in the pull request with diff information
    const changes = await getChangedFiles(octokit);

    // Generate and post a summary of the PR changes
    const summary = await reviewer.summarizeChanges({
      prContext,
      prompts,
      changes,
    });

    // Update the PR description with the generated summary
    await commenter.updateDescription(summary);

    // Review code changes and post feedback comments
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
