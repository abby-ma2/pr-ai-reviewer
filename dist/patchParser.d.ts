export type CodeSection = {
    filename: string;
    startLine: number;
    lineCount: number;
    branch?: string;
    commitId?: string;
    content: string[];
};
export type PatchParseResult = {
    original: CodeSection;
    modified: CodeSection;
};
export declare const parsePatch: ({ filename, patch, }: {
    filename: string;
    patch?: string;
}) => PatchParseResult[];
