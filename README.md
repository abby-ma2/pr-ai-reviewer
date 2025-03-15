# PR AI Reviewer

PR AI Reviewer is a GitHub Action that leverages artificial intelligence to
automatically review pull requests. This tool helps development teams improve
code quality and maintain consistency by providing automated feedback on code
changes.

## Features

- Automated code review for pull requests
- AI-powered analysis of code changes
- Detection of potential bugs, security issues, and anti-patterns
- Suggestions for code improvements and best practices
- Support for multiple programming languages
- Customizable review rules and severity levels

## How It Works

When a pull request is opened or updated, PR AI Reviewer scans the changed files
and provides intelligent comments directly in the PR conversation. The AI model
examines:

- Code style and formatting consistency
- Potential bugs and logic errors
- Security vulnerabilities
- Performance considerations
- Documentation completeness

## Usage

Add the following to your GitHub workflow file:

```yaml
name: PR AI Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: PR AI Reviewer
        uses: abby-ma2/pr-ai-reviewer@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Configuration Options

| Option              | Description                                 | Default    |
| ------------------- | ------------------------------------------- | ---------- |
| `github-token`      | GitHub token for API access                 | Required   |
| `review-level`      | Depth of review (basic, standard, thorough) | `standard` |
| `ignored-files`     | Patterns for files to ignore                | None       |
| `comment-threshold` | Minimum severity to create comments         | `info`     |
