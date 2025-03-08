export type Hunk = {
    filename: string;
    startLine: number;
    lineCount: number;
    branch?: string;
    commitId?: string;
    content: string[];
};
export type PatchParseResult = {
    from: Hunk;
    to: Hunk;
};
export declare const parsePatch: ({ filename, patch, }: {
    filename: string;
    patch?: string;
}) => PatchParseResult[];
