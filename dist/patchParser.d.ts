export declare class Hunk {
    filename: string;
    startLine: number;
    lineCount: number;
    content: string[];
    branch?: string | undefined;
    commitId?: string | undefined;
    constructor(filename: string, startLine: number, lineCount: number, content: string[], branch?: string | undefined, commitId?: string | undefined);
}
export declare class PatchParseResult {
    from: Hunk;
    to: Hunk;
    constructor(from: Hunk, to: Hunk);
}
export declare const parsePatch: ({ filename, patch, }: {
    filename: string;
    patch?: string;
}) => PatchParseResult[];
