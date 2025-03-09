import * as core from "@actions/core";
import { minimatch } from "minimatch";

export class Options {
  debug: boolean;
  disableReview: boolean;
  disableReleaseNotes: boolean;
  maxFiles: number;
  reviewSimpleChanges: boolean;
  reviewCommentLGTM: boolean;
  pathFilters: PathFilter;
  systemMessage: string;
  model: string;
  retries: number;
  timeoutMS: number;
  apiBaseUrl: string;
  language: string;

  constructor(
    debug: boolean,
    disableReview: boolean,
    disableReleaseNotes: boolean,
    maxFiles = "0",
    reviewSimpleChanges = false,
    reviewCommentLGTM = false,
    pathFilters: string[] | null = null,
    systemMessage = "",
    model = "openai/o3-mini",
    retries = "3",
    timeoutMS = "120000",
    apiBaseUrl = "https://api.openai.com/v1",
    language = "en-US",
  ) {
    this.debug = debug;
    this.disableReview = disableReview;
    this.disableReleaseNotes = disableReleaseNotes;
    this.maxFiles = Number.parseInt(maxFiles);
    this.reviewSimpleChanges = reviewSimpleChanges;
    this.reviewCommentLGTM = reviewCommentLGTM;
    this.pathFilters = new PathFilter(pathFilters);
    this.systemMessage = systemMessage;
    this.model = model;
    this.retries = Number.parseInt(retries);
    this.timeoutMS = Number.parseInt(timeoutMS);
    this.apiBaseUrl = apiBaseUrl;
    this.language = language;
  }

  // print all options using core.info
  print(): void {
    core.info(`debug: ${this.debug}`);
    core.info(`disable_review: ${this.disableReview}`);
    core.info(`disable_release_notes: ${this.disableReleaseNotes}`);
    core.info(`max_files: ${this.maxFiles}`);
    core.info(`review_simple_changes: ${this.reviewSimpleChanges}`);
    core.info(`review_comment_lgtm: ${this.reviewCommentLGTM}`);
    core.info(`path_filters: ${this.pathFilters}`);
    core.info(`system_message: ${this.systemMessage}`);
    core.info(`model: ${this.model}`);
    core.info(`openai_retries: ${this.retries}`);
    core.info(`openai_timeout_ms: ${this.timeoutMS}`);
    core.info(`api_base_url: ${this.apiBaseUrl}`);
    core.info(`language: ${this.language}`);
  }

  checkPath(path: string): boolean {
    const ok = this.pathFilters.check(path);
    core.info(`checking path: ${path} => ${ok}`);
    return ok;
  }
}

export class PathFilter {
  private readonly rules: Array<[string /* rule */, boolean /* exclude */]>;

  constructor(rules: string[] | null = null) {
    this.rules = [];
    if (rules != null) {
      for (const rule of rules) {
        const trimmed = rule?.trim();
        if (trimmed) {
          if (trimmed.startsWith("!")) {
            this.rules.push([trimmed.substring(1).trim(), true]);
          } else {
            this.rules.push([trimmed, false]);
          }
        }
      }
    }
  }

  check(path: string): boolean {
    if (this.rules.length === 0) {
      return true;
    }

    // Track if the path is explicitly included or excluded by any rules
    let included = false;
    let excluded = false;
    // Track if any inclusion rules exist at all
    let inclusionRuleExists = false;

    for (const [rule, exclude] of this.rules) {
      // Check if the path matches the current rule pattern
      if (minimatch(path, rule)) {
        if (exclude) {
          // If it's an exclusion rule and matches, mark as excluded
          excluded = true;
        } else {
          // If it's an inclusion rule and matches, mark as included
          included = true;
        }
      }
      // Keep track of whether any inclusion rules exist
      if (!exclude) {
        inclusionRuleExists = true;
      }
    }

    // Path is valid if:
    // 1. No inclusion rules exist OR the path matches at least one inclusion rule
    // 2. AND the path doesn't match any exclusion rules
    return (!inclusionRuleExists || included) && !excluded;
  }
}
