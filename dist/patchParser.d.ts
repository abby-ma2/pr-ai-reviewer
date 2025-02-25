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
}) => {
    original: {
        filename: string;
        startLine: number;
        lineCount: number;
        branch: string | undefined;
        commitId: undefined;
        content: string[];
    };
    modified: {
        filename: string;
        startLine: number;
        lineCount: number;
        branch: string | undefined;
        commitId: string | undefined;
        content: string[];
    };
} | undefined;
