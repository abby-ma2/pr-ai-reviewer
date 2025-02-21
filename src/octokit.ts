import { getInput } from "@actions/core";
import { getOctokitOptions, GitHub } from "@actions/github/lib/utils.js";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";

const token = getInput("token") || process.env.GITHUB_TOKEN || "";

const RetryAndThrottlingOctokit = GitHub.plugin(retry, throttling);

export const octokit = new RetryAndThrottlingOctokit(getOctokitOptions(token));
