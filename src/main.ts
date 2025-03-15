import {
  debug,
  getBooleanInput,
  getInput,
  getMultilineInput,
  info,
  setFailed
} from "@actions/core"
import { context, getOctokit } from "@actions/github"
import { Commenter } from "./commenter.js"
import { PullRequestContext } from "./context.js"
import { Options } from "./option.js"
import { parsePatch } from "./patchParser.js"
import { Prompts } from "./prompts.js"
import { Reviewer } from "./reviewer.js"
import type { ChangeFile, FileDiff } from "./types.js"

/**
 * Retrieves all configuration options from GitHub Actions inputs.
 * Reads boolean flags, text inputs, and multiline inputs to configure the reviewer.
 *
 * @returns Configured Options instance with all action parameters
 */
const getOptions = () => {
  return new Options(
    getBooleanInput("debug"),
    getBooleanInput("disable_review"),
    getBooleanInput("disable_release_notes"),
    getMultilineInput("path_filters"),
    getInput("system_prompt"),
    getInput("summary_model"),
    getInput("model"),
    getInput("retries"),
    getInput("timeout_ms"),
    getInput("language"),
    getInput("summarize_release_notes"),
    getInput("release_notes_title")
  )
}

const token = process.env.GITHUB_TOKEN || ""

/**
 * Gets the PR context information from GitHub action context.
 * Extracts repository owner, PR title, repository name, PR body, PR number,
 * and commit SHA from the GitHub context.
 *
 * @returns Pull request context object with all required PR metadata
 */
const getPrContext = (): PullRequestContext => {
  const repo = context.repo
  const pull_request = context.payload.pull_request

  return new PullRequestContext(
    repo.owner,
    pull_request?.title,
    repo.repo,
    pull_request?.body || "",
    pull_request?.number || 0,
    pull_request?.head?.sha
  )
}

/**
 * Fetches the content of a file from GitHub repository.
 *
 * @param octokit - GitHub API client instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param path - File path
 * @param ref - Git reference (branch, tag, or commit SHA)
 * @returns The content of the file as a string or undefined if not found
 */
const getFileContent = async (
  octokit: ReturnType<typeof getOctokit>,
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string | undefined> => {
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref
    })

    if ("content" in response.data && response.data.content) {
      // Content is base64 encoded
      return Buffer.from(response.data.content, "base64").toString()
    }
    return undefined
  } catch (error) {
    info(`Failed to fetch content for ${path} ${error}`)
    return undefined
  }
}

/**
 * Fetches and processes the changed files in a pull request.
 * Retrieves the diff between base and head commits, parses the patch information,
 * and constructs FileDiff objects for each changed section of code.
 *
 * @param octokit - GitHub API client instance
 * @returns Array of ChangeFile objects with parsed diff information
 * @throws Error if the commit information cannot be found
 */
const getChangedFiles = async (
  options: Options,
  octokit: ReturnType<typeof getOctokit>
): Promise<ChangeFile[]> => {
  const pull_request = context.payload.pull_request
  const repo = context.repo

  if (!pull_request?.base?.sha) {
    throw new Error("No commit id found")
  }

  const targetBranchDiff = await octokit.rest.repos.compareCommits({
    owner: repo.owner,
    repo: repo.repo,
    base: pull_request.base.sha,
    head: pull_request.head.sha
  })

  const changes: ChangeFile[] = []

  if (!targetBranchDiff.data.files) {
    return changes
  }

  for (const file of targetBranchDiff.data.files) {
    if (!file.patch) {
      continue
    }
    if (!options.checkPath(file.filename)) {
      continue
    }

    const changeFile: ChangeFile = {
      filename: file.filename,
      sha: file.sha,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      url: file.blob_url,
      patch: file.patch,
      summary: "",
      content: undefined,
      diff: []
    }

    // Fetch file content from the head commit
    if (pull_request?.head?.sha) {
      changeFile.content = await getFileContent(
        octokit,
        repo.owner,
        repo.repo,
        file.filename,
        pull_request.head.sha
      )
      debug(
        `Fetched content for ${file.filename} from commit ${pull_request.head.sha}\n ${changeFile.content}\n`
      )
    }

    const results = parsePatch({
      filename: file.filename,
      patch: file.patch
    })

    for (const result of results) {
      const diff: FileDiff = {
        filename: file.filename,
        from: result.from,
        to: result.to
      }
      changeFile.diff.push(diff)
    }
    changes.push(changeFile)
  }

  return changes
}

/**
 * The main function for the action.
 * This function orchestrates the entire PR review process:
 * 1. Gets the options from inputs
 * 2. Creates prompt templates
 * 3. Retrieves the PR context
 * 4. Initializes the GitHub client
 * 5. Creates a reviewer instance
 * 6. Fetches changed files in the PR
 * 7. Generates a summary of changes if enabled
 * 8. Reviews code changes and posts comments if review is not disabled
 *
 * @returns {Promise<void>} Resolves when the action is complete
 * @throws {Error} If any part of the process fails
 */
export async function run(): Promise<void> {
  try {
    // Load configuration options from action inputs
    const options = getOptions()

    // Initialize prompt templates with configured options
    const prompts = new Prompts(options)

    // replace system prompt with the one from options
    const systemPrompt = prompts.renderTemplate(options.systemPrompt, {
      language: options.language
    })
    // Update the system prompt in options
    options.systemPrompt = systemPrompt

    // Get pull request context information from GitHub context
    const prContext = getPrContext()

    // Create authenticated GitHub API client
    const octokit = getOctokit(token)

    // Initialize commenter for posting review comments
    const commenter = new Commenter(options, octokit, prContext)

    // Create reviewer instance with GitHub client and options
    const reviewer = new Reviewer(commenter, options)

    // Fetch files changed in the pull request with diff information
    const changes = await getChangedFiles(options, octokit)

    if (!options.disableReleaseNotes) {
      // Generate and post a summary of the PR changes
      const summary = await reviewer.summarizeChanges({
        prContext,
        prompts,
        changes
      })

      // Update the PR description with the generated summary
      await commenter.updateDescription(summary)
    }

    if (options.disableReview) {
      return
    }
    // Review code changes and post feedback comments
    await reviewer.reviewChanges({
      prContext,
      prompts,
      changes
    })
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      setFailed(error.message)
    }
  }
}
