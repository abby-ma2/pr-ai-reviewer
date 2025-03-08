export type PullRequestContext = {
  owner: string;
  title: string;
  description: string;
  summary?: string;
  repo: string;
  pull_number: number;
};


