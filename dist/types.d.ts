import type { Hunk } from "./patchParser.js";
export declare class ChangeFile {
    filename: string;
    sha: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    url: string;
    from: Hunk;
    to: Hunk;
    constructor(filename: string, sha: string, status: string, additions: number, deletions: number, changes: number, url: string, from: Hunk, to: Hunk);
    renderHunk(): string;
}
