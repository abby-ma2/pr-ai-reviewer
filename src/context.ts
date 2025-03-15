/**
 * Class that holds context information for a pull request
 * Stores pull request related data and handles chatbot creation
 */
export class PullRequestContext {
  /** Repository owner name */
  public owner: string
  /** Pull request title */
  public title: string
  /** Pull request description (optional) */
  public description: string
  /** Summary of the pull request (optional) */
  public summary: string
  /** Repository name */
  public repo: string
  /** Pull request number */
  public pullRequestNumber: number

  /** Comment ID for the PR review comment */
  public commentId: string

  /** Array of file summaries in markdown format */
  public fileSummaries: string[]

  /**
   * Creates an instance of PullRequestContext
   *
   * @param owner Repository owner name
   * @param title Pull request title
   * @param repo Repository name
   * @param description Pull request description
   * @param pullRequestNumber Pull request number
   * @param commentId ID of the comment associated with this PR review
   */
  constructor(
    owner: string,
    title: string,
    repo: string,
    description: string,
    pullRequestNumber: number,
    commentId: string
  ) {
    this.owner = owner
    this.title = title
    this.repo = repo
    this.description = description
    this.pullRequestNumber = pullRequestNumber
    this.commentId = commentId
    this.summary = ""
    this.fileSummaries = []
  }

  /**
   * Appends a file change summary to the fileSummaries array
   *
   * @param file File name or path
   * @param summary Summary of changes for the file
   */
  appendChangeSummary(file: string, summary: string) {
    this.fileSummaries.push(`### ${file}\n\n${summary}`)
  }

  /**
   * Returns a combined string of all file summaries
   *
   * @returns Markdown formatted string of all file summaries
   */
  getChangeSummary(): string {
    return `${this.fileSummaries.join("\n")}`
  }
}
