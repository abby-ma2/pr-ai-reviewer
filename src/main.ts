import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  info,
  setFailed,
} from "@actions/core";
import { context, getOctokit } from "@actions/github";
import type { PullRequestContext } from "./context.js";
import { Options } from "./option.js";
import { parsePatch } from "./patchParser.js";
import { Prompts } from "./prompts.js";
import type { ChangeFile } from "./types.js";

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
 * PRコンテキストを取得する
 *
 * @returns PRコンテキスト
 */
const getPrContext = (): PullRequestContext => {
  const repo = context.repo;
  const pull_request = context.payload.pull_request;

  return {
    owner: repo.owner,
    title: pull_request?.title,
    description: pull_request?.body,
    repo: repo.repo,
    pullRequestNumber: pull_request?.number,
  };
};

/**
 * 変更ファイルを取得する
 *
 * @param octokit GitHubクライアント
 * @returns 変更ファイルの配列
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
      const modifiedFile = {
        filename: file.filename,
        sha: file.sha,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        url: file.contents_url,
        from: result.from,
        to: result.to,
      } satisfies ChangeFile;

      changes.push(modifiedFile);
    }
  }

  return changes;
};

/**
 * 変更ファイルをレビューする
 *
 * @param prompts プロンプト生成オブジェクト
 * @param prContext PRコンテキスト
 * @param changes 変更ファイルの配列
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
