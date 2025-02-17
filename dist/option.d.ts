export declare class Options {
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
    constructor(debug: boolean, disableReview: boolean, disableReleaseNotes: boolean, maxFiles?: string, reviewSimpleChanges?: boolean, reviewCommentLGTM?: boolean, pathFilters?: string[] | null, systemMessage?: string, model?: string, retries?: string, timeoutMS?: string, apiBaseUrl?: string, language?: string);
    print(): void;
    checkPath(path: string): boolean;
}
export declare class PathFilter {
    private readonly rules;
    constructor(rules?: string[] | null);
    check(path: string): boolean;
}
