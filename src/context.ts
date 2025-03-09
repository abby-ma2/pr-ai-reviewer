export class PullRequestContext {
  owner: string;
  title: string;
  description?: string;
  summary?: string;
  repo: string;
  pullRequestNumber?: number;

  constructor(
    owner: string,
    title: string,
    repo: string,
    description?: string,
    pullRequestNumber?: number,
  ) {
    this.owner = owner;
    this.title = title;
    this.repo = repo;
    this.description = description;
    this.pullRequestNumber = pullRequestNumber;
  }
}
