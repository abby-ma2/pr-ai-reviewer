export declare class PullRequestContext {
    owner: string;
    title: string;
    description?: string;
    summary?: string;
    repo: string;
    pullRequestNumber?: number;
    constructor(owner: string, title: string, repo: string, description?: string, pullRequestNumber?: number);
}
