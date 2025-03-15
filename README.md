# PR AI Reviewer

A GitHub Action that provides intelligent code review and release notes
generation for pull requests using AI. The action automatically analyzes code
changes, provides specific code improvement suggestions, and generates
structured release notes to help streamline the code review process.

## Features

- Automated code review with contextual suggestions
- Smart release notes generation categorizing changes
- Support for multiple AI models (Claude, GPT, Gemini)
- File change analysis and patch parsing
- Configurable path filters for targeted reviews
- Language-specific review support
- File content aware review capability

## Key Components

- **Code Review**: Analyzes diffs and provides specific, actionable feedback
- **Release Notes**: Automatically generates structured release notes from
  changes
- **Comment Management**: Posts review comments directly on the PR
- **Patch Analysis**: Smart parsing and analysis of code changes
- **Multi-model Support**: Flexible AI model selection for different tasks

## Usage

Add to your GitHub workflow `.github/workflows/pr-review.yml`:

```yaml
name: PR AI Review

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - "**.ts"
      - "**.tsx"
      - "**.js"
      - "**.jsx"
      - "**.py"
      - "**.go"

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required to get proper diff

      - uses: abby-ma2/pr-ai-reviewer@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        with:
          model: gpt-4
          summary_model: gpt-3.5-turbo
          language: en-US
          disable_review: false
          disable_release_notes: false
          path_filters: |
            src/**/*.ts
            src/**/*.tsx
            !src/**/*.test.ts
          use_file_content: true
          debug: false
```

## Configuration

| Option                  | Description                         | Default               |
| ----------------------- | ----------------------------------- | --------------------- |
| `github-token`          | GitHub token for API access         | Required              |
| `debug`                 | Enable debug logging                | `false`               |
| `disable_review`        | Skip code review                    | `false`               |
| `disable_release_notes` | Skip release notes generation       | `false`               |
| `path_filters`          | Glob patterns for files to analyze  | `[]`                  |
| `system_prompt`         | Custom prompt for AI reviewer       | Default system prompt |
| `language`              | Review comments language            | `en-US`               |
| `model`                 | AI model for code review            | `gpt-4`               |
| `summary_model`         | AI model for summaries              | `gpt-3.5-turbo`       |
| `use_file_content`      | Include full file content in review | `false`               |
