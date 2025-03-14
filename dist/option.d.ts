export declare class Options {
    debug: boolean;
    disableReview: boolean;
    disableReleaseNotes: boolean;
    pathFilters: PathFilter;
    systemPrompt: string;
    summaryModel: string;
    model: string;
    retries: number;
    timeoutMS: number;
    language: string;
    summarizeReleaseNotes: string;
    constructor(debug: boolean, disableReview: boolean, disableReleaseNotes: boolean, pathFilters: string[] | null, systemPrompt: string, summaryModel: string, model: string, retries: string, timeoutMS: string, language: string, summarizeReleaseNotes: string);
    print(): void;
    checkPath(path: string): boolean;
}
export declare class PathFilter {
    private readonly rules;
    constructor(rules?: string[] | null);
    check(path: string): boolean;
}
