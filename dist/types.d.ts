import type { Hunk } from "./patchParser.js";
export declare class ChangeFile {
    filename: string;
    sha: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    url: string;
    patch: string;
    diff: FileDiff[];
    constructor(filename: string, sha: string, status: string, additions: number, deletions: number, changes: number, url: string, patch: string, diff: FileDiff[]);
}
export declare class FileDiff {
    filename: string;
    from: Hunk;
    to: Hunk;
    constructor(filename: string, from: Hunk, to: Hunk);
    renderHunk(): string;
}
